<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Admin Narrative Events Page
	 *
	 * Detailed view of narrative walkthrough events.
	 */
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString(data.locale, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Narrative Events | Admin | Primer</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">Narrative Events</h1>
		<p class="mt-1 text-secondary">
			{data.stats.uniqueSessions} unique sessions, {data.pagination.total} total events
		</p>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Event type breakdown -->
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<h2 class="text-sm font-medium text-secondary">Events by Type</h2>
			<div class="mt-3 space-y-2">
				{#each data.stats.eventBreakdown as item (item.type)}
					<div class="flex items-center justify-between">
						<span class="text-sm text-primary">{item.type}</span>
						<span class="font-mono text-sm text-secondary">{item.count}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Locale breakdown -->
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<h2 class="text-sm font-medium text-secondary">Events by Locale</h2>
			<div class="mt-3 space-y-2">
				{#each data.stats.localeBreakdown as item (item.locale)}
					<div class="flex items-center justify-between">
						<span class="text-sm text-primary">{item.locale}</span>
						<span class="font-mono text-sm text-secondary">{item.count}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Events table -->
	<div class="rounded-lg border border-border bg-surfaceMid">
		<table class="w-full">
			<thead>
				<tr class="border-b border-border text-left text-sm font-medium text-secondary">
					<th class="p-4">Session</th>
					<th class="p-4">Event</th>
					<th class="p-4">Value</th>
					<th class="p-4">Locale</th>
					<th class="p-4">Time</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each data.events as event (event.id)}
					<tr class="hover:bg-surfaceHigh">
						<td class="p-4 font-mono text-xs text-secondary"
							>{event.sessionId.substring(0, 12)}...</td
						>
						<td class="p-4">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {event.eventType === 'complete'
									? 'bg-accent2/10 text-accent2'
									: event.eventType === 'start'
										? 'bg-accent1/10 text-accent1'
										: 'bg-secondary/10 text-secondary'}"
							>
								{event.eventType}
							</span>
						</td>
						<td class="p-4 text-sm text-primary">{event.eventValue || '-'}</td>
						<td class="p-4 text-sm text-secondary">{event.locale}</td>
						<td class="p-4 text-sm text-secondary">{formatDate(event.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="mt-4 flex items-center justify-between">
			<span class="text-sm text-secondary">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</span>
			<div class="flex gap-2">
				{#if data.pagination.page > 1}
					<a
						href={href(`?page=${data.pagination.page - 1}`)}
						class="rounded-lg border border-border px-3 py-1.5 text-sm text-secondary hover:bg-surfaceHigh"
					>
						Previous
					</a>
				{/if}
				{#if data.pagination.page < data.pagination.totalPages}
					<a
						href={href(`?page=${data.pagination.page + 1}`)}
						class="rounded-lg border border-border px-3 py-1.5 text-sm text-secondary hover:bg-surfaceHigh"
					>
						Next
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
