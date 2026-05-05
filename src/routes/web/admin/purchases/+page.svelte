<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Admin Purchases Page
	 *
	 * Purchase events and license history.
	 */
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let viewMode = $state<'events' | 'licenses'>('licenses');

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

	/**
	 * Format currency
	 */
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
	}
</script>

<svelte:head>
	<title>Purchases | Admin | Primer</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-medium text-primary">Purchases</h1>
			<p class="mt-1 text-secondary">
				{data.stats.completed} inquiries submitted, {formatCurrency(data.stats.totalRevenue)} total revenue
			</p>
		</div>

		<!-- View toggle -->
		<div
			class="flex rounded-lg border border-border bg-surface p-1"
			role="group"
			aria-label="View mode"
		>
			<button
				type="button"
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {viewMode === 'licenses'
					? 'bg-surfaceMid text-primary'
					: 'text-secondary hover:text-primary'}"
				onclick={() => (viewMode = 'licenses')}
				aria-pressed={viewMode === 'licenses'}
			>
				Licenses
			</button>
			<button
				type="button"
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {viewMode === 'events'
					? 'bg-surfaceMid text-primary'
					: 'text-secondary hover:text-primary'}"
				onclick={() => (viewMode = 'events')}
				aria-pressed={viewMode === 'events'}
			>
				Events
			</button>
		</div>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Total Revenue</div>
			<div class="mt-1 text-3xl font-bold text-accent2">
				{formatCurrency(data.stats.totalRevenue)}
			</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Licenses Sold</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.licenses.length}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Purchase Events</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.totalEvents}</div>
		</div>
	</div>

	{#if viewMode === 'licenses'}
		<!-- Licenses table -->
		<div class="rounded-lg border border-border bg-surfaceMid">
			<table class="w-full">
				<thead>
					<tr class="border-b border-border text-left text-sm font-medium text-secondary">
						<th scope="col" class="p-4">License ID</th>
						<th scope="col" class="p-4">Customer</th>
						<th scope="col" class="p-4">Email</th>
						<th scope="col" class="p-4">Status</th>
						<th scope="col" class="p-4">Purchased</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.licenses as license (license.id)}
						<tr class="hover:bg-surfaceHigh">
							<td class="p-4 font-mono text-xs text-secondary">{license.id.substring(0, 8)}...</td>
							<td class="p-4 font-medium text-primary">{license.userName}</td>
							<td class="p-4 text-sm text-secondary">{license.userEmail}</td>
							<td class="p-4">
								<span
									class="rounded-full bg-accent2/10 px-2 py-0.5 text-xs font-medium text-accent2"
								>
									{license.status}
								</span>
							</td>
							<td class="p-4 text-sm text-secondary">{formatDate(license.purchasedAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<!-- Events table -->
		<div class="rounded-lg border border-border bg-surfaceMid">
			<table class="w-full">
				<thead>
					<tr class="border-b border-border text-left text-sm font-medium text-secondary">
						<th scope="col" class="p-4">Event</th>
						<th scope="col" class="p-4">Email</th>
						<th scope="col" class="p-4">Error</th>
						<th scope="col" class="p-4">Time</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.events as event (event.id)}
						<tr class="hover:bg-surfaceHigh">
							<td class="p-4">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {event.eventType ===
									'license_granted'
										? 'bg-accent2/10 text-accent2'
										: event.eventType.includes('error') || event.eventType.includes('failed')
											? 'bg-alarm/10 text-alarm'
											: 'bg-secondary/10 text-secondary'}"
								>
									{event.eventType}
								</span>
							</td>
							<td class="p-4 text-sm text-primary">{event.email || '-'}</td>
							<td class="text-alarm p-4 text-sm">{event.errorDetail || '-'}</td>
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
	{/if}
</div>
