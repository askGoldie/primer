<script lang="ts">
	/**
	 * The Problem Page
	 *
	 * Presents research-backed statistics about organizational goal
	 * management failures, with citations for every figure shown.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade, NumberTicker } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildWebPage } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Each section pairs its statistics with a `variant` that selects a
	 * distinct visual treatment. Cycling through different layouts keeps the
	 * page from feeling like a single repeating template, while the data and
	 * copy remain fully driven by locale files.
	 */
	type StatVariant = 'funnel' | 'rings' | 'feature' | 'split';

	interface ProblemStat {
		value: number;
		suffix: string;
		key: string;
		prefix?: string;
	}

	interface ProblemSection {
		key: string;
		variant: StatVariant;
		accent: 'accent1' | 'accent2' | 'accent3';
		stats: ProblemStat[];
	}

	/** Problem sections with animated statistics */
	const sections: ProblemSection[] = [
		{
			key: 'problem.section1',
			variant: 'funnel',
			accent: 'accent1',
			stats: [
				{ value: 95, suffix: '%', key: 'problem.section1.stat1' },
				{ value: 33, suffix: '%', key: 'problem.section1.stat2' },
				{ value: 2, suffix: '%', key: 'problem.section1.stat3' }
			]
		},
		{
			key: 'problem.section2',
			variant: 'rings',
			accent: 'accent2',
			stats: [
				{ value: 82, suffix: '%', key: 'problem.section2.stat1' },
				{ value: 71, suffix: '%', key: 'problem.section2.stat2' },
				{ value: 34, suffix: '%', key: 'problem.section2.stat3' }
			]
		},
		{
			key: 'problem.section3',
			variant: 'feature',
			accent: 'accent3',
			stats: [
				{ value: 50, suffix: '%', key: 'problem.section3.stat1' },
				{ value: 21, suffix: '%', key: 'problem.section3.stat2' },
				{ value: 438, suffix: 'B', key: 'problem.section3.stat3', prefix: '$' }
			]
		},
		{
			key: 'problem.section4',
			variant: 'split',
			accent: 'accent1',
			stats: [
				{ value: 70, suffix: '%', key: 'problem.section4.stat1' },
				{ value: 61, suffix: '%', key: 'problem.section4.stat2' }
			]
		}
	];

	/** SVG ring geometry shared by the `rings` variant. */
	const RING_RADIUS = 52;
	const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
</script>

<Seo locale={data.locale} pageKey="problem" path="/web/problem" />
<StructuredData
	data={buildWebPage(
		data.locale,
		t(data.locale, 'seo.problem.title'),
		t(data.locale, 'seo.problem.description'),
		'/web/problem'
	)}
/>

