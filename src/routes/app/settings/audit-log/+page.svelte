<script lang="ts">
	/**
	 * Audit Log Viewer
	 *
	 * Paginated, filterable view of all audit log entries
	 * for the organization. Shows timestamp, actor, entity type,
	 * action, context, and value diffs.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	let entityTypeFilter = $state(data.filters.entityType ?? '');
	// svelte-ignore state_referenced_locally
	let actionFilter = $state(data.filters.action ?? '');
	// svelte-ignore state_referenced_locally
	let changedByFilter = $state(data.filters.changedBy ?? '');
	// svelte-ignore state_referenced_locally
	let dateFromFilter = $state(data.filters.dateFrom ?? '');
	// svelte-ignore state_referenced_locally
	let dateToFilter = $state(data.filters.dateTo ?? '');

	const ENTITY_TYPES = [
		'metric',
		'threshold',
		'weight',
		'score',
		'inquiry',
		'organization',
		'user',
		'node'
	];
	const ACTIONS = [
		'created',
		'updated',
		'deleted',
		'approved',
		'filed',
		'resolved',
		'dismissed',
		'deactivated',
		'bound',
		'unbound'
	];

	/**
	 * Apply current filters to the URL and navigate
	 */
	function applyFilters() {
		const params = new SvelteURLSearchParams();
		if (entityTypeFilter) params.set('entity_type', entityTypeFilter);
		if (actionFilter) params.set('action', actionFilter);
		if (changedByFilter) params.set('changed_by', changedByFilter);
		if (dateFromFilter) params.set('date_from', dateFromFilter);
		if (dateToFilter) params.set('date_to', dateToFilter);

		goto(`/app/settings/audit-log?${params.toString()}`, { invalidateAll: true });
	}

	/**
	 * Clear all filters
	 */
	function clearFilters() {
		entityTypeFilter = '';
		actionFilter = '';
		changedByFilter = '';
		dateFromFilter = '';
		dateToFilter = '';

		goto('/app/settings/audit-log', { invalidateAll: true });
	}

	/**
	 * Navigate to a specific page
	 */
	function goToPage(page: number) {
		const params = new SvelteURLSearchParams(window.location.search);
		params.set('page', String(page));

		goto(`/app/settings/audit-log?${params.toString()}`, { invalidateAll: true });
	}

	/**
	 * Format a JSON value for display
	 */
	function formatValue(val: Record<string, unknown> | null): string {
		if (!val) return '—';
		return JSON.stringify(val, null, 2);
	}

	/**
	 * Format date for display
	 */
	function formatDate(d: string): string {
		return new Date(d).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{t(data.locale, 'audit.title')} | {data.organization.name}</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-6 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-xl font-medium text-primary">{t(data.locale, 'audit.title')}</h1>
			<p class="mt-1 text-sm text-secondary">
				{t(data.locale, 'audit.description', { count: String(data.totalCount) })}
			</p>
		</div>
		{#if data.canExport}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/app/api/audit-export?{new URLSearchParams(
					Object.entries(data.filters)
						.filter(([_k, v]) => v !== null)
						.map(([k, v]) => [
							k === 'entityType'
								? 'entity_type'
								: k === 'dateFrom'
									? 'date_from'
									: k === 'dateTo'
										? 'date_to'
										: k === 'changedBy'
											? 'changed_by'
											: k,
							v ?? ''
						])
				).toString()}&format=csv"
				class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
			>
				{t(data.locale, 'audit.export')}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</div>

	<!-- Filters -->
	<div class="mb-6 rounded-lg border border-border bg-surfaceMid p-4">
		<div class="grid gap-3 sm:grid-cols-5">
			<div>
				<label for="filter-entity" class="mb-1 block text-xs font-medium text-secondary">
					{t(data.locale, 'audit.filter_entity')}
				</label>
				<select
					id="filter-entity"
					bind:value={entityTypeFilter}
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				>
					<option value="">{t(data.locale, 'common.all')}</option>
					{#each ENTITY_TYPES as et (et)}
						<option value={et}>{et}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="filter-action" class="mb-1 block text-xs font-medium text-secondary">
					{t(data.locale, 'audit.filter_action')}
				</label>
				<select
					id="filter-action"
					bind:value={actionFilter}
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				>
					<option value="">{t(data.locale, 'common.all')}</option>
					{#each ACTIONS as a (a)}
						<option value={a}>{a}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="filter-user" class="mb-1 block text-xs font-medium text-secondary">
					{t(data.locale, 'audit.filter_user')}
				</label>
				<select
					id="filter-user"
					bind:value={changedByFilter}
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				>
					<option value="">{t(data.locale, 'common.all')}</option>
					{#each data.availableUsers as u (u.id)}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="filter-from" class="mb-1 block text-xs font-medium text-secondary">
					{t(data.locale, 'audit.filter_date')}
				</label>
				<input
					id="filter-from"
					type="date"
					bind:value={dateFromFilter}
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				/>
			</div>
			<div>
				<label for="filter-to" class="mb-1 block text-xs font-medium text-secondary">
					&nbsp;
				</label>
				<input
					id="filter-to"
					type="date"
					bind:value={dateToFilter}
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				/>
			</div>
		</div>
		<div class="mt-3 flex gap-2">
			<button
				onclick={applyFilters}
				class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
			>
				{t(data.locale, 'action.apply')}
			</button>
			<button
				onclick={clearFilters}
				class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary hover:bg-surfaceHigh"
			>
				{t(data.locale, 'action.clear')}
			</button>
		</div>
	</div>

	<!-- Entries table -->
	{#if data.entries.length === 0}
		<div class="rounded-lg border border-border bg-surfaceMid p-8 text-center text-secondary">
			{t(data.locale, 'audit.no_entries')}
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-border">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border bg-surfaceMid">
					<tr>
						<th class="px-4 py-3 text-xs font-medium text-secondary"
							>{t(data.locale, 'audit.col_date')}</th
						>
						<th class="px-4 py-3 text-xs font-medium text-secondary"
							>{t(data.locale, 'audit.col_actor')}</th
						>
						<th class="px-4 py-3 text-xs font-medium text-secondary"
							>{t(data.locale, 'audit.filter_entity')}</th
						>
						<th class="px-4 py-3 text-xs font-medium text-secondary"
							>{t(data.locale, 'audit.filter_action')}</th
						>
						<th class="px-4 py-3 text-xs font-medium text-secondary"
							>{t(data.locale, 'audit.col_context')}</th
						>
						<th class="px-4 py-3 text-xs font-medium text-secondary"
							>{t(data.locale, 'audit.col_changes')}</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.entries as entry (entry.id)}
						<tr class="hover:bg-surfaceHigh/50">
							<td class="px-4 py-3 text-xs whitespace-nowrap text-secondary">
								{formatDate(entry.createdAt)}
							</td>
							<td class="px-4 py-3">
								<div class="text-sm text-primary">{entry.changedByName ?? '—'}</div>
							</td>
							<td class="px-4 py-3 text-xs text-secondary capitalize">{entry.entityType}</td>
							<td class="px-4 py-3">
								<span
									class="rounded-full bg-surfaceMid px-2 py-0.5 text-xs font-medium text-secondary"
								>
									{entry.action}
								</span>
							</td>
							<td class="max-w-[200px] truncate px-4 py-3 text-xs text-secondary">
								{entry.context ?? '—'}
							</td>
							<td class="px-4 py-3">
								{#if entry.previousValue || entry.newValue}
									<details class="text-xs">
										<summary class="cursor-pointer text-accent1"
											>{t(data.locale, 'audit.view_diff')}</summary
										>
										<div class="mt-2 grid gap-2 sm:grid-cols-2">
											{#if entry.previousValue}
												<div>
													<span class="font-medium text-secondary"
														>{t(data.locale, 'audit.previous_value')}</span
													>
													<pre
														class="mt-1 max-h-32 overflow-auto rounded bg-surface p-2 text-[11px] text-secondary">{formatValue(
															entry.previousValue
														)}</pre>
												</div>
											{/if}
											{#if entry.newValue}
												<div>
													<span class="font-medium text-secondary"
														>{t(data.locale, 'audit.new_value')}</span
													>
													<pre
														class="mt-1 max-h-32 overflow-auto rounded bg-surface p-2 text-[11px] text-secondary">{formatValue(
															entry.newValue
														)}</pre>
												</div>
											{/if}
										</div>
									</details>
								{:else}
									<span class="text-xs text-secondary">—</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="mt-4 flex items-center justify-between">
				<span class="text-xs text-secondary">
					{t(data.locale, 'audit.page_info', {
						page: String(data.page),
						total: String(data.totalPages)
					})}
				</span>
				<div class="flex gap-1">
					{#if data.page > 1}
						<button
							onclick={() => goToPage(data.page - 1)}
							class="rounded border border-border px-3 py-1 text-sm text-secondary hover:bg-surfaceHigh"
						>
							&laquo;
						</button>
					{/if}
					{#if data.page < data.totalPages}
						<button
							onclick={() => goToPage(data.page + 1)}
							class="rounded border border-border px-3 py-1 text-sm text-secondary hover:bg-surfaceHigh"
						>
							&raquo;
						</button>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
