import { fetchBuilds, type Listing } from '$lib/server/builders';
import { getProfile } from '$lib/server/bungie';
import { getExotics } from '$lib/server/manifest';
import { availability, ownershipByName, worst, type Availability } from '$lib/match';

const CLASSES = ['hunter', 'titan', 'warlock'];
const LISTINGS = ['popular', 'latest'];
// ponytail: hardcoded builders.gg season ids, add new ones when a season starts
const SEASONS = ['28', '27', '26', '25', '24', '23', '22', '21', '20'];
const ACTIVITIES = ['pve', 'pvp', 'gambit', 'trials', 'grandmaster', 'lost_sector', 'solo'];

const pick = (value: string | null, allowed: string[]) => (value && allowed.includes(value) ? value : '');
const MAX_PAGES = 5;

export async function load({ url, locals }) {
	const cls = pick(url.searchParams.get('class'), CLASSES);
	const activity = pick(url.searchParams.get('activity'), ACTIVITIES);
	const season = pick(url.searchParams.get('season'), SEASONS);
	const listing = (pick(url.searchParams.get('listing'), LISTINGS) || 'popular') as Listing;
	const pages = Math.min(Math.max(Number(url.searchParams.get('pages')) || 3, 1), MAX_PAGES);

	const [builds, exotics, profile] = await Promise.all([
		fetchBuilds(listing, { dclass: cls, activity, season }, pages),
		getExotics(),
		locals.session ? getProfile(locals.session) : undefined
	]);
	const ownership =
		profile && ownershipByName(exotics.values(), profile.ownedItemHashes, profile.acquiredCollectibleHashes);

	return {
		cls,
		activity,
		season,
		seasons: SEASONS,
		listing,
		pages,
		user: locals.session?.name,
		builds: builds.map((b) => {
			const items = b.itemHashes.flatMap((h) => {
				const e = exotics.get(h);
				if (!e) return [];
				return [{ name: e.name, icon: e.icon, isWeapon: e.isWeapon, status: ownership && availability(e.name, ownership) }];
			});
			const status: Availability | undefined = ownership && worst(items.map((i) => i.status!));
			return { ...b, items, status };
		})
	};
}
