<script lang="ts">
	/**
	 * Inquiries Page
	 *
	 * Lists all inquiries and provides interface to file new ones.
	 * Self-inquiries challenge your own metrics.
	 * Peer inquiries challenge metrics that affect you.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { fade } from 'svelte/transition';

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

	/**
	 * Get status color classes
	 */
	function getStatusClasses(status: string): string {
		switch (status) {
			case 'filed':
				return 'bg-accent1/10 text-accent1';
			case 'under_review':
				return 'bg-amber-500/10 text-amber-500';
			case 'resolved':
				return 'bg-accent2/10 text-accent2';
			case 'dismissed':
				return 'bg-secondary/10 text-secondary';
			default:
				return 'bg-secondary/10 text-secondary';
		}
	}

	let filterStatus = $state<string>('all');
	let filterType = $state<string>('all');

	const filteredInquiries = $derived(
		data.inquiries.filter((inquiry) => {
			if (filterStatus !== 'all' && inquiry.status !== filterStatus) return false;
			if (filterType !== 'all' && inquiry.type !== filterType) return false;
			return true;
		})
	);
</script>

<svelte:head>
	<title>{t(data.locale, 'nav.inquiries')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8 flex items-start justify-between">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-medium text-primary">
					{t(data.locale, 'nav.inquiries')}
				</h1>
				<HelpTooltip text={t(data.locale, 'tooltip.inquiries.overview')} />
			</div>
			<p class="mt-1 text-secondary">{t(data.locale, 'inquiry.subtitle')}</p>
		</div>

		{#if data.canFileInquiry}
			<a href={resolve('/app/inquiries/new')} class="btn-primary px-4 py-2">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{t(data.locale, 'inquiry.file')}
			</a>
		{/if}
	</div>

	<!-- Filters -->
	<div class="mb-6 flex gap-4">
		<select
			bind:value={filterStatus}
			class="rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
		>
			<option value="all">{t(data.locale, 'inquiry.filter.all_statuses')}</option>
			<option value="filed">{t(data.locale, 'inquiry.status.filed')}</option>
			<option value="under_review">{t(data.locale, 'inquiry.status.under_review')}</option>
			<option value="resolved">{t(data.locale, 'inquiry.status.resolved')}</option>
			<option value="dismissed">{t(data.locale, 'inquiry.status.dismissed')}</option>
		</select>

		<select
			bind:value={filterType}
			class="rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
		>
			<option value="all">{t(data.locale, 'inquiry.filter.all_types')}</option>
			<option value="self">{t(data.locale, 'inquiry.self')}</option>
			<option value="peer">{t(data.locale, 'inquiry.peer')}</option>
		</select>
	</div>

	<!-- Inquiries list -->
	{#if filteredInquiries.length > 0}
		<div class="space-y-4">
			{#each filteredInquiries as inquiry (inquiry.id)}
				<a
					href={resolve(`/app/inquiries/${inquiry.id}`)}
					class="block rounded-lg border border-border bg-surfaceMid p-4 transition-colors hover:border-accent1/50"
				>
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<span class="font-medium text-primary">
									{t(data.locale, `inquiry.challenge.${inquiry.challengeType}`)}
								</span>
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusClasses(
										inquiry.status
									)}"
								>
									{t(data.locale, `inquiry.status.${inquiry.status}`)}
								</span>
								<span
									class="rounded-full bg-surfaceHigh px-2 py-0.5 text-xs font-medium text-secondary capitalize"
								>
									{inquiry.type}
								</span>
							</div>

							<p class="mt-2 text-sm text-secondary">
								{t(data.locale, 'inquiry.target_metric')}:
								<span class="text-primary">{inquiry.targetMetric.name}</span>
							</p>

							<p class="mt-1 line-clamp-2 text-sm text-secondary">
								{inquiry.rationale}
							</p>
						</div>

						<div class="text-right text-sm text-secondary">
							<div>{formatDate(inquiry.filedAt)}</div>
							<div class="mt-1">{inquiry.filedBy.name}</div>
						</div>
					</div>

					{#if inquiry.resolutionSummary}
						<div class="mt-3 rounded-lg bg-surfaceHigh p-3">
							<div class="flex items-center gap-2 text-xs text-secondary">
								<span class="font-medium"
									>{t(data.locale, `inquiry.resolution.${inquiry.resolutionAction}`)}</span
								>
								{#if inquiry.resolvedAt}
									<span>•</span>
									<span>{formatDate(inquiry.resolvedAt)}</span>
								{/if}
							</div>
							<p class="mt-1 text-sm text-primary">{inquiry.resolutionSummary}</p>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{:else}
		<div
			in:fade={{ duration: 300 }}
			class="rounded-lg border border-dashed border-border bg-surface p-8 text-center"
		>
			<svg
				class="mx-auto h-12 w-12 text-secondary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<p class="mt-4 text-secondary">{t(data.locale, 'inquiry.no_results')}</p>
			{#if data.canFileInquiry}
				<a
					href={resolve('/app/inquiries/new')}
					class="mt-4 inline-flex items-center gap-2 text-sm text-accent1 hover:underline"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					{t(data.locale, 'inquiry.file')}
				</a>
			{/if}
		</div>
	{/if}
</div>
