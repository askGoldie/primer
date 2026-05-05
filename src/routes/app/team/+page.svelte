<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * My Team Page
	 *
	 * Displays the user's direct reports and their descendant subtree.
	 * Includes a Team Health Summary section at the top showing each
	 * direct report's current tier, composite score, and metric completion.
	 *
	 * Two view modes:
	 * - Tree view: hierarchical indentation showing the org structure
	 * - List view: flat sortable table of all descendants
	 */
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { fade, slide } from 'svelte/transition';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	/** Quick snapshot capture UI state */
	let showSnapshotForm = $state(false);
	let snapshotNodeId = $state('');

	/** Current view mode for the subtree display */
	let viewMode: 'tree' | 'list' = $state('tree');

	/** Sort field for list view */
	let sortField: 'name' | 'tier' | 'completion' = $state('name');

	/** Sort direction */
	let sortAsc: boolean = $state(true);

	/**
	 * Tier numeric value for sorting
	 */
	const TIER_SORT: Record<string, number> = {
		alarm: 1,
		concern: 2,
		content: 3,
		effective: 4,
		optimized: 5
	};

	/**
	 * Tier badge color classes
	 */
	function tierColor(tier: string | null): string {
		switch (tier) {
			case 'optimized':
				return 'bg-emerald-500/15 text-emerald-400';
			case 'effective':
				return 'bg-sky-500/15 text-sky-400';
			case 'content':
				return 'bg-amber-500/15 text-amber-400';
			case 'concern':
				return 'bg-orange-500/15 text-orange-400';
			case 'alarm':
				return 'bg-red-500/15 text-red-400';
			default:
				return 'bg-surfaceHigh text-secondary';
		}
	}

	/**
	 * Completion percentage for a node
	 */
	function completionPct(total: number, approved: number): number {
		if (total === 0) return 0;
		return Math.round((approved / total) * 100);
	}

	/**
	 * Sorted subtree for list view
	 */
	let sortedSubtree = $derived.by(() => {
		const items = [...data.subtree];
		items.sort((a, b) => {
			let cmp = 0;
			switch (sortField) {
				case 'name':
					cmp = a.name.localeCompare(b.name);
					break;
				case 'tier':
					cmp = (TIER_SORT[a.compositeTier ?? ''] ?? 0) - (TIER_SORT[b.compositeTier ?? ''] ?? 0);
					break;
				case 'completion':
					cmp =
						completionPct(a.metricTotal, a.metricApproved) -
						completionPct(b.metricTotal, b.metricApproved);
					break;
			}
			return sortAsc ? cmp : -cmp;
		});
		return items;
	});

	/**
	 * Toggle sort field / direction
	 */
	function toggleSort(field: typeof sortField) {
		if (sortField === field) {
			sortAsc = !sortAsc;
		} else {
			sortField = field;
			sortAsc = true;
		}
	}
</script>

