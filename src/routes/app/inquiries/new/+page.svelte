<script lang="ts">
	/**
	 * New Inquiry Page
	 *
	 * Form to file a new self-inquiry or peer inquiry.
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { fade, slide } from 'svelte/transition';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let inquiryType = $state<'self' | 'peer'>('self');
	let loading = $state(false);

	const availableMetrics = $derived(inquiryType === 'self' ? data.ownMetrics : data.peerMetrics);
</script>

<svelte:head>
	<title>{t(data.locale, 'inquiry.file')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<a href={resolve('/app/inquiries')} class="text-sm text-secondary hover:text-primary">
			← {t(data.locale, 'action.back')}
		</a>
		<h1 class="mt-2 text-2xl font-medium text-primary">
			{t(data.locale, 'inquiry.file')}
		</h1>
		<p class="mt-1 text-secondary">{t(data.locale, 'inquiry.new.subtitle')}</p>
	</div>

	<div class="mx-auto max-w-2xl">
		<div class="rounded-lg border border-border bg-surfaceMid p-6">
			{#if form?.error}
				<div
					transition:fade={{ duration: 200 }}
					class="bg-alarm/10 text-alarm mb-6 rounded-lg p-4 text-sm"
				>
					{t(data.locale, form.error)}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<!-- Inquiry type selection -->
				<fieldset class="mb-6">
					<div class="flex items-center gap-1.5">
						<legend class="block text-sm font-medium text-primary"
							>{t(data.locale, 'inquiry.type_label')}</legend
						>
						<HelpTooltip text={t(data.locale, 'tooltip.inquiries.type')} position="bottom" />
					</div>
					<div class="mt-2 flex gap-4">
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="inquiryType"
								value="self"
								bind:group={inquiryType}
								class="h-4 w-4 border-border text-accent1 focus:ring-accent1"
							/>
							<span class="text-primary">{t(data.locale, 'inquiry.self')}</span>
						</label>
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="inquiryType"
								value="peer"
								bind:group={inquiryType}
								class="h-4 w-4 border-border text-accent1 focus:ring-accent1"
							/>
							<span class="text-primary">{t(data.locale, 'inquiry.peer')}</span>
						</label>
					</div>
					<p class="mt-1 text-xs text-secondary">
						{inquiryType === 'self'
							? t(data.locale, 'inquiry.self_description')
							: t(data.locale, 'inquiry.peer_description')}
					</p>
				</fieldset>

				<!-- Target metric selection -->
				<div class="mb-6">
					<label for="targetMetricId" class="block text-sm font-medium text-primary">
						{t(data.locale, 'inquiry.target_metric')}
					</label>
					{#if availableMetrics.length > 0}
						<select
							id="targetMetricId"
							name="targetMetricId"
							required
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
						>
							<option value="">{t(data.locale, 'inquiry.select_metric')}</option>
							{#each availableMetrics as metric (metric.id)}
								<option value={metric.id}>
									{metric.name}
									{#if 'nodeName' in metric}
										({metric.nodeName})
									{/if}
									{#if metric.weight}
										- {metric.weight}%
									{/if}
								</option>
							{/each}
						</select>
					{:else}
						<p class="mt-2 text-sm text-secondary">
							{inquiryType === 'self'
								? t(data.locale, 'inquiry.no_self_metrics')
								: t(data.locale, 'inquiry.no_peer_metrics')}
						</p>
					{/if}
				</div>

				<!-- Affected metric (for peer inquiries) -->
				{#if inquiryType === 'peer' && data.ownMetrics.length > 0}
					<div transition:slide={{ duration: 250 }} class="mb-6">
						<div class="flex items-center gap-1.5">
							<label for="affectedMetricId" class="block text-sm font-medium text-primary">
								{t(data.locale, 'inquiry.affected_metric')}
							</label>
							<HelpTooltip
								text={t(data.locale, 'tooltip.inquiries.affected_metric')}
								position="bottom"
							/>
						</div>
						<p class="text-xs text-secondary">{t(data.locale, 'inquiry.affected_metric_hint')}</p>
						<select
							id="affectedMetricId"
							name="affectedMetricId"
							required
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
						>
							<option value="">{t(data.locale, 'inquiry.select_affected')}</option>
							{#each data.ownMetrics as metric (metric.id)}
								<option value={metric.id}>
									{metric.name}
									{#if metric.weight}
										- {metric.weight}%
									{/if}
								</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Challenge type -->
				<fieldset class="mb-6">
					<legend class="block text-sm font-medium text-primary"
						>{t(data.locale, 'inquiry.what_challenging')}</legend
					>
					<div class="mt-2 grid grid-cols-2 gap-3">
						<label
							class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent1/50"
						>
							<input
								type="radio"
								name="challengeType"
								value="threshold"
								required
								class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
							/>
							<div>
								<span class="font-medium text-primary"
									>{t(data.locale, 'inquiry.challenge.threshold')}</span
								>
								<p class="text-xs text-secondary">
									{t(data.locale, 'inquiry.challenge.threshold_description')}
								</p>
							</div>
						</label>
						<label
							class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent1/50"
						>
							<input
								type="radio"
								name="challengeType"
								value="weight"
								class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
							/>
							<div>
								<span class="font-medium text-primary"
									>{t(data.locale, 'inquiry.challenge.weight')}</span
								>
								<p class="text-xs text-secondary">
									{t(data.locale, 'inquiry.challenge.weight_description')}
								</p>
							</div>
						</label>
						<label
							class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent1/50"
						>
							<input
								type="radio"
								name="challengeType"
								value="definition"
								class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
							/>
							<div>
								<span class="font-medium text-primary"
									>{t(data.locale, 'inquiry.challenge.definition')}</span
								>
								<p class="text-xs text-secondary">
									{t(data.locale, 'inquiry.challenge.definition_description')}
								</p>
							</div>
						</label>
						<label
							class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent1/50"
						>
							<input
								type="radio"
								name="challengeType"
								value="measurement"
								class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
							/>
							<div>
								<span class="font-medium text-primary"
									>{t(data.locale, 'inquiry.challenge.measurement')}</span
								>
								<p class="text-xs text-secondary">
									{t(data.locale, 'inquiry.challenge.measurement_description')}
								</p>
							</div>
						</label>
					</div>
				</fieldset>

				<!-- Rationale -->
				<div class="mb-6">
					<label for="rationale" class="block text-sm font-medium text-primary">
						{t(data.locale, 'inquiry.rationale')}
					</label>
					<textarea
						id="rationale"
						name="rationale"
						rows="4"
						required
						placeholder={t(data.locale, 'inquiry.rationale_placeholder')}
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					></textarea>
				</div>

				<!-- Submit -->
				<div class="flex justify-end gap-2">
					<a
						href={resolve('/app/inquiries')}
						class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surfaceHigh"
					>
						{t(data.locale, 'action.cancel')}
					</a>
					<button
						type="submit"
						disabled={loading || availableMetrics.length === 0}
						class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90 disabled:opacity-50"
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
										fill="none"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								{t(data.locale, 'inquiry.filing')}
							</span>
						{:else}
							{t(data.locale, 'action.submit')}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
