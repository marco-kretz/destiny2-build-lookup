export type Build = {
	id: string;
	name: string;
	subclass: string;
	url: string;
	dimUrl: string;
	itemHashes: number[];
};

const BASE = 'https://builders.gg';
const TTL = 60 * 60 * 1000;
const cache = new Map<string, { at: number; builds: Build[] }>();

const decode = (s: string) =>
	s
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.trim();

// ponytail: regex over builders.gg markup, breaks if they redesign the build cards
export function parseBuilds(html: string): Build[] {
	return html
		.split('<strong class="is-size-4"><a href="/destiny/dim-builds/')
		.slice(1)
		.flatMap((card) => {
			const head = card.match(/^([a-z0-9]+)\/([^"]+)">([^<]*)<\/a>/);
			const dimUrl = card.match(/href="(https:\/\/dim\.gg\/[^"]+)"/)?.[1];
			if (!head || !dimUrl) return [];
			return [
				{
					id: head[1],
					name: decode(head[3]),
					subclass: decode(card.match(/<i class="d-icon [^"]*"><\/i>\s*([^<\n]+)/)?.[1] ?? ''),
					url: `${BASE}/destiny/dim-builds/${head[1]}/${head[2]}`,
					dimUrl,
					itemHashes: [...card.matchAll(/data-itemid="(\d+)"/g)].map((m) => Number(m[1]))
				}
			];
		});
}

export type Listing = 'popular' | 'latest';

export async function fetchBuilds(
	listing: Listing,
	filters: { dclass: string; activity: string; season: string },
	pages: number
): Promise<Build[]> {
	const path = listing === 'latest' ? '/destiny/dim-builds' : '/destiny/dim-builds/popular';
	const results = await Promise.all(
		Array.from({ length: pages }, (_, i) => {
			const params = new URLSearchParams({ page: String(i + 1) });
			for (const [key, value] of Object.entries(filters)) if (value) params.set(`q[${key}]`, value);
			return fetchPage(`${BASE}${path}?${params}`);
		})
	);
	const seen = new Set<string>();
	return results.flat().filter((b) => !seen.has(b.id) && seen.add(b.id));
}

async function fetchPage(url: string): Promise<Build[]> {
	const hit = cache.get(url);
	if (hit && Date.now() - hit.at < TTL) return hit.builds;
	const res = await fetch(url, { headers: { 'user-agent': 'd2-build-lookup' } });
	if (!res.ok) throw new Error(`builders.gg ${res.status}`);
	const builds = parseBuilds(await res.text());
	cache.set(url, { at: Date.now(), builds });
	return builds;
}
