<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { data } = $props();

	let playableOnly = $state(false);

	const STATUS = {
		owned: { label: 'Spielbar', badge: 'border-owned/40 bg-owned/10 text-owned', bar: 'bg-owned', frame: 'ring-owned/70' },
		collection: {
			label: 'Aus Sammlung ziehen',
			badge: 'border-collection/40 bg-collection/10 text-collection',
			bar: 'bg-collection',
			frame: 'ring-collection/70'
		},
		missing: { label: 'Fehlt', badge: 'border-missing/40 bg-missing/10 text-missing', bar: 'bg-missing', frame: 'ring-missing/70' }
	} as const;

	// 'all' stands for "no filter" because an empty Select value renders as unselected.
	const filters = $derived([
		{ key: 'listing', value: data.listing, options: [['popular', 'Beliebteste'], ['latest', 'Neueste']] },
		{
			key: 'season',
			value: data.season || 'all',
			options: [['all', 'Aktuelle Season'], ...data.seasons.map((s) => [s, `Season ${s}`])]
		},
		{
			key: 'class',
			value: data.cls || 'all',
			options: [['all', 'Alle Klassen'], ['hunter', 'Hunter'], ['titan', 'Titan'], ['warlock', 'Warlock']]
		},
		{
			key: 'activity',
			value: data.activity || 'all',
			options: [
				['all', 'Alle Aktivitäten'],
				['pve', 'PvE'],
				['pvp', 'PvP'],
				['gambit', 'Gambit'],
				['trials', 'Trials'],
				['grandmaster', 'GM Nightfalls'],
				['lost_sector', 'Lost Sectors'],
				['solo', 'Solo']
			]
		},
		{
			key: 'pages',
			value: String(data.pages),
			options: [1, 2, 3, 4, 5].map((n) => [String(n), `${n} ${n === 1 ? 'Seite' : 'Seiten'}`])
		}
	]);

	function setParam(key: string, value: string) {
		const url = new URL(page.url);
		if (value === 'all') url.searchParams.delete(key);
		else url.searchParams.set(key, value);
		goto(url, { keepFocus: true, noScroll: true });
	}

	const visible = $derived(data.builds.filter((b) => !playableOnly || b.status === 'owned' || b.status === 'collection'));
</script>

<svelte:head><title>D2 Build Lookup</title></svelte:head>

{#if navigating.to}
	<div class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20">
		<div class="h-full w-1/3 animate-[scan_1.1s_ease-in-out_infinite] bg-primary"></div>
	</div>
{/if}

<Tooltip.Provider delayDuration={150}>
	<div class="mx-auto max-w-5xl px-4">
		<header class="flex flex-wrap items-end justify-between gap-4 border-b border-border pt-10 pb-6">
			<div>
				<p class="font-heading text-[11px] font-semibold tracking-[0.3em] text-primary uppercase">◆ builders.gg × Bungie</p>
				<h1 class="mt-1 font-heading text-3xl font-bold tracking-wider uppercase md:text-4xl">D2 Build Lookup</h1>
			</div>
			{#if data.user}
				<form method="POST" action="/auth/logout" class="flex items-center gap-3">
					<span class="font-heading text-xs tracking-widest text-muted-foreground uppercase">{data.user}</span>
					<Button type="submit" variant="ghost" size="sm"><LogOutIcon />Logout</Button>
				</form>
			{:else}
				<Button href="/auth/login" data-sveltekit-reload size="lg" class="chamfer px-5 font-heading tracking-widest uppercase">
					Mit Bungie einloggen
				</Button>
			{/if}
		</header>

		<div class="flex flex-wrap items-center gap-2 py-5">
			{#each filters as f (f.key)}
				<Select.Root type="single" value={f.value} onValueChange={(v) => setParam(f.key, v)}>
					<Select.Trigger aria-label={f.key}>
						{f.options.find(([v]) => v === f.value)?.[1]}
					</Select.Trigger>
					<Select.Content>
						{#each f.options as [value, label] (value)}
							<Select.Item {value} {label} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/each}
			{#if data.user}
				<div class="ml-2 flex items-center gap-2">
					<Switch id="playable" bind:checked={playableOnly} />
					<Label for="playable" class="text-xs">Nur machbare</Label>
				</div>
			{/if}
			<span class="ml-auto font-heading text-xs tracking-widest text-muted-foreground uppercase">
				<span class="text-foreground">{visible.length}</span> Builds
			</span>
		</div>

		<ul class="grid gap-3 transition-opacity {navigating.to ? 'opacity-50' : ''}">
			{#each visible as b (b.id)}
				{@const status = b.status && STATUS[b.status]}
				<li class={b.status === 'missing' ? 'opacity-60 transition-opacity hover:opacity-100' : ''}>
					<Card.Root class="hud gap-3 bg-border ring-0">
						{#if status}<span class="absolute inset-y-0 left-0 w-0.5 {status.bar}"></span>{/if}
						<Card.Header>
							<Card.Title class="font-heading text-base font-semibold tracking-wide">
								<a href={b.url} target="_blank" rel="noopener" class="hover:text-primary">{b.name}</a>
							</Card.Title>
							<Card.Description class="font-heading text-[11px] tracking-[0.2em] uppercase">{b.subclass}</Card.Description>
							<Card.Action class="flex items-center gap-2">
								{#if status}<Badge variant="outline" class={status.badge}>{status.label}</Badge>{/if}
								<Button href={b.dimUrl} target="_blank" rel="noopener" variant="outline" size="sm">
									In DIM öffnen<ExternalLinkIcon data-icon="inline-end" />
								</Button>
							</Card.Action>
						</Card.Header>
						<Card.Content class="flex flex-wrap gap-4">
							{#each b.items as item (item.name)}
								{@const itemStatus = item.status && STATUS[item.status]}
								<Tooltip.Root>
									<Tooltip.Trigger class="flex items-center gap-2 text-left">
										<img
											src={item.icon}
											alt=""
											width="44"
											height="44"
											class="size-11 ring-1 ring-offset-2 ring-offset-card {itemStatus?.frame ?? 'ring-primary/50'} {item.status === 'missing' ? 'grayscale' : ''}"
										/>
										<span class="text-xs">{item.name}</span>
									</Tooltip.Trigger>
									<Tooltip.Content>
										{item.name}{itemStatus ? ` – ${itemStatus.label}` : ''}
									</Tooltip.Content>
								</Tooltip.Root>
							{:else}
								<em class="text-xs text-muted-foreground">Keine Exotics</em>
							{/each}
						</Card.Content>
					</Card.Root>
				</li>
			{/each}
		</ul>

		<footer class="mt-10 border-t border-border py-6 text-xs text-muted-foreground">
			Builds von <a href="https://builders.gg/destiny/dim-builds/popular" class="text-foreground hover:text-primary">builders.gg</a> · Daten via Bungie API
		</footer>
	</div>
</Tooltip.Provider>

<style>
	@keyframes -global-scan {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}
</style>
