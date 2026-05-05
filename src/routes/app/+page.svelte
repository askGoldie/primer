<script lang="ts">
	/**
	 * App Dashboard Page
	 *
	 * Layout intent:
	 *
	 * Header zone: name + title left, composite score + delta right.
	 *   Score is the headline — no separate hero card needed.
	 *
	 * Trend strip: slim chart below the header when history exists.
	 *   A visual whisper, not a section.
	 *
	 * Content grid: Goals | Metrics side by side, equal weight, near the top.
	 *
	 * Secondary: direct reports (managers only).
	 *
	 * Research ticker: scrolling strip of TED talks and articles on motivation science.
	 */

	import { resolve } from '$app/paths';
	import { href } from '$lib/utils/href.js';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { fade } from 'svelte/transition';
	import CompositeScore from '$lib/components/tier/CompositeScore.svelte';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import SparkLine from '$lib/components/charts/SparkLine.svelte';
	import BlurFade from '$lib/components/animations/BlurFade.svelte';
	import Marquee from '$lib/components/animations/Marquee.svelte';
	import { getTierColor } from '$lib/utils/score.js';
	import type { TierLevel } from '$lib/types/index.js';

	let { data }: { data: PageData } = $props();

	let requestingPlacement = $state(false);
	let placementRequested = $state(false);

	async function handlePlacementRequest() {
		if (requestingPlacement) return;
		requestingPlacement = true;
		try {
			const res = await fetch('/app/api/placement-request', { method: 'POST' });
			if (res.ok) placementRequested = true;
		} finally {
			requestingPlacement = false;
		}
	}

	const previousScore = $derived(
		data.recentSnapshots.length > 1 ? data.recentSnapshots[0].score : null
	);
	const scoreDelta = $derived(
		previousScore !== null ? +(data.compositeScore - previousScore).toFixed(1) : null
	);

	const chartPoints = $derived(
		data.recentSnapshots
			.slice()
			.reverse()
			.map((s) => ({ value: s.score, label: s.cycleLabel ?? '', tier: s.tier as TierLevel }))
	);

	function goalStatusClass(status: string): string {
		switch (status) {
			case 'in_progress':
				return 'bg-accent2/10 text-accent2';
			case 'defined':
				return 'bg-accent1/10 text-accent1';
			default:
				return 'bg-surfaceHigh text-secondary';
		}
	}

	function priorityColor(priority: string | null): string {
		switch (priority) {
			case 'high':
				return 'var(--color-tier-alarm)';
			case 'medium':
				return 'var(--color-tier-concern)';
			default:
				return 'var(--color-secondary)';
		}
	}

	/**
	 * Research ticker — TED talks and short articles only.
	 * Stat items with full-sentence copy are intentionally excluded: they truncate badly in pills.
	 */
	const tickerItems = $derived([
		{
			label: t(data.locale, 'home.motivation.talks.dan_pink.title'),
			source: t(data.locale, 'home.motivation.talks.dan_pink.speaker'),
			url: 'https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation'
		},
		{
			label: t(data.locale, 'home.motivation.talks.dan_ariely.title'),
			source: t(data.locale, 'home.motivation.talks.dan_ariely.speaker'),
			url: 'https://www.ted.com/talks/dan_ariely_what_makes_us_feel_good_about_our_work'
		},
		{
			label: t(data.locale, 'home.motivation.reading.progress'),
			source: 'hbr.org',
			url: 'https://hbr.org/2011/05/the-power-of-small-wins'
		},
		{
			label: t(data.locale, 'home.motivation.talks.csikszentmihalyi.title'),
			source: t(data.locale, 'home.motivation.talks.csikszentmihalyi.speaker'),
			url: 'https://www.ted.com/talks/mihaly_csikszentmihalyi_flow_the_secret_to_happiness'
		},
		{
			label: t(data.locale, 'home.motivation.talks.angela_duckworth.title'),
			source: t(data.locale, 'home.motivation.talks.angela_duckworth.speaker'),
			url: 'https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance'
		},
		{
			label: t(data.locale, 'home.motivation.talks.simon_sinek.title'),
			source: t(data.locale, 'home.motivation.talks.simon_sinek.speaker'),
			url: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action'
		},
		{
			label: t(data.locale, 'home.motivation.talks.barry_schwartz.title'),
			source: t(data.locale, 'home.motivation.talks.barry_schwartz.speaker'),
			url: 'https://www.ted.com/talks/barry_schwartz_the_way_we_think_about_work_is_broken'
		},
		{
			label: t(data.locale, 'home.motivation.reading.drive'),
			source: 'danpink.com',
			url: 'https://www.danpink.com/books/drive/'
		},
		{
			label: t(data.locale, 'home.motivation.reading.gallup'),
			source: 'gallup.com',
			url: 'https://www.gallup.com/workplace/697904/state-of-the-global-workplace-global-data.aspx'
		},
		{
			label: t(data.locale, 'home.motivation.reading.sdt'),
			source: 'selfdeterminationtheory.org',
			url: 'https://selfdeterminationtheory.org/theory/'
		}
	]);
