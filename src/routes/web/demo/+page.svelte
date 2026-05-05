<script lang="ts">
	/**
	 * Demo Walkthrough - Visual-First Framework Explanation
	 *
	 * Single-page scrolling experience with 6 interactive sections:
	 * 1. The Scale   - Animated 5-tier bar, click-to-explore
	 * 2. Set Goals   - Interactive threshold definition
	 * 3. Weight      - Draggable weight sliders + live composite
	 * 4. See Score   - Animated waterfall calculation
	 * 5. Inquiry     - Visual inquiry process flow
	 * 6. CTA         - Personalized next step
	 *
	 * Constructivist approach: try first, explain after.
	 * All interactions persisted to localStorage.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import { inview } from '$lib/actions/inview.js';
	import type { TierLevel } from '$lib/types/index.js';
	import { getTierValue } from '$lib/utils/score.js';
	import { browser } from '$app/environment';
	import { SvelteSet } from 'svelte/reactivity';

	let { data }: { data: PageData } = $props();

	/** localStorage key for walkthrough progress */
	const STORAGE_KEY = 'primer_walkthrough';

	/** Tiers in order with their CSS variable colors */
	const TIERS: Array<{ key: TierLevel; color: string; bg: string }> = [
		{
			key: 'alarm',
			color: 'var(--color-tier-alarm)',
			bg: 'color-mix(in srgb, var(--color-tier-alarm) 12%, transparent)'
		},
		{
			key: 'concern',
			color: 'var(--color-tier-concern)',
			bg: 'color-mix(in srgb, var(--color-tier-concern) 12%, transparent)'
		},
		{
			key: 'content',
			color: 'var(--color-tier-content)',
			bg: 'color-mix(in srgb, var(--color-tier-content) 12%, transparent)'
		},
		{
			key: 'effective',
			color: 'var(--color-tier-effective)',
			bg: 'color-mix(in srgb, var(--color-tier-effective) 12%, transparent)'
		},
		{
			key: 'optimized',
			color: 'var(--color-tier-optimized)',
			bg: 'color-mix(in srgb, var(--color-tier-optimized) 12%, transparent)'
		}
	];

	/** Section visibility state (scroll-triggered) */
	let sectionVisible = $state<Record<string, boolean>>({
		scale: false,
		goals: false,
		weight: false,
		score: false,
		inquiry: false,
		cta: false
	});

	/** Section 1: Active tier selection */
	let activeTier = $state<TierLevel | null>(null);

	/** Section 2: User-defined thresholds */
	let userMetricName = $state('');
	let userThresholds = $state<Record<TierLevel, string>>({
		alarm: '',
		concern: '',
		content: '',
		effective: '',
		optimized: ''
	});

	/** Section 3: Interactive weight sliders */
	interface WeightMetric {
		nameKey: string;
		tier: TierLevel;
		weight: number;
		color: string;
	}
	let weightMetrics = $state<WeightMetric[]>([
		{
			nameKey: 'demo.metric.schedule_adherence',
			tier: 'effective',
			weight: 30,
			color: 'var(--color-tier-effective)'
		},
		{
			nameKey: 'demo.metric.budget_variance',
			tier: 'concern',
			weight: 25,
			color: 'var(--color-tier-concern)'
		},
		{
			nameKey: 'demo.metric.win_rate',
			tier: 'effective',
			weight: 25,
			color: 'var(--color-tier-effective)'
		},
		{
			nameKey: 'demo.metric.safety_record',
			tier: 'optimized',
			weight: 20,
			color: 'var(--color-tier-optimized)'
		}
	]);

	/** Computed composite score from weight metrics */
	const compositeScore = $derived.by(() => {
		const totalW = weightMetrics.reduce((s, m) => s + m.weight, 0);
		if (totalW === 0) return 0;
		return weightMetrics.reduce((s, m) => s + getTierValue(m.tier) * m.weight, 0) / totalW;
	});
	const totalWeight = $derived(weightMetrics.reduce((s, m) => s + m.weight, 0));

	/** Section 5: Inquiry animation step */
	let inquiryStep = $state(0);

	/** Completed sections tracking */
	let completed = $state<SvelteSet<string>>(new SvelteSet());

	/** Mark a section complete + persist */
	function markComplete(section: string) {
		completed.add(section);
		completed = new SvelteSet(completed);
		saveProgress();
	}

	/** Persist progress to localStorage */
	function saveProgress() {
		if (!browser) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					completed: [...completed],
					userMetricName,
					userThresholds,
					weightMetrics
				})
			);
		} catch {
			/* localStorage unavailable - silently ignore */
		}
	}

	/** Load progress from localStorage on mount */
	$effect(() => {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const saved = JSON.parse(raw);
				if (saved.completed) completed = new SvelteSet(saved.completed);
				if (saved.userMetricName) userMetricName = saved.userMetricName;
				if (saved.userThresholds) userThresholds = saved.userThresholds;
				if (saved.weightMetrics && saved.weightMetrics[0]?.nameKey)
					weightMetrics = saved.weightMetrics;
			}
		} catch {
			/* silently ignore */
		}
	});

	/** Tier color helper */
	function tierColor(tier: TierLevel): string {
		return TIERS.find((t) => t.key === tier)?.color ?? 'var(--color-secondary)';
	}
	function tierBg(tier: TierLevel): string {
		return TIERS.find((t) => t.key === tier)?.bg ?? 'transparent';
	}

	/** Example thresholds for "Schedule Adherence" */
	// svelte-ignore state_referenced_locally
	const exampleThresholds: Record<TierLevel, string> = {
		alarm: t(data.locale, 'demo.threshold.alarm'),
		concern: t(data.locale, 'demo.threshold.concern'),
		content: t(data.locale, 'demo.threshold.content'),
		effective: t(data.locale, 'demo.threshold.effective'),
		optimized: t(data.locale, 'demo.threshold.optimized')
	};
