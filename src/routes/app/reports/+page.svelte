<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Reports Page
	 *
	 * Historical performance analytics with data visualizations.
	 * Available to all users — CEO, leaders, and employees each see
	 * their own metrics plus (for leaders) a team overview.
	 *
	 * Charts:
	 * 1. Composite Score Trend — line chart of overall tier score over time
	 * 2. Metric Tier History — per-metric line charts across periods
	 * 3. Tier Distribution — donut chart of tier level frequency
	 * 4. Team Overview — bar chart + sparklines for direct reports (leaders only)
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import SparkLine from '$lib/components/charts/SparkLine.svelte';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import { getTierColor } from '$lib/utils/score.js';
	import type { TierLevel } from '$lib/types/index.js';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const TIER_LEVELS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];

	/**
	 * Change the report scope via query parameter navigation
	 */
	function changeScope(newScope: string) {
		const url = new URL(window.location.href);
		if (newScope === 'self') {
			url.searchParams.delete('scope');
		} else {
			url.searchParams.set('scope', newScope);
		}

		goto(url.pathname + url.search, { invalidateAll: true });
	}

	/** Tier labels for the donut chart */
	const tierSegments = $derived(
		TIER_LEVELS.map((tier) => ({
			label: t(data.locale, `tier.${tier}`),
			value: data.tierDistribution[tier],
			color: getTierColor(tier)
		}))
	);

	/** Total entries across all tiers */
	const totalEntries = $derived(
		Object.values(data.tierDistribution).reduce((sum, v) => sum + v, 0)
	);

	/** Score trend line chart points */
	const scoreTrendPoints = $derived(
		data.scoreTrend.map((s) => ({
			value: s.score,
			label: s.label,
			tier: s.tier as TierLevel
		}))
	);

	/** Direct report bars for the team overview */
	const teamBars = $derived(
		data.directReportScores
			.filter((r) => r.currentScore !== null)
			.map((r) => ({
				label: r.name,
				value: r.currentScore!,
				tier: r.currentTier as TierLevel,
				sublabel: t(data.locale, 'reports.entries', { count: String(r.entryCount) })
			}))
	);
</script>

