<script lang="ts">
	/**
	 * Inquiry Detail Page
	 *
	 * Shows full inquiry details, comments, and resolution interface.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { fade, slide } from 'svelte/transition';

	let { data }: { data: PageData } = $props();

	let showResolveForm = $state(false);

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(data.locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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
</script>

<svelte:head>
	<title
		>{t(data.locale, `inquiry.challenge.${data.inquiry.challengeType}`)} | {data.organization
			.name}</title
	>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<a href={resolve('/app/inquiries')} class="text-sm text-secondary hover:text-primary">
			← {t(data.locale, 'action.back')}
		</a>

		<div class="mt-2 flex items-center gap-3">
			<h1 class="text-2xl font-medium text-primary">
				{t(data.locale, `inquiry.challenge.${data.inquiry.challengeType}`)}
			</h1>
			<span
				class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusClasses(data.inquiry.status)}"
			>
				{t(data.locale, `inquiry.status.${data.inquiry.status}`)}
			</span>
			<span
				class="rounded-full bg-surfaceHigh px-2 py-0.5 text-xs font-medium text-secondary capitalize"
			>
				{data.inquiry.type}
			</span>
		</div>
	</div>

	<div class="mx-auto max-w-3xl">
		<!-- Main content -->
		<div class="rounded-lg border border-border bg-surfaceMid p-6">
			<!-- Metadata -->
			<div class="flex flex-wrap gap-6 text-sm">
				<div>
					<span class="text-secondary">{t(data.locale, 'inquiry.target_metric')}:</span>
					<span class="ml-1 font-medium text-primary">{data.targetMetric.name}</span>
				</div>
				<div>
					<span class="text-secondary">{t(data.locale, 'inquiry.filed_by', { name: '' })}:</span>
					<span class="ml-1 font-medium text-primary">{data.filedBy.name}</span>
					{#if data.filedByNode.title}
						<span class="text-secondary">({data.filedByNode.title})</span>
					{/if}
				</div>
				<div>
					<span class="text-secondary">{t(data.locale, 'inquiry.filed_on', { date: '' })}:</span>
					<span class="ml-1 font-medium text-primary">{formatDate(data.inquiry.filedAt)}</span>
				</div>
			</div>

			<!-- Rationale -->
			<div class="mt-6">
				<h3 class="text-sm font-medium tracking-wider text-secondary uppercase">
					{t(data.locale, 'inquiry.rationale')}
				</h3>
				<p class="mt-2 whitespace-pre-wrap text-primary">
					{data.inquiry.rationale}
				</p>
			</div>

			<!-- Resolution (if resolved) -->
			{#if data.inquiry.resolutionSummary}
				<div in:fade={{ duration: 200 }} class="mt-6 rounded-lg bg-surfaceHigh p-4">
					<div class="flex items-center gap-2 text-sm">
						<span class="font-medium text-accent2">
							{t(data.locale, `inquiry.resolution.${data.inquiry.resolutionAction}`)}
						</span>
						{#if data.inquiry.resolvedAt}
							<span class="text-secondary">•</span>
							<span class="text-secondary">{formatDate(data.inquiry.resolvedAt)}</span>
						{/if}
					</div>
					<p class="mt-2 text-primary">{data.inquiry.resolutionSummary}</p>
				</div>
			{/if}

			<!-- Resolution form -->
			{#if data.canResolve}
				<div class="mt-6 border-t border-border pt-6">
					{#if !showResolveForm}
						<div transition:fade={{ duration: 200 }} class="flex items-center gap-3">
							<button
								type="button"
								class="rounded-lg bg-accent2 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent2/90"
								onclick={() => (showResolveForm = true)}
							>
								{t(data.locale, 'inquiry.resolve')}
							</button>
							<HelpTooltip text={t(data.locale, 'tooltip.inquiries.resolve')} />
							<form method="POST" action="?/dismiss" use:enhance>
								<button
									type="submit"
									class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surfaceHigh"
								>
									{t(data.locale, 'inquiry.dismiss')}
								</button>
							</form>
						</div>
					{:else}
						<form transition:slide={{ duration: 300 }} method="POST" action="?/resolve" use:enhance>
							<h3 class="text-sm font-medium text-primary">
								{t(data.locale, 'inquiry.resolve_title')}
							</h3>

							<fieldset class="mt-4">
								<legend class="block text-sm font-medium text-primary"
									>{t(data.locale, 'inquiry.resolution_label')}</legend
								>
								<div class="mt-2 space-y-2">
									<label class="flex items-center gap-2">
										<input
											type="radio"
											name="resolutionAction"
											value="adjusted"
											required
											class="h-4 w-4 border-border text-accent1"
										/>
										<span class="text-primary">{t(data.locale, 'inquiry.resolution.adjusted')}</span
										>
										<span class="text-sm text-secondary"
											>- {t(data.locale, 'inquiry.resolution.adjusted_hint')}</span
										>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="radio"
											name="resolutionAction"
											value="no_change"
											class="h-4 w-4 border-border text-accent1"
										/>
										<span class="text-primary"
											>{t(data.locale, 'inquiry.resolution.no_change')}</span
										>
										<span class="text-sm text-secondary"
											>- {t(data.locale, 'inquiry.resolution.no_change_hint')}</span
										>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="radio"
											name="resolutionAction"
											value="deferred"
											class="h-4 w-4 border-border text-accent1"
										/>
										<span class="text-primary">{t(data.locale, 'inquiry.resolution.deferred')}</span
										>
										<span class="text-sm text-secondary"
											>- {t(data.locale, 'inquiry.resolution.deferred_hint')}</span
										>
									</label>
								</div>
							</fieldset>

							<div class="mt-4">
								<label for="resolutionSummary" class="block text-sm font-medium text-primary">
									{t(data.locale, 'inquiry.resolution_summary')}
								</label>
								<textarea
									id="resolutionSummary"
									name="resolutionSummary"
									rows="3"
									required
									placeholder={t(data.locale, 'inquiry.resolution_placeholder')}
									class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
								></textarea>
							</div>

							<div class="mt-4 flex gap-2">
								<button
									type="button"
									class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surfaceHigh"
									onclick={() => (showResolveForm = false)}
								>
									{t(data.locale, 'action.cancel')}
								</button>
								<button
									type="submit"
									class="rounded-lg bg-accent2 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent2/90"
								>
									{t(data.locale, 'inquiry.submit_resolution')}
								</button>
							</div>
						</form>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Comments -->
		<div class="mt-6 rounded-lg border border-border bg-surfaceMid p-6">
			<h2 class="text-lg font-medium text-primary">
				{t(data.locale, 'inquiry.comments', { count: String(data.comments.length) })}
			</h2>

			{#if data.comments.length > 0}
				<div class="mt-4 space-y-4">
					{#each data.comments as comment (comment.id)}
						<div class="border-b border-border pb-4 last:border-0 last:pb-0">
							<div class="flex items-center gap-2 text-sm">
								<span class="font-medium text-primary">{comment.author.name}</span>
								<span class="text-secondary">•</span>
								<span class="text-secondary">{formatDate(comment.createdAt)}</span>
							</div>
							<p class="mt-2 whitespace-pre-wrap text-primary">{comment.body}</p>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Add comment form -->
			<form method="POST" action="?/comment" class="mt-4" use:enhance>
				<textarea
					name="body"
					rows="2"
					placeholder={t(data.locale, 'inquiry.add_comment')}
					required
					class="block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
				></textarea>
				<div class="mt-2 flex justify-end">
					<button
						type="submit"
						class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
					>
						{t(data.locale, 'action.submit')}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
