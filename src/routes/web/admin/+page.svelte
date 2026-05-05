<script lang="ts">
	/**
	 * Admin Dashboard Page
	 *
	 * Overview with funnel metrics and recent activity.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { AnimatedCounter } from '$lib/components/animations/index.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString(data.locale, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * Calculate conversion rate
	 */
	function conversionRate(numerator: number, denominator: number): string {
		if (denominator === 0) return '0%';
		return ((numerator / denominator) * 100).toFixed(1) + '%';
	}
</script>

<svelte:head>
	<title>Admin Dashboard | Primer</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">Admin Dashboard</h1>
		<p class="mt-1 text-secondary">Last 30 days activity</p>
	</div>

	<!-- Funnel metrics -->
	<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Narrative Starts</div>
			<div class="mt-1 text-3xl font-bold text-primary">
				<AnimatedCounter value={data.funnel.narrativeStarts} delay={0} />
			</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Narrative Completes</div>
			<div class="mt-1 text-3xl font-bold text-primary">
				<AnimatedCounter value={data.funnel.narrativeCompletes} delay={100} />
			</div>
			<div class="mt-1 text-xs text-secondary">
				{conversionRate(data.funnel.narrativeCompletes, data.funnel.narrativeStarts)} completion
			</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Account Creations</div>
			<div class="mt-1 text-3xl font-bold text-primary">
				<AnimatedCounter value={data.funnel.accountCreations} delay={200} />
			</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Purchases</div>
			<div class="mt-1 text-3xl font-bold text-accent2">
				<AnimatedCounter value={data.funnel.purchases} delay={300} />
			</div>
			<div class="mt-1 text-xs text-secondary">
				{conversionRate(data.funnel.purchases, data.funnel.accountCreations)} conversion
			</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Downloads</div>
			<div class="mt-1 text-3xl font-bold text-primary">
				<AnimatedCounter value={data.funnel.downloads} delay={400} />
			</div>
		</div>
	</div>

	<!-- Totals -->
	<div class="mb-8 grid gap-4 sm:grid-cols-2">
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Total Users</div>
			<div class="mt-1 text-2xl font-bold text-primary">
				<AnimatedCounter value={data.totals.users} delay={500} />
			</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Total Licenses Sold</div>
			<div class="mt-1 text-2xl font-bold text-accent2">
				<AnimatedCounter value={data.totals.licenses} delay={600} />
			</div>
			<div class="mt-1 text-xs text-secondary">
				<AnimatedCounter value={data.totals.licenses * 5000} delay={700} prefix="$" /> total revenue
			</div>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent narrative events -->
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="flex items-center justify-between">
				<h2 class="font-medium text-primary">Recent Narrative Events</h2>
				<a href={resolve('/web/admin/narrative')} class="text-sm text-accent1 hover:underline"
					>View all</a
				>
			</div>
			<div class="mt-4 max-h-64 overflow-auto">
				<table class="w-full text-sm">
					<thead class="text-left text-secondary">
						<tr>
							<th class="pb-2">Session</th>
							<th class="pb-2">Event</th>
							<th class="pb-2">Time</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.recent.narrativeEvents as event (event.id)}
							<tr>
								<td class="py-2 font-mono text-xs text-secondary">{event.sessionId}</td>
								<td class="py-2 text-primary">
									{event.eventType}
									{#if event.eventValue}
										<span class="text-secondary">({event.eventValue})</span>
									{/if}
								</td>
								<td class="py-2 text-secondary">{formatDate(event.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Recent purchase events -->
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="flex items-center justify-between">
				<h2 class="font-medium text-primary">Recent Purchase Events</h2>
				<a href={resolve('/web/admin/purchases')} class="text-sm text-accent1 hover:underline"
					>View all</a
				>
			</div>
			<div class="mt-4 max-h-64 overflow-auto">
				<table class="w-full text-sm">
					<thead class="text-left text-secondary">
						<tr>
							<th class="pb-2">Event</th>
							<th class="pb-2">Email</th>
							<th class="pb-2">Time</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.recent.purchaseEvents as event (event.id)}
							<tr>
								<td class="py-2">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {event.eventType ===
										'purchase_completed'
											? 'bg-accent2/10 text-accent2'
											: event.eventType.includes('error')
												? 'bg-alarm/10 text-alarm'
												: 'bg-secondary/10 text-secondary'}"
									>
										{event.eventType}
									</span>
								</td>
								<td class="py-2 text-primary">{event.email || '-'}</td>
								<td class="py-2 text-secondary">{formatDate(event.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Errors -->
	{#if data.recent.errors.length > 0}
		<div class="border-alarm/20 bg-alarm/5 mt-6 rounded-lg border p-4">
			<div class="flex items-center justify-between">
				<h2 class="text-alarm font-medium">Recent Errors</h2>
				<a href={resolve('/web/admin/errors')} class="text-alarm text-sm hover:underline"
					>View all</a
				>
			</div>
			<div class="mt-4">
				<table class="w-full text-sm">
					<tbody class="divide-alarm/10 divide-y">
						{#each data.recent.errors as error (error.id)}
							<tr>
								<td class="text-alarm py-2">{error.eventType}</td>
								<td class="py-2 text-primary">{error.errorDetail}</td>
								<td class="py-2 text-secondary">{formatDate(error.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
