<script lang="ts">
	let { data } = $props();

	let filter = $state<'all' | 'playable'>('all');
	const LABEL = { owned: 'Spielbar', collection: 'Aus Sammlung ziehen', missing: 'Fehlt' } as const;

	const visible = $derived(
		data.builds.filter((b) => filter === 'all' || b.status === 'owned' || b.status === 'collection')
	);
</script>

<svelte:head><title>D2 Build Lookup</title></svelte:head>

<header>
	<h1>D2 Build Lookup</h1>
	{#if data.user}
		<form method="POST" action="/auth/logout">
			<span>{data.user}</span>
			<button>Logout</button>
		</form>
	{:else}
		<a class="button" href="/auth/login" data-sveltekit-reload>Mit Bungie einloggen</a>
	{/if}
</header>

<form class="filters">
	<select name="listing" value={data.listing} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="popular">Beliebteste</option>
		<option value="latest">Neueste</option>
	</select>
	<select name="season" value={data.season} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="">Aktuelle Season</option>
		{#each data.seasons as s (s)}
			<option value={s}>Season {s}</option>
		{/each}
	</select>
	<select name="class" value={data.cls} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="">Alle Klassen</option>
		<option value="hunter">Hunter</option>
		<option value="titan">Titan</option>
		<option value="warlock">Warlock</option>
	</select>
	<select name="activity" value={data.activity} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="">Alle Aktivitäten</option>
		<option value="pve">PvE</option>
		<option value="pvp">PvP</option>
		<option value="gambit">Gambit</option>
		<option value="trials">Trials</option>
		<option value="grandmaster">GM Nightfalls</option>
		<option value="lost_sector">Lost Sectors</option>
		<option value="solo">Solo</option>
	</select>
	<select name="pages" value={String(data.pages)} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		{#each [1, 2, 3, 4, 5] as n (n)}
			<option value={String(n)}>{n} {n === 1 ? 'Seite' : 'Seiten'}</option>
		{/each}
	</select>
	{#if data.user}
		<label><input type="checkbox" checked={filter === 'playable'} onchange={(e) => (filter = e.currentTarget.checked ? 'playable' : 'all')} /> Nur machbare</label>
	{/if}
	<span class="count">{visible.length} Builds</span>
</form>

<ul class="builds">
	{#each visible as b (b.id)}
		<li class={b.status}>
			<div class="title">
				<a href={b.url} target="_blank" rel="noopener">{b.name}</a>
				<small>{b.subclass}</small>
			</div>
			<div class="items">
				{#each b.items as item (item.name)}
					<figure class={item.status} title="{item.name}{item.status ? ` – ${LABEL[item.status]}` : ''}">
						<img src={item.icon} alt={item.name} width="48" height="48" />
						<figcaption>{item.name}</figcaption>
					</figure>
				{:else}
					<em>Keine Exotics</em>
				{/each}
			</div>
			<div class="actions">
				{#if b.status}<span class="badge {b.status}">{LABEL[b.status]}</span>{/if}
				<a class="button" href={b.dimUrl} target="_blank" rel="noopener">In DIM öffnen</a>
			</div>
		</li>
	{/each}
</ul>

<footer>Builds von <a href="https://builders.gg/destiny/dim-builds/popular">builders.gg</a> · Daten via Bungie API</footer>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		background: #111418;
		color: #e6e6e6;
	}
	:global(a) {
		color: #8ab4ff;
	}
	header,
	.filters,
	.builds,
	footer {
		max-width: 960px;
		margin: 0 auto;
		padding: 0 16px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.filters {
		display: flex;
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.count {
		margin-left: auto;
		opacity: 0.7;
	}
	.button,
	button {
		background: #2a2f37;
		color: inherit;
		border: 1px solid #3a404a;
		border-radius: 6px;
		padding: 6px 12px;
		text-decoration: none;
		cursor: pointer;
		font: inherit;
	}
	.builds {
		list-style: none;
		display: grid;
		gap: 12px;
	}
	.builds li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px 16px;
		background: #1a1e24;
		border-left: 4px solid #3a404a;
		border-radius: 6px;
		padding: 12px;
	}
	.builds li.owned {
		border-left-color: #3fb950;
	}
	.builds li.collection {
		border-left-color: #d29922;
	}
	.builds li.missing {
		border-left-color: #f85149;
		opacity: 0.75;
	}
	.title small {
		display: block;
		opacity: 0.7;
	}
	.items {
		grid-column: 1 / -1;
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	figure {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	figure img {
		border: 2px solid transparent;
		border-radius: 4px;
	}
	figure.owned img {
		border-color: #3fb950;
	}
	figure.collection img {
		border-color: #d29922;
	}
	figure.missing img {
		border-color: #f85149;
		filter: grayscale(1);
	}
	.actions {
		grid-row: 1;
		grid-column: 2;
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.badge {
		font-size: 0.85em;
		padding: 2px 8px;
		border-radius: 999px;
		background: #2a2f37;
	}
	.badge.owned {
		color: #3fb950;
	}
	.badge.collection {
		color: #d29922;
	}
	.badge.missing {
		color: #f85149;
	}
	footer {
		margin: 32px auto;
		opacity: 0.6;
		font-size: 0.9em;
	}
</style>