<div class="mx-auto max-w-5xl px-6 py-8">
	<!-- Header -->
	<div class="mb-8 flex items-start justify-between">
		<div>
			<h1 class="text-xl font-medium text-primary">
				{t(data.locale, 'reports.title')}
			</h1>
			<p class="mt-1 text-sm text-secondary">
				{t(data.locale, 'reports.description')}
			</p>
		</div>
		{#if data.hasData}
			<a
				href={href('/api/export/snapshots')}
				class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
			>
				{t(data.locale, 'export.csv')}
			</a>
		{/if}
	</div>

	<!-- Scope selector -->
	{#if data.hasDirectReports || data.isAdminRole}
		<div class="mb-6 flex items-center gap-3">
			<label for="report-scope" class="text-sm font-medium text-secondary">
				{t(data.locale, 'reports.scope_label')}:
			</label>
			<div class="flex gap-1 rounded-lg bg-surfaceMid p-1">
				<button
					onclick={() => changeScope('self')}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.scope === 'self'
						? 'bg-surface text-primary shadow-sm'
						: 'text-secondary hover:text-primary'}"
				>
					{t(data.locale, 'reports.scope_self')}
				</button>
				{#if data.hasDirectReports}
					<button
						onclick={() => changeScope('subtree')}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.scope ===
						'subtree'
							? 'bg-surface text-primary shadow-sm'
							: 'text-secondary hover:text-primary'}"
					>
						{t(data.locale, 'reports.scope_subtree')}
					</button>
				{/if}
				{#if data.isAdminRole}
					<button
						onclick={() => changeScope('org')}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.scope ===
						'org'
							? 'bg-surface text-primary shadow-sm'
							: 'text-secondary hover:text-primary'}"
					>
						{t(data.locale, 'reports.scope_org')}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Subtree completion rate -->
	{#if data.completionRate && data.scope === 'subtree'}
		<div class="mb-6 rounded-lg border border-border bg-surfaceMid p-4">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-primary"
					>{t(data.locale, 'reports.completion_rate')}</span
				>
				<span class="text-sm text-secondary tabular-nums">
					{data.completionRate.approved} / {data.completionRate.total}
					({data.completionRate.total > 0
						? Math.round((data.completionRate.approved / data.completionRate.total) * 100)
						: 0}%)
				</span>
			</div>
		</div>
	{/if}

	{#if data.needsNode || !data.hasData}
		<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center">
			<svg
				class="mx-auto mb-3 h-10 w-10 text-secondary/40"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				/>
			</svg>
			<p class="text-sm text-secondary">{t(data.locale, 'reports.no_data')}</p>
		</div>
	{:else}
		<div class="space-y-8">
			<!-- ─── 1. Composite Score Trend ─────────────────────────── -->
			{#if scoreTrendPoints.length > 0}
				<section
					in:fly={{ y: 20, duration: 400, delay: 0, easing: quintOut }}
					class="rounded-lg border border-border bg-surfaceMid p-6"
				>
					<div class="mb-1 flex items-center gap-2">
						<h2 class="text-base font-medium text-primary">
							{t(data.locale, 'reports.score_trend')}
						</h2>
						<HelpTooltip text={t(data.locale, 'tooltip.reports.score_trend')} />
					</div>
					<p class="mb-4 text-xs text-secondary">
						{t(data.locale, 'reports.score_trend_description')}
					</p>
					<LineChart
						points={scoreTrendPoints}
						min={1}
						max={5}
						height={220}
						color="#8B4E1E"
						tierColored={true}
						showArea={true}
					/>
				</section>
			{/if}

			<!-- ─── 2. Metric Tier History ───────────────────────────── -->
			{#if data.metricHistory.length > 0}
				<section
					in:fly={{ y: 20, duration: 400, delay: 100, easing: quintOut }}
					class="rounded-lg border border-border bg-surfaceMid p-6"
				>
					<div class="mb-1 flex items-center gap-2">
						<h2 class="text-base font-medium text-primary">
							{t(data.locale, 'reports.metric_breakdown')}
						</h2>
						<HelpTooltip text={t(data.locale, 'tooltip.reports.metric_breakdown')} />
					</div>
					<p class="mb-4 text-xs text-secondary">
						{t(data.locale, 'reports.metric_breakdown_description')}
					</p>

					<div class="grid gap-6 lg:grid-cols-2">
						{#each data.metricHistory as metric (metric.metricName)}
							<div class="rounded-lg border border-border/50 bg-surface p-4">
								<h3 class="mb-3 text-sm font-medium text-primary">{metric.metricName}</h3>
								{#if metric.entries.length > 1}
									<LineChart
										points={metric.entries.map((e) => ({
											value: e.tierValue,
											label: e.label,
											tier: e.tier
										}))}
										min={1}
										max={5}
										height={160}
										color={getTierColor(metric.entries[metric.entries.length - 1].tier)}
										tierColored={true}
										showArea={false}
									/>
								{:else if metric.entries.length === 1}
									<div class="flex items-center gap-3 py-4">
										<TierIndicator tier={metric.entries[0].tier} locale={data.locale} size="md" />
										<span class="text-sm text-secondary">{metric.entries[0].label}</span>
									</div>
								{/if}

								<!-- Trend indicator -->
								{#if metric.entries.length >= 2}
									{@const first = metric.entries[0].tierValue}
									{@const last = metric.entries[metric.entries.length - 1].tierValue}
									{@const diff = last - first}
									<div class="mt-2 flex items-center gap-1 text-xs">
										<span
											class="font-medium {diff > 0.1
												? 'text-green-600 dark:text-green-400'
												: diff < -0.1
													? 'text-red-600 dark:text-red-400'
													: 'text-secondary'}"
										>
											{#if diff > 0.1}
												&#x25B2; {t(data.locale, 'reports.improving')}
											{:else if diff < -0.1}
												&#x25BC; {t(data.locale, 'reports.declining')}
											{:else}
												&#x25C6; {t(data.locale, 'reports.stable')}
											{/if}
										</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- ─── 3. Tier Distribution ──────────────────────��──────── -->
			{#if totalEntries > 0}
				<section
					in:fly={{ y: 20, duration: 400, delay: 200, easing: quintOut }}
					class="rounded-lg border border-border bg-surfaceMid p-6"
				>
					<div class="mb-1 flex items-center gap-2">
						<h2 class="text-base font-medium text-primary">
							{t(data.locale, 'reports.tier_distribution')}
						</h2>
						<HelpTooltip text={t(data.locale, 'tooltip.reports.tier_distribution')} />
					</div>
					<p class="mb-4 text-xs text-secondary">
						{t(data.locale, 'reports.tier_distribution_description')}
					</p>

					<div class="flex justify-center py-4">
						<DonutChart
							segments={tierSegments}
							size={200}
							strokeWidth={32}
							centerValue={String(totalEntries)}
							centerLabel={t(data.locale, 'reports.entries', { count: String(totalEntries) })}
						/>
					</div>
				</section>
			{/if}

			<!-- ─── 4. Team Overview (leaders only) ──────────────────── -->
			{#if data.directReportScores.length > 0}
				<section
					in:fly={{ y: 20, duration: 400, delay: 300, easing: quintOut }}
					class="rounded-lg border border-border bg-surfaceMid p-6"
				>
					<div class="mb-1 flex items-center gap-2">
						<h2 class="text-base font-medium text-primary">
							{t(data.locale, 'reports.team_overview')}
						</h2>
						<HelpTooltip text={t(data.locale, 'tooltip.reports.team_overview')} />
					</div>
					<p class="mb-4 text-xs text-secondary">
						{t(data.locale, 'reports.team_overview_description')}
					</p>

					{#if teamBars.length > 0}
						<div class="mb-6">
							<BarChart bars={teamBars} maxValue={5} />
						</div>
					{/if}

					<!-- Detailed team table with sparklines -->
					<div class="overflow-x-auto rounded-lg border border-border/50">
						<table class="w-full text-left text-sm">
							<thead class="border-b border-border bg-surface">
								<tr>
									<th class="px-4 py-3 text-xs font-medium text-secondary">Name</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'reports.trend')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.assessed_tier')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'reports.entries', { count: '' })}
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/50">
								{#each data.directReportScores as report (report.id)}
									<tr class="hover:bg-surfaceHigh/50">
										<td class="px-4 py-3">
											<div class="font-medium text-primary">{report.name}</div>
											{#if report.title}
												<div class="text-xs text-secondary">{report.title}</div>
											{/if}
										</td>
										<td class="px-4 py-3">
											{#if report.trend.length > 1}
												<SparkLine
													values={report.trend.map((t) => t.score)}
													color={report.currentTier ? getTierColor(report.currentTier) : '#8B4E1E'}
													width={80}
													height={24}
												/>
											{:else}
												<span class="text-xs text-secondary">—</span>
											{/if}
										</td>
										<td class="px-4 py-3">
											{#if report.currentTier}
												<TierIndicator tier={report.currentTier} locale={data.locale} size="sm" />
											{:else}
												<span class="text-xs text-secondary">—</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-secondary">
											{report.entryCount}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}
		</div>
	{/if}
</div>