<!-- Hero section with accent warmth -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'problem.title')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl lg:text-5xl">
				{t(data.locale, 'problem.hero')}
			</h1>
			<p class="mt-6 text-lg text-secondary sm:text-xl">
				{t(data.locale, 'problem.hero_sub')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Emotional anchor: the cost of disengagement has a face -->
	<BlurFade delay={50}>
		<div class="-mt-4 mb-16 overflow-hidden rounded-xl border border-border">
			<img
				src="/images/web/problem-anchor.webp"
				alt={t(data.locale, 'web.image.problem_anchor.alt')}
				loading="lazy"
				decoding="async"
				class="aspect-[16/9] w-full object-cover"
			/>
		</div>
	</BlurFade>

	<BlurFade delay={100}>
		<p class="text-eyebrow text-accent1">{t(data.locale, 'problem.stat_intro')}</p>
	</BlurFade>

	<!-- Problem sections — each section uses a distinct visual variant -->
	{#each sections as section, sectionIndex (section.key)}
		<BlurFade delay={200 + sectionIndex * 150}>
			<div class="mt-16 border-b border-border pb-16 last:border-b-0">
				<h2
					class="text-page-heading border-l-4 ps-4 text-primary"
					style="border-color: var(--color-{section.accent});"
				>
					{t(data.locale, `${section.key}.heading`)}
				</h2>

				{#if section.variant === 'funnel'}
					<!--
						Funnel variant: horizontal bars whose width tracks the stat
						value, dramatising the dropoff from a large starting cohort
						down to a tiny remainder.
					-->
					<div class="mt-8 space-y-3">
						{#each section.stats as stat, statIndex (stat.key)}
							<div
								class="relative overflow-hidden rounded-md border bg-surfaceMid"
								style="border-color: color-mix(in srgb, var(--color-{section.accent}) 25%, transparent);"
							>
								<div
									class="absolute inset-y-0 start-0"
									style="width: {stat.value}%; background: color-mix(in srgb, var(--color-{section.accent}) 18%, transparent);"
								></div>
								<div class="relative flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-5">
									<div
										class="min-w-[5.5rem] text-3xl font-medium tracking-tight sm:text-4xl"
										style="color: var(--color-{section.accent});"
									>
										{#if stat.prefix}<span class="font-mono">{stat.prefix}</span>{/if}<NumberTicker
											value={stat.value}
											delay={300 + statIndex * 150}
											duration={1200}
										/>{stat.suffix}
									</div>
									<p class="text-sm text-secondary sm:text-base">
										{t(data.locale, stat.key)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{:else if section.variant === 'rings'}
					<!--
						Rings variant: animated SVG progress arcs convey magnitude
						visually without relying on bar charts again.
					-->
					<div class="mt-8 grid gap-6 sm:grid-cols-3">
						{#each section.stats as stat, statIndex (stat.key)}
							{@const offset = RING_CIRCUMFERENCE * (1 - stat.value / 100)}
							<div
								class="flex flex-col items-center rounded-xl border bg-surfaceMid p-6"
								style="border-color: color-mix(in srgb, var(--color-{section.accent}) 25%, transparent);"
							>
								<div class="relative h-32 w-32">
									<svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
										<circle
											cx="60"
											cy="60"
											r={RING_RADIUS}
											fill="none"
											stroke="color-mix(in srgb, var(--color-{section.accent}) 15%, transparent)"
											stroke-width="10"
										/>
										<circle
											cx="60"
											cy="60"
											r={RING_RADIUS}
											fill="none"
											stroke="var(--color-{section.accent})"
											stroke-width="10"
											stroke-linecap="round"
											stroke-dasharray={RING_CIRCUMFERENCE}
											stroke-dashoffset={offset}
											style="transition: stroke-dashoffset 1.4s cubic-bezier(.22,.61,.36,1) {0.3 +
												statIndex * 0.15}s;"
										/>
									</svg>
									<div
										class="absolute inset-0 flex items-center justify-center text-2xl font-medium tracking-tight sm:text-3xl"
										style="color: var(--color-{section.accent});"
									>
										<NumberTicker
											value={stat.value}
											delay={300 + statIndex * 150}
											duration={1400}
										/>{stat.suffix}
									</div>
								</div>
								<p class="mt-4 text-center text-sm text-secondary">
									{t(data.locale, stat.key)}
								</p>
							</div>
						{/each}
					</div>
				{:else if section.variant === 'feature'}
					<!--
						Feature variant: one hero stat occupies a large panel while
						the supporting figures sit in a stacked sidebar. The hero is
						the final stat in the array (the climax figure).
					-->
					{@const heroIndex = section.stats.length - 1}
					{@const hero = section.stats[heroIndex]}
					<div class="mt-8 grid gap-4 lg:grid-cols-5">
						<div
							class="rounded-xl border p-8 sm:p-10 lg:col-span-3"
							style="border-color: color-mix(in srgb, var(--color-{section.accent}) 30%, transparent); background: color-mix(in srgb, var(--color-{section.accent}) 8%, var(--color-surfaceMid));"
						>
							<div
								class="text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl"
								style="color: var(--color-{section.accent});"
							>
								{#if hero.prefix}<span class="font-mono">{hero.prefix}</span>{/if}<NumberTicker
									value={hero.value}
									delay={400}
									duration={1600}
								/>{hero.suffix}
							</div>
							<p class="mt-4 max-w-md text-base text-secondary sm:text-lg">
								{t(data.locale, hero.key)}
							</p>
						</div>
						<div class="grid gap-4 lg:col-span-2">
							{#each section.stats as stat, statIndex (stat.key)}
								{#if statIndex !== heroIndex}
									<div
										class="rounded-xl border bg-surfaceMid p-6"
										style="border-color: color-mix(in srgb, var(--color-{section.accent}) 25%, transparent);"
									>
										<div
											class="text-3xl font-medium tracking-tight sm:text-4xl"
											style="color: var(--color-{section.accent});"
										>
											{#if stat.prefix}<span class="font-mono">{stat.prefix}</span
												>{/if}<NumberTicker
												value={stat.value}
												delay={300 + statIndex * 150}
												duration={1200}
											/>{stat.suffix}
										</div>
										<p class="mt-2 text-sm text-secondary">
											{t(data.locale, stat.key)}
										</p>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{:else if section.variant === 'split'}
					<!--
						Split variant: two oversized figures separated by a thin
						divider. Used when there are only two stats so each can
						breathe at a much larger type scale.
					-->
					<div
						class="mt-8 grid gap-px overflow-hidden rounded-xl border"
						style="border-color: color-mix(in srgb, var(--color-{section.accent}) 25%, transparent); background-color: color-mix(in srgb, var(--color-{section.accent}) 25%, transparent); grid-template-columns: repeat({section
							.stats.length}, minmax(0, 1fr));"
					>
						{#each section.stats as stat, statIndex (stat.key)}
							<div class="bg-surfaceMid p-8 sm:p-10">
								<div
									class="text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl"
									style="color: var(--color-{section.accent});"
								>
									{#if stat.prefix}<span class="font-mono">{stat.prefix}</span>{/if}<NumberTicker
										value={stat.value}
										delay={300 + statIndex * 200}
										duration={1400}
									/>{stat.suffix}
								</div>
								<p class="mt-4 text-sm text-secondary sm:text-base">
									{t(data.locale, stat.key)}
								</p>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Body text -->
				<p class="mt-6 leading-relaxed text-secondary">
					{t(data.locale, `${section.key}.body`)}
				</p>
				<p class="mt-2 text-xs text-secondary/60">
					{t(data.locale, `${section.key}.source`)}
				</p>
			</div>
		</BlurFade>
	{/each}

	<!-- Section 5: Stale metrics (no stats, just text) -->
	<BlurFade delay={800}>
		<div class="mt-16 border-b border-border pb-16">
			<h2 class="text-page-heading border-l-4 border-accent2 ps-4 text-primary">
				{t(data.locale, 'problem.section5.heading')}
			</h2>
			<p class="mt-4 leading-relaxed text-secondary">
				{t(data.locale, 'problem.section5.body')}
			</p>
			<p class="mt-2 text-xs text-secondary/60">
				{t(data.locale, 'problem.section5.source')}
			</p>
		</div>
	</BlurFade>

	<!--
		Section 6: Vendor-driven roadmaps. The pain point is that customers
		spend years waiting for features built around someone else's
		priorities — directly motivates the source-code-ownership model.
	-->
	<BlurFade delay={850}>
		<div class="mt-16 border-b border-border pb-16">
			<h2 class="text-page-heading border-l-4 border-accent3 ps-4 text-primary">
				{t(data.locale, 'problem.section6.heading')}
			</h2>
			<p class="mt-4 leading-relaxed text-secondary">
				{t(data.locale, 'problem.section6.body')}
			</p>
			<p class="mt-2 text-xs text-secondary/60">
				{t(data.locale, 'problem.section6.source')}
			</p>
		</div>
	</BlurFade>

	<!-- CTA: The bridge -->
	<BlurFade delay={900}>
		<div class="mt-16 rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8 sm:p-12">
			<h2 class="text-2xl font-medium text-primary sm:text-3xl">
				{t(data.locale, 'problem.cta_heading')}
			</h2>
			<p class="mt-4 text-lg leading-relaxed text-secondary">
				{t(data.locale, 'problem.cta_body')}
			</p>
			<div class="mt-8">
				<a href={resolve('/web/how-it-works')} class="btn-primary px-6 py-3">
					{t(data.locale, 'problem.cta_button')}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</a>
			</div>
		</div>
	</BlurFade>
</div>
