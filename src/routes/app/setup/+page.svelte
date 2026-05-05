<script lang="ts">
	/**
	 * Organization Setup Page
	 *
	 * Initial setup for users without an organization.
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>{t(data.locale, 'setup.organization')} | Primer</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
	<div class="w-full max-w-lg">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="inline-block">
				<img src="/logo.svg" alt="Primer" class="h-10" />
			</a>
		</div>

		<!-- Setup card -->
		<div class="rounded-lg border border-border bg-surfaceMid p-8">
			<h1 class="text-2xl font-medium text-primary">
				{t(data.locale, 'setup.organization')}
			</h1>
			<p class="mt-2 text-secondary">
				{t(data.locale, 'setup.description')}
			</p>

			{#if form?.error}
				<div
					transition:fade={{ duration: 200 }}
					class="bg-alarm/10 text-alarm mt-4 rounded-lg p-4 text-sm"
				>
					{t(data.locale, form.error)}
				</div>
			{/if}

			<form
				method="POST"
				class="mt-6 space-y-6"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<!-- Organization name -->
				<div>
					<label for="orgName" class="block text-sm font-medium text-primary">
						{t(data.locale, 'setup.org_name')}
					</label>
					<input
						type="text"
						id="orgName"
						name="orgName"
						required
						placeholder={t(data.locale, 'setup.org_placeholder')}
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
				</div>

				<!-- Industry -->
				<div>
					<label for="industry" class="block text-sm font-medium text-primary">
						{t(data.locale, 'setup.industry')}
					</label>
					<select
						id="industry"
						name="industry"
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					>
						<option value="">{t(data.locale, 'setup.industry_placeholder')}</option>
						<option value="construction">{t(data.locale, 'demo.industry.construction')}</option>
						<option value="healthcare">{t(data.locale, 'demo.industry.healthcare')}</option>
						<option value="professional_services"
							>{t(data.locale, 'demo.industry.professional_services')}</option
						>
						<option value="manufacturing">{t(data.locale, 'demo.industry.manufacturing')}</option>
						<option value="retail">{t(data.locale, 'demo.industry.retail')}</option>
					</select>
				</div>

				<!-- Cycle cadence -->
				<div>
					<label for="cycleCadence" class="block text-sm font-medium text-primary">
						{t(data.locale, 'setup.cycle_cadence')}
					</label>
					<select
						id="cycleCadence"
						name="cycleCadence"
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					>
						<option value="quarterly">{t(data.locale, 'setup.cycle.quarterly')}</option>
						<option value="monthly">{t(data.locale, 'setup.cycle.monthly')}</option>
					</select>
					<p class="mt-1 text-xs text-secondary">{t(data.locale, 'setup.cadence_hint')}</p>
				</div>

				<hr class="border-border" />

				<!-- Your profile -->
				<div>
					<label for="userName" class="block text-sm font-medium text-primary">
						{t(data.locale, 'setup.your_name')}
					</label>
					<input
						type="text"
						id="userName"
						name="userName"
						required
						value={data.user?.name || ''}
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
				</div>

				<div>
					<label for="userTitle" class="block text-sm font-medium text-primary"
						>{t(data.locale, 'setup.your_title')}</label
					>
					<input
						type="text"
						id="userTitle"
						name="userTitle"
						placeholder={t(data.locale, 'setup.title_placeholder')}
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-accent1 px-4 py-3 font-medium text-white transition-colors hover:bg-accent1/90 disabled:opacity-50"
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
							{t(data.locale, 'setup.creating')}
						</span>
					{:else}
						{t(data.locale, 'action.create')}
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
