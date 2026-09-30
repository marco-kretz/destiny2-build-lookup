export type Availability = 'owned' | 'collection' | 'missing';

export type ExoticRef = {
	hash: number;
	name: string;
	icon: string;
	isWeapon: boolean;
	collectibleHash?: number;
};

export type Ownership = {
	ownedNames: Set<string>;
	collectionNames: Set<string>;
};

const RANK: Record<Availability, number> = { owned: 0, collection: 1, missing: 2 };

/**
 * Exotics get reissued under new item hashes, so ownership is compared by name:
 * any owned copy of "Celestial Nighthawk" satisfies a build that lists a different hash.
 */
export function ownershipByName(
	exotics: Iterable<ExoticRef>,
	ownedItemHashes: Set<number>,
	acquiredCollectibleHashes: Set<number>
): Ownership {
	const ownedNames = new Set<string>();
	const collectionNames = new Set<string>();
	for (const e of exotics) {
		if (ownedItemHashes.has(e.hash)) ownedNames.add(e.name);
		if (e.collectibleHash && acquiredCollectibleHashes.has(e.collectibleHash)) collectionNames.add(e.name);
	}
	return { ownedNames, collectionNames };
}

export function availability(name: string, o: Ownership): Availability {
	if (o.ownedNames.has(name)) return 'owned';
	if (o.collectionNames.has(name)) return 'collection';
	return 'missing';
}

export function worst(list: Availability[]): Availability {
	return list.reduce<Availability>((a, b) => (RANK[b] > RANK[a] ? b : a), 'owned');
}