<svelte:head>
	<title>{t(data.locale, 'nav.my_team')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">
			{t(data.locale, 'nav.my_team')}
		</h1>
		<p class="mt-1 text-secondary">
			{t(data.locale, 'team.subtitle')}
		</p>
	</div>

	<!-- ── Team Health Summary ─────────────────────────────────────────── -->
	{#if data.directReportHealth.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 text-lg font-medium text-primary">
				{t(data.locale, 'team.health_summary')}
			</h2>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each data.directReportHealth as report (report.id)}
					<a
						href={href(`/app/leaders/${report.id}`)}
						class="group flex items-start gap-3 rounded-xl border border-border bg-surfaceMid p-4 transition-colors hover:border-accent2/50 hover:bg-surfaceHigh"
					>
						<div class="min-w-0 flex-1">
							<span class="block truncate font-medium text-primary">{report.name}</span>
							{#if report.title}
								<span class="block truncate text-sm text-secondary">{report.title}</span>
							{/if}
							<!-- Metric completion -->
							<div class="mt-2 flex items-center gap-2">
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surfaceHigh">
									<div
										class="h-full rounded-full transition-all"
										class:bg-emerald-500={completionPct(
											report.metricTotal,
											report.metricApproved
										) >= 75}
										class:bg-amber-500={completionPct(report.metricTotal, report.metricApproved) >=
											50 && completionPct(report.metricTotal, report.metricApproved) < 75}
										class:bg-red-500={completionPct(report.metricTotal, report.metricApproved) <
											50 && report.metricTotal > 0}
										class:bg-surfaceHigh={report.metricTotal === 0}
										style="width: {completionPct(report.metricTotal, report.metricApproved)}%"
									></div>
								</div>
								<span class="flex-shrink-0 text-xs text-secondary">
									{report.metricApproved}/{report.metricTotal}
								</span>
							</div>
						</div>
						<!-- Tier badge -->
						<div class="flex flex-shrink-0 flex-col items-end gap-1">
							{#if report.currentTier}
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {tierColor(
										report.currentTier
									)}"
								>
									{report.currentTier}
								</span>
							{:else}
								<span class="rounded-full bg-surfaceHigh px-2 py-0.5 text-xs text-secondary">
									--
								</span>
							{/if}
							{#if report.currentScore != null}
								<span class="text-xs text-secondary">
									{report.currentScore.toFixed(1)}
								</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ── Snapshot Capture ─────────────────────────────────────────────── -->
	{#if data.directReportHealth.length > 0}
		<section class="mb-8">
			{#if form?.snapshotSuccess}
				<div
					class="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
					transition:fade={{ duration: 200 }}
				>
					{t(data.locale, 'team.snapshot_success')}
				</div>
			{/if}
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-medium text-primary">
						{t(data.locale, 'team.snapshot_heading')}
					</h2>
					<HelpTooltip text={t(data.locale, 'tooltip.team.snapshot')} />
				</div>
				<button
					type="button"
					onclick={() => (showSnapshotForm = !showSnapshotForm)}
					class="rounded-lg border border-accent1/50 bg-accent1/10 px-4 py-2 text-sm font-medium text-accent1 hover:bg-accent1/20"
				>
					{t(data.locale, 'leaders.capture_snapshot')}
				</button>
			</div>
			{#if showSnapshotForm}
				<div
					class="mt-4 rounded-lg border border-border bg-surfaceMid p-5"
					transition:slide={{ duration: 300 }}
				>
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
						<div class="grid gap-4 sm:grid-cols-3">
							<div>
								<label for="snap-node" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'team.snapshot_for')}
								</label>
								<select
									id="snap-node"
									name="nodeId"
									required
									bind:value={snapshotNodeId}
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
								>
									<option value="">— {t(data.locale, 'action.select')} —</option>
									{#each data.directReportHealth as report (report.id)}
										<option value={report.id}>{report.name}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="snap-cycle" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'leaders.cycle_label')}
								</label>
								<input
									id="snap-cycle"
									name="cycleLabel"
									type="text"
									required
									placeholder={t(data.locale, 'leaders.cycle_label_placeholder')}
									class="placeholder:text-tertiary w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
								/>
							</div>
							<div>
								<label for="snap-notes" class="mb-1 block text-xs font-medium text-secondary">
									{t(data.locale, 'performance.notes')}
								</label>
								<input
									id="snap-notes"
									name="notes"
									type="text"
									class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:outline-none"
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
		</section>
	{/if}

	<!-- ── View mode toggle ───────────────────────────────────────────── -->
	{#if data.subtree.length > 0}
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-medium text-primary">
				{t(data.locale, 'team.direct_reports')}
				<span class="ml-1 text-sm font-normal text-secondary">({data.subtree.length})</span>
			</h2>
			<div class="flex gap-1 rounded-lg bg-surfaceMid p-1">
				<button
					onclick={() => (viewMode = 'tree')}
					class="rounded-md px-3 py-1 text-sm transition-colors {viewMode === 'tree'
						? 'bg-accent2/15 text-accent2'
						: 'text-secondary hover:text-primary'}"
				>
					{t(data.locale, 'team.view.tree')}
				</button>
				<button
					onclick={() => (viewMode = 'list')}
					class="rounded-md px-3 py-1 text-sm transition-colors {viewMode === 'list'
						? 'bg-accent2/15 text-accent2'
						: 'text-secondary hover:text-primary'}"
				>
					{t(data.locale, 'team.view.list')}
				</button>
			</div>
		</div>

		<!-- ── Tree View ────────────────────────────────────────────────── -->
		{#if viewMode === 'tree'}
			<div class="space-y-1">
				{#each data.subtree as node (node.id)}
					<a
						href={href(`/app/leaders/${node.id}`)}
						class="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-surfaceMid"
						style="padding-left: {node.depth * 1.5 + 0.75}rem"
					>
						<div class="min-w-0 flex-1">
							<span class="font-medium text-primary">{node.name}</span>
							{#if node.title}
								<span class="ml-2 text-sm text-secondary">{node.title}</span>
							{/if}
						</div>
						<div class="flex flex-shrink-0 items-center gap-3">
							<!-- Completion -->
							{#if node.metricTotal > 0}
								<span class="text-xs text-secondary">
									{node.metricApproved}/{node.metricTotal}
								</span>
							{/if}
							<!-- Tier -->
							{#if node.compositeTier}
								<TierIndicator tier={node.compositeTier} locale={data.locale} size="sm" />
							{/if}
						</div>
					</a>
				{/each}
			</div>

			<!-- ── List View ────────────────────────────────────────────────── -->
		{:else}
			<div class="overflow-x-auto rounded-xl border border-border">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-border bg-surfaceMid text-xs text-secondary uppercase">
						<tr>
							<th class="px-4 py-3">
								<button onclick={() => toggleSort('name')} class="hover:text-primary">
									{t(data.locale, 'team.col.name')}
									{#if sortField === 'name'}{sortAsc ? '\u25B2' : '\u25BC'}{/if}
								</button>
							</th>
							<th class="px-4 py-3">{t(data.locale, 'team.col.type')}</th>
							<th class="px-4 py-3">
								<button onclick={() => toggleSort('tier')} class="hover:text-primary">
									{t(data.locale, 'team.tier_badge')}
									{#if sortField === 'tier'}{sortAsc ? '\u25B2' : '\u25BC'}{/if}
								</button>
							</th>
							<th class="px-4 py-3">
								<button onclick={() => toggleSort('completion')} class="hover:text-primary">
									{t(data.locale, 'team.completion')}
									{#if sortField === 'completion'}{sortAsc ? '\u25B2' : '\u25BC'}{/if}
								</button>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each sortedSubtree as node (node.id)}
							<tr class="transition-colors hover:bg-surfaceMid">
								<td class="px-4 py-3">
									<a href={href(`/app/leaders/${node.id}`)} class="hover:text-accent2">
										<span class="font-medium text-primary">{node.name}</span>
										{#if node.title}
											<span class="ml-1 text-secondary">- {node.title}</span>
										{/if}
									</a>
								</td>
								<td class="px-4 py-3 text-secondary capitalize"
									>{node.nodeType.replace('_', ' ')}</td
								>
								<td class="px-4 py-3">
									{#if node.compositeTier}
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {tierColor(
												node.compositeTier
											)}"
										>
											{node.compositeTier}
										</span>
									{:else}
										<span class="text-secondary">--</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									{#if node.metricTotal > 0}
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-16 overflow-hidden rounded-full bg-surfaceHigh">
												<div
													class="h-full rounded-full bg-accent2"
													style="width: {completionPct(node.metricTotal, node.metricApproved)}%"
												></div>
											</div>
											<span class="text-xs text-secondary">
												{completionPct(node.metricTotal, node.metricApproved)}%
											</span>
										</div>
									{:else}
										<span class="text-secondary">--</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		<!-- No reports -->
		<div class="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
			<p class="text-secondary">{t(data.locale, 'team.no_reports')}</p>
			<p class="mt-1 text-sm text-secondary">{t(data.locale, 'team.no_reports_description')}</p>
		</div>
	{/if}
</div>
