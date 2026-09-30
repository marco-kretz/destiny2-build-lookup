import { expect, test } from 'vitest';
import { parseBuilds } from './builders';

// Trimmed copy of a build card from builders.gg/destiny/dim-builds/popular
const card = (id: string, name: string, hashes: number[]) => `
<strong class="is-size-4"><a href="/destiny/dim-builds/${id}/slug">${name}</a></strong>
<div class="is-hidden-tablet">
<i class="d-icon d-prismatic mr-1"></i>
Prismatic Warlock
<span class="mx-1"> • </span>
</div>
<a target="_blank" rel="nofollow ugc" class="button is-small is-dim" href="https://dim.gg/${id}/Slug">DIM -&gt;</a>
${hashes.map((h) => `<div class="icon-item item-tooltip" data-itemid="${h}"></div>`).join('\n')}`;

test('parses build cards', () => {
	const html = `<html>${card('qs2ncni', 'Cull&#39;s Claymores', [2273643087, 2200470033])}${card('abc', 'Other', [1])}</html>`;
	expect(parseBuilds(html)).toEqual([
		{
			id: 'qs2ncni',
			name: "Cull's Claymores",
			subclass: 'Prismatic Warlock',
			url: 'https://builders.gg/destiny/dim-builds/qs2ncni/slug',
			dimUrl: 'https://dim.gg/qs2ncni/Slug',
			itemHashes: [2273643087, 2200470033]
		},
		expect.objectContaining({ id: 'abc', itemHashes: [1] })
	]);
});