</script>

<Seo locale={data.locale} pageKey="demo" path="/web/demo" />

<!-- ─── Hero / Intro ────────────────────────────────────────────────────── -->
<section class="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 lg:px-8">
	<BlurFade delay={0} duration={500}>
		<h1 class="text-3xl font-semibold text-primary sm:text-4xl" style="letter-spacing: -0.02em;">
			{t(data.locale, 'demo.intro.heading')}
		</h1>
	</BlurFade>
	<BlurFade delay={150} duration={500}>
		<p class="mx-auto mt-4 max-w-xl text-lg text-secondary">
			{t(data.locale, 'demo.intro.subhead')}
		</p>
	</BlurFade>
	<BlurFade delay={300} duration={500}>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-4">
			<a href="#scale" class="btn-primary px-6 py-3">
				{t(data.locale, 'demo.intro.cta')}
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
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					/>
				</svg>
			</a>
			<a href={resolve('/platform')} class="text-sm font-medium text-secondary hover:text-primary">
				{t(data.locale, 'demo.intro.skip')} →
			</a>
		</div>
	</BlurFade>

	<!-- Animated progress dots -->
	<BlurFade delay={450} duration={500}>
		<div class="mt-12 flex items-center justify-center gap-3">
			{#each ['scale', 'goals', 'weight', 'score', 'inquiry'] as section (section)}
				<div
					class="h-2.5 w-2.5 rounded-full transition-all duration-500"
					style="background-color: {completed.has(section)
						? 'var(--color-accent2)'
						: sectionVisible[section]
							? 'var(--color-accent1)'
							: 'var(--color-border)'};"
				></div>
			{/each}
		</div>
	</BlurFade>
</section>

<!-- ─── Section 1: The Scale ────────────────────────────────────────────── -->
<section
	id="scale"
	class="border-t border-border bg-surfaceMid"
	use:inview={(v) => {
		sectionVisible.scale = v;
		if (v && activeTier !== null) markComplete('scale');
	}}
