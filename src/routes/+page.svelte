<script lang="ts">
	import { goto } from '$app/navigation';
	import logo from '$lib/assets/favicon.svg';
	import { navigating, page } from '$app/state';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import LanguagesIcon from '@lucide/svelte/icons/languages';
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

	// Hysteresis: the header shrinks by ~90px, so a single threshold would flip back and forth.
	let compact = $state(false);
	function onScroll() {
		if (scrollY > 120) compact = true;
		else if (scrollY < 8) compact = false;
	}

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

	const LANG_OPTIONS = [
		['auto', 'Browser'],
		['de', 'Deutsch'],
		['en', 'English'],
		['fr', 'Français']
	];

	function setLang(value: string) {
		document.cookie =
			value === 'auto' ? 'lang=; path=/; max-age=0' : `lang=${value}; path=/; max-age=31536000; samesite=lax`;
		goto(page.url, { invalidateAll: true, keepFocus: true, noScroll: true });
	}

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

<svelte:window onscroll={onScroll} />

<Tooltip.Provider delayDuration={150}>
	<div class="sticky top-0 z-40">
		<div class="relative z-10 border-b border-border bg-background">
			<div class="relative mx-auto max-w-5xl px-4">
				<header
					class="flex flex-wrap justify-between gap-4 border-b border-border transition-all duration-300 {compact
						? 'items-center pt-3 pb-3'
						: 'items-end pt-10 pb-6'}"
				>
					<div class="flex items-center gap-4">
						<img src={logo} alt="" class="transition-all duration-300 {compact ? 'size-8' : 'size-12 md:size-14'}" />
						<div>
							<div class="grid transition-all duration-300 {compact ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]'}">
								<p class="overflow-hidden font-heading text-[11px] font-semibold tracking-[0.3em] text-primary uppercase">
									◆ builders.gg × Bungie
								</p>
							</div>
							<h1
								class="font-heading font-bold tracking-wider uppercase transition-all duration-300 {compact
									? 'text-xl'
									: 'mt-1 text-3xl md:text-4xl'}"
							>
								D2 Build Lookup
							</h1>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<Select.Root type="single" value={data.langSetting} onValueChange={setLang}>
							<Select.Trigger aria-label="Sprache der Item-Namen" class="font-heading tracking-widest uppercase">
								<LanguagesIcon />
								<span class="cap-trim">{LANG_OPTIONS.find(([v]) => v === data.langSetting)?.[1]}</span>
							</Select.Trigger>
							<Select.Content>
								{#each LANG_OPTIONS as [value, label] (value)}
									<Select.Item {value} {label} />
								{/each}
							</Select.Content>
						</Select.Root>
						{#if data.user}
							{@const [name, code] = data.user.split('#')}
							<form method="POST" action="/auth/logout" class="flex h-8 items-stretch border border-input bg-input/30">
								<span class="flex items-center gap-2 px-3 font-heading text-xs tracking-widest uppercase">
									<span class="size-1.5 rotate-45 bg-owned shadow-[0_0_6px_var(--owned)]"></span>
									<span class="cap-trim">{name}{#if code}<span class="text-muted-foreground">#{code}</span>{/if}</span>
								</span>
								<Button
									type="submit"
									variant="ghost"
									size="icon"
									title="Logout"
									aria-label="Logout"
									class="size-auto w-8 border-0 border-l border-input hover:text-missing"
								>
									<LogOutIcon />
								</Button>
							</form>
						{:else}
							<Button href="/auth/login" data-sveltekit-reload size="lg" class="chamfer px-5 font-heading tracking-widest uppercase">
								Mit Bungie einloggen
							</Button>
						{/if}
					</div>
				</header>

				<div class="flex flex-wrap items-center gap-2 transition-all duration-300 {compact ? 'py-3' : 'py-5'}">
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
				<!-- HUD accent on the bottom border: gold segment ending in a diamond, grows with scroll progress -->
				<span class="absolute inset-x-4 -bottom-px h-0.5">
					<span class="scroll-progress relative block h-full w-24 bg-primary">
						<span class="absolute top-1/2 -right-[3px] size-1.5 -translate-y-1/2 rotate-45 bg-primary"></span>
					</span>
				</span>
			</div>
		</div>
		<!-- Cards fade out as they scroll under the header; hidden at the top so the first card stays crisp -->
		<div
			class="pointer-events-none absolute inset-x-0 top-full h-10 bg-linear-to-b from-background to-transparent transition-opacity duration-300 {compact
				? ''
				: 'opacity-0'}"
		></div>
	</div>

	<div class="mx-auto max-w-5xl px-4">
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
