<script lang="ts">
	/**
	 * Platform Role Picker
	 *
	 * 9 demo personas grouped into three tiers (Executive, Management,
	 * Specialists). Cards use progressive disclosure — activities are
	 * collapsed by default and revealed on click. Recommended personas
	 * are visually promoted to guide first-time visitors.
	 */

	import { resolve } from '$app/paths';
	import { slide } from 'svelte/transition';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';

	let { data }: { data: PageData } = $props();

	/** Track which persona cards have their activities expanded */
	let expanded: Record<string, boolean> = $state({});

	function toggleExpand(id: string) {
		expanded[id] = !expanded[id];
	}

	/** Role badge colors — maps orgRole to Tailwind classes */
	const roleBadge: Record<string, string> = {
		owner: 'bg-accent1/15 text-accent1',
		editor: 'bg-accent3/15 text-accent3',
		viewer: 'bg-surfaceHigh text-secondary'
	};

	/** Build an array of activity i18n keys for a persona */
	function activityKeys(prefix: string, count: number): string[] {
		return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`);
	}

	/** Tier section accent styles */
	const tierAccent: Record<string, string> = {
		executive: 'border-amber-400/60 dark:border-amber-600/60',
		management: 'border-accent3/40',
		specialist: 'border-purple-400/40 dark:border-purple-500/40'
	};
</script>

<svelte:head>
	<title>{t(data.locale, 'platform.title')} | Tier</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-12">
	<!-- Header -->
	<div class="mb-10 text-center">
		<a href={resolve('/')} class="inline-block">
			<img src="/logo.svg" alt="Tier" class="mx-auto h-10" />
		</a>
		<h1 class="mt-6 text-2xl font-medium text-primary">
			{t(data.locale, 'platform.heading')}
		</h1>
		<p class="mx-auto mt-2 max-w-2xl text-secondary">
			{t(data.locale, 'platform.description')}
		</p>
	</div>

	<!-- Tier sections -->
	{#each data.tiers as tier (tier.id)}
		<section class="mb-8">
			<!-- Tier header -->
			<div class="mb-4 flex items-center gap-3">
				<div class="h-px flex-1 {tierAccent[tier.id]}  border-t"></div>
				<h2 class="text-sm font-semibold tracking-wider text-secondary uppercase">
					{t(data.locale, tier.labelKey)}
				</h2>
				<div class="h-px flex-1 {tierAccent[tier.id]} border-t"></div>
			</div>

			<!-- Persona cards -->
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each tier.personas as persona (persona.loginId)}
					<div
						class="group relative flex min-h-[200px] flex-col rounded-lg border bg-surfaceMid transition-all hover:shadow-md
						{persona.recommended ? 'border-2 border-accent1/60 ring-1 ring-accent1/20' : 'border-border'}"
					>
						<!-- Recommended badge -->
						{#if persona.recommended}
							<div class="absolute -top-2.5 left-4">
								<span
									class="rounded-full bg-accent1 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm"
								>
									{t(data.locale, 'platform.recommended')}
								</span>
							</div>
						{/if}

						<!-- Card body -->
						<div class="flex flex-1 flex-col p-5 {persona.recommended ? 'pt-6' : ''}">
							<!-- Top row: icon + name/title + role badge -->
							<div class="mb-2 flex items-start gap-3">
								<!-- Icon -->
								<div
									class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surfaceHigh text-secondary"
								>
									{#if persona.icon === 'crown'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M2 20h20M4 20l2-14 4 6 2-8 2 8 4-6 2 14" /></svg
										>
									{:else if persona.icon === 'building'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><rect x="4" y="2" width="16" height="20" rx="1" /><path
												d="M9 6h1m4 0h1M9 10h1m4 0h1M9 14h1m4 0h1M9 18h6"
											/></svg
										>
									{:else if persona.icon === 'chart'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M3 3v18h18" /><path d="M7 16l4-4 3 3 5-7" /></svg
										>
									{:else if persona.icon === 'layers'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path
												d="M2 12l10 5 10-5"
											/></svg
										>
									{:else if persona.icon === 'users'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
												cx="9"
												cy="7"
												r="4"
											/><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
												d="M16 3.13a4 4 0 0 1 0 7.75"
											/></svg
										>
									{:else if persona.icon === 'code'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><polyline points="16 18 22 12 16 6" /><polyline
												points="8 6 2 12 8 18"
											/></svg
										>
									{:else if persona.icon === 'sparkle'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path
												d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"
											/><path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" /></svg
										>
									{:else if persona.icon === 'shield'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path
												d="M9 12l2 2 4-4"
											/></svg
										>
									{:else if persona.icon === 'key'}
										<svg
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path
												d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
											/></svg
										>
									{/if}
								</div>

								<!-- Name + title -->
								<div class="min-w-0 flex-1">
									<h3 class="text-base leading-tight font-semibold text-primary">{persona.name}</h3>
									<p class="text-sm text-secondary">
										{t(data.locale, persona.titleKey)}
									</p>
								</div>

								<!-- Role badge -->
								<span
									class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {roleBadge[
										persona.orgRole
									]}"
								>
									{t(data.locale, `platform.role.${persona.orgRole}`)}
								</span>
							</div>

							<!-- One-liner description (always visible) -->
							<p class="mb-3 text-sm leading-relaxed text-secondary">
								{t(data.locale, persona.descriptionKey)}
							</p>

							<!-- Expandable activities (progressive disclosure) -->
							<div class="flex-1">
								<button
									onclick={() => toggleExpand(persona.loginId)}
									class="mb-1 flex items-center gap-1 text-xs font-medium text-accent1 transition-colors hover:text-accent1/80"
								>
									<svg
										class="h-3.5 w-3.5 transition-transform {expanded[persona.loginId]
											? 'rotate-90'
											: ''}"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="9 18 15 12 9 6" />
									</svg>
									{t(data.locale, 'platform.activities_label')}
								</button>

								{#if expanded[persona.loginId]}
									<ul class="mt-1 space-y-1" transition:slide={{ duration: 150 }}>
										{#each activityKeys(persona.activitiesKey, persona.activityCount) as key (key)}
											<li class="flex items-start gap-1.5 text-sm text-primary">
												<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent1/60"></span>
												{t(data.locale, key)}
											</li>
										{/each}
									</ul>
								{/if}
							</div>

							<!-- Enter button -->
							<a
								href={resolve(`/login?as=${persona.loginId}`)}
								class="mt-3 block rounded-md px-4 py-2 text-center text-sm font-medium transition-colors
								{persona.recommended
									? 'bg-accent1 text-white hover:bg-accent1/90'
									: 'border border-accent1 text-accent1 hover:bg-accent1 hover:text-white'}"
							>
								{t(data.locale, 'platform.enter_as')}
							</a>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}

	<p class="mt-4 text-center text-xs text-secondary">
		{t(data.locale, 'platform.access_note')}
	</p>
</div>