>
	<div class="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
		<p class="text-eyebrow mb-4" style="color: var(--color-accent3);">
			{t(data.locale, 'demo.section.scale.eyebrow')}
		</p>
		<h2 class="text-page-heading mb-4 text-primary">
			{t(data.locale, 'demo.section.scale.heading')}
		</h2>
		<p class="mb-12 max-w-xl text-secondary">
			{t(data.locale, 'demo.section.scale.body')}
		</p>

		<!-- Interactive 5-tier segmented bar -->
		<div class="mb-8 flex overflow-hidden rounded-xl border border-border">
			{#each TIERS as tier, idx (tier.key)}
				<button
					type="button"
					onclick={() => {
						activeTier = tier.key;
						markComplete('scale');
					}}
					class="relative flex-1 py-6 text-center transition-all duration-300 focus:outline-none"
					style="background-color: {activeTier === tier.key ? tier.bg : 'transparent'};
						   border-right: {idx < 4 ? '1px solid var(--color-border)' : 'none'};"
				>
					<!-- Tier number -->
					<span
						class="mb-1 block font-mono text-2xl font-bold transition-all duration-300"
						style="color: {activeTier === tier.key ? tier.color : 'var(--color-border)'};"
					>
						{idx + 1}
					</span>
					<!-- Tier name -->
					<span
						class="block text-xs font-medium tracking-wider uppercase transition-all duration-300"
						style="color: {activeTier === tier.key ? tier.color : 'var(--color-secondary)'};"
					>
						{t(data.locale, `tier.${tier.key}`)}
					</span>
					<!-- Active indicator dot -->
					{#if activeTier === tier.key}
						<span
							class="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
							style="background-color: {tier.color};"
						></span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Expanded tier description (click to reveal) -->
		{#if activeTier}
			<div
				class="rounded-xl border p-6 transition-all duration-500"
				style="border-color: {tierColor(activeTier)}; background-color: {tierBg(activeTier)};"
			>
				<div class="mb-3 flex items-center gap-3">
					<span
						class="inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold text-white"
						style="background-color: {tierColor(activeTier)};"
					>
						{getTierValue(activeTier)}
					</span>
					<h3 class="text-lg font-semibold" style="color: {tierColor(activeTier)};">
						{t(data.locale, `tier.${activeTier}`)}
					</h3>
				</div>
				<p class="text-sm leading-relaxed text-secondary">
					{t(data.locale, `tier.${activeTier}.description`)}
				</p>
			</div>
		{:else}
			<p class="text-center text-sm text-secondary" style="opacity: 0.6;">
				{t(data.locale, 'demo.section.scale.try')}
			</p>
		{/if}
	</div>
</section>

<!-- ─── Section 2: Set Goals ────────────────────────────────────────────── -->
<section
	id="goals"
	use:inview={(v) => {
		sectionVisible.goals = v;
	}}
>
	<div class="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
		<p class="text-eyebrow mb-4" style="color: var(--color-accent1);">
			{t(data.locale, 'demo.section.goals.eyebrow')}
		</p>
		<h2 class="text-page-heading mb-4 text-primary">
			{t(data.locale, 'demo.section.goals.heading')}
		</h2>
		<p class="mb-12 max-w-xl text-secondary">
			{t(data.locale, 'demo.section.goals.body')}
		</p>

		<!-- Two-column: example (read-only) vs user input -->
		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Example metric (pre-filled) -->
			<div class="rounded-xl border border-border bg-surfaceMid p-6">
				<p class="text-eyebrow mb-4 text-secondary">
					{t(data.locale, 'demo.section.goals.example_metric')}
				</p>
				<div class="space-y-3">
					{#each TIERS as tier (tier.key)}
						<div class="flex items-start gap-3 rounded-lg p-3" style="background-color: {tier.bg};">
							<span
								class="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
								style="background-color: {tier.color};"
							>
								{getTierValue(tier.key)}
							</span>
							<div>
								<p class="text-xs font-semibold" style="color: {tier.color};">
									{t(data.locale, `tier.${tier.key}`)}
								</p>
								<p class="mt-0.5 text-xs text-secondary">
									{exampleThresholds[tier.key]}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- User's metric (interactive) -->
			<div class="rounded-xl border border-accent1 bg-surface p-6 shadow-sm">
				<p class="text-eyebrow mb-4" style="color: var(--color-accent1);">
					{t(data.locale, 'demo.section.goals.your_metric')}
				</p>
				<input
					type="text"
					bind:value={userMetricName}
					oninput={() => saveProgress()}
					placeholder={t(data.locale, 'demo.section.goals.your_metric_placeholder')}
					class="mb-4 w-full rounded-lg border border-border bg-surfaceMid px-3 py-2 text-sm text-primary placeholder:text-secondary/50 focus:border-accent1 focus:outline-none"
				/>
				<div class="space-y-2">
					{#each TIERS as tier (tier.key)}
						<div class="flex items-center gap-3">
							<span
								class="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
								style="background-color: {tier.color};"
							>
								{getTierValue(tier.key)}
							</span>
							<input
								type="text"
								bind:value={userThresholds[tier.key]}
								oninput={() => {
									if (Object.values(userThresholds).some((v) => v)) markComplete('goals');
									saveProgress();
								}}
								placeholder={t(data.locale, `tier.${tier.key}`)}
								class="flex-1 rounded-lg border border-border bg-surfaceMid px-3 py-1.5 text-xs text-primary placeholder:text-secondary/40 focus:border-accent1 focus:outline-none"
							/>
						</div>
					{/each}
				</div>
				<p class="mt-4 text-xs text-secondary">
					{t(data.locale, 'demo.section.goals.prompt')}
				</p>
			</div>
		</div>
	</div>
</section>

<!-- ─── Section 3: Weight What Matters ──────────────────────────────────── -->
<section
	id="weight"
	class="border-t border-border bg-surfaceMid"
	use:inview={(v) => {
		sectionVisible.weight = v;
	}}
>
	<div class="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
		<p class="text-eyebrow mb-4" style="color: var(--color-accent2);">
			{t(data.locale, 'demo.section.weight.eyebrow')}
		</p>
		<h2 class="text-page-heading mb-4 text-primary">
			{t(data.locale, 'demo.section.weight.heading')}
		</h2>
		<p class="mb-12 max-w-xl text-secondary">
			{t(data.locale, 'demo.section.weight.body')}
		</p>

		<div class="grid gap-12 lg:grid-cols-3">
			<!-- Weight sliders (2/3 width) -->
			<div class="space-y-6 lg:col-span-2">
				{#each weightMetrics as metric, idx (idx)}
					<div>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium text-primary">{t(data.locale, metric.nameKey)}</span>
							<div class="flex items-center gap-2">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium"
									style="background-color: {tierBg(metric.tier)}; color: {tierColor(metric.tier)};"
								>
									{t(data.locale, `tier.${metric.tier}`)}
								</span>
								<span class="font-mono text-sm text-secondary tabular-nums">{metric.weight}%</span>
							</div>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step="5"
							bind:value={metric.weight}
							oninput={() => {
								markComplete('weight');
								saveProgress();
							}}
							class="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-[var(--color-accent1)]"
						/>
						<!-- Visual weight bar -->
						<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
							<div
								class="h-full rounded-full transition-all duration-300"
								style="width: {metric.weight}%; background-color: {metric.color};"
							></div>
						</div>
					</div>
				{/each}

				<!-- Weight total indicator -->
				<div class="flex items-center justify-between border-t border-border pt-4">
					<span class="text-sm text-secondary">
						{t(data.locale, 'demo.section.weight.total', { total: String(totalWeight) })}
					</span>
					{#if totalWeight === 100}
						<span class="text-xs font-medium" style="color: var(--color-accent2);"
							>&#10003; {t(data.locale, 'demo.section.weight.balanced')}</span
						>
					{:else}
						<span class="text-xs font-medium" style="color: var(--color-tier-concern);">
							{totalWeight < 100
								? t(data.locale, 'demo.section.weight.remaining', {
										amount: String(100 - totalWeight)
									})
								: t(data.locale, 'demo.section.weight.over', { amount: String(totalWeight - 100) })}
						</span>
					{/if}
				</div>
			</div>

			<!-- Live composite score (1/3 width) -->
			<div class="flex items-center justify-center">
				<div class="w-full rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
					<p class="text-eyebrow mb-3 text-secondary">
						{t(data.locale, 'demo.section.weight.composite')}
					</p>
					<p
						class="font-mono text-5xl font-semibold tabular-nums transition-all duration-500"
						style="color: {compositeScore >= 4
							? 'var(--color-tier-effective)'
							: compositeScore >= 3
								? 'var(--color-tier-content)'
								: compositeScore >= 2
									? 'var(--color-tier-concern)'
									: 'var(--color-tier-alarm)'};"
					>
						{compositeScore.toFixed(1)}
					</p>
					<!-- Mini tier bar showing position -->
					<div class="mt-4 flex h-3 overflow-hidden rounded-full">
						{#each TIERS as tier (tier.key)}
							<div class="flex-1" style="background-color: {tier.bg};"></div>
						{/each}
					</div>
					<div class="relative mt-1">
						<div
							class="absolute h-3 w-0.5 -translate-x-1/2 rounded-full transition-all duration-500"
							style="left: {((compositeScore - 1) / 4) *
								100}%; background-color: var(--color-primary);"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ─── Section 4: See the Score ────────────────────────────────────────── -->
<section
	id="score"
	use:inview={(v) => {
		sectionVisible.score = v;
		if (v) markComplete('score');
	}}
>
	<div class="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
		<p class="text-eyebrow mb-4" style="color: var(--color-tier-effective);">
			{t(data.locale, 'demo.section.score.eyebrow')}
		</p>
		<h2 class="text-page-heading mb-4 text-primary">
			{t(data.locale, 'demo.section.score.heading')}
		</h2>
		<p class="mb-12 max-w-xl text-secondary">
			{t(data.locale, 'demo.section.score.body')}
		</p>

		<!-- Waterfall visualization -->
		<div class="rounded-xl border border-border bg-surfaceMid p-6">
			<div class="space-y-4">
				{#each weightMetrics as metric (metric.nameKey)}
					{@const contribution = (getTierValue(metric.tier) * metric.weight) / (totalWeight || 1)}
					<div class="flex items-center gap-4">
						<span class="w-40 truncate text-sm font-medium text-primary"
							>{t(data.locale, metric.nameKey)}</span
						>
						<div class="flex-1">
							<!-- Contribution bar -->
							<div class="relative h-8 w-full overflow-hidden rounded-lg bg-border/50">
								<div
									class="flex h-full items-center justify-end rounded-lg pr-3 transition-all duration-700"
									style="width: {totalWeight > 0 ? (contribution / compositeScore) * 100 : 0}%;
										   background-color: {tierBg(metric.tier)};
										   border: 1px solid {tierColor(metric.tier)};"
								>
									<span
										class="font-mono text-xs tabular-nums"
										style="color: {tierColor(metric.tier)};"
									>
										{contribution.toFixed(2)}
									</span>
								</div>
							</div>
						</div>
						<div class="w-28 text-right">
							<span class="font-mono text-xs text-secondary tabular-nums">
								{t(data.locale, `tier.${metric.tier}`)} x {metric.weight}%
							</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Sum line -->
			<div class="mt-6 flex items-center justify-between border-t border-border pt-4">
				<span class="text-sm text-secondary">{t(data.locale, 'demo.section.score.formula')}</span>
				<span
					class="font-mono text-2xl font-semibold tabular-nums"
					style="color: {compositeScore >= 4
						? 'var(--color-tier-effective)'
						: compositeScore >= 3
							? 'var(--color-tier-content)'
							: 'var(--color-tier-concern)'};"
				>
					{compositeScore.toFixed(1)}
				</span>
			</div>
		</div>
	</div>
</section>

<!-- ─── Section 5: Inquiry Process ──────────────────────────────────────── -->
<section
	id="inquiry"
	class="border-t border-border bg-surfaceMid"
	use:inview={(v) => {
		sectionVisible.inquiry = v;
		if (v) markComplete('inquiry');
	}}
>
	<div class="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
		<p class="text-eyebrow mb-4" style="color: var(--color-accent3);">
			{t(data.locale, 'demo.section.inquiry.eyebrow')}
		</p>
		<h2 class="text-page-heading mb-4 text-primary">
			{t(data.locale, 'demo.section.inquiry.heading')}
		</h2>
		<p class="mb-12 max-w-xl text-secondary">
			{t(data.locale, 'demo.section.inquiry.body')}
		</p>

		<!-- Two inquiry types side by side -->
		<div class="mb-12 grid gap-8 md:grid-cols-2">
			<!-- Self-inquiry -->
			<div class="rounded-xl border border-border bg-surface p-6">
				<div class="mb-4 flex items-center gap-3">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-full"
						style="background-color: color-mix(in srgb, var(--color-accent1) 12%, transparent);"
					>
						<svg
							class="h-5 w-5"
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
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					</span>
					<h3 class="text-lg font-semibold text-primary">
						{t(data.locale, 'demo.section.inquiry.self')}
					</h3>
				</div>
				<p class="text-sm leading-relaxed text-secondary">
					{t(data.locale, 'demo.section.inquiry.self_desc')}
				</p>
			</div>

			<!-- Peer inquiry -->
			<div class="rounded-xl border border-border bg-surface p-6">
				<div class="mb-4 flex items-center gap-3">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-full"
						style="background-color: color-mix(in srgb, var(--color-accent3) 12%, transparent);"
					>
						<svg
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							style="color: var(--color-accent3);"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</span>
					<h3 class="text-lg font-semibold text-primary">
						{t(data.locale, 'demo.section.inquiry.peer')}
					</h3>
				</div>
				<p class="text-sm leading-relaxed text-secondary">
					{t(data.locale, 'demo.section.inquiry.peer_desc')}
				</p>
			</div>
		</div>

		<!-- Animated inquiry flow -->
		<div class="rounded-xl border border-border bg-surface p-8">
			<div class="flex items-center justify-between">
				{#each [{ key: 'filed', icon: '1', accent: 'var(--color-accent1)' }, { key: 'reviewed', icon: '2', accent: 'var(--color-accent3)' }, { key: 'resolved', icon: '3', accent: 'var(--color-accent2)' }] as step, idx (step.key)}
					<!-- Step -->
					<button
						type="button"
						onclick={() => (inquiryStep = idx)}
						class="flex flex-col items-center gap-2 transition-all duration-300"
						style="opacity: {idx <= inquiryStep ? 1 : 0.3};"
					>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-all duration-500"
							style="background-color: {idx <= inquiryStep ? step.accent : 'var(--color-border)'};
								   color: {idx <= inquiryStep ? 'white' : 'var(--color-secondary)'};"
						>
							{step.icon}
						</span>
						<span class="text-xs font-medium text-primary"
							>{t(data.locale, `demo.section.inquiry.${step.key}`)}</span
						>
					</button>
					<!-- Connector line -->
					{#if idx < 2}
						<div class="mx-4 flex-1">
							<div
								class="h-0.5 w-full rounded-full transition-all duration-700"
								style="background-color: {idx < inquiryStep
									? 'var(--color-accent2)'
									: 'var(--color-border)'};"
							></div>
						</div>
					{/if}
				{/each}
			</div>
			<!-- Step through button -->
			<div class="mt-8 text-center">
				<button
					type="button"
					onclick={() => {
						inquiryStep = Math.min(inquiryStep + 1, 2);
					}}
					class="btn-outline px-5 py-2 text-sm"
					disabled={inquiryStep >= 2}
				>
					{inquiryStep >= 2
						? t(data.locale, 'demo.progress.complete')
						: t(data.locale, 'action.continue')}
				</button>
			</div>
		</div>
	</div>
</section>

<!-- ─── Section 6: CTA ──────────────────────────────────────────────────── -->
<section
	id="cta"
	class="border-t border-border"
	use:inview={(v) => {
		sectionVisible.cta = v;
	}}
>
	<div class="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
		<BlurFade delay={0} duration={500}>
			<p class="text-eyebrow mb-4" style="color: var(--color-accent2);">
				{t(data.locale, 'demo.section.cta.eyebrow')}
			</p>
		</BlurFade>
		<BlurFade delay={100} duration={500}>
			<h2 class="text-page-heading mx-auto mb-4 max-w-2xl text-primary">
				{t(data.locale, 'demo.section.cta.heading')}
			</h2>
		</BlurFade>
		<BlurFade delay={200} duration={500}>
			<p class="mx-auto mb-10 max-w-lg text-lg text-secondary">
				{t(data.locale, 'demo.section.cta.body')}
			</p>
		</BlurFade>
		<BlurFade delay={300} duration={500}>
			<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a href={resolve('/platform')} class="btn-primary px-8 py-3">
					{t(data.locale, 'demo.section.cta.platform')}
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
							d="M13 7l5 5m0 0l-5 5m5-5H6"
						/>
					</svg>
				</a>
				<a
					href={resolve('/web/dashboard')}
					class="text-sm font-medium text-secondary hover:text-primary"
				>
					{t(data.locale, 'demo.section.cta.purchase')} →
				</a>
			</div>
		</BlurFade>
	</div>
</section>
