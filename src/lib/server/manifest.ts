import { bungieGet } from './bungie';

export type Exotic = {
	hash: number;
	name: string;
	icon: string;
	isWeapon: boolean;
	collectibleHash?: number;
};

// The lite definitions have no `hash` field; the hash is only the object key.
type LiteDef = {
	displayProperties: { name: string; icon?: string };
	itemType: number;
	inventory?: { tierType?: number };
	collectibleHash?: number;
};

const ARMOR = 2;
const WEAPON = 3;
const EXOTIC = 6;
const CHECK_EVERY = 60 * 60 * 1000;

let state: { version: string; checkedAt: number; exotics: Map<number, Exotic> } | undefined;
let loading: Promise<Map<number, Exotic>> | undefined;

/** Exotic weapons and armor from the item manifest, keyed by item hash. */
export function getExotics(): Promise<Map<number, Exotic>> {
	if (state && Date.now() - state.checkedAt < CHECK_EVERY) return Promise.resolve(state.exotics);
	loading ??= load().finally(() => (loading = undefined));
	return loading;
}

async function load(): Promise<Map<number, Exotic>> {
	const manifest = await bungieGet<{
		version: string;
		jsonWorldComponentContentPaths: { en: Record<string, string> };
	}>('/Destiny2/Manifest/');
	if (state?.version === manifest.version) {
		state.checkedAt = Date.now();
		return state.exotics;
	}

	const path = manifest.jsonWorldComponentContentPaths.en.DestinyInventoryItemLiteDefinition;
	const res = await fetch(`https://www.bungie.net${path}`);
	if (!res.ok) throw new Error(`manifest download ${res.status}`);
	const defs = (await res.json()) as Record<string, LiteDef>;

	const exotics = new Map<number, Exotic>();
	for (const [key, d] of Object.entries(defs)) {
		const hash = Number(key);
		if (d.inventory?.tierType !== EXOTIC || (d.itemType !== ARMOR && d.itemType !== WEAPON)) continue;
		exotics.set(hash, {
			hash,
			name: d.displayProperties.name,
			icon: d.displayProperties.icon ? `https://www.bungie.net${d.displayProperties.icon}` : '',
			isWeapon: d.itemType === WEAPON,
			collectibleHash: d.collectibleHash
		});
	}
	state = { version: manifest.version, checkedAt: Date.now(), exotics };
	return exotics;
}
