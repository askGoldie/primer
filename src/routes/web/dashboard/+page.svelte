<script lang="ts">
	/**
	 * Dashboard Page
	 *
	 * The authenticated hub for all signed-in users.
	 * - Without license: purchase inquiry form + demo platform CTA
	 * - With license: download section + getting started guide
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);

	/**
	 * Whether this submission is a direct purchase or a meeting request.
	 * The form always submits the same action — the server branches on
	 * requestType to send different emails and record a different
	 * purchase_events row. UI labels and the submit button swap based on
	 * this value so a direct buyer isn't confused by meeting-request copy.
	 */
	let requestType = $state<'purchase' | 'meeting'>('purchase');

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(data.locale, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{t(data.locale, 'account.dashboard')} | Primer</title>
</svelte:head>

<div class="min-h-screen bg-surface">
	<!-- Main content -->
	<main class="mx-auto max-w-5xl px-4 py-8">
		<!-- Welcome -->
		<div class="mb-8">
			<h1 class="text-2xl font-medium text-primary">
				{t(data.locale, 'account.dashboard')}
			</h1>
			<p class="mt-1 text-secondary">
				{t(data.locale, 'account.dashboard_subtitle')}
			</p>
		</div>

		<!-- ── Demo Platform CTA — always visible, always prominent ───────── -->
		<a
			href={resolve('/platform')}
			class="mb-8 flex items-center justify-between rounded-xl border-2 border-accent1/30 bg-accent1/5 p-6 transition-colors hover:border-accent1/60 hover:bg-accent1/10"
		>
			<div>
				<h2 class="text-lg font-semibold text-primary">
					{t(data.locale, 'purchase.platform_heading')}
				</h2>
				<p class="mt-1 text-sm text-secondary">
					{t(data.locale, 'purchase.platform_description')}
				</p>
			</div>
			<div class="ml-4 flex flex-shrink-0 items-center gap-2 text-accent1">
				<span class="text-sm font-medium">{t(data.locale, 'purchase.platform_cta')}</span>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		{#if data.hasLicense}
			<!-- ── LICENSED USER VIEW ──────────────────────────────────────── -->
			<div class="grid gap-6 lg:grid-cols-3">
				<!-- License card -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6 lg:col-span-2">
					<div class="flex items-start justify-between">
						<div>
							<h2 class="text-lg font-medium text-primary">
								{t(data.locale, 'account.perpetual')}
							</h2>
							<p class="mt-1 text-sm text-secondary">
								{t(data.locale, 'account.license_id')}: {data.license.id.substring(0, 8)}...
							</p>
						</div>
						<span class="rounded-full bg-accent2/10 px-3 py-1 text-xs font-medium text-accent2">
							{t(data.locale, 'account.active')}
						</span>
					</div>

					<div class="mt-4 text-sm text-secondary">
						{t(data.locale, 'account.purchase_date')}: {formatDate(data.license.purchasedAt)}
					</div>

					<!-- Download section -->
					<div class="mt-6 border-t border-border pt-6">
						<h3 class="text-sm font-medium tracking-wider text-secondary uppercase">
							{t(data.locale, 'account.download')}
						</h3>

						<div
							class="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface p-4"
						>
							<div>
								<span class="font-medium text-primary">
									{t(data.locale, 'account.version', { version: data.currentVersion })}
								</span>
								<span class="ml-2 text-sm text-secondary">{t(data.locale, 'account.latest')}</span>
							</div>
							<a
								href={resolve(`/api/download?version=${data.currentVersion}`)}
								class="btn-primary px-4 py-2 text-sm"
							>
								{t(data.locale, 'account.download_latest')}
							</a>
						</div>
					</div>

					<!-- Recent downloads -->
					{#if data.recentDownloads.length > 0}
						<div class="mt-4">
							<h4 class="text-xs font-medium tracking-wider text-secondary uppercase">
								{t(data.locale, 'account.recent_downloads')}
							</h4>
							<ul class="mt-2 space-y-1">
								{#each data.recentDownloads as download (download.downloadedAt)}
									<li class="flex items-center justify-between text-sm">
										<span class="text-primary">v{download.version}</span>
										<span class="text-secondary">{formatDate(download.downloadedAt)}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>

				<!-- Getting started card -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h2 class="text-lg font-medium text-primary">
						{t(data.locale, 'account.getting_started')}
					</h2>

					<ul class="mt-4 space-y-4">
						<li class="flex items-start gap-3">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent1/10 text-xs font-medium text-accent1"
							>
								1
							</div>
							<div>
								<span class="font-medium text-primary">
									{t(data.locale, 'account.getting_started.deploy')}
								</span>
								<p class="mt-1 text-sm text-secondary">
									{t(data.locale, 'account.getting_started.deploy.description')}
								</p>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent1/10 text-xs font-medium text-accent1"
							>
								2
							</div>
							<div>
								<span class="font-medium text-primary">
									{t(data.locale, 'account.getting_started.adopt')}
								</span>
								<p class="mt-1 text-sm text-secondary">
									{t(data.locale, 'account.getting_started.adopt.description')}
								</p>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent1/10 text-xs font-medium text-accent1"
							>
								3
							</div>
							<div>
								<span class="font-medium text-primary">
									{t(data.locale, 'account.getting_started.evaluate')}
								</span>
								<p class="mt-1 text-sm text-secondary">
									{t(data.locale, 'account.getting_started.evaluate.description')}
								</p>
							</div>
						</li>
					</ul>

					<div class="mt-6 border-t border-border pt-6">
						<a href={resolve('/web/deployment')} class="block text-sm text-accent1 hover:underline">
							{t(data.locale, 'nav.deployment')}
						</a>
					</div>
				</div>
			</div>

			<!-- Changelog section -->
			<div class="mt-8 rounded-lg border border-border bg-surfaceMid p-6">
				<h2 class="text-lg font-medium text-primary">
					{t(data.locale, 'account.changelog')}
				</h2>

				<div class="mt-4 space-y-4">
					<div class="border-l-2 border-accent2 pl-4">
						<div class="flex items-baseline gap-2">
							<span class="font-medium text-primary">
								{t(data.locale, 'account.version', { version: '1.0.0' })}
							</span>
							<span class="text-sm text-secondary">
								{t(data.locale, 'account.initial_release')}
							</span>
						</div>
						<ul class="mt-2 space-y-1 text-sm text-secondary">
							<li>• {t(data.locale, 'account.changelog.framework')}</li>
							<li>• {t(data.locale, 'account.changelog.hierarchy')}</li>
							<li>• {t(data.locale, 'account.changelog.metrics')}</li>
							<li>• {t(data.locale, 'account.changelog.inquiries')}</li>
							<li>• {t(data.locale, 'account.changelog.multilang')}</li>
							<li>• {t(data.locale, 'account.changelog.deployment')}</li>
						</ul>
					</div>
				</div>
			</div>
		{:else}
			<!-- ── UNLICENSED USER VIEW ────────────────────────────────────── -->
			<div class="grid gap-8 lg:grid-cols-5">
				<!-- Purchase inquiry form — 3/5 width -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6 lg:col-span-3">
					<h2 class="text-lg font-medium text-primary">
						{t(data.locale, 'purchase.inquiry_heading')}
					</h2>
					<p class="mt-1 text-sm text-secondary">
						{t(data.locale, 'purchase.inquiry_subtitle')}
					</p>

					<div class="mt-4 flex items-baseline gap-2">
						<span class="text-3xl font-bold text-primary">$5,000</span>
						<span class="text-secondary">{t(data.locale, 'account.perpetual')}</span>
					</div>

					{#if form?.success}
						<div class="mt-6 rounded-lg bg-accent2/10 p-4 text-sm text-accent2">
							{t(data.locale, 'purchase.inquiry_success')}
						</div>
					{:else}
						{#if form?.error}
							<div class="bg-alarm/10 text-alarm mt-4 rounded-lg p-4 text-sm">
								{t(data.locale, form.error)}
							</div>
						{/if}

						<form
							method="POST"
							action="?/inquiry"
							class="mt-6 space-y-4"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update();
								};
							}}
						>
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<label for="inq-name" class="block text-sm font-medium text-primary">
										{t(data.locale, 'purchase.inquiry_name')}
									</label>
									<input
										type="text"
										id="inq-name"
										name="name"
										required
										value={data.user.name}
										class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
									/>
								</div>

								<div>
									<label for="inq-email" class="block text-sm font-medium text-primary">
										{t(data.locale, 'purchase.inquiry_email')}
									</label>
									<input
										type="email"
										id="inq-email"
										name="email"
										required
										value={data.user.email}
										class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label for="inq-org" class="block text-sm font-medium text-primary">
									{t(data.locale, 'purchase.inquiry_org')}
								</label>
								<input
									type="text"
									id="inq-org"
									name="organizationName"
									required
									class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
								/>
							</div>

							<!-- Purchase or meeting request — branches the server action -->
							<fieldset>
								<legend class="block text-sm font-medium text-primary">
									{t(data.locale, 'purchase.inquiry_type')}
								</legend>
								<div class="mt-2 space-y-2">
									<label
										class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:border-accent1/60"
									>
										<input
											type="radio"
											name="requestType"
											value="purchase"
											bind:group={requestType}
											class="mt-0.5 h-4 w-4 text-accent1 focus:ring-accent1"
										/>
										<span class="text-sm text-primary">
											{t(data.locale, 'purchase.inquiry_type.purchase')}
										</span>
									</label>
									<label
										class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:border-accent1/60"
									>
										<input
											type="radio"
											name="requestType"
											value="meeting"
											bind:group={requestType}
											class="mt-0.5 h-4 w-4 text-accent1 focus:ring-accent1"
										/>
										<span class="text-sm text-primary">
											{t(data.locale, 'purchase.inquiry_type.meeting')}
										</span>
									</label>
								</div>
							</fieldset>

							<div>
								<label for="inq-agent" class="block text-sm font-medium text-primary">
									{t(data.locale, 'purchase.inquiry_sales_agent')}
								</label>
								<input
									type="text"
									id="inq-agent"
									name="salesAgent"
									placeholder={t(data.locale, 'purchase.inquiry_sales_agent_placeholder')}
									class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
								/>
							</div>

							<div>
								<label for="inq-message" class="block text-sm font-medium text-primary">
									{t(data.locale, 'purchase.inquiry_message')}
								</label>
								<textarea
									id="inq-message"
									name="message"
									rows="3"
									placeholder={t(data.locale, 'purchase.inquiry_message_placeholder')}
									class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
								></textarea>
							</div>

							<button
								type="submit"
								disabled={loading}
								class="w-full rounded-lg bg-accent1 px-6 py-3 font-medium text-white transition-colors hover:bg-accent1/90 disabled:opacity-50"
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
										{t(data.locale, 'purchase.inquiry_submitting')}
									</span>
								{:else if requestType === 'meeting'}
									{t(data.locale, 'purchase.inquiry_submit_meeting')}
								{:else}
									{t(data.locale, 'purchase.inquiry_submit')}
								{/if}
							</button>
						</form>
					{/if}

					<p class="mt-4 text-xs text-secondary">
						{t(data.locale, 'purchase.disclaimer')}
					</p>
				</div>

				<!-- What you receive — 2/5 width -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6 lg:col-span-2">
					<h3 class="text-sm font-medium tracking-wider text-secondary uppercase">
						{t(data.locale, 'purchase.what_you_get')}
					</h3>
					<ul class="mt-4 space-y-3">
						{#each ['source_code', 'deploy_anywhere', 'modify_anything', 'own_forever'] as item (item)}
							<li class="flex items-start gap-3">
								<svg
									class="mt-0.5 h-5 w-5 flex-shrink-0 text-accent2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="text-primary">{t(data.locale, `purchase.${item}`)}</span>
							</li>
						{/each}
					</ul>

					<div class="mt-6 border-t border-border pt-6">
						<h4 class="text-sm font-medium text-primary">
							{t(data.locale, 'purchase.price')}
						</h4>
						<p class="mt-2 text-xs text-secondary">
							{t(data.locale, 'purchase.disclaimer')}
						</p>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
