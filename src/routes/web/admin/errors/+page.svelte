<script lang="ts">
	/**
	 * Admin Errors Page
	 *
	 * All error events across the system.
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
			minute: '2-digit',
			second: '2-digit'
		});
	}

	/**
	 * Get source color classes
	 */
	function getSourceClasses(source: string): string {
		switch (source) {
			case 'purchase':
				return 'bg-accent1/10 text-accent1';
			case 'download':
				return 'bg-accent2/10 text-accent2';
			case 'account':
				return 'bg-amber-500/10 text-amber-500';
			default:
				return 'bg-secondary/10 text-secondary';
		}
	}
</script>

<svelte:head>
	<title>Errors | Admin | Primer</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">Errors</h1>
		<p class="mt-1 text-secondary">
			{data.stats.total} total errors across all systems
		</p>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-4 sm:grid-cols-4">
		<div class="border-alarm/20 bg-alarm/5 rounded-lg border p-4">
			<div class="text-alarm/80 text-sm">Total Errors</div>
			<div class="text-alarm mt-1 text-3xl font-bold">{data.stats.total}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Purchase Errors</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.bySource.purchase}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Download Errors</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.bySource.download}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Account Errors</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.bySource.account}</div>
		</div>
	</div>

	<!-- Errors list -->
	{#if data.errors.length > 0}
		<div class="space-y-3">
			{#each data.errors as error (error.id)}
				<div class="border-alarm/20 bg-alarm/5 rounded-lg border p-4">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {getSourceClasses(
									error.source
								)}"
							>
								{error.source}
							</span>
							<span class="text-alarm text-sm font-medium">{error.eventType}</span>
						</div>
						<span class="text-xs text-secondary">{formatDate(error.createdAt)}</span>
					</div>
					<p class="mt-2 font-mono text-sm text-primary">{error.errorDetail}</p>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
			<svg
				class="mx-auto h-12 w-12 text-accent2"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<p class="mt-4 text-secondary">No errors recorded. Everything is running smoothly!</p>
		</div>
	{/if}
</div>
