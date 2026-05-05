<script lang="ts">
	/**
	 * How It Works Page
	 *
	 * Explains Primer's five-tier framework, the five pillars of the system,
	 * and how the product serves each organizational role.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildHowTo } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	/** Five-tier framework definitions */
	const tiers = [
		{ key: 'alarm', color: 'bg-tier-alarm', textColor: 'text-tier-alarm' },
		{ key: 'concern', color: 'bg-tier-concern', textColor: 'text-tier-concern' },
		{ key: 'content', color: 'bg-tier-content', textColor: 'text-tier-content' },
		{ key: 'effective', color: 'bg-tier-effective', textColor: 'text-tier-effective' },
		{ key: 'optimized', color: 'bg-tier-optimized', textColor: 'text-tier-optimized' }
	];

	/** Five pillars of the system */
	const pillars = [
		{
			key: 'how.pillar1',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		},
		{
			key: 'how.pillar2',
			icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'
		},
		{
			key: 'how.pillar3',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
		},
		{
			key: 'how.pillar4',
			icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		{
			key: 'how.pillar5',
			icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
		}
	];

	/** Alternating accent colors for pillar icons (cognac, moss, slate) */
	const pillarAccents = ['accent1', 'accent2', 'accent3', 'accent1', 'accent2'];

	/** Role-based value propositions */
	const roles = [
		{
			key: 'how.role_ceo',
			label: 'CEO',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
		},
		{
			key: 'how.role_vp',
			label: 'VP / Director',
			icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
		},
		{
			key: 'how.role_manager',
			label: 'Manager',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
		},
		{
			key: 'how.role_ic',
			label: 'IC',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		},
		{
			key: 'how.role_hr',
			label: 'HR / CoS',
			icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
		}
	];
</script>

<Seo locale={data.locale} pageKey="how" path="/web/how-it-works" />
<StructuredData
	data={buildHowTo(
		t(data.locale, 'seo.how.title'),
		t(data.locale, 'seo.how.description'),
		tiers.map((tier) => ({
			name: t(data.locale, `tier.${tier.key}`),
			text: t(data.locale, `tier.${tier.key}.description`)
		}))
	)}
/>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Hero -->
	<BlurFade delay={0}>
		<div class="text-center">
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'how.hero')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'how.hero_sub')}
			</p>
		</div>
	</BlurFade>

	<!-- Canvas differentiator: Primer as a starting point, not a prescription -->
	<BlurFade delay={150}>
		<div class="mt-16 rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8 sm:p-12">
			<div class="grid gap-8 sm:grid-cols-2 sm:items-center">
				<div>
					<p class="text-eyebrow mb-3 text-accent1">{t(data.locale, 'how.source_code_answer')}</p>
					<h2 class="text-2xl font-medium text-primary sm:text-3xl">
						{t(data.locale, 'how.canvas_heading')}
					</h2>
				</div>
				<div>
					<p class="leading-relaxed text-secondary">
						{t(data.locale, 'how.canvas_body')}
					</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Five-Tier Framework -->
	<BlurFade delay={300}>
		<div class="mt-24">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'how.framework_heading')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'how.framework_body')}
			</p>

			<!-- Tier visualization: stacked cards with color accent -->
			<div class="mt-10 grid gap-3 sm:grid-cols-5">
				{#each tiers as tier, i (tier.key)}
					<div
						class="relative overflow-hidden rounded-lg border border-border bg-surfaceMid p-4 transition-colors hover:bg-surfaceHigh"
					>
						<!-- Color accent bar at top -->
						<div class="absolute inset-x-0 top-0 h-1 {tier.color}"></div>
						<div class="mt-1">
							<span class="font-mono text-2xl font-semibold tabular-nums {tier.textColor}">
								{i + 1}
							</span>
							<p class="mt-2 text-xs leading-relaxed text-secondary">
								{t(data.locale, `how.tier_${tier.key}`)}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Five Pillars — alternating accent colors (cognac, moss, slate) -->
	<div class="mt-24 space-y-6">
		{#each pillars as pillar, i (pillar.key)}
			<BlurFade delay={500 + i * 100}>
				<div
					class="flex flex-col gap-6 rounded-lg border border-border bg-surfaceMid p-6 transition-colors hover:bg-surfaceHigh sm:flex-row sm:items-start sm:p-8"
				>
					<div
						class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
						style="background-color: color-mix(in srgb, var(--color-{pillarAccents[
							i
						]}) 10%, transparent);"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							style="color: var(--color-{pillarAccents[i]});"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d={pillar.icon}
							/>
						</svg>
					</div>
					<div>
						<h3 class="text-section-heading text-primary">
							{t(data.locale, `${pillar.key}.heading`)}
						</h3>
						<p class="mt-2 leading-relaxed text-secondary">
							{t(data.locale, `${pillar.key}.body`)}
						</p>
					</div>
				</div>
			</BlurFade>
		{/each}
	</div>

	<!-- Two-party metric ownership differentiator -->
	<BlurFade delay={1000}>
		<div class="mt-24 rounded-lg border-2 border-accent2/30 bg-accent2/5 p-8 sm:p-12">
			<div class="grid gap-8 sm:grid-cols-[1fr_2fr] sm:items-start">
				<div>
					<p class="text-eyebrow mb-3 text-accent2">
						{t(data.locale, 'how.two_party.eyebrow')}
					</p>
					<h2 class="text-2xl font-medium text-primary sm:text-3xl">
						{t(data.locale, 'how.two_party.heading')}
					</h2>
				</div>
				<div class="space-y-4">
					<p class="leading-relaxed text-secondary">
						{t(data.locale, 'how.two_party.body1')}
					</p>
					<p class="leading-relaxed text-secondary">
						{t(data.locale, 'how.two_party.body2')}
					</p>

					<!-- Visual: top-down critical metrics ↔ bottom-up employee participation -->
					<div class="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
						<div class="rounded-lg border border-accent2/30 bg-surface p-4">
							<p class="text-eyebrow mb-2 text-accent2">
								{t(data.locale, 'how.two_party.step1.label')}
							</p>
							<p class="text-sm font-medium text-primary">
								{t(data.locale, 'how.two_party.step1.title')}
							</p>
							<p class="mt-1 text-xs text-secondary">
								{t(data.locale, 'how.two_party.step1.body')}
							</p>
						</div>
						<div class="hidden items-center justify-center sm:flex">
							<svg
								class="h-5 w-10 text-accent2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 40 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M28 5l7 7m0 0l-7 7m7-7H5M12 19l-7-7m0 0l7-7"
								/>
							</svg>
						</div>
						<div class="rounded-lg border border-accent2/30 bg-surface p-4">
							<p class="text-eyebrow mb-2 text-accent2">
								{t(data.locale, 'how.two_party.step2.label')}
							</p>
							<p class="text-sm font-medium text-primary">
								{t(data.locale, 'how.two_party.step2.title')}
							</p>
							<p class="mt-1 text-xs text-secondary">
								{t(data.locale, 'how.two_party.step2.body')}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Built for every level -->
	<BlurFade delay={1100}>
		<div class="mt-24">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'how.roles_heading')}
			</h2>
			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each roles as role (role.key)}
					<div
						class="rounded-lg border border-border bg-surfaceMid p-5 text-center transition-colors hover:bg-surfaceHigh"
					>
						<div
							class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent3/10"
						>
							<svg
								class="h-5 w-5 text-accent3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d={role.icon}
								/>
							</svg>
						</div>
						<div class="mt-3 text-sm font-medium text-primary">
							{t(data.locale, `${role.key}.label`)}
						</div>
						<p class="mt-1 text-xs text-secondary">{t(data.locale, role.key)}</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Outcome image: leadership acting on the data, not the data itself -->
	<BlurFade delay={1150}>
		<div class="mt-24 overflow-hidden rounded-xl border border-border">
			<img
				src="/images/web/how-it-works-outcome.webp"
				alt={t(data.locale, 'web.image.how_outcome.alt')}
				loading="lazy"
				decoding="async"
				class="aspect-[16/9] w-full object-cover"
			/>
		</div>
	</BlurFade>

	<!-- CTA -->
	<BlurFade delay={1200}>
		<div class="mt-24 text-center">
			<h3 class="text-page-heading text-primary">
				{t(data.locale, 'how.cta_heading')}
			</h3>
			<p class="mx-auto mt-3 max-w-lg text-secondary">
				{t(data.locale, 'how.cta_body')}
			</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a href={resolve('/web/demo')} class="btn-primary px-8 py-3 text-base">
					{t(data.locale, 'how.cta_demo')}
				</a>
				<a href={resolve('/web/pricing')} class="btn-outline px-8 py-3 text-base">
					{t(data.locale, 'how.cta_pricing')}
				</a>
			</div>
		</div>
	</BlurFade>
</div>
