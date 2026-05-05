<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Admin Downloads Page
	 *
	 * Download activity tracking.
	 */
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString(data.locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Downloads | Admin | Primer</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">Downloads</h1>
		<p class="mt-1 text-secondary">
			{data.stats.totalDownloads} total downloads by {data.stats.uniqueUsers} unique users
		</p>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Total Downloads</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.totalDownloads}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Unique Users</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.uniqueUsers}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">By Version</div>
			<div class="mt-2 space-y-1">
				{#each data.stats.versionBreakdown as item (item.version)}
					<div class="flex items-center justify-between text-sm">
						<span class="text-primary">v{item.version}</span>
						<span class="font-mono text-secondary">{item.count}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Downloads table -->
	<div class="rounded-lg border border-border bg-surfaceMid">
		<table class="w-full">
			<thead>
				<tr class="border-b border-border text-left text-sm font-medium text-secondary">
					<th class="p-4">User</th>
					<th class="p-4">Email</th>
					<th class="p-4">Version</th>
					<th class="p-4">Status</th>
					<th class="p-4">Time</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each data.events as event (event.id)}
					<tr class="hover:bg-surfaceHigh">
						<td class="p-4 font-medium text-primary">{event.userName}</td>
						<td class="p-4 text-sm text-secondary">{event.userEmail}</td>
						<td class="p-4 text-sm text-primary">v{event.version}</td>
						<td class="p-4">
							{#if event.errorDetail}
								<span class="bg-alarm/10 text-alarm rounded-full px-2 py-0.5 text-xs font-medium">
									Error
								</span>
							{:else}
								<span
									class="rounded-full bg-accent2/10 px-2 py-0.5 text-xs font-medium text-accent2"
								>
									{event.eventType}
								</span>
							{/if}
						</td>
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
