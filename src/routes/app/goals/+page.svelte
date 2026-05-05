<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Goals Page
	 *
	 * Combined view for metric stack management (Primer quintile framework)
	 * and goal management (OKR-style). Two top-level tabs:
	 *
	 * - Metrics: define metrics, weights, thresholds, record tier, submit for review
	 * - Goals: create/track goals with type, priority, dependencies, team rollup
	 */

	import { browser } from '$app/environment';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import CompositeScore from '$lib/components/tier/CompositeScore.svelte';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { calculateCompositeScore, getTierFromScore } from '$lib/utils/score.js';
	import type { TierLevel, PerformanceCadence } from '$lib/types/index.js';
	import { fade, slide } from 'svelte/transition';
	import { SvelteDate } from 'svelte/reactivity';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const TIER_LEVELS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];

	/** Whether the tier framework reference section is expanded */
	let showFramework = $state(false);

	// ── Top-level section ───────────────────────────────────────────────────────
	/** Which top-level section is active: metrics stack, goals list, or performance log */
	let activeSection = $state<'metrics' | 'goals' | 'performance'>('metrics');

	// ── Metrics state ───────────────────────────────────────────────────────────
	/** Number of metrics visible before "show all" is clicked */
	const SOFT_FOLD_LIMIT = 5;

	let showAddMetricForm = $state(false);
	let editingMetricId = $state<string | null>(null);
	let showAllMetrics = $state(false);

	/**
	 * Set of expanded metric IDs. Persisted to localStorage so the interface
	 * remembers which rows the user has opened across sessions.
	 */
	const STORAGE_KEY = $derived(`primer_expanded_${data.user?.id ?? 'anon'}`);

	function loadExpanded(): SvelteSet<string> {
		if (!browser) return new SvelteSet();
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? new SvelteSet(JSON.parse(raw)) : new SvelteSet();
		} catch {
			return new SvelteSet();
		}
	}

	let expandedMetrics = $state<SvelteSet<string>>(loadExpanded());

	function toggleExpanded(id: string) {
		const next = new SvelteSet(expandedMetrics);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedMetrics = next;
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
			} catch {
				// localStorage unavailable — silently ignore
			}
		}
	}

	const visibleMetrics = $derived(
		showAllMetrics ? data.metrics : data.metrics.slice(0, SOFT_FOLD_LIMIT)
	);
	const hiddenCount = $derived(Math.max(0, data.metrics.length - SOFT_FOLD_LIMIT));

	const compositeData = $derived.by(() => {
		const metricsWithScores = data.metrics
			.filter((m) => m.currentTier && m.weight)
			.map((m) => ({ tier: m.currentTier as TierLevel, weight: m.weight as number }));
		if (metricsWithScores.length === 0) return { score: 0, tier: 'content' as TierLevel };
		const score = calculateCompositeScore(metricsWithScores);
		return { score, tier: getTierFromScore(score) };
	});

	const totalWeight = $derived(data.totalWeight ?? 0);
	const remainingWeight = $derived(100 - totalWeight);

	// ── Goals state ─────────────────────────────────────────────────────────────
	let showAddGoalForm = $state(false);
	let editingGoalId = $state<string | null>(null);
	let addingDependencyForGoalId = $state<string | null>(null);
	let activeGoalTab = $state<'my' | 'team' | 'parent'>('my');
	let expandedAdjustmentGoalId = $state<string | null>(null);

	/** Colour per priority dot */
	const priorityColour: Record<string, string> = {
		high: 'bg-red-500',
		medium: 'bg-amber-400',
		low: 'bg-gray-400'
	};

	/** Badge classes per goal status */
	const statusBadge: Record<string, string> = {
		defined: 'bg-surface text-secondary border border-border',
		in_progress: 'bg-accent1/10 text-accent1',
		completed: 'bg-accent2/10 text-accent2',
		deferred: 'bg-surfaceMid text-secondary'
	};

	/** Goal type badge classes */
	const goalTypeBadge: Record<string, string> = {
		strategic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
		operational: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		developmental: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		compliance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
	};

	/** Dependency type badge classes */
	const depTypeBadge: Record<string, string> = {
		blocks: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		informs: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		supports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
	};

	function isOverdue(dueDate: string | null): boolean {
		if (!dueDate) return false;
		return new Date(dueDate) < new Date();
	}

	function isDueSoon(dueDate: string | null): boolean {
		if (!dueDate) return false;
		const due = new Date(dueDate);
		const now = new Date();
		const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		return due >= now && due <= weekFromNow;
	}

	function getDepsForGoal(goalId: string) {
		return data.dependencies.filter((d) => d.goalId === goalId);
	}

	function getAdjustmentsForGoal(goalId: string) {
		return data.goalAdjustments.filter((a) => a.goalId === goalId);
	}

	// ── Performance state ───────────────────────────────────────────────────────
	const CADENCES: PerformanceCadence[] = [
		'weekly',
		'monthly',
		'quarterly',
		'semi_annual',
		'annual'
	];

	let showPerfForm = $state(false);
	let perfSaving = $state(false);
	let perfFilterMetricId = $state('all');
	let perfSelectedMetricId = $state('');
	let perfSelectedCadence = $state<PerformanceCadence>('monthly');
	let perfMeasuredValueInput = $state('');

	/** Auto-calculate period dates based on cadence */
	function getPeriodDefaults(cadence: PerformanceCadence): { start: string; end: string } {
		const now = new SvelteDate();
		const year = now.getFullYear();
		const month = now.getMonth();

		switch (cadence) {
			case 'weekly': {
				const weekStart = new SvelteDate(now);
				weekStart.setDate(now.getDate() - now.getDay());
				const weekEnd = new SvelteDate(weekStart);
				weekEnd.setDate(weekStart.getDate() + 6);
				return {
					start: weekStart.toISOString().split('T')[0],
					end: weekEnd.toISOString().split('T')[0]
				};
			}
			case 'monthly': {
				const start = new Date(year, month, 1);
				const end = new Date(year, month + 1, 0);
				return {
					start: start.toISOString().split('T')[0],
					end: end.toISOString().split('T')[0]
				};
			}
			case 'quarterly': {
				const qStart = Math.floor(month / 3) * 3;
				const start = new Date(year, qStart, 1);
				const end = new Date(year, qStart + 3, 0);
				return {
					start: start.toISOString().split('T')[0],
					end: end.toISOString().split('T')[0]
				};
			}
			case 'semi_annual': {
				const hStart = month < 6 ? 0 : 6;
				const start = new Date(year, hStart, 1);
				const end = new Date(year, hStart + 6, 0);
				return {
					start: start.toISOString().split('T')[0],
					end: end.toISOString().split('T')[0]
				};
			}
			case 'annual': {
				return {
					start: `${year}-01-01`,
					end: `${year}-12-31`
				};
			}
		}
	}

	const perfPeriodDefaults = $derived(getPeriodDefaults(perfSelectedCadence));

	/** Build the measured_value JSON based on metric type */
	function buildMeasuredValue(metricId: string, rawValue: string): string {
		const metric = data.performanceMetrics.find((m) => m.id === metricId);
		if (!metric) return '{}';

		const type = metric.measurementType;

		if (type === 'binary') {
			return JSON.stringify({ value: rawValue.toLowerCase() === 'true' });
		}
		if (type === 'qualitative') {
			return JSON.stringify({ observation: rawValue });
		}
		const num = parseFloat(rawValue);
		if (!isNaN(num)) {
			return JSON.stringify({ value: num });
		}
		try {
			JSON.parse(rawValue);
			return rawValue;
		} catch {
			return JSON.stringify({ value: rawValue });
		}
	}

	/** Filtered performance entries based on selected metric */
	const filteredPerfEntries = $derived(
		perfFilterMetricId === 'all'
			? data.performanceEntries
			: data.performanceEntries.filter((e) => e.metricId === perfFilterMetricId)
	);

	/** Metric name lookup for performance entries */
	function perfMetricName(id: string): string {
		return data.performanceMetrics.find((m) => m.id === id)?.name ?? id;
	}

	/** Format a date for display */
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{t(data.locale, 'goals.page_title')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Page header -->
	<div class="mb-6 flex items-start justify-between">
		<h1 class="text-2xl font-medium text-primary">{t(data.locale, 'goals.page_title')}</h1>
		<!-- Context-aware action button -->
		{#if activeSection === 'metrics' && data.metrics.length > 0}
			<a
				href={href('/api/export/goals-pdf')}
				target="_blank"
				class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surfaceHigh hover:text-primary"
			>
				{t(data.locale, 'export.pdf')}
			</a>
		{:else if activeSection === 'goals' && data.canWrite}
			<button
				onclick={() => (showAddGoalForm = !showAddGoalForm)}
				class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
			>
				{t(data.locale, 'goals.add_goal')}
			</button>
		{:else if activeSection === 'performance'}
			<div class="flex items-center gap-2">
				{#if data.performanceEntries.length > 0}
					<a
						href={href('/api/export/performance-logs')}
						class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surfaceHigh hover:text-primary"
					>
						{t(data.locale, 'export.csv')}
					</a>
				{/if}
				{#if data.performanceMetrics.length > 0 && data.canWrite}
					<button
						onclick={() => (showPerfForm = !showPerfForm)}
						class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
					>
						{t(data.locale, 'performance.new_entry')}
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Top-level section tabs: Metrics | Goals | Performance -->
	<div class="mb-6 flex gap-1 rounded-lg bg-surfaceMid p-1">
		<button
			onclick={() => (activeSection = 'metrics')}
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeSection ===
			'metrics'
				? 'bg-surface text-primary shadow-sm'
				: 'text-secondary hover:text-primary'}"
		>
			{t(data.locale, 'goals.tab_metrics')}
			{#if data.metrics.length > 0}
				<span class="ml-1.5 text-xs text-secondary">({data.metrics.length})</span>
			{/if}
		</button>
		<button
			onclick={() => (activeSection = 'goals')}
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeSection ===
			'goals'
				? 'bg-surface text-primary shadow-sm'
				: 'text-secondary hover:text-primary'}"
		>
			{t(data.locale, 'goals.tab_goals')}
			{#if data.goals.length > 0}
				<span class="ml-1.5 text-xs text-secondary">({data.goals.length})</span>
			{/if}
		</button>
		<button
			onclick={() => (activeSection = 'performance')}
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeSection ===
			'performance'
				? 'bg-surface text-primary shadow-sm'
				: 'text-secondary hover:text-primary'}"
		>
			{t(data.locale, 'performance.title')}
			{#if data.performanceEntries.length > 0}
				<span class="ml-1.5 text-xs text-secondary">({data.performanceEntries.length})</span>
			{/if}
		</button>
	</div>

	<!-- ════════════════════════════════════════════════════════════════════════
	     METRICS SECTION
	     ════════════════════════════════════════════════════════════════════════ -->
	{#if activeSection === 'metrics'}
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<p class="text-sm text-secondary">{t(data.locale, 'stack.subtitle')}</p>
				<HelpTooltip text={t(data.locale, 'tooltip.stack.add_metric')} />
			</div>
			{#if data.metrics.length > 0}
				<CompositeScore
					score={compositeData.score}
					tier={compositeData.tier}
					locale={data.locale}
					size="sm"
					compact
				/>
			{/if}
		</div>

		<!-- Lock banner (shown when snapshot has been captured) -->
		{#if data.metrics.some((m) => m.lockedBySnapshotId)}
			<div
				transition:slide={{ duration: 250 }}
				class="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950"
			>
				<svg
					class="h-4 w-4 text-amber-600 dark:text-amber-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<p class="text-sm text-amber-800 dark:text-amber-200">
					{t(data.locale, 'metric.locked')}
				</p>
			</div>
		{/if}

		<!-- Weight progress bar -->
		{#if data.metrics.length > 0}
			<div class="mb-6 rounded-lg border border-border bg-surfaceMid p-4">
				<p class="mb-2 text-xs text-secondary/70">{t(data.locale, 'stack.weight_explain')}</p>
				<div class="flex items-center justify-between text-sm">
					<span class="text-secondary"
						>{t(data.locale, 'demo.weight_total', { total: totalWeight })}</span
					>
					{#if remainingWeight > 0}
						<span class="text-secondary"
							>{t(data.locale, 'demo.weight_remaining', { remaining: remainingWeight })}</span
						>
					{:else if remainingWeight < 0}
						<span class="text-alarm">{t(data.locale, 'validation.weights_exceed')}</span>
					{:else}
						<span class="text-accent2">{t(data.locale, 'stack.balanced')}</span>
					{/if}
				</div>
				<div class="mt-2 h-2 overflow-hidden rounded-full bg-surfaceHigh">
					<div
						class="h-full rounded-full transition-all {totalWeight === 100
							? 'bg-accent2'
							: totalWeight > 100
								? 'bg-alarm'
								: 'bg-accent1'}"
						style="width: {Math.min(totalWeight, 100)}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Metrics list -->
		<div class="space-y-3">
			{#each visibleMetrics as metric (metric.id)}
				{@const isExpanded = expandedMetrics.has(metric.id)}
				<div class="rounded-lg border border-border bg-surfaceMid">
					<!-- Collapsed header -->
					<div
						class="flex items-center justify-between p-4 {isExpanded
							? 'border-b border-border'
							: ''}"
					>
						<div class="flex min-w-0 flex-1 items-center gap-3">
							{#if metric.currentTier}
								<TierIndicator tier={metric.currentTier} locale={data.locale} size="sm" dotOnly />
							{/if}
							<h3 class="truncate font-medium text-primary">{metric.name}</h3>
							{#if metric.origin === 'superior_assigned'}
								<span
									class="shrink-0 rounded-full bg-accent3/10 px-2 py-0.5 text-xs font-medium text-accent3"
								>
									{t(data.locale, 'leaders.assigned')}
								</span>
							{/if}
							{#if metric.lockedBySnapshotId}
								<svg
									class="h-3.5 w-3.5 shrink-0 text-secondary/50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									role="img"
									aria-label={t(data.locale, 'metric.locked')}
								>
									<title>{t(data.locale, 'metric.locked')}</title>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							{/if}
						</div>

						<div class="ml-4 flex flex-shrink-0 items-center gap-3">
							{#if metric.weight}
								<span class="text-sm font-medium text-secondary tabular-nums">{metric.weight}%</span
								>
							{/if}
							{#if metric.currentTier}
								<TierIndicator tier={metric.currentTier} locale={data.locale} size="sm" />
							{/if}

							<!-- Approval check marks: employee ✓ (accent1) + manager ✓ (accent2) -->
							<span
								class="flex items-center gap-0.5"
								title={`${t(data.locale, 'stack.alignment_explain')} — ${
									metric.approvedAt
										? t(data.locale, 'metric.approved')
										: metric.submittedAt
											? t(data.locale, 'metric.pending_review')
											: t(data.locale, 'metric.status.draft')
								}`}
							>
								<svg
									class="h-4 w-4 {metric.submittedAt || metric.approvedAt
										? 'text-accent1'
										: 'text-accent1/25'}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									aria-hidden="true"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								<svg
									class="h-4 w-4 {metric.approvedAt
										? 'text-tier-optimized'
										: 'text-tier-optimized/20'}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									aria-hidden="true"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</span>

							<!-- Expand/collapse chevron -->
							<button
								type="button"
								class="rounded p-1 text-secondary transition-colors hover:bg-surfaceMid hover:text-primary"
								aria-label={isExpanded
									? t(data.locale, 'stack.collapse')
									: t(data.locale, 'stack.expand')}
								aria-expanded={isExpanded}
								onclick={() => toggleExpanded(metric.id)}
							>
								<svg
									class="h-4 w-4 transition-transform duration-180 {isExpanded ? 'rotate-180' : ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Accordion: thresholds + edit form -->
					<div class="accordion-content {isExpanded ? 'open' : ''}">
						<div class="accordion-inner">
							<!-- Threshold tier buttons -->
							<div class="p-4">
								<div class="mb-3 flex items-center gap-1.5">
									<p class="text-xs text-secondary/70">
										{t(data.locale, 'stack.thresholds_explain')}
									</p>
									<HelpTooltip
										text={t(data.locale, 'tooltip.stack.thresholds')}
										position="bottom"
									/>
								</div>
								<div class="grid grid-cols-5 gap-2">
									{#each TIER_LEVELS as tier, idx (tier)}
										<button
											type="button"
											class="rounded-lg border p-3 text-left transition-colors {metric.currentTier ===
											tier
												? 'border-accent1 bg-accent1/10'
												: 'border-border bg-surface hover:border-accent1/50'}"
											onclick={() => {
												const formData = new FormData();
												formData.set('metricId', metric.id);
												formData.set('tier', tier);
												fetch('?/recordTier', { method: 'POST', body: formData });
											}}
										>
											<div class="mb-1">
												<TierIndicator {tier} locale={data.locale} size="sm" dotOnly />
											</div>
											<div class="text-xs text-secondary">
												{metric.thresholds[idx]?.description || t(data.locale, `tier.${tier}`)}
											</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- Submit for review footer -->
							<div class="flex items-center justify-between border-t border-border px-4 py-3">
								<div class="flex items-center gap-2 text-xs">
									{#if metric.approvedAt}
										<svg
											class="h-3.5 w-3.5 text-tier-optimized"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2.5"
											aria-hidden="true"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
										<span class="font-medium text-tier-optimized">
											{t(data.locale, 'metric.approved')}
										</span>
									{:else if metric.submittedAt}
										<svg
											class="h-3.5 w-3.5 text-accent1"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2.5"
											aria-hidden="true"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
										<span class="text-secondary">{t(data.locale, 'metric.pending_review')}</span>
									{:else}
										<span class="text-secondary">{t(data.locale, 'metric.status.draft')}</span>
									{/if}
								</div>

								{#if !metric.approvedAt && !metric.lockedBySnapshotId}
									<div class="flex items-center gap-3">
										<div class="flex items-center gap-1.5">
											<button
												type="button"
												class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent1/40 hover:text-accent1"
												onclick={() =>
													(editingMetricId = editingMetricId === metric.id ? null : metric.id)}
											>
												{t(data.locale, 'action.edit')}
											</button>
											<HelpTooltip text={t(data.locale, 'tooltip.stack.edit')} position="top" />
										</div>
										<div class="flex items-center gap-1.5">
											<form method="POST" action="?/submitMetric" use:enhance>
												<input type="hidden" name="metricId" value={metric.id} />
												<button
													type="submit"
													class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {metric.submittedAt
														? 'border-accent1/40 text-accent1 hover:bg-accent1/10'
														: 'border-border text-secondary hover:border-accent1/40 hover:text-accent1'}"
												>
													{metric.submittedAt
														? t(data.locale, 'metric.resubmit')
														: t(data.locale, 'metric.submit_for_review')}
												</button>
											</form>
											<HelpTooltip text={t(data.locale, 'tooltip.stack.submit')} position="top" />
										</div>
									</div>
								{/if}
							</div>

							<!-- Edit form -->
							{#if editingMetricId === metric.id}
								<div transition:slide={{ duration: 250 }} class="border-t border-border p-4">
									<form
										method="POST"
										action="?/updateMetric"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												editingMetricId = null;
											};
										}}
									>
										<input type="hidden" name="metricId" value={metric.id} />

										<div class="grid gap-4 md:grid-cols-2">
											<div>
												<label
													for="name-{metric.id}"
													class="block text-sm font-medium text-primary"
												>
													{t(data.locale, 'metric.name')}
												</label>
												<input
													type="text"
													id="name-{metric.id}"
													name="name"
													value={metric.name}
													required
													class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
												/>
											</div>

											<div>
												<label
													for="weight-{metric.id}"
													class="block text-sm font-medium text-primary"
												>
													{t(data.locale, 'metric.weight')}
												</label>
												<input
													type="number"
													id="weight-{metric.id}"
													name="weight"
													value={metric.weight || 0}
													min="0"
													max="100"
													class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
												/>
											</div>
										</div>

										<div class="mt-4">
											<label
												for="description-{metric.id}"
												class="block text-sm font-medium text-primary"
											>
												{t(data.locale, 'metric.description')}
											</label>
											<textarea
												id="description-{metric.id}"
												name="description"
												rows="2"
												class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
												>{metric.description || ''}</textarea
											>
										</div>

										<!-- Threshold descriptions -->
										<div class="mt-4">
											<span class="block text-sm font-medium text-primary">
												{t(data.locale, 'metric.thresholds')}
											</span>
											<div class="mt-2 space-y-2">
												{#each TIER_LEVELS as tier, idx (tier)}
													<div class="flex items-center gap-2">
														<TierIndicator {tier} locale={data.locale} size="sm" dotOnly />
														<input
															type="text"
															name="threshold_{tier}"
															value={metric.thresholds[idx]?.description || ''}
															placeholder={t(data.locale, `tier.${tier}.description`)}
															class="block flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
														/>
													</div>
												{/each}
											</div>
										</div>

										<div class="mt-4 flex items-center justify-between">
											<button
												type="button"
												class="text-alarm text-sm hover:underline"
												onclick={async () => {
													if (!confirm('Delete this metric?')) return;
													const formData = new FormData();
													formData.append('metricId', metric.id);
													const response = await fetch('?/deleteMetric', {
														method: 'POST',
														body: formData
													});
													if (response.ok) {
														invalidateAll();
													}
												}}
											>
												{t(data.locale, 'action.delete')}
											</button>

											<div class="flex gap-2">
												<button
													type="button"
													class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surfaceHigh"
													onclick={() => (editingMetricId = null)}
												>
													{t(data.locale, 'action.cancel')}
												</button>
												<button
													type="submit"
													class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
												>
													{t(data.locale, 'action.save')}
												</button>
											</div>
										</div>
									</form>
								</div>
							{/if}
						</div>
						<!-- accordion-inner -->
					</div>
					<!-- accordion-content -->
				</div>
				<!-- metric card -->
			{/each}
		</div>

		<!-- Soft-fold -->
		{#if hiddenCount > 0 && !showAllMetrics}
			<button
				transition:fade={{ duration: 200 }}
				type="button"
				class="mt-3 w-full rounded-lg border border-dashed border-border bg-surface p-3 text-sm text-secondary transition-colors hover:border-accent1 hover:text-accent1"
				onclick={() => (showAllMetrics = true)}
			>
				{t(data.locale, 'stack.more', { count: hiddenCount })}
			</button>
		{/if}

		<!-- Add new metric button / form -->
		{#if !showAddMetricForm}
			<button
				type="button"
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-4 text-secondary transition-colors hover:border-accent1 hover:text-accent1"
				onclick={() => (showAddMetricForm = true)}
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{t(data.locale, 'demo.add_metric')}
			</button>
		{:else}
			<div
				transition:slide={{ duration: 300 }}
				class="mt-4 rounded-lg border border-border bg-surfaceMid p-6"
			>
				<h3 class="text-lg font-medium text-primary">{t(data.locale, 'demo.add_metric')}</h3>

				<form
					method="POST"
					action="?/createMetric"
					class="mt-4"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							showAddMetricForm = false;
						};
					}}
				>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<label for="new-name" class="block text-sm font-medium text-primary">
								{t(data.locale, 'metric.name')}
							</label>
							<input
								type="text"
								id="new-name"
								name="name"
								required
								placeholder={t(data.locale, 'demo.metric_placeholder')}
								class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							/>
						</div>

						<div>
							<div class="flex items-center gap-1.5">
								<label for="new-weight" class="block text-sm font-medium text-primary">
									{t(data.locale, 'metric.weight')}
								</label>
								<HelpTooltip text={t(data.locale, 'tooltip.stack.weight')} position="top" />
							</div>
							<input
								type="number"
								id="new-weight"
								name="weight"
								value={remainingWeight > 0 ? remainingWeight : 0}
								min="0"
								max="100"
								class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							/>
						</div>
					</div>

					<div class="mt-4 grid gap-4 md:grid-cols-3">
						<div>
							<label for="new-measurementType" class="block text-sm font-medium text-primary">
								{t(data.locale, 'metric.measurement_type')}
							</label>
							<p class="mt-0.5 text-xs text-secondary/70">
								{t(data.locale, 'metric.measurement_type_explain')}
							</p>
							<select
								id="new-measurementType"
								name="measurementType"
								class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							>
								<option value="qualitative">{t(data.locale, 'metric.type.qualitative')}</option>
								<option value="numeric">{t(data.locale, 'metric.type.numeric')}</option>
								<option value="percentage">{t(data.locale, 'metric.type.percentage')}</option>
								<option value="currency">{t(data.locale, 'metric.type.currency')}</option>
								<option value="binary">{t(data.locale, 'metric.type.binary')}</option>
							</select>
						</div>

						<div>
							<label for="new-indicatorType" class="block text-sm font-medium text-primary">
								{t(data.locale, 'metric.indicator_type')}
							</label>
							<p class="mt-0.5 text-xs text-secondary/70">
								{t(data.locale, 'metric.indicator_type_explain')}
							</p>
							<select
								id="new-indicatorType"
								name="indicatorType"
								class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							>
								<option value="health">{t(data.locale, 'metric.indicator.health')}</option>
								<option value="leading">{t(data.locale, 'metric.indicator.leading')}</option>
								<option value="lagging">{t(data.locale, 'metric.indicator.lagging')}</option>
							</select>
						</div>

						<div>
							<label for="new-origin" class="block text-sm font-medium text-primary">
								{t(data.locale, 'metric.origin')}
							</label>
							<p class="mt-0.5 text-xs text-secondary/70">
								{t(data.locale, 'metric.origin_explain')}
							</p>
							<select
								id="new-origin"
								name="origin"
								class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							>
								<option value="self_defined">{t(data.locale, 'metric.origin.self_defined')}</option>
								<option value="co_authored">{t(data.locale, 'metric.origin.co_authored')}</option>
								<option value="superior_assigned"
									>{t(data.locale, 'metric.origin.superior_assigned')}</option
								>
								<option value="board">{t(data.locale, 'metric.origin.board')}</option>
								<option value="regulatory">{t(data.locale, 'metric.origin.regulatory')}</option>
							</select>
						</div>
					</div>

					<div class="mt-4">
						<label for="new-description" class="block text-sm font-medium text-primary">
							{t(data.locale, 'metric.description')}
						</label>
						<textarea
							id="new-description"
							name="description"
							rows="2"
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
						></textarea>
					</div>

					<div class="mt-6 flex justify-end gap-2">
						<button
							type="button"
							class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surfaceHigh"
							onclick={() => (showAddMetricForm = false)}
						>
							{t(data.locale, 'action.cancel')}
						</button>
						<button
							type="submit"
							class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
						>
							{t(data.locale, 'action.create')}
						</button>
					</div>
				</form>
			</div>
		{/if}
	{/if}

	<!-- ════════════════════════════════════════════════════════════════════════
	     GOALS SECTION
	     ════════════════════════════════════════════════════════════════════════ -->
	{#if activeSection === 'goals'}
		<!-- Success messages -->
		{#if form?.cascadeSuccess}
			<div
				transition:fade={{ duration: 200 }}
				class="mb-4 rounded-lg bg-accent2/10 px-4 py-3 text-sm text-accent2"
			>
				{t(data.locale, 'goals.cascade_success', { count: String(form.cascaded ?? 0) })}
			</div>
		{/if}
		{#if form?.createSuccess}
			<div
				transition:fade={{ duration: 200 }}
				class="mb-4 rounded-lg bg-accent2/10 px-4 py-3 text-sm text-accent2"
			>
				{t(data.locale, 'goals.create_success')}
			</div>
		{/if}
		{#if form?.updateSuccess}
			<div
				transition:fade={{ duration: 200 }}
				class="mb-4 rounded-lg bg-accent2/10 px-4 py-3 text-sm text-accent2"
			>
				{t(data.locale, 'goals.update_success')}
			</div>
		{/if}
		{#if form?.deleteSuccess}
			<div
				transition:fade={{ duration: 200 }}
				class="mb-4 rounded-lg bg-accent2/10 px-4 py-3 text-sm text-accent2"
			>
				{t(data.locale, 'goals.delete_success')}
			</div>
		{/if}

		<!-- Goal sub-tabs: My Goals | Team Rollup | Parent Goals -->
		{#if data.hasDirectReports || data.parentGoals.length > 0}
			<div class="mb-6 flex gap-1 rounded-lg bg-surfaceMid p-1">
				<button
					onclick={() => (activeGoalTab = 'my')}
					class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeGoalTab ===
					'my'
						? 'bg-surface text-primary shadow-sm'
						: 'text-secondary hover:text-primary'}"
				>
					{t(data.locale, 'goals.my_goals')} ({data.goals.length})
				</button>
				{#if data.hasDirectReports}
					<button
						onclick={() => (activeGoalTab = 'team')}
						class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeGoalTab ===
						'team'
							? 'bg-surface text-primary shadow-sm'
							: 'text-secondary hover:text-primary'}"
					>
						{t(data.locale, 'goals.team_rollup')} ({data.teamGoals.length})
					</button>
				{/if}
				{#if data.parentGoals.length > 0}
					<button
						onclick={() => (activeGoalTab = 'parent')}
						class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeGoalTab ===
						'parent'
							? 'bg-surface text-primary shadow-sm'
							: 'text-secondary hover:text-primary'}"
					>
						{t(data.locale, 'goals.team_goals')} ({data.parentGoals.length})
					</button>
				{/if}
			</div>
		{/if}

		<!-- ── Add Goal Form ─────────────────────────────────────────────────── -->
		{#if showAddGoalForm}
			<div
				transition:slide={{ duration: 300 }}
				class="mb-6 rounded-lg border border-border bg-surfaceMid p-6"
			>
				<h2 class="mb-4 text-lg font-medium text-primary">{t(data.locale, 'goals.add_goal')}</h2>
				<form
					method="POST"
					action="?/createGoal"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							showAddGoalForm = false;
						};
					}}
				>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="goal-title" class="mb-1 block text-sm font-medium text-primary">
								{t(data.locale, 'goals.title')}
							</label>
							<input
								id="goal-title"
								name="title"
								type="text"
								required
								placeholder={t(data.locale, 'goals.title_placeholder')}
								class="placeholder:text-tertiary w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="goal-desc" class="mb-1 block text-sm font-medium text-primary">
								{t(data.locale, 'goals.description')}
							</label>
							<textarea
								id="goal-desc"
								name="description"
								rows="2"
								placeholder={t(data.locale, 'goals.description_placeholder')}
								class="placeholder:text-tertiary w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
							></textarea>
						</div>

						<div>
							<label for="goal-type" class="mb-1 block text-sm font-medium text-primary">
								{t(data.locale, 'goals.goal_type')}
							</label>
							<select
								id="goal-type"
								name="goalType"
								required
								class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
							>
								<option value="operational">{t(data.locale, 'goal.type.operational')}</option>
								<option value="strategic">{t(data.locale, 'goal.type.strategic')}</option>
								<option value="developmental">{t(data.locale, 'goal.type.developmental')}</option>
								<option value="compliance">{t(data.locale, 'goal.type.compliance')}</option>
							</select>
						</div>

						<div>
							<label for="goal-priority" class="mb-1 block text-sm font-medium text-primary">
								{t(data.locale, 'goals.priority')}
							</label>
							<select
								id="goal-priority"
								name="priority"
								required
								class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
							>
								<option value="medium">{t(data.locale, 'goal.priority.medium')}</option>
								<option value="high">{t(data.locale, 'goal.priority.high')}</option>
								<option value="low">{t(data.locale, 'goal.priority.low')}</option>
							</select>
						</div>

						<div>
							<label for="goal-target-tier" class="mb-1 block text-sm font-medium text-primary">
								{t(data.locale, 'goals.target_tier')}
							</label>
							<select
								id="goal-target-tier"
								name="targetTier"
								class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
							>
								<option value="">—</option>
								{#each TIER_LEVELS as tier (tier)}
									<option value={tier}>{t(data.locale, `tier.${tier}`)}</option>
								{/each}
							</select>
							<p class="text-tertiary mt-1 text-xs">{t(data.locale, 'goals.target_tier_help')}</p>
						</div>

						<div>
							<label for="goal-due" class="mb-1 block text-sm font-medium text-primary">
								{t(data.locale, 'goals.due_date')}
							</label>
							<input
								id="goal-due"
								name="dueDate"
								type="date"
								class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
							/>
						</div>
					</div>

					<div class="mt-4 flex gap-3">
						<button
							type="submit"
							class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
						>
							{t(data.locale, 'action.save')}
						</button>
						<button
							type="button"
							onclick={() => (showAddGoalForm = false)}
							class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-surfaceHigh"
						>
							{t(data.locale, 'action.cancel')}
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- ── My Goals ──────────────────────────────────────────────────────── -->
		{#if activeGoalTab === 'my'}
			{#if data.goals.length === 0}
				<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center text-secondary">
					{t(data.locale, 'goals.no_goals')}
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.goals as goal (goal.id)}
						{@const deps = getDepsForGoal(goal.id)}
						<div class="rounded-lg border border-border bg-surfaceMid p-4">
							<!-- Goal header -->
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<span
											class="inline-block h-2.5 w-2.5 rounded-full {priorityColour[goal.priority]}"
										></span>
										<h3 class="font-medium text-primary">{goal.title}</h3>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {goalTypeBadge[
												goal.goalType
											] ?? ''}"
										>
											{t(data.locale, `goal.type.${goal.goalType}`)}
										</span>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadge[
												goal.status
											] ?? ''}"
										>
											{t(data.locale, `goal.status.${goal.status}`)}
										</span>
										{#if goal.goalOrigin === 'cascaded'}
											<span
												class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
											>
												{t(data.locale, 'goals.origin_cascaded')}
											</span>
										{:else if goal.goalOrigin === 'superior_assigned'}
											<span
												class="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-200"
											>
												{t(data.locale, 'goals.origin_assigned')}
											</span>
										{/if}
										{#if goal.dueDate && isOverdue(goal.dueDate) && goal.status !== 'completed'}
											<span
												class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-200"
											>
												{t(data.locale, 'goals.overdue')}
											</span>
										{:else if goal.dueDate && isDueSoon(goal.dueDate) && goal.status !== 'completed'}
											<span
												class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-200"
											>
												{t(data.locale, 'goals.due_soon')}
											</span>
										{/if}
									</div>
									{#if goal.description}
										<p class="mt-1 text-sm text-secondary">{goal.description}</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									{#if goal.targetTier}
										<div
											class="flex items-center gap-1.5"
											title={t(data.locale, 'goals.tier_alignment')}
										>
											<span class="text-tertiary text-xs"
												>{t(data.locale, 'goals.target_tier')}:</span
											>
											<TierIndicator
												tier={goal.targetTier as TierLevel}
												locale={data.locale}
												size="sm"
											/>
										</div>
									{/if}
									{#if goal.actualTier}
										<div class="flex items-center gap-1.5">
											<span class="text-tertiary text-xs"
												>{t(data.locale, 'goals.actual_tier')}:</span
											>
											<TierIndicator
												tier={goal.actualTier as TierLevel}
												locale={data.locale}
												size="sm"
											/>
										</div>
									{/if}
								</div>
							</div>

							{#if goal.dueDate}
								<div class="text-tertiary mt-2 text-xs">
									{t(data.locale, 'goals.due_date')}: {new Date(goal.dueDate).toLocaleDateString()}
								</div>
							{/if}

							<!-- Dependencies -->
							{#if deps.length > 0}
								<div class="mt-3 border-t border-border pt-3">
									<h4 class="text-tertiary mb-1.5 text-xs font-medium tracking-wider uppercase">
										{t(data.locale, 'goals.dependencies')}
									</h4>
									<div class="flex flex-wrap gap-2">
										{#each deps as dep (dep.id)}
											<div
												class="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs"
											>
												<span
													class="rounded px-1.5 py-0.5 text-[10px] font-medium {depTypeBadge[
														dep.dependencyType
													] ?? ''}"
												>
													{t(data.locale, `goal.dependency.${dep.dependencyType}`)}
												</span>
												<span class="text-primary">{dep.dependsOnTitle ?? '—'}</span>
												{#if dep.dependsOnNodeName}
													<span class="text-tertiary">({dep.dependsOnNodeName})</span>
												{/if}
												{#if data.canWrite}
													<form
														method="POST"
														action="?/removeDependency"
														use:enhance={() => {
															return async ({ update }) => {
																await update();
															};
														}}
													>
														<input type="hidden" name="dependencyId" value={dep.id} />
														<button
															type="submit"
															class="text-tertiary ml-1 hover:text-red-500"
															aria-label={t(data.locale, 'action.remove')}
														>
															&times;
														</button>
													</form>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Action buttons -->
							{#if data.canWrite}
								<div class="mt-3 flex gap-2 border-t border-border pt-3">
									<button
										onclick={() => (editingGoalId = editingGoalId === goal.id ? null : goal.id)}
										class="text-xs font-medium text-accent1 hover:underline"
									>
										{t(data.locale, 'action.edit')}
									</button>
									<div class="flex items-center gap-1">
										<button
											onclick={() =>
												(addingDependencyForGoalId =
													addingDependencyForGoalId === goal.id ? null : goal.id)}
											class="text-xs font-medium text-accent1 hover:underline"
										>
											{t(data.locale, 'goals.add_dependency')}
										</button>
										<HelpTooltip text={t(data.locale, 'tooltip.goals.dependency')} position="top" />
									</div>
									{#if data.hasDirectReports}
										<div class="flex items-center gap-1">
											<form
												method="POST"
												action="?/cascade"
												use:enhance={() => {
													return async ({ update }) => {
														await update();
													};
												}}
											>
												<input type="hidden" name="goalId" value={goal.id} />
												<button
													type="submit"
													class="text-xs font-medium text-accent1 hover:underline"
												>
													{t(data.locale, 'goals.cascade_to_team')}
												</button>
											</form>
											<HelpTooltip text={t(data.locale, 'tooltip.goals.cascade')} position="top" />
										</div>
									{/if}
									{#if data.cascadeStatus[goal.id]}
										{@const cs = data.cascadeStatus[goal.id]}
										<span class="text-xs text-secondary">
											{t(data.locale, 'goals.cascade_status', {
												accepted: String(cs.accepted),
												deferred: String(cs.deferred),
												pending: String(cs.pending),
												total: String(cs.total)
											})}
										</span>
									{/if}
									{#if goal.goalOrigin !== 'cascaded'}
										<form
											method="POST"
											action="?/deleteGoal"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
												};
											}}
										>
											<input type="hidden" name="goalId" value={goal.id} />
											<button
												type="submit"
												onclick={(e) => {
													if (!confirm(t(data.locale, 'goals.delete_confirm'))) e.preventDefault();
												}}
												class="text-xs font-medium text-red-500 hover:underline"
											>
												{t(data.locale, 'goals.delete_goal')}
											</button>
										</form>
									{/if}
								</div>
							{/if}

							<!-- ── Inline Edit Form ────────────────────────────────── -->
							{#if editingGoalId === goal.id}
								<div transition:slide={{ duration: 250 }} class="mt-3 border-t border-border pt-3">
									<form
										method="POST"
										action="?/updateGoal"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												editingGoalId = null;
											};
										}}
									>
										<input type="hidden" name="goalId" value={goal.id} />
										<div class="grid gap-3 sm:grid-cols-2">
											<div class="sm:col-span-2">
												<input
													name="title"
													type="text"
													required
													value={goal.title}
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												/>
											</div>
											<div class="sm:col-span-2">
												<textarea
													name="description"
													rows="2"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
													>{goal.description ?? ''}</textarea
												>
											</div>
											<div>
												<select
													name="goalType"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													{#each ['operational', 'strategic', 'developmental', 'compliance'] as gt (gt)}
														<option value={gt} selected={goal.goalType === gt}
															>{t(data.locale, `goal.type.${gt}`)}</option
														>
													{/each}
												</select>
											</div>
											<div>
												<select
													name="priority"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													{#each ['high', 'medium', 'low'] as p (p)}
														<option value={p} selected={goal.priority === p}
															>{t(data.locale, `goal.priority.${p}`)}</option
														>
													{/each}
												</select>
											</div>
											<div>
												<select
													name="status"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													{#each ['defined', 'in_progress', 'completed', 'deferred'] as s (s)}
														<option value={s} selected={goal.status === s}
															>{t(data.locale, `goal.status.${s}`)}</option
														>
													{/each}
												</select>
											</div>
											<div>
												<select
													name="targetTier"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													<option value="">—</option>
													{#each TIER_LEVELS as tier (tier)}
														<option value={tier} selected={goal.targetTier === tier}
															>{t(data.locale, `tier.${tier}`)}</option
														>
													{/each}
												</select>
											</div>
											<label class="block">
												<span class="text-tertiary mb-1 block text-xs"
													>{t(data.locale, 'goals.actual_tier')}</span
												>
												<select
													name="actualTier"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													<option value="">—</option>
													{#each TIER_LEVELS as tier (tier)}
														<option value={tier} selected={goal.actualTier === tier}
															>{t(data.locale, `tier.${tier}`)}</option
														>
													{/each}
												</select>
											</label>
											<label class="block">
												<span class="text-tertiary mb-1 block text-xs"
													>{t(data.locale, 'goals.due_date')}</span
												>
												<input
													name="dueDate"
													type="date"
													value={goal.dueDate ?? ''}
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												/>
											</label>
											<label class="block sm:col-span-2">
												<span class="mb-1 block text-xs font-medium text-secondary">
													{t(data.locale, 'goals.adjustment_reason')}
												</span>
												<input
													name="reason"
													type="text"
													placeholder={t(data.locale, 'goals.adjustment_reason_placeholder')}
													class="placeholder:text-tertiary w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												/>
												<p class="text-tertiary mt-1 text-xs">
													{t(data.locale, 'goals.adjustment_reason_help')}
												</p>
											</label>
										</div>
										<div class="mt-3 flex gap-2">
											<button
												type="submit"
												class="rounded-lg bg-accent1 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent1/90"
											>
												{t(data.locale, 'action.save')}
											</button>
											<button
												type="button"
												onclick={() => (editingGoalId = null)}
												class="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surfaceHigh"
											>
												{t(data.locale, 'action.cancel')}
											</button>
										</div>
									</form>
								</div>
							{/if}

							<!-- ── Adjustment Log ──────────────────────────────────── -->
							{#if getAdjustmentsForGoal(goal.id).length > 0}
								<div class="mt-3 border-t border-border pt-3">
									<div class="flex items-center gap-1.5">
										<button
											type="button"
											onclick={() =>
												(expandedAdjustmentGoalId =
													expandedAdjustmentGoalId === goal.id ? null : goal.id)}
											class="text-tertiary flex items-center gap-1.5 text-xs hover:text-secondary"
										>
											<svg
												class="h-3.5 w-3.5 transition-transform {expandedAdjustmentGoalId ===
												goal.id
													? 'rotate-90'
													: ''}"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												/>
											</svg>
											{t(data.locale, 'goals.adjustment_log')} ({getAdjustmentsForGoal(goal.id)
												.length})
										</button>
										<HelpTooltip
											text={t(data.locale, 'tooltip.goals.adjustment_log')}
											position="top"
										/>
									</div>
									{#if expandedAdjustmentGoalId === goal.id}
										<div class="mt-2 space-y-1.5">
											{#each getAdjustmentsForGoal(goal.id) as adj (adj.id)}
												<div class="rounded-md border border-border bg-surface px-3 py-2 text-xs">
													<div class="flex items-center justify-between gap-2">
														<span class="font-medium text-secondary capitalize"
															>{adj.field.replace(/_/g, ' ')}</span
														>
														<span class="text-tertiary"
															>{new Date(adj.createdAt).toLocaleDateString()}</span
														>
													</div>
													<div class="text-tertiary mt-1 flex items-center gap-1.5">
														{#if adj.oldValue !== null}
															<span
																class="rounded bg-red-50 px-1.5 py-0.5 line-through dark:bg-red-950"
																>{adj.oldValue}</span
															>
														{:else}
															<span class="italic">—</span>
														{/if}
														<svg
															class="h-3 w-3 shrink-0"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															aria-hidden="true"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M9 5l7 7-7 7"
															/>
														</svg>
														{#if adj.newValue !== null}
															<span class="rounded bg-green-50 px-1.5 py-0.5 dark:bg-green-950"
																>{adj.newValue}</span
															>
														{:else}
															<span class="italic">—</span>
														{/if}
													</div>
													{#if adj.adjustedByName || adj.reason}
														<div class="text-tertiary mt-1">
															{#if adj.adjustedByName}
																<span
																	>{t(data.locale, 'goals.adjusted_by')}: {adj.adjustedByName}</span
																>
															{/if}
															{#if adj.reason}
																<span class="ml-2 italic">"{adj.reason}"</span>
															{/if}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}

							<!-- ── Inline Add Dependency Form ────────────────────── -->
							{#if addingDependencyForGoalId === goal.id}
								<div transition:slide={{ duration: 250 }} class="mt-3 border-t border-border pt-3">
									<form
										method="POST"
										action="?/addDependency"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												addingDependencyForGoalId = null;
											};
										}}
									>
										<input type="hidden" name="goalId" value={goal.id} />
										<div class="grid gap-3 sm:grid-cols-3">
											<label class="block">
												<span class="text-tertiary mb-1 block text-xs"
													>{t(data.locale, 'goals.depends_on')}</span
												>
												<select
													name="dependsOnGoalId"
													required
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													<option value="">—</option>
													{#each data.availableGoals.filter((g) => g.id !== goal.id) as ag (ag.id)}
														<option value={ag.id}
															>{ag.title}{ag.nodeName ? ` (${ag.nodeName})` : ''}</option
														>
													{/each}
												</select>
											</label>
											<label class="block">
												<span class="text-tertiary mb-1 block text-xs"
													>{t(data.locale, 'goals.dependency_type')}</span
												>
												<select
													name="dependencyType"
													required
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												>
													<option value="supports"
														>{t(data.locale, 'goal.dependency.supports')}</option
													>
													<option value="informs"
														>{t(data.locale, 'goal.dependency.informs')}</option
													>
													<option value="blocks">{t(data.locale, 'goal.dependency.blocks')}</option>
												</select>
											</label>
											<label class="block">
												<span class="text-tertiary mb-1 block text-xs"
													>{t(data.locale, 'goals.description')}</span
												>
												<input
													name="description"
													type="text"
													placeholder={t(data.locale, 'goals.dependency_description')}
													class="placeholder:text-tertiary w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
												/>
											</label>
										</div>
										<div class="mt-3 flex gap-2">
											<button
												type="submit"
												class="rounded-lg bg-accent1 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent1/90"
											>
												{t(data.locale, 'action.save')}
											</button>
											<button
												type="button"
												onclick={() => (addingDependencyForGoalId = null)}
												class="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surfaceHigh"
											>
												{t(data.locale, 'action.cancel')}
											</button>
										</div>
									</form>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- ── Parent / Team Goals (upward visibility for ICs) ──────────────── -->
		{#if activeGoalTab === 'parent'}
			<p class="mb-4 text-xs text-secondary">
				{t(data.locale, 'goals.upward_visibility_note')}
			</p>
			{#if data.parentGoals.length === 0}
				<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center text-secondary">
					{t(data.locale, 'goals.no_team_goals')}
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.parentGoals as goal (goal.id)}
						<div class="rounded-lg border border-border bg-surfaceMid p-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<span
											class="inline-block h-2.5 w-2.5 rounded-full {priorityColour[goal.priority]}"
										></span>
										<h3 class="font-medium text-primary">{goal.title}</h3>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {goalTypeBadge[
												goal.goalType
											] ?? ''}"
										>
											{t(data.locale, `goal.type.${goal.goalType}`)}
										</span>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadge[
												goal.status
											] ?? ''}"
										>
											{t(data.locale, `goal.status.${goal.status}`)}
										</span>
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if goal.targetTier}
										<TierIndicator
											tier={goal.targetTier as TierLevel}
											locale={data.locale}
											size="sm"
										/>
									{/if}
								</div>
							</div>
							<div class="text-tertiary mt-2 flex flex-wrap gap-3 text-xs">
								{#if goal.nodeName}
									<span>{t(data.locale, 'goals.node_name')}: {goal.nodeName}</span>
								{/if}
								{#if goal.dueDate}
									<span
										>{t(data.locale, 'goals.due_date')}: {new Date(
											goal.dueDate
										).toLocaleDateString()}</span
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- ── Team Goals Rollup ─────────────────────────────────────────────── -->
		{#if activeGoalTab === 'team'}
			{#if data.teamGoals.length === 0}
				<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center text-secondary">
					{t(data.locale, 'goals.no_team_goals')}
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.teamGoals as goal (goal.id)}
						<div class="rounded-lg border border-border bg-surfaceMid p-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<span
											class="inline-block h-2.5 w-2.5 rounded-full {priorityColour[goal.priority]}"
										></span>
										<h3 class="font-medium text-primary">{goal.title}</h3>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {goalTypeBadge[
												goal.goalType
											] ?? ''}"
										>
											{t(data.locale, `goal.type.${goal.goalType}`)}
										</span>
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadge[
												goal.status
											] ?? ''}"
										>
											{t(data.locale, `goal.status.${goal.status}`)}
										</span>
										{#if goal.dueDate && isOverdue(goal.dueDate) && goal.status !== 'completed'}
											<span
												class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-200"
											>
												{t(data.locale, 'goals.overdue')}
											</span>
										{/if}
									</div>
									{#if goal.description}
										<p class="mt-1 text-sm text-secondary">{goal.description}</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									{#if goal.targetTier}
										<TierIndicator
											tier={goal.targetTier as TierLevel}
											locale={data.locale}
											size="sm"
										/>
									{/if}
									{#if goal.actualTier}
										<div class="flex items-center gap-1">
											<span class="text-tertiary text-xs">&rarr;</span>
											<TierIndicator
												tier={goal.actualTier as TierLevel}
												locale={data.locale}
												size="sm"
											/>
										</div>
									{/if}
								</div>
							</div>
							<div class="text-tertiary mt-2 flex flex-wrap gap-3 text-xs">
								{#if goal.nodeName}
									<span>{t(data.locale, 'goals.node_name')}: {goal.nodeName}</span>
								{/if}
								{#if goal.dueDate}
									<span
										>{t(data.locale, 'goals.due_date')}: {new Date(
											goal.dueDate
										).toLocaleDateString()}</span
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}

	<!-- ════════════════════════════════════════════════════════════════════════
	     PERFORMANCE SECTION
	     ════════════════════════════════════════════════════════════════════════ -->
	{#if activeSection === 'performance'}
		{#if data.performanceMetrics.length === 0}
			<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center">
				<p class="text-sm text-secondary">{t(data.locale, 'performance.no_metrics')}</p>
			</div>
		{:else}
			<!-- Success/Error Messages -->
			{#if form?.recordSuccess}
				<div
					transition:fade={{ duration: 200 }}
					class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
				>
					{t(data.locale, 'performance.saved')}
				</div>
			{/if}
			{#if form?.error === 'duplicate_entry'}
				<div
					transition:fade={{ duration: 200 }}
					class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
				>
					{t(data.locale, 'performance.error_duplicate')}
				</div>
			{:else if form?.error === 'save_failed'}
				<div
					transition:fade={{ duration: 200 }}
					class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
				>
					{t(data.locale, 'performance.error_save')}
				</div>
			{/if}

			<!-- New Entry Form -->
			{#if showPerfForm}
				<div
					transition:slide={{ duration: 300 }}
					class="mb-8 rounded-lg border border-border bg-surfaceMid p-6"
				>
					<h2 class="mb-4 text-base font-medium text-primary">
						{t(data.locale, 'performance.log_entry')}
					</h2>

					<form
						method="POST"
						action="?/record"
						use:enhance={() => {
							perfSaving = true;
							return async ({ update }) => {
								await update();
								perfSaving = false;
							};
						}}
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<!-- Metric Selection -->
							<div>
								<label for="perf_metric_id" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.metric')}
								</label>
								<select
									id="perf_metric_id"
									name="metric_id"
									required
									bind:value={perfSelectedMetricId}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								>
									<option value="" disabled>{t(data.locale, 'performance.select_metric')}</option>
									{#each data.performanceMetrics as metric (metric.id)}
										<option value={metric.id}>{metric.name}</option>
									{/each}
								</select>
							</div>

							<!-- Cadence -->
							<div>
								<label for="perf_cadence" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.cadence')}
								</label>
								<select
									id="perf_cadence"
									name="cadence"
									required
									bind:value={perfSelectedCadence}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								>
									{#each CADENCES as cadence (cadence)}
										<option value={cadence}>
											{t(data.locale, `performance.cadence.${cadence}`)}
										</option>
									{/each}
								</select>
							</div>

							<!-- Period Start -->
							<div>
								<label
									for="perf_period_start"
									class="mb-1 block text-xs font-medium text-secondary"
								>
									{t(data.locale, 'performance.period_start')}
								</label>
								<input
									type="date"
									id="perf_period_start"
									name="period_start"
									required
									value={perfPeriodDefaults.start}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>

							<!-- Period End -->
							<div>
								<label for="perf_period_end" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.period_end')}
								</label>
								<input
									type="date"
									id="perf_period_end"
									name="period_end"
									required
									value={perfPeriodDefaults.end}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>

							<!-- Measured Value -->
							<div>
								<label
									for="perf_measured_value_input"
									class="mb-1 block text-xs font-medium text-secondary"
								>
									{t(data.locale, 'performance.measured_value')}
								</label>
								<input
									type="text"
									id="perf_measured_value_input"
									required
									bind:value={perfMeasuredValueInput}
									placeholder={t(data.locale, 'performance.measured_value_placeholder')}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
								<input
									type="hidden"
									name="measured_value"
									value={buildMeasuredValue(perfSelectedMetricId, perfMeasuredValueInput)}
								/>
							</div>

							<!-- Assessed Tier -->
							<div>
								<label
									for="perf_assessed_tier"
									class="mb-1 block text-xs font-medium text-secondary"
								>
									{t(data.locale, 'performance.assessed_tier')}
								</label>
								<select
									id="perf_assessed_tier"
									name="assessed_tier"
									required
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								>
									{#each TIER_LEVELS as tier (tier)}
										<option value={tier}>{t(data.locale, `tier.${tier}`)}</option>
									{/each}
								</select>
							</div>

							<!-- Data Source -->
							<div>
								<label for="perf_data_source" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.data_source')}
								</label>
								<input
									type="text"
									id="perf_data_source"
									name="data_source"
									placeholder={t(data.locale, 'performance.data_source_placeholder')}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>

							<!-- Notes -->
							<div>
								<label for="perf_notes" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.notes')}
								</label>
								<input
									type="text"
									id="perf_notes"
									name="notes"
									placeholder={t(data.locale, 'performance.notes_placeholder')}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>
						</div>

						<div class="mt-4 flex justify-end">
							<button
								type="submit"
								disabled={perfSaving}
								class="rounded-lg bg-accent1 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90 disabled:opacity-50"
							>
								{perfSaving
									? t(data.locale, 'performance.saving')
									: t(data.locale, 'performance.save')}
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- Metric Cadence Cards -->
			<div class="mb-8">
				<div class="mb-3 flex items-center gap-2">
					<h2 class="text-base font-medium text-primary">
						{t(data.locale, 'performance.cadence_label')}
					</h2>
					<HelpTooltip text={t(data.locale, 'tooltip.performance.cadence')} />
				</div>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.performanceMetrics as metric (metric.id)}
						{@const metricEntries = data.performanceEntries.filter((e) => e.metricId === metric.id)}
						{@const latestEntry = metricEntries[0]}
						<div class="rounded-lg border border-border bg-surfaceMid p-4">
							<div class="mb-2 flex items-start justify-between">
								<h3 class="text-sm font-medium text-primary">{metric.name}</h3>
								{#if metric.currentTier}
									<TierIndicator tier={metric.currentTier} locale={data.locale} size="sm" />
								{/if}
							</div>

							<!-- Cadence form -->
							{#if data.canWrite}
								<form
									method="POST"
									action="?/setCadence"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
										};
									}}
									class="flex items-center gap-2"
								>
									<input type="hidden" name="metric_id" value={metric.id} />
									<select
										name="cadence"
										class="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-primary"
										value={metric.performanceCadence ?? data.orgCadence ?? 'monthly'}
									>
										{#each CADENCES as cadence (cadence)}
											<option value={cadence}>
												{t(data.locale, `performance.cadence.${cadence}`)}
											</option>
										{/each}
									</select>
									<button
										type="submit"
										class="rounded bg-accent1/10 px-2 py-1 text-xs font-medium text-accent1 hover:bg-accent1/20"
									>
										{t(data.locale, 'performance.set_cadence')}
									</button>
								</form>
							{/if}

							<!-- Entry summary -->
							<div class="mt-2 text-xs text-secondary">
								{t(data.locale, 'performance.entries_count', {
									count: String(metricEntries.length)
								})}
								{#if latestEntry}
									· {t(data.locale, 'performance.latest_entry', {
										tier: t(data.locale, `tier.${latestEntry.assessedTier}`),
										date: formatDate(latestEntry.periodStart)
									})}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- History Table -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-base font-medium text-primary">
						{t(data.locale, 'performance.history')}
					</h2>
					<select
						bind:value={perfFilterMetricId}
						class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-primary"
					>
						<option value="all">{t(data.locale, 'performance.filter_all')}</option>
						{#each data.performanceMetrics as metric (metric.id)}
							<option value={metric.id}>{metric.name}</option>
						{/each}
					</select>
				</div>

				{#if filteredPerfEntries.length === 0}
					<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center">
						<p class="text-sm text-secondary">{t(data.locale, 'performance.empty')}</p>
					</div>
				{:else}
					<div class="overflow-x-auto rounded-lg border border-border">
						<table class="w-full text-left text-sm">
							<thead class="border-b border-border bg-surfaceMid">
								<tr>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.metric')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.period')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.cadence')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.measured_value')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.assessed_tier')}
									</th>
									<th class="px-4 py-3 text-xs font-medium text-secondary">
										{t(data.locale, 'performance.data_source')}
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each filteredPerfEntries as entry (entry.id)}
									<tr class="hover:bg-surfaceHigh/50">
										<td class="px-4 py-3 font-medium text-primary">
											{perfMetricName(entry.metricId)}
										</td>
										<td class="px-4 py-3 text-secondary">
											{t(data.locale, 'performance.period_label', {
												start: formatDate(entry.periodStart),
												end: formatDate(entry.periodEnd)
											})}
										</td>
										<td class="px-4 py-3 text-secondary">
											{t(data.locale, `performance.cadence.${entry.cadence}`)}
										</td>
										<td class="px-4 py-3 font-mono text-xs text-primary">
											{JSON.stringify(entry.measuredValue)}
										</td>
										<td class="px-4 py-3">
											<TierIndicator tier={entry.assessedTier} locale={data.locale} size="sm" />
										</td>
										<td class="px-4 py-3 text-secondary">
											{entry.dataSource ?? '—'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Performance Framework Reference (collapsible) -->
	<div class="mt-8 rounded-lg border border-border bg-surfaceMid">
		<button
			type="button"
			class="flex w-full items-center justify-between px-6 py-4 text-left"
			onclick={() => (showFramework = !showFramework)}
		>
			<div>
				<h2 class="text-base font-medium text-primary">
					{t(data.locale, 'settings.framework_heading')}
				</h2>
				<p class="mt-0.5 text-sm text-secondary">
					{t(data.locale, 'settings.framework_description')}
				</p>
			</div>
			<svg
				class="h-5 w-5 shrink-0 text-secondary transition-transform {showFramework
					? 'rotate-180'
					: ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if showFramework}
			<div transition:slide={{ duration: 200 }} class="space-y-3 px-6 pb-6">
				{#each [{ tier: 'alarm', color: 'text-tier-alarm', bg: 'bg-tier-alarm/10', border: 'border-tier-alarm/20' }, { tier: 'concern', color: 'text-tier-concern', bg: 'bg-tier-concern/10', border: 'border-tier-concern/20' }, { tier: 'content', color: 'text-tier-content', bg: 'bg-tier-content/10', border: 'border-tier-content/20' }, { tier: 'effective', color: 'text-tier-effective', bg: 'bg-tier-effective/10', border: 'border-tier-effective/20' }, { tier: 'optimized', color: 'text-tier-optimized', bg: 'bg-tier-optimized/10', border: 'border-tier-optimized/20' }] as row (row.tier)}
					<div class="flex items-start gap-3 rounded-lg border {row.border} {row.bg} px-4 py-3">
						<div class="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-current {row.color}"></div>
						<div>
							<p class="text-sm font-semibold {row.color}">{t(data.locale, `tier.${row.tier}`)}</p>
							<p class="mt-0.5 text-xs text-secondary">
								{t(data.locale, `tier.${row.tier}.description`)}
							</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
