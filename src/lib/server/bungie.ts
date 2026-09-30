import { env } from '$env/dynamic/private';

const API = 'https://www.bungie.net/Platform';
export const AUTHORIZE_URL = 'https://www.bungie.net/en/OAuth/Authorize';

export type Session = {
	access: string;
	accessExp: number;
	refresh: string;
	refreshExp: number;
	mType: number;
	mId: string;
	name: string;
};

export async function bungieGet<T>(path: string, accessToken?: string): Promise<T> {
	const headers: Record<string, string> = { 'X-API-Key': env.BUNGIE_API_KEY ?? '' };
	if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
	const res = await fetch(API + path, { headers });
	const body = await res.json().catch(() => undefined);
	if (!res.ok || body?.ErrorCode !== 1) {
		throw new Error(`Bungie ${path}: ${body?.Message ?? res.status}`);
	}
	return body.Response as T;
}

type TokenResponse = {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	refresh_expires_in: number;
};

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
	const res = await fetch(`${API}/App/OAuth/Token/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${btoa(`${env.BUNGIE_CLIENT_ID}:${env.BUNGIE_CLIENT_SECRET}`)}`
		},
		body: new URLSearchParams(params)
	});
	if (!res.ok) throw new Error(`Bungie OAuth token: ${res.status}`);
	return res.json();
}

export async function sessionFromCode(code: string): Promise<Session> {
	const t = await tokenRequest({ grant_type: 'authorization_code', code });
	const m = await bungieGet<{
		primaryMembershipId?: string;
		bungieNetUser: { uniqueName?: string; displayName: string };
		destinyMemberships: { membershipType: number; membershipId: string; crossSaveOverride: number }[];
	}>('/User/GetMembershipsForCurrentUser/', t.access_token);
	// With cross save, only the primary (or overriding) membership has a playable profile.
	const membership =
		m.destinyMemberships.find((d) => d.membershipId === m.primaryMembershipId) ??
		m.destinyMemberships.find((d) => d.crossSaveOverride === 0 || d.crossSaveOverride === d.membershipType);
	if (!membership) throw new Error('No Destiny 2 account found');
	return {
		...tokenFields(t),
		mType: membership.membershipType,
		mId: membership.membershipId,
		name: m.bungieNetUser.uniqueName ?? m.bungieNetUser.displayName
	};
}

export async function refreshSession(s: Session): Promise<Session> {
	return { ...s, ...tokenFields(await tokenRequest({ grant_type: 'refresh_token', refresh_token: s.refresh })) };
}

function tokenFields(t: TokenResponse) {
	const now = Date.now();
	return {
		access: t.access_token,
		accessExp: now + t.expires_in * 1000,
		refresh: t.refresh_token,
		refreshExp: now + t.refresh_expires_in * 1000
	};
}

type ItemList = { items: { itemHash: number }[] };
type Collectibles = { collectibles: Record<string, { state: number }> };

export type Profile = { ownedItemHashes: Set<number>; acquiredCollectibleHashes: Set<number> };

const NOT_ACQUIRED = 1;

export async function getProfile(s: Session): Promise<Profile> {
	const p = await bungieGet<{
		profileInventory: { data?: ItemList };
		characterInventories: { data?: Record<string, ItemList> };
		characterEquipment: { data?: Record<string, ItemList> };
		profileCollectibles: { data?: Collectibles };
		characterCollectibles: { data?: Record<string, Collectibles> };
	}>(`/Destiny2/${s.mType}/Profile/${s.mId}/?components=102,201,205,800`, s.access);

	const itemLists = [
		p.profileInventory.data,
		...Object.values(p.characterInventories.data ?? {}),
		...Object.values(p.characterEquipment.data ?? {})
	];
	const ownedItemHashes = new Set(itemLists.flatMap((l) => l?.items.map((i) => i.itemHash) ?? []));

	// Class-specific armor collectibles live on the characters, the rest on the profile.
	const acquiredCollectibleHashes = new Set<number>();
	for (const c of [p.profileCollectibles.data, ...Object.values(p.characterCollectibles.data ?? {})]) {
		for (const [hash, { state }] of Object.entries(c?.collectibles ?? {})) {
			if (!(state & NOT_ACQUIRED)) acquiredCollectibleHashes.add(Number(hash));
		}
	}
	return { ownedItemHashes, acquiredCollectibleHashes };
}
