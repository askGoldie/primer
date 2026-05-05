<script lang="ts">
	/**
	 * Leader Detail Page
	 *
	 * Shows a single org node's profile: their metrics, goals, and latest score.
	 * Content is gated by hierarchy visibility.
	 *
	 * For leaders (ancestors), adds workflow actions:
	 * - Assign required metrics to subordinates (Step 1)
	 * - Edit metrics during review meetings (Step 4)
	 * - Capture interval snapshots (Step 7)
	 * - Adjust snapshots after capture (Step 8)
	 * - Start new cycle to unlock metrics (Step 9)
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import type { TierLevel } from '$lib/types/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const TIER_LEVELS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];

	/** Dot colour per priority */
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

	function nodeTypeLabel(nodeType: string): string {
		return t(data.locale, `hierarchy.type.${nodeType}`);
	}

	/** UI state */
	let showAssignForm = $state(false);
	let showSnapshotForm = $state(false);
	let editingMetricId = $state<string | null>(null);
	let adjustingSnapshotId = $state<string | null>(null);

	/** Check if any metric is locked (snapshot captured) */
	const hasLockedMetrics = $derived(data.metrics.some((m) => m.lockedBySnapshotId));
</script>

<svelte:head>
	<title>{data.targetNode.name} | {t(data.locale, 'nav.my_team')}</title>
</svelte:head>

