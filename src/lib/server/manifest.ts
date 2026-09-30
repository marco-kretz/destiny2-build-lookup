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

type Paths = Record<string, Record<string, string>>;

let state: { version: string; checkedAt: number; paths: Paths; exotics: Map<number, Exotic> } | undefined;
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
		jsonWorldComponentContentPaths: Paths;
	}>('/Destiny2/Manifest/');
	if (state?.version === manifest.version) {
		state.checkedAt = Date.now();
		return state.exotics;
	}

	const paths = manifest.jsonWorldComponentContentPaths;
	const defs = await fetchItemDefs(paths.en);

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
	state = { version: manifest.version, checkedAt: Date.now(), paths, exotics };
	return exotics;
}

async function fetchItemDefs(paths: Record<string, string>): Promise<Record<string, LiteDef>> {
	const res = await fetch(`https://www.bungie.net${paths.DestinyInventoryItemLiteDefinition}`);
	if (!res.ok) throw new Error(`manifest download ${res.status}`);
	return res.json();
}

const localized = new Map<string, { version: string; names: Promise<Map<number, string>> }>();

/**
 * Exotic display names in another manifest language, keyed by item hash. Undefined for English,
 * the canonical names. Only the names are kept, the full download is dropped after filtering.
 */
export async function getLocalizedNames(lang: string): Promise<Map<number, string> | undefined> {
	if (lang === 'en') return undefined;
	const exotics = await getExotics();
	const { version, paths } = state!;
	let entry = localized.get(lang);
	if (entry?.version !== version) {
		const names = fetchItemDefs(paths[lang]).then((defs) => {
			const names = new Map<number, string>();
			for (const hash of exotics.keys()) {
				const name = defs[hash]?.displayProperties.name;
				if (name) names.set(hash, name);
			}
			return names;
		});
		const created = { version, names };
		// Forget failed downloads so the next request retries.
		names.catch(() => localized.get(lang) === created && localized.delete(lang));
		localized.set(lang, (entry = created));
	}
	return entry.names;
}
