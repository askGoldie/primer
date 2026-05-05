<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Admin Accounts Page
	 *
	 * Lists all user accounts.
	 */
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(data.locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Accounts | Admin | Primer</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">Accounts</h1>
		<p class="mt-1 text-secondary">
			{data.stats.total} total, {data.stats.verified} verified, {data.stats.licensed} licensed
		</p>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Total Accounts</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.total}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">Email Verified</div>
			<div class="mt-1 text-3xl font-bold text-primary">{data.stats.verified}</div>
		</div>
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			<div class="text-sm text-secondary">With License</div>
			<div class="mt-1 text-3xl font-bold text-accent2">{data.stats.licensed}</div>
		</div>
	</div>

	<!-- Accounts table -->
	<div class="rounded-lg border border-border bg-surfaceMid">
		<table class="w-full">
			<thead>
				<tr class="border-b border-border text-left text-sm font-medium text-secondary">
					<th scope="col" class="p-4">Name</th>
					<th scope="col" class="p-4">Email</th>
					<th scope="col" class="p-4">Status</th>
					<th scope="col" class="p-4">License</th>
					<th scope="col" class="p-4">Created</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each data.accounts as account (account.id)}
					<tr
						class="hover:bg-surfaceHigh {account.deactivatedAt ? 'opacity-50' : ''}"
						aria-disabled={account.deactivatedAt ? 'true' : undefined}
					>
						<td class="p-4">
							<span class="font-medium text-primary">{account.name}</span>
							{#if account.isAdmin}
								<span
									class="ml-2 rounded-full bg-accent1/10 px-2 py-0.5 text-xs font-medium text-accent1"
									>Admin</span
								>
							{/if}
						</td>
						<td class="p-4 text-sm text-secondary">{account.email}</td>
						<td class="p-4">
							{#if account.deactivatedAt}
								<span class="bg-alarm/10 text-alarm rounded-full px-2 py-0.5 text-xs font-medium"
									>Deactivated</span
								>
							{:else if account.emailVerified}
								<span
									class="rounded-full bg-accent2/10 px-2 py-0.5 text-xs font-medium text-accent2"
									>Verified</span
								>
							{:else}
								<span
									class="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500"
									>Pending</span
								>
							{/if}
						</td>
						<td class="p-4">
							{#if account.license}
								<span
									class="rounded-full bg-accent2/10 px-2 py-0.5 text-xs font-medium text-accent2"
								>
									{account.license.status}
								</span>
							{:else}
								<span class="text-sm text-secondary">-</span>
							{/if}
						</td>
						<td class="p-4 text-sm text-secondary">{formatDate(account.createdAt)}</td>
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