<div class="p-8">
	<!-- Back link -->
	<a
		href={resolve('/app/leaders')}
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		{t(data.locale, 'leaders.back')}
	</a>

	<!-- Profile header -->
	<div class="mb-8 flex items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-medium text-primary">{data.targetNode.name}</h1>
				{#if data.latestScore}
					<TierIndicator tier={data.latestScore.tier as TierLevel} locale={data.locale} size="md" />
				{/if}
			</div>
			{#if data.targetNode.title}
				<p class="mt-1 text-secondary">{data.targetNode.title}</p>
			{/if}
			<p class="mt-0.5 text-sm text-secondary capitalize">
				{nodeTypeLabel(data.targetNode.nodeType)}
			</p>
		</div>

		<div class="flex items-start gap-3">
			{#if data.latestScore}
				<div class="text-right">
					<p class="text-3xl font-medium text-primary">
						{data.latestScore.score.toFixed(1)}
					</p>
					{#if data.latestScore.cycleLabel}
						<p class="mt-0.5 text-xs text-secondary">{data.latestScore.cycleLabel}</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Success messages -->
	{#if form?.assignSuccess}
		<div
			class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{t(data.locale, 'leaders.assign_success')}
		</div>
	{/if}
	{#if form?.snapshotSuccess}
		<div
			class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{t(data.locale, 'leaders.snapshot_success')}
		</div>
	{/if}
	{#if form?.editSuccess}
		<div
			class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{t(data.locale, 'leaders.edit_success')}
		</div>
	{/if}
	{#if form?.newCycleSuccess}
		<div
			class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{t(data.locale, 'leaders.new_cycle_success')}
		</div>
	{/if}
	{#if form?.adjustSuccess}
		<div
			class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{t(data.locale, 'leaders.adjust_success')}
		</div>
	{/if}

	{#if !data.canView && !data.isPeer}
		<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center">
			<svg
				class="mx-auto h-10 w-10 text-secondary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
			<p class="mt-4 text-secondary">{t(data.locale, 'leaders.restricted')}</p>
		</div>
	{:else if data.isPeer && data.peerVisibility === 'score_only'}
		<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center">
			<svg
				class="mx-auto h-10 w-10 text-secondary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
				/>
			</svg>
			<p class="mt-4 text-secondary">{t(data.locale, 'leaders.peer_metrics_restricted')}</p>
		</div>
	{:else}
		<div class="space-y-8">
			<!-- ─── Leader Action Bar (ancestors only) ────────────────── -->
			{#if data.canManageNode}
				<div
					class="flex flex-wrap items-center gap-3 rounded-lg border border-accent1/20 bg-accent1/5 p-4"
				>
					<div class="flex items-center gap-1.5">
						<button
							onclick={() => (showAssignForm = !showAssignForm)}
							class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
						>
							{t(data.locale, 'leaders.assign_metric')}
						</button>
						<HelpTooltip text={t(data.locale, 'tooltip.leaders.assign')} position="bottom" />
					</div>

					<div class="flex items-center gap-1.5">
						<button
							onclick={() => (showSnapshotForm = !showSnapshotForm)}
							class="rounded-lg border border-accent1/50 bg-accent1/10 px-4 py-2 text-sm font-medium text-accent1 hover:bg-accent1/20"
						>
							{t(data.locale, 'leaders.capture_snapshot')}
						</button>
						<HelpTooltip text={t(data.locale, 'tooltip.leaders.snapshot')} position="bottom" />
					</div>

					{#if hasLockedMetrics}
						<div class="flex items-center gap-1.5">
							<form
								method="POST"
								action="?/startNewCycle"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<button
									type="submit"
									class="rounded-lg border border-accent2/50 bg-accent2/10 px-4 py-2 text-sm font-medium text-accent2 hover:bg-accent2/20"
								>
									{t(data.locale, 'leaders.start_new_cycle')}
								</button>
							</form>
							<HelpTooltip text={t(data.locale, 'tooltip.leaders.new_cycle')} position="bottom" />
						</div>
					{/if}
				</div>
			{/if}

			<!-- ─── Assign Metric Form (Step 1) ──────────────────────── -->
			{#if showAssignForm && data.canManageNode}
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h3 class="mb-4 text-base font-medium text-primary">
						{t(data.locale, 'leaders.assign_metric_heading')}
					</h3>
					<form
						method="POST"
						action="?/assignMetric"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								showAssignForm = false;
							};
						}}
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="sm:col-span-2">
								<label for="assign-name" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'metric.name')}
								</label>
								<input
									id="assign-name"
									name="name"
									type="text"
									required
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>
							<div class="sm:col-span-2">
								<label for="assign-desc" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'metric.description')}
								</label>
								<input
									id="assign-desc"
									name="description"
									type="text"
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>
							<div>
								<label for="assign-weight" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'metric.weight')}
								</label>
								<input
									id="assign-weight"
									name="weight"
									type="number"
									min="0"
									max="100"
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>
						</div>

						<!-- Co-authorship -->
						<div class="sm:col-span-2">
							<label class="flex cursor-pointer items-start gap-3">
								<input
									type="checkbox"
									name="isCoAuthored"
									value="true"
									class="mt-0.5 h-4 w-4 rounded border-border accent-accent1"
								/>
								<div>
									<div class="flex items-center gap-1.5">
										<span class="text-sm font-medium text-primary"
											>{t(data.locale, 'leaders.co_authored_label')}</span
										>
										<HelpTooltip
											text={t(data.locale, 'tooltip.leaders.co_authored')}
											position="top"
										/>
									</div>
									<p class="text-tertiary mt-0.5 text-xs">
										{t(data.locale, 'leaders.co_authored_help')}
									</p>
								</div>
							</label>
						</div>

						<!-- Threshold descriptions -->
						<div class="mt-4">
							<p class="mb-2 text-xs font-medium text-secondary">
								{t(data.locale, 'metric.thresholds')}
							</p>
							<div class="grid gap-2 sm:grid-cols-5">
								{#each TIER_LEVELS as tier (tier)}
									<div>
										<label
											for="assign-threshold-{tier}"
											class="mb-1 block text-xs text-secondary capitalize"
										>
											{t(data.locale, `tier.${tier}`)}
										</label>
										<textarea
											id="assign-threshold-{tier}"
											name="threshold_{tier}"
											rows="2"
											class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-primary"
										></textarea>
									</div>
								{/each}
							</div>
						</div>

						<div class="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onclick={() => (showAssignForm = false)}
								class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh"
							>
								{t(data.locale, 'action.cancel')}
							</button>
							<button
								type="submit"
								class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
							>
								{t(data.locale, 'leaders.assign_metric')}
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- ─── Capture Snapshot Form (Step 7) ───────────────────── -->
			{#if showSnapshotForm && data.canManageNode}
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h3 class="mb-4 text-base font-medium text-primary">
						{t(data.locale, 'leaders.capture_snapshot_heading')}
					</h3>
					<p class="mb-4 text-xs text-secondary">
						{t(data.locale, 'leaders.capture_snapshot_description')}
					</p>
					<form
						method="POST"
						action="?/captureSnapshot"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								showSnapshotForm = false;
							};
						}}
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label for="cycle-label" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'leaders.cycle_label')}
								</label>
								<input
									id="cycle-label"
									name="cycleLabel"
									type="text"
									required
									placeholder={t(data.locale, 'leaders.cycle_label_placeholder')}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>
							<div>
								<label for="snapshot-notes" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.notes')}
								</label>
								<input
									id="snapshot-notes"
									name="notes"
									type="text"
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
								/>
							</div>
						</div>
						<div class="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onclick={() => (showSnapshotForm = false)}
								class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh"
							>
								{t(data.locale, 'action.cancel')}
							</button>
							<button
								type="submit"
								class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
							>
								{t(data.locale, 'leaders.capture_snapshot')}
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- ─── Metric Stack ──────────────────────────────────────── -->
			<section>
				<h2 class="mb-4 text-lg font-medium text-primary">
					{t(data.locale, 'leaders.metrics_heading')}
				</h2>

				{#if data.metrics.length === 0}
					<div class="rounded-lg border border-dashed border-border bg-surfaceMid p-6 text-center">
						<p class="text-sm text-secondary">{t(data.locale, 'leaders.no_metrics')}</p>
					</div>
				{:else}
					<div class="divide-y divide-border rounded-lg border border-border bg-surfaceMid">
						{#each data.metrics as metric (metric.id)}
							<div class="p-4">
								{#if editingMetricId === metric.id && data.canManageNode}
									<!-- Inline edit form (Step 4) -->
									<form
										method="POST"
										action="?/editMetric"
										use:enhance={() => {
											return async ({ update }) => {
												editingMetricId = null;
												await update();
											};
										}}
									>
										<input type="hidden" name="metricId" value={metric.id} />
										<div class="grid gap-3 sm:grid-cols-2">
											<label class="block">
												<span class="mb-1 block text-xs font-medium text-secondary"
													>{t(data.locale, 'metric.name')}</span
												>
												<input
													name="name"
													type="text"
													value={metric.name}
													required
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
												/>
											</label>
											<label class="block">
												<span class="mb-1 block text-xs font-medium text-secondary"
													>{t(data.locale, 'metric.weight')}</span
												>
												<input
													name="weight"
													type="number"
													value={metric.weight ?? 0}
													min="0"
													max="100"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
												/>
											</label>
											<label class="block sm:col-span-2">
												<span class="mb-1 block text-xs font-medium text-secondary"
													>{t(data.locale, 'metric.description')}</span
												>
												<input
													name="description"
													type="text"
													value={metric.description ?? ''}
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
												/>
											</label>
											<label class="block">
												<span class="mb-1 block text-xs font-medium text-secondary"
													>{t(data.locale, 'metric.current_tier')}</span
												>
												<select
													name="currentTier"
													class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
												>
													<option value="">—</option>
													{#each TIER_LEVELS as tier (tier)}
														<option value={tier} selected={metric.currentTier === tier}
															>{t(data.locale, `tier.${tier}`)}</option
														>
													{/each}
												</select>
											</label>
										</div>
										<div class="mt-3">
											<p class="mb-2 text-xs font-medium text-secondary">
												{t(data.locale, 'metric.thresholds')}
											</p>
											<div class="grid gap-2 sm:grid-cols-5">
												{#each metric.thresholds as threshold (threshold.tier)}
													<label class="block">
														<span class="mb-1 block text-xs text-secondary capitalize"
															>{t(data.locale, `tier.${threshold.tier}`)}</span
														>
														<textarea
															name="threshold_{threshold.tier}"
															rows="2"
															class="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-primary"
															>{threshold.description}</textarea
														>
													</label>
												{/each}
											</div>
										</div>
										<div class="mt-3 flex justify-end gap-2">
											<button
												type="button"
												onclick={() => (editingMetricId = null)}
												class="rounded-lg border border-border px-3 py-1.5 text-xs text-secondary hover:bg-surfaceHigh"
											>
												{t(data.locale, 'action.cancel')}
											</button>
											<button
												type="submit"
												class="rounded-lg bg-accent1 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent1/90"
											>
												{t(data.locale, 'action.save')}
											</button>
										</div>
									</form>
								{:else}
									<!-- Read-only metric display -->
									<div class="flex items-center justify-between gap-4">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span class="font-medium text-primary">{metric.name}</span>
												<span class="text-xs text-secondary capitalize">{metric.indicatorType}</span
												>
												{#if metric.origin === 'superior_assigned'}
													<span
														class="rounded-full bg-accent3/10 px-2 py-0.5 text-xs font-medium text-accent3"
													>
														{t(data.locale, 'leaders.assigned')}
													</span>
												{:else if metric.origin === 'co_authored'}
													<span
														class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
													>
														{t(data.locale, 'leaders.co_authored')}
													</span>
												{/if}
												{#if metric.lockedBySnapshotId}
													<svg
														class="h-3.5 w-3.5 text-secondary/60"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														role="img"
														aria-label={t(data.locale, 'leaders.locked')}
													>
														<title>{t(data.locale, 'leaders.locked')}</title>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
														/>
													</svg>
												{/if}
											</div>
											{#if metric.description}
												<p class="mt-0.5 text-sm text-secondary">{metric.description}</p>
											{/if}
										</div>
										<div class="flex shrink-0 items-center gap-3">
											{#if metric.weight}
												<span class="text-sm text-secondary">{metric.weight}%</span>
											{/if}
											{#if metric.currentTier}
												<TierIndicator tier={metric.currentTier} locale={data.locale} size="sm" />
											{/if}

											<!-- Dual check marks -->
											<span
												class="flex items-center gap-0.5"
												title={metric.approvedAt
													? t(data.locale, 'metric.approved')
													: metric.submittedAt
														? t(data.locale, 'metric.pending_review')
														: t(data.locale, 'metric.status.draft')}
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

											<!-- Approve button -->
											{#if data.canManageNode && metric.submittedAt && !metric.approvedAt}
												<div class="flex items-center gap-1">
													<form method="POST" action="?/approve" use:enhance>
														<input type="hidden" name="metricId" value={metric.id} />
														<button
															type="submit"
															class="rounded-lg border border-accent2/50 bg-accent2/10 px-3 py-1 text-xs font-medium text-accent2 hover:bg-accent2/20"
														>
															{t(data.locale, 'metric.approve')}
														</button>
													</form>
													<HelpTooltip
														text={t(data.locale, 'tooltip.leaders.approve')}
														position="top"
													/>
												</div>
											{/if}

											<!-- Edit button (leader only) -->
											{#if data.canManageNode}
												<button
													onclick={() => (editingMetricId = metric.id)}
													class="rounded-lg border border-border px-2 py-1 text-xs text-secondary hover:bg-surfaceHigh"
												>
													{t(data.locale, 'action.edit')}
												</button>
											{/if}
										</div>
									</div>

									<!-- Thresholds -->
									{#if metric.thresholds.some((th) => th.description)}
										<div class="mt-3 grid gap-1 sm:grid-cols-5">
											{#each metric.thresholds as threshold (threshold.tier)}
												{#if threshold.description}
													<div class="rounded bg-surface p-2 text-xs">
														<p class="mb-1 font-medium text-secondary capitalize">
															{t(data.locale, `tier.${threshold.tier}`)}
														</p>
														<p class="text-secondary">{threshold.description}</p>
													</div>
												{/if}
											{/each}
										</div>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- ─── Goals ─────────────────────────────────────────────── -->
			<section>
				<h2 class="mb-4 text-lg font-medium text-primary">
					{t(data.locale, 'leaders.goals_heading')}
				</h2>

				{#if data.goals.length === 0}
					<div class="rounded-lg border border-dashed border-border bg-surfaceMid p-6 text-center">
						<p class="text-sm text-secondary">{t(data.locale, 'leaders.no_goals')}</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each data.goals as goal (goal.id)}
							<div class="rounded-lg border border-border bg-surfaceMid p-4">
								<div class="flex items-start justify-between gap-4">
									<div class="flex items-start gap-3">
										<span
											class="mt-1.5 h-2 w-2 shrink-0 rounded-full {priorityColour[goal.priority] ??
												'bg-gray-400'}"
											title={t(data.locale, `goal.priority.${goal.priority}`)}
										></span>
										<div>
											<div class="flex flex-wrap items-center gap-2">
												<p class="font-medium text-primary">{goal.title}</p>
												{#if goal.goalType}
													<span
														class="rounded-full px-2 py-0.5 text-xs font-medium
														{goal.goalType === 'strategic'
															? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
															: goal.goalType === 'operational'
																? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
																: goal.goalType === 'developmental'
																	? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
																	: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'}"
													>
														{t(data.locale, `goal.type.${goal.goalType}`)}
													</span>
												{/if}
											</div>
											{#if goal.description}
												<p class="mt-1 text-sm text-secondary">{goal.description}</p>
											{/if}
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
										{#if goal.actualTier}
											<span class="text-tertiary text-xs">&rarr;</span>
											<TierIndicator
												tier={goal.actualTier as TierLevel}
												locale={data.locale}
												size="sm"
											/>
										{/if}
										<span
											class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {statusBadge[
												goal.status
											] ?? ''}"
										>
											{t(data.locale, `goal.status.${goal.status}`)}
										</span>
									</div>
								</div>
								{#if goal.dueDate}
									<div class="text-tertiary mt-2 text-xs">
										{t(data.locale, 'goals.due_date')}: {new Date(
											goal.dueDate
										).toLocaleDateString()}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- ─── Snapshot History (managers only) ───────────────────── -->
			{#if data.canManageNode}
				<section>
					<div class="mb-4 flex items-center gap-2">
						<h2 class="text-lg font-medium text-primary">
							{t(data.locale, 'leaders.snapshot_history')}
						</h2>
						<HelpTooltip text={t(data.locale, 'tooltip.leaders.snapshot_adjust')} />
					</div>

					{#if data.snapshotHistory.length === 0}
						<div
							class="rounded-lg border border-dashed border-border bg-surfaceMid p-6 text-center"
						>
							<p class="text-sm text-secondary">{t(data.locale, 'leaders.no_snapshots')}</p>
						</div>
					{:else}
						<div class="divide-y divide-border rounded-lg border border-border bg-surfaceMid">
							{#each data.snapshotHistory as snapshot (snapshot.id)}
								<div class="p-4">
									{#if adjustingSnapshotId === snapshot.id}
										<!-- Inline adjust form (Step 8) -->
										<form
											method="POST"
											action="?/adjustSnapshot"
											use:enhance={() => {
												return async ({ update }) => {
													adjustingSnapshotId = null;
													await update();
												};
											}}
										>
											<input type="hidden" name="snapshotId" value={snapshot.id} />
											<p class="mb-3 text-xs text-secondary">
												{t(data.locale, 'leaders.adjust_snapshot_description')}
											</p>
											<div class="grid gap-3 sm:grid-cols-2">
												<div>
													<label
														for="adj-tier-{snapshot.id}"
														class="mb-1 block text-xs font-medium text-secondary"
													>
														{t(data.locale, 'metric.current_tier')}
													</label>
													<select
														id="adj-tier-{snapshot.id}"
														name="compositeTier"
														class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
													>
														{#each TIER_LEVELS as tier (tier)}
															<option value={tier} selected={snapshot.compositeTier === tier}>
																{t(data.locale, `tier.${tier}`)}
															</option>
														{/each}
													</select>
												</div>
												<div>
													<label
														for="adj-score-{snapshot.id}"
														class="mb-1 block text-xs font-medium text-secondary"
													>
														{t(data.locale, 'metric.weight')}
													</label>
													<input
														id="adj-score-{snapshot.id}"
														name="compositeScore"
														type="number"
														step="0.01"
														min="1"
														max="5"
														value={snapshot.compositeScore.toFixed(2)}
														class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
													/>
												</div>
												<div class="sm:col-span-2">
													<label
														for="adj-notes-{snapshot.id}"
														class="mb-1 block text-xs font-medium text-secondary"
													>
														{t(data.locale, 'performance.notes')}
													</label>
													<textarea
														id="adj-notes-{snapshot.id}"
														name="notes"
														rows="2"
														class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
														>{snapshot.notes ?? ''}</textarea
													>
												</div>
											</div>
											<div class="mt-3 flex justify-end gap-2">
												<button
													type="button"
													onclick={() => (adjustingSnapshotId = null)}
													class="rounded-lg border border-border px-3 py-1.5 text-xs text-secondary hover:bg-surfaceHigh"
												>
													{t(data.locale, 'action.cancel')}
												</button>
												<button
													type="submit"
													class="rounded-lg bg-accent1 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent1/90"
												>
													{t(data.locale, 'action.save')}
												</button>
											</div>
										</form>
									{:else}
										<!-- Snapshot row (read mode) -->
										<div class="flex items-center justify-between gap-4">
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2">
													<span class="font-medium text-primary">{snapshot.cycleLabel}</span>
													<TierIndicator
														tier={snapshot.compositeTier}
														locale={data.locale}
														size="sm"
													/>
													<span class="text-sm text-secondary"
														>{snapshot.compositeScore.toFixed(2)}</span
													>
												</div>
												<p class="mt-0.5 text-xs text-secondary">
													{new Date(snapshot.createdAt).toLocaleDateString()}
												</p>
												{#if snapshot.adjustedAt && snapshot.adjustedByName}
													<p class="mt-1 text-xs text-secondary italic">
														{t(data.locale, 'leaders.adjusted_by', {
															name: snapshot.adjustedByName
														})}
														· {new Date(snapshot.adjustedAt).toLocaleDateString()}
													</p>
												{/if}
												{#if snapshot.notes}
													<p class="mt-1 text-xs text-secondary">{snapshot.notes}</p>
												{/if}
											</div>
											<button
												onclick={() => (adjustingSnapshotId = snapshot.id)}
												class="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-secondary hover:bg-surfaceHigh"
											>
												{t(data.locale, 'leaders.adjust_snapshot')}
											</button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<!-- ─── Inquiry CTA (same-level only) ─────────────────────── -->
			{#if data.canFileInquiry}
				<div class="rounded-lg border border-border bg-surfaceMid p-4">
					<p class="text-sm text-secondary">
						{t(data.locale, 'leaders.inquiry_cta')}
					</p>
					<a
						href={resolve('/app/inquiries/new')}
						class="btn-outline mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm"
					>
						{t(data.locale, 'leaders.file_inquiry')}
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
