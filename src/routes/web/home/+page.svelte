<script lang="ts">
	/**
	 * Marketing Home Page - Motivation Transformation Funnel
	 *
	 * Seven-zone layout following the new message flow:
	 * 1. Hero              - "What if" low-risk pitch ($5,000 one-time)
	 * 2. Extrinsic Ceiling  - Telling people what to do has a hard ceiling
	 * 3. Intrinsic Structure - Intrinsic ≠ chaos: predict, report, comply
	 * 4. The Platform       - Primer: autonomy, mastery, purpose + peer visibility
	 *                          Hans testimonial as social proof
	 * 5. The Model          - perpetual license, security, deployment
	 * 6. Close              - restate value, CTA
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade, ResearchDive } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import {
		buildOrganization,
		buildWebSite,
		buildSoftwareApplication
	} from '$lib/seo/structured.js';
	import type { ResearchItem } from '$lib/components/animations/ResearchDive.svelte';

	let { data }: { data: PageData } = $props();

	/** Extrinsic problem research - why command-and-control fails */
	const extrinsicResearch = $derived<ResearchItem[]>([
		{
			type: 'video',
			title: t(data.locale, 'home.motivation.talks.dan_pink.title'),
			subtitle: t(data.locale, 'home.motivation.talks.dan_pink.speaker'),
			description: t(data.locale, 'home.motivation.talks.dan_pink.description'),
			url: 'https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation',
			badge: 'TED'
		},
		{
			type: 'video',
			title: t(data.locale, 'home.motivation.talks.barry_schwartz.title'),
			subtitle: t(data.locale, 'home.motivation.talks.barry_schwartz.speaker'),
			description: t(data.locale, 'home.motivation.talks.barry_schwartz.description'),
			url: 'https://www.ted.com/talks/barry_schwartz_the_way_we_think_about_work_is_broken',
			badge: 'TED'
		},
		{
			type: 'stat',
			title: t(data.locale, 'home.motivation.research.stat1'),
			subtitle: t(data.locale, 'home.motivation.research.stat1.source'),
			url: 'https://www.psychologytoday.com/us/blog/getting-up-on-monday-morning/202206/new-research-shows-intrinsic-motivation-is-crucial-at-work'
		},
		{
			type: 'article',
			title: t(data.locale, 'home.motivation.reading.sdt'),
			subtitle: 'selfdeterminationtheory.org',
			url: 'https://selfdeterminationtheory.org/theory/'
		}
	]);

	/** Intrinsic framework research - SDT and goal-setting science */
	const intrinsicResearch = $derived<ResearchItem[]>([
		{
			type: 'video',
			title: t(data.locale, 'home.motivation.talks.dan_ariely.title'),
			subtitle: t(data.locale, 'home.motivation.talks.dan_ariely.speaker'),
			description: t(data.locale, 'home.motivation.talks.dan_ariely.description'),
			url: 'https://www.ted.com/talks/dan_ariely_what_makes_us_feel_good_about_our_work',
			badge: 'TED'
		},
		{
			type: 'stat',
			title: t(data.locale, 'home.motivation.research.stat4'),
			subtitle: t(data.locale, 'home.motivation.research.stat4.source'),
			url: 'https://www.thrivesparrow.com/blog/performance-management-statistics'
		},
		{
			type: 'article',
			title: t(data.locale, 'home.motivation.reading.drive'),
			subtitle: 'danpink.com',
			url: 'https://www.danpink.com/books/drive/'
		}
	]);

	/** Platform capability cards with research backing */
	const platformCards = $derived<
		Array<{
			headingKey: string;
			bodyKey: string;
			num: string;
			stat: string;
			statSource: string;
			research: ResearchItem[];
		}>
	>([
		{
			headingKey: 'home.platform.autonomy.heading',
			bodyKey: 'home.platform.autonomy.body',
			num: '01',
			stat: t(data.locale, 'home.card.stat.weighting'),
			statSource: t(data.locale, 'home.card.stat.weighting.source'),
			research: [
				{
					type: 'video',
					title: t(data.locale, 'home.motivation.talks.angela_duckworth.title'),
					subtitle: t(data.locale, 'home.motivation.talks.angela_duckworth.speaker'),
					description: t(data.locale, 'home.motivation.talks.angela_duckworth.description'),
					url: 'https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance',
					badge: 'TED'
				},
				{
					type: 'article',
					title:
						t(data.locale, 'home.motivation.autonomy.heading') +
						' - ' +
						t(data.locale, 'home.motivation.autonomy.source'),
					subtitle: t(data.locale, 'home.motivation.autonomy.body'),
					url: 'https://selfdeterminationtheory.org/theory/'
				},
				{
					type: 'article',
					title: t(data.locale, 'home.motivation.reading.drive'),
					subtitle: 'danpink.com',
					url: 'https://www.danpink.com/books/drive/'
				}
			]
		},
		{
			headingKey: 'home.platform.mastery.heading',
			bodyKey: 'home.platform.mastery.body',
			num: '02',
			stat: t(data.locale, 'home.card.stat.thresholds'),
			statSource: t(data.locale, 'home.card.stat.thresholds.source'),
			research: [
				{
					type: 'video',
					title: t(data.locale, 'home.motivation.talks.csikszentmihalyi.title'),
					subtitle: t(data.locale, 'home.motivation.talks.csikszentmihalyi.speaker'),
					description: t(data.locale, 'home.motivation.talks.csikszentmihalyi.description'),
					url: 'https://www.ted.com/talks/mihaly_csikszentmihalyi_flow_the_secret_to_happiness',
					badge: 'TED'
				},
				{
					type: 'article',
					title:
						t(data.locale, 'home.motivation.mastery.heading') +
						' - ' +
						t(data.locale, 'home.motivation.mastery.source'),
					subtitle: t(data.locale, 'home.motivation.mastery.body'),
					url: 'https://hbr.org/2011/05/the-power-of-small-wins'
				},
				{
					type: 'article',
					title: t(data.locale, 'home.motivation.reading.progress'),
					subtitle: 'hbr.org',
					url: 'https://hbr.org/2011/05/the-power-of-small-wins'
				}
			]
		},
		{
			headingKey: 'home.platform.purpose.heading',
			bodyKey: 'home.platform.purpose.body',
			num: '03',
			stat: t(data.locale, 'home.card.stat.silos'),
			statSource: t(data.locale, 'home.card.stat.silos.source'),
			research: [
				{
					type: 'video',
					title: t(data.locale, 'home.motivation.talks.simon_sinek.title'),
					subtitle: t(data.locale, 'home.motivation.talks.simon_sinek.speaker'),
					description: t(data.locale, 'home.motivation.talks.simon_sinek.description'),
					url: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action',
					badge: 'TED'
				},
				{
					type: 'article',
					title:
						t(data.locale, 'home.motivation.purpose.heading') +
						' - ' +
						t(data.locale, 'home.motivation.purpose.source'),
					subtitle: t(data.locale, 'home.motivation.purpose.body'),
					url: 'https://www.danpink.com/books/drive/'
				},
				{
					type: 'article',
					title: t(data.locale, 'home.motivation.reading.aristotle'),
					subtitle: 'rework.withgoogle.com',
					url: 'https://rework.withgoogle.com/intl/en/subjects/managers'
				}
			]
		},
		{
			headingKey: 'home.platform.inquiry.heading',
			bodyKey: 'home.platform.inquiry.body',
			num: '04',
			stat: t(data.locale, 'home.card.stat.inquiry'),
			statSource: t(data.locale, 'home.card.stat.inquiry.source'),
			research: [
				{
					type: 'video',
					title: t(data.locale, 'home.motivation.talks.dan_pink.title'),
					subtitle: t(data.locale, 'home.motivation.talks.dan_pink.speaker'),
					description: t(data.locale, 'home.motivation.talks.dan_pink.description'),
					url: 'https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation',
					badge: 'TED'
				},
				{
					type: 'article',
					title: t(data.locale, 'home.motivation.reading.gallup'),
					subtitle: 'gallup.com',
					url: 'https://www.gallup.com/workplace/697904/state-of-the-global-workplace-global-data.aspx'
				},
				{
					type: 'article',
					title: t(data.locale, 'home.motivation.reading.mckinsey'),
					subtitle: 'mckinsey.com',
					url: 'https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/hr-monitor-2025'
				}
			]
		}
	]);