</script>

<svelte:head>
	<title>{t(data.locale, 'nav.dashboard')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- ── Unplaced user ────────────────────────────────────────────────────── -->
	{#if data.needsPlacement}
		<div in:fade={{ duration: 300 }} class="mx-auto max-w-lg py-16 text-center">
			<div class="rounded-xl border border-border bg-surfaceMid p-10">
				<svg
					class="mx-auto mb-4 h-14 w-14 text-accent1/60"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<h1 class="mb-2 text-xl font-semibold text-primary">
					{t(data.locale, 'onboarding.welcome', { orgName: data.organization.name })}
				</h1>
				<p class="mb-6 text-sm text-secondary">{t(data.locale, 'onboarding.needs_placement')}</p>
				{#if placementRequested}
					<div
						transition:fade={{ duration: 200 }}
						class="rounded-lg bg-accent2/10 px-4 py-3 text-sm text-accent2"
					>
						{t(data.locale, 'onboarding.request_sent')}
					</div>
				{:else}
					<button
						onclick={handlePlacementRequest}
						disabled={requestingPlacement}
						class="rounded-lg bg-accent1 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent1/90 disabled:opacity-50"
					>
						{t(data.locale, 'onboarding.notify_manager')}
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- ── Header zone: identity left, score right ──────────────────────────── -->
		<BlurFade delay={0} direction="up">
			<div class="mb-6 flex items-start justify-between gap-6">
				<div>
					<h1 class="text-2xl font-semibold text-primary" style="letter-spacing: -0.01em;">
						{data.userNode?.name || data.user.name}
					</h1>
					{#if data.userNode?.title}
						<p class="mt-1 text-sm text-secondary">{data.userNode.title}</p>
					{/if}
					<p class="mt-2 text-xs text-secondary/60">{data.organization.name}</p>
				</div>

				{#if data.metrics.length > 0}
					<div class="flex-shrink-0 text-right">
						<CompositeScore
							score={data.compositeScore}
							tier={data.compositeTier}
							locale={data.locale}
							size="lg"
							compact
						/>
						{#if scoreDelta !== null}
							<p class="mt-2 text-xs tabular-nums">
								{#if scoreDelta > 0}
									<span style="color: var(--color-tier-optimized);">
										{t(data.locale, 'score.change.up', { delta: scoreDelta })}
									</span>
								{:else if scoreDelta < 0}
									<span style="color: var(--color-tier-alarm);">
										{t(data.locale, 'score.change.down', { delta: scoreDelta })}
									</span>
								{:else}
									<span class="text-secondary">{t(data.locale, 'score.change.same')}</span>
								{/if}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</BlurFade>

		<!-- ── Trend strip ───────────────────────────────────────────────────────── -->
		{#if chartPoints.length > 1}
			<BlurFade delay={50} direction="up">
				<div class="mb-6 overflow-hidden rounded-xl border border-border">
					<LineChart
						points={chartPoints}
						min={1}
						max={5}
						height={180}
						tierColored
						showArea
						showDots
					/>
				</div>
			</BlurFade>
		{/if}

		<!-- ── Goals | Metrics ───────────────────────────────────────────────────── -->
		<div class="mb-8 grid gap-6 lg:grid-cols-2">
			<!-- Goals -->
			<BlurFade delay={100} direction="up">
				<div class="h-full rounded-xl border border-border bg-surfaceMid p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-sm font-medium tracking-wider text-secondary uppercase">
							{t(data.locale, 'goals.tab_goals')}
						</h2>
						<a href={href('/app/goals')} class="text-sm text-accent1 hover:underline">
							{t(data.locale, 'common.learn_more')}
						</a>
					</div>

					{#if data.activeGoals.length > 0}
						<ul class="divide-y divide-border">
							{#each data.activeGoals as goal (goal.id)}
								<li class="py-3">
									<a
										href={resolve('/app/goals')}
										class="-mx-2 flex items-start gap-3 rounded px-2 transition-colors hover:bg-surfaceHigh"
									>
										<span
											class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
											style="background-color: {priorityColor(goal.priority)};"
											aria-hidden="true"
										></span>
										<span class="min-w-0 flex-1 text-sm text-primary">{goal.title}</span>
										<span
											class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {goalStatusClass(
												goal.status
											)}"
										>
											{t(data.locale, `goal.status.${goal.status}`)}
										</span>
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<div
							class="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center"
						>
							<p class="text-sm text-secondary">{t(data.locale, 'dashboard.no_goals')}</p>
							<a href={resolve('/app/goals')} class="mt-2 text-sm text-accent1 hover:underline">
								{t(data.locale, 'goals.add_goal')} →
							</a>
						</div>
					{/if}
				</div>
			</BlurFade>

			<!-- Metrics -->
			<BlurFade delay={150} direction="up">
				<div class="h-full rounded-xl border border-border bg-surfaceMid p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-sm font-medium tracking-wider text-secondary uppercase">
							{t(data.locale, 'goals.tab_metrics')}
						</h2>
						<a href={resolve('/app/stack')} class="text-sm text-accent1 hover:underline">
							{t(data.locale, 'action.edit')}
						</a>
					</div>

					{#if data.metrics.length > 0}
						<ul class="divide-y divide-border">
							{#each data.metrics as metric (metric.id)}
								<li
									class="flex items-center justify-between py-3"
									style="border-left: 3px solid {metric.currentTier
										? getTierColor(metric.currentTier)
										: 'transparent'}; padding-left: 10px; margin-left: -10px;"
								>
									<div class="min-w-0 flex-1">
										<span class="text-sm font-medium text-primary">{metric.name}</span>
										{#if metric.weight}
											<span class="ml-1.5 text-xs text-secondary tabular-nums"
												>{metric.weight}%</span
											>
										{/if}
									</div>
									<div class="ml-3 flex flex-shrink-0 items-center gap-2">
										{#if metric.sparkline.length > 1}
											<SparkLine
												values={metric.sparkline}
												color={metric.currentTier ? getTierColor(metric.currentTier) : '#8B4E1E'}
												width={48}
												height={18}
											/>
										{/if}
										{#if metric.currentTier}
											<TierIndicator tier={metric.currentTier} locale={data.locale} size="sm" />
										{:else}
											<span class="text-sm text-secondary">—</span>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<div
							class="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center"
						>
							<p class="text-sm text-secondary">{t(data.locale, 'dashboard.no_metrics_cta')}</p>
							<a href={resolve('/app/stack')} class="mt-2 text-sm text-accent1 hover:underline">
								{t(data.locale, 'demo.add_metric')} →
							</a>
						</div>
					{/if}
				</div>
			</BlurFade>
		</div>

		<!-- ── Direct Reports ────────────────────────────────────────────────────── -->
		{#if data.directReports.length > 0}
			<BlurFade delay={200} direction="up">
				<div class="mb-8 rounded-xl border border-border bg-surfaceMid p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-sm font-medium tracking-wider text-secondary uppercase">
							{t(data.locale, 'team.direct_reports')}
						</h2>
						{#if data.pendingReviewCount > 0}
							<a
								href={resolve('/app/leaders')}
								class="flex items-center gap-1.5 rounded-full bg-accent2/10 px-2.5 py-1 text-xs font-medium text-accent2 transition-colors hover:bg-accent2/20"
							>
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									aria-hidden="true"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								{data.pendingReviewCount}
							</a>
						{/if}
					</div>
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each data.directReports as report (report.id)}
							<a
								href={resolve(`/app/leaders/${report.id}`)}
								class="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent1/30 hover:bg-surfaceHigh"
							>
								<div class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium text-primary">{report.name}</span>
									{#if report.title}
										<span class="block truncate text-xs text-secondary">{report.title}</span>
									{/if}
								</div>
								<div class="flex flex-shrink-0 items-center gap-2">
									{#if report.recentScores.length > 1}
										<SparkLine
											values={report.recentScores}
											color={report.compositeTier ? getTierColor(report.compositeTier) : '#8B4E1E'}
											width={40}
											height={16}
										/>
									{/if}
									{#if report.compositeTier}
										<TierIndicator tier={report.compositeTier} locale={data.locale} size="sm" />
									{:else}
										<span class="text-sm text-secondary">—</span>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				</div>
			</BlurFade>
		{/if}

		<!-- ── Research ticker ──────────────────────────────────────────────────── -->
		<BlurFade delay={250} direction="up">
			<div class="rounded-xl border border-border bg-surfaceMid px-4 py-4">
				<div class="mb-3 flex items-center gap-2">
					<svg
						class="h-3 w-3 text-secondary/50"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d="M8 5v14l11-7z" />
					</svg>
					<span class="text-xs tracking-wider text-secondary/50 uppercase">
						{t(data.locale, 'dashboard.research')}
					</span>
				</div>
				<Marquee pauseOnHover class="[--duration:180s]">
					{#each tickerItems as item (item.url)}
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							class="mx-2 flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs whitespace-nowrap transition-colors hover:border-accent1/30 hover:bg-surfaceHigh"
						>
							<span class="text-primary">{item.label}</span>
							<span class="text-secondary/50">— {item.source}</span>
						</a>
					{/each}
				</Marquee>
			</div>
		</BlurFade>
	{/if}
</div>