</script>

<svelte:head>
	<link rel="preload" as="image" href="/images/web/home-hero-team.webp" type="image/webp" />
</svelte:head>

<Seo locale={data.locale} pageKey="home" path="/web/home" />
<StructuredData data={buildOrganization(data.locale)} />
<StructuredData data={buildWebSite(data.locale)} />
<StructuredData data={buildSoftwareApplication(data.locale)} />

<!-- ─── Zone 1: Hero - "What if" Low-Risk Pitch ─────────────────────────── -->
<section class="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 lg:px-8">
	<div class="grid items-center gap-16 lg:grid-cols-2">
		<!-- Left: Value proposition -->
		<div>
			<BlurFade delay={0} duration={500}>
				<p class="text-eyebrow mb-4 text-secondary">
					{t(data.locale, 'home.eyebrow')}
				</p>
			</BlurFade>
			<BlurFade delay={100} duration={500}>
				<h1
					class="text-hero text-primary"
					style="font-size: 36px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.15;"
				>
					{t(data.locale, 'home.headline')}
				</h1>
			</BlurFade>
			<BlurFade delay={200} duration={500}>
				<p class="mt-6 text-lg leading-relaxed text-secondary">
					{t(data.locale, 'home.subhead')}
				</p>
			</BlurFade>
			<BlurFade delay={320} duration={500}>
				<div class="mt-10 flex flex-wrap items-center gap-4">
					<a href={resolve('/platform')} class="btn-primary px-6 py-3">
						{t(data.locale, 'home.cta.platform')}
						<svg
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</a>
					<a
						href={resolve('/web/demo')}
						class="text-sm font-medium text-secondary hover:text-primary"
					>
						{t(data.locale, 'home.cta.walkthrough')} →
					</a>
				</div>
			</BlurFade>
		</div>

		<!-- Right: Product preview (composite score card) -->
		<BlurFade delay={200} duration={600}>
			<div class="rounded-xl border border-border bg-surfaceMid p-6 shadow-sm">
				<!-- Composite score hero -->
				<div class="mb-6 border-b border-border pb-6">
					<p class="text-eyebrow mb-3 text-secondary">{t(data.locale, 'score.composite')}</p>
					<div class="flex items-end gap-4">
						<span
							class="font-mono text-5xl font-semibold tabular-nums"
							style="color: var(--color-tier-effective);"
						>
							3.6
						</span>
						<div
							class="mb-1.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
							style="background-color: color-mix(in srgb, var(--color-tier-effective) 12%, transparent); color: var(--color-tier-effective);"
						>
							<svg
								class="h-3.5 w-3.5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							{t(data.locale, 'tier.effective')}
						</div>
					</div>
					<p class="mt-2 text-xs text-secondary tabular-nums">
						↑0.2 {t(data.locale, 'score.previous_cycle')}
					</p>
				</div>

				<!-- Metric stack preview -->
				<div class="space-y-0 divide-y divide-border">
					{#each [{ name: t(data.locale, 'home.preview.metric.schedule_adherence'), weight: 30, tierColor: 'var(--color-tier-effective)', tierBg: 'color-mix(in srgb, var(--color-tier-effective) 10%, transparent)', label: t(data.locale, 'tier.effective'), icon: '✓' }, { name: t(data.locale, 'home.preview.metric.budget_variance'), weight: 25, tierColor: 'var(--color-tier-concern)', tierBg: 'color-mix(in srgb, var(--color-tier-concern) 10%, transparent)', label: t(data.locale, 'tier.concern'), icon: '▲' }, { name: t(data.locale, 'home.preview.metric.win_rate'), weight: 20, tierColor: 'var(--color-tier-effective)', tierBg: 'color-mix(in srgb, var(--color-tier-effective) 10%, transparent)', label: t(data.locale, 'tier.effective'), icon: '✓' }, { name: t(data.locale, 'home.preview.metric.incident_frequency'), weight: 25, tierColor: 'var(--color-tier-content)', tierBg: 'color-mix(in srgb, var(--color-tier-content) 10%, transparent)', label: t(data.locale, 'tier.content'), icon: '○' }] as metric, idx (idx)}
						<div class="flex items-center justify-between py-3">
							<span class="text-sm font-medium text-primary">{metric.name}</span>
							<div class="flex items-center gap-3">
								<span class="text-sm text-secondary tabular-nums">{metric.weight}%</span>
								<span
									class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
									style="background-color: {metric.tierBg}; color: {metric.tierColor};"
								>
									<span aria-hidden="true">{metric.icon}</span>
									{metric.label}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</BlurFade>
	</div>
</section>

<!-- ─── Photo band: humanizes the abstract pitch above ─────────────────── -->
<div class="border-y border-border bg-surfaceMid">
	<img
		src="/images/web/home-hero-team.webp"
		alt={t(data.locale, 'web.image.home_team.alt')}
		fetchpriority="high"
		decoding="async"
		class="h-[42vh] min-h-[280px] w-full object-cover sm:h-[52vh] sm:max-h-[560px]"
	/>
</div>

<!-- ─── Zone 2: Extrinsic Ceiling - Command-and-Control Has Limits ──────── -->
<section class="border-y border-border bg-surfaceMid">
	<div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
		<BlurFade delay={0} duration={500}>
			<p class="text-eyebrow mb-4 text-secondary">
				{t(data.locale, 'home.extrinsic.eyebrow')}
			</p>
		</BlurFade>
		<BlurFade delay={100} duration={500}>
			<h2 class="text-page-heading mb-6 max-w-3xl text-primary">
				{t(data.locale, 'home.extrinsic.heading')}
			</h2>
		</BlurFade>
		<BlurFade delay={200} duration={500}>
			<p class="mb-16 max-w-2xl text-lg leading-relaxed text-secondary">
				{t(data.locale, 'home.extrinsic.body')}
			</p>
		</BlurFade>

		<!-- Stat cards - each links to its source -->
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each [{ key: 'stat1', url: 'https://www.gallup.com/workplace/644717/chros-think-performance-management-system-works.aspx' }, { key: 'stat2', url: 'https://www.octanner.com/global-culture-report' }, { key: 'stat3', url: 'https://www.gallup.com/workplace/697904/state-of-the-global-workplace-global-data.aspx' }, { key: 'stat4', url: 'https://www.gallup.com/workplace/697904/state-of-the-global-workplace-global-data.aspx' }] as stat, idx (idx)}
				<BlurFade delay={300 + idx * 80} duration={500}>
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={stat.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group block rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent1"
					>
						<p class="mb-2 font-mono text-4xl font-bold text-primary tabular-nums">
							{t(data.locale, `home.extrinsic.${stat.key}.value`)}
						</p>
						<p class="mb-3 text-sm leading-relaxed text-secondary">
							{t(data.locale, `home.extrinsic.${stat.key}.label`)}
						</p>
						<p class="flex items-center gap-1 text-xs text-secondary group-hover:text-accent1">
							{t(data.locale, `home.extrinsic.${stat.key}.source`)}
							<svg
								class="h-3 w-3 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
						</p>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</BlurFade>
			{/each}
		</div>

		<!-- Research dive for extrinsic section -->
		<div class="mt-12">
			<ResearchDive
				label={t(data.locale, 'home.research.tab.studies', { count: '3' })}
				items={extrinsicResearch}
			/>
		</div>
	</div>
</section>

<!-- ─── Zone 3: Intrinsic Structure - Predict, Report, Comply ───────────── -->
<section class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
	<BlurFade delay={0} duration={500}>
		<p class="text-eyebrow mb-4 text-secondary">
			{t(data.locale, 'home.intrinsic.eyebrow')}
		</p>
	</BlurFade>
	<BlurFade delay={100} duration={500}>
		<h2 class="text-page-heading mb-6 max-w-3xl text-primary">
			{t(data.locale, 'home.intrinsic.heading')}
		</h2>
	</BlurFade>
	<BlurFade delay={200} duration={500}>
		<p class="mb-16 max-w-2xl text-lg leading-relaxed text-secondary">
			{t(data.locale, 'home.intrinsic.body')}
		</p>
	</BlurFade>

	<!-- Three goal-type cards: Predict / Report / Comply -->
	<div class="mb-16 grid gap-8 md:grid-cols-3">
		{#each [{ key: 'leading', num: '01', stat: t(data.locale, 'home.card.stat.imposed'), statSource: t(data.locale, 'home.card.stat.imposed.source') }, { key: 'lagging', num: '02', stat: t(data.locale, 'home.card.stat.stale'), statSource: t(data.locale, 'home.card.stat.stale.source') }, { key: 'compliance', num: '03', stat: t(data.locale, 'home.card.stat.priority'), statSource: t(data.locale, 'home.card.stat.priority.source') }] as card, idx (idx)}
			<BlurFade delay={300 + idx * 100} duration={500}>
				<div class="rounded-xl border border-border bg-surfaceMid p-6">
					<p
						class="mb-4 font-mono text-3xl font-bold text-primary tabular-nums"
						style="opacity: 0.15;"
						aria-hidden="true"
					>
						{card.num}
					</p>
					<h3 class="mb-2 text-lg font-semibold text-primary">
						{t(data.locale, `home.intrinsic.${card.key}.heading`)}
					</h3>
					<p
						class="mb-1 text-xs font-medium tracking-wider uppercase"
						style="color: var(--color-accent1);"
					>
						{t(data.locale, `home.intrinsic.${card.key}.label`)}
					</p>
					<p class="text-sm leading-relaxed text-secondary">
						{t(data.locale, `home.intrinsic.${card.key}.body`)}
					</p>
					<!-- Leaked stat -->
					<div
						class="mt-4 flex items-start gap-2 rounded-lg p-3"
						style="background-color: color-mix(in srgb, var(--color-accent1) 6%, transparent);"
					>
						<svg
							class="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							style="color: var(--color-accent1);"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<div>
							<p class="text-xs leading-snug font-medium text-primary">{card.stat}</p>
							<p class="mt-0.5 text-[10px] text-secondary" style="opacity: 0.7;">
								{card.statSource}
							</p>
						</div>
					</div>
				</div>
			</BlurFade>
		{/each}
	</div>

	<!-- Bridge quote -->
	<BlurFade delay={600} duration={500}>
		<blockquote class="mb-10 border-l-4 border-accent1 py-2 pl-6">
			<p class="text-xl leading-relaxed text-secondary italic">
				"{t(data.locale, 'home.intrinsic.bridge')}"
			</p>
		</blockquote>
	</BlurFade>

	<!-- Research dive for intrinsic section -->
	<BlurFade delay={700} duration={500}>
		<ResearchDive
			label={t(data.locale, 'home.research.tab.studies', { count: '2' })}
			items={intrinsicResearch}
		/>
	</BlurFade>

	<!-- Scroll CTA to platform -->
	<BlurFade delay={750} duration={500}>
		<a href="#platform" class="mt-8 inline-block text-sm font-medium text-accent1 hover:underline">
			{t(data.locale, 'home.cta.platform')} →
		</a>
	</BlurFade>
</section>

<!-- ─── Zone 4: The Platform - Autonomy, Mastery, Purpose + Visibility ──── -->
<section id="platform" class="border-t border-border bg-surfaceMid">
	<div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
		<!-- Section header -->
		<div class="mb-24">
			<BlurFade delay={0} duration={500}>
				<p class="text-eyebrow mb-4 text-secondary">
					{t(data.locale, 'home.platform.eyebrow')}
				</p>
			</BlurFade>
			<BlurFade delay={100} duration={500}>
				<h2 class="text-page-heading mb-6 max-w-3xl text-primary">
					{t(data.locale, 'home.platform.heading')}
				</h2>
			</BlurFade>
			<BlurFade delay={200} duration={500}>
				<p class="mb-16 max-w-2xl text-lg leading-relaxed text-secondary">
					{t(data.locale, 'home.platform.body')}
				</p>
			</BlurFade>

			<!-- Platform capability cards - 2x2 grid -->
			<div class="grid gap-8 md:grid-cols-2">
				{#each platformCards as card, idx (idx)}
					<BlurFade delay={300 + idx * 100} duration={500}>
						<div class="rounded-xl border border-border bg-surface p-6">
							<p
								class="mb-4 font-mono text-3xl font-bold text-primary tabular-nums"
								style="opacity: 0.15;"
								aria-hidden="true"
							>
								{card.num}
							</p>
							<h3 class="mb-3 text-lg font-semibold text-primary">
								{t(data.locale, card.headingKey)}
							</h3>
							<p class="text-sm leading-relaxed text-secondary">
								{t(data.locale, card.bodyKey)}
							</p>
							<!-- Leaked stat -->
							<div
								class="mt-4 flex items-start gap-2 rounded-lg p-3"
								style="background-color: color-mix(in srgb, var(--color-accent1) 6%, transparent);"
							>
								<svg
									class="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									style="color: var(--color-accent1);"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								<div>
									<p class="text-xs leading-snug font-medium text-primary">{card.stat}</p>
									<p class="mt-0.5 text-xs text-secondary">
										{card.statSource}
									</p>
								</div>
							</div>
							<ResearchDive
								label={t(data.locale, 'home.research.tab.studies', { count: '2' })}
								items={card.research}
							/>
						</div>
					</BlurFade>
				{/each}
			</div>
		</div>

		<!-- Research voices - credibility from the scientists who proved it -->
		<div class="border-t border-border pt-24">
			<BlurFade delay={0} duration={500}>
				<p class="text-eyebrow mb-4 text-secondary">
					{t(data.locale, 'home.voices.eyebrow')}
				</p>
			</BlurFade>
			<BlurFade delay={100} duration={500}>
				<h2 class="text-page-heading mb-12 max-w-3xl text-primary">
					{t(data.locale, 'home.voices.heading')}
				</h2>
			</BlurFade>

			<div class="grid gap-8 md:grid-cols-3">
				{#each [{ key: 'quote1' }, { key: 'quote2' }, { key: 'quote3' }] as quote, idx (idx)}
					<BlurFade delay={200 + idx * 120} duration={500}>
						<div
							class="flex h-full flex-col justify-between rounded-xl border border-border bg-surface p-6"
						>
							<blockquote class="mb-6 border-l-4 border-accent1 pl-4">
								<p class="text-sm leading-relaxed text-secondary italic">
									"{t(data.locale, `home.voices.${quote.key}.text`)}"
								</p>
							</blockquote>
							<div>
								<p class="text-sm font-semibold text-primary">
									{t(data.locale, `home.voices.${quote.key}.attribution`)}
								</p>
								<p class="mt-0.5 text-xs text-secondary">
									{t(data.locale, `home.voices.${quote.key}.source`)}
								</p>
							</div>
						</div>
					</BlurFade>
				{/each}
			</div>

			<BlurFade delay={600} duration={500}>
				<div class="mt-10 text-center">
					<a href={resolve('/platform')} class="btn-outline px-5 py-2.5 text-sm">
						{t(data.locale, 'home.voices.cta')}
						<svg
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</a>
				</div>
			</BlurFade>
		</div>
	</div>
</section>

<!-- ─── Photo band: visual breath before the price/credibility section ──── -->
<div class="border-t border-border">
	<img
		src="/images/web/home-conversation-divider.webp"
		alt={t(data.locale, 'web.image.home_conversation.alt')}
		loading="lazy"
		decoding="async"
		class="h-[36vh] min-h-[240px] w-full object-cover sm:h-[44vh] sm:max-h-[480px]"
	/>
</div>

<!-- ─── Zone 5: The Model - Perpetual Source Code License ─────────────────── -->
<section class="border-t border-border">
	<div class="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
		<div class="grid gap-16 lg:grid-cols-2">
			<!-- Left: Price argument -->
			<div>
				<p class="text-eyebrow mb-4 text-secondary">
					{t(data.locale, 'home.credibility.eyebrow')}
				</p>
				<h2 class="text-page-heading mb-6 text-primary">
					{t(data.locale, 'home.credibility.heading')}
				</h2>
				<p class="leading-relaxed text-secondary">
					{t(data.locale, 'home.credibility.body')}
				</p>

				<div class="mt-10 inline-block rounded-lg border border-border px-6 py-4">
					<p class="font-mono text-3xl font-semibold text-primary tabular-nums">$5,000</p>
					<p class="mt-1 text-sm text-secondary">{t(data.locale, 'home.credibility.price')}</p>
				</div>

				<div class="mt-8">
					<a href={resolve('/web/dashboard')} class="btn-primary px-6 py-3">
						{t(data.locale, 'purchase.cta')}
					</a>
				</div>
			</div>

			<!-- Right: Feature bullets + trust links -->
			<div>
				<ul class="space-y-5">
					{#each [{ icon: 'code', text: t(data.locale, 'purchase.source_code') }, { icon: 'server', text: t(data.locale, 'purchase.deploy_anywhere') }, { icon: 'edit', text: t(data.locale, 'purchase.modify_anything') }, { icon: 'shield', text: t(data.locale, 'purchase.own_forever') }] as item, idx (idx)}
						<li class="flex items-start gap-4">
							<span
								class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
								style="background-color: color-mix(in srgb, var(--color-accent2) 12%, transparent);"
							>
								{#if item.icon === 'code'}
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										style="color: var(--color-accent2);"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
										/>
									</svg>
								{:else if item.icon === 'server'}
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										style="color: var(--color-accent2);"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
										/>
									</svg>
								{:else if item.icon === 'edit'}
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										style="color: var(--color-accent2);"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								{:else}
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										style="color: var(--color-accent2);"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										/>
									</svg>
								{/if}
							</span>
							<span class="font-medium text-primary">{item.text}</span>
						</li>
					{/each}
				</ul>

				<div class="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-8">
					<a href={resolve('/web/pricing')} class="text-sm text-secondary hover:text-primary">
						{t(data.locale, 'home.credibility.link.pricing')}
					</a>
					<a href={resolve('/web/security')} class="text-sm text-secondary hover:text-primary">
						{t(data.locale, 'home.credibility.link.security')}
					</a>
					<a href={resolve('/web/deployment')} class="text-sm text-secondary hover:text-primary">
						{t(data.locale, 'home.credibility.link.deployment')}
					</a>
					<a href={resolve('/web/about/license')} class="text-sm text-secondary hover:text-primary">
						{t(data.locale, 'home.credibility.link.license')}
					</a>
				</div>
			</div>
		</div>
	</div>
</section>
