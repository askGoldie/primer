<script lang="ts">
	/**
	 * Contact Page
	 *
	 * Public contact form for general inquiries. Anyone — prospects, customers,
	 * partners, press — can reach DavidPM here without signing up first. The
	 * purchase inquiry form (organization size, license intent) lives behind
	 * auth on /web/dashboard; this form is for everything else.
	 *
	 * Submission is handled by the default action in +page.server.ts which
	 * sends two Postmark emails (internal notification + submitter confirmation)
	 * and tracks the event in purchase_events.
	 */

	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
</script>

<Seo locale={data.locale} pageKey="contact" path="/web/contact" />

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
		<div class="min-w-0">
			<BlurFade delay={0}>
				<h1 class="text-3xl font-medium tracking-tight text-primary">
					{t(data.locale, 'contact.heading')}
				</h1>
				<p class="mt-4 text-lg text-secondary">
					{t(data.locale, 'contact.body')}
				</p>
			</BlurFade>

			{#if form?.success}
				<BlurFade delay={0}>
					<div class="mt-12 rounded-lg border-2 border-accent2 bg-accent2/5 p-8 text-center">
						<svg
							class="mx-auto h-12 w-12 text-accent2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="mt-4 text-lg font-medium text-primary">
							{t(data.locale, 'contact.sent')}
						</p>
						<p class="mt-2 text-secondary">
							{t(data.locale, 'contact.response_time')}
						</p>
					</div>
				</BlurFade>
			{:else}
				<BlurFade delay={200}>
					{#if form?.error}
						<div class="bg-alarm/10 text-alarm mt-8 rounded-lg p-4 text-sm" role="alert">
							{t(data.locale, form.error)}
						</div>
					{/if}

					<form
						method="POST"
						class="mt-10 space-y-6"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								submitting = false;
								await update();
							};
						}}
					>
						<div>
							<label for="name" class="text-label text-primary">
								{t(data.locale, 'contact.name')}
							</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								value={form?.values?.name ?? ''}
								class="mt-1.5 w-full rounded-lg border border-border bg-surfaceMid px-4 py-2.5 text-primary placeholder:text-secondary/50 focus:border-accent1 focus:ring-1 focus:ring-accent1"
							/>
						</div>

						<div>
							<label for="email" class="text-label text-primary">
								{t(data.locale, 'contact.email')}
							</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								value={form?.values?.email ?? ''}
								class="mt-1.5 w-full rounded-lg border border-border bg-surfaceMid px-4 py-2.5 text-primary placeholder:text-secondary/50 focus:border-accent1 focus:ring-1 focus:ring-accent1"
							/>
						</div>

						<div>
							<label for="company" class="text-label text-primary">
								{t(data.locale, 'contact.company')}
							</label>
							<input
								id="company"
								name="company"
								type="text"
								value={form?.values?.company ?? ''}
								class="mt-1.5 w-full rounded-lg border border-border bg-surfaceMid px-4 py-2.5 text-primary placeholder:text-secondary/50 focus:border-accent1 focus:ring-1 focus:ring-accent1"
							/>
						</div>

						<div>
							<label for="message" class="text-label text-primary">
								{t(data.locale, 'contact.message')}
							</label>
							<textarea
								id="message"
								name="message"
								required
								rows="5"
								placeholder={t(data.locale, 'contact.message_placeholder')}
								class="mt-1.5 w-full rounded-lg border border-border bg-surfaceMid px-4 py-2.5 text-primary placeholder:text-secondary/50 focus:border-accent1 focus:ring-1 focus:ring-accent1"
								>{form?.values?.message ?? ''}</textarea
							>
						</div>

						<!--
							Honeypot field. Hidden from real users via aria-hidden + tabindex
							+ off-screen positioning. Bots that scrape the DOM will fill it,
							triggering a silent-success path on the server.
						-->
						<div class="absolute left-[-9999px]" aria-hidden="true">
							<label for="website">Website</label>
							<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
						</div>

						<button type="submit" class="btn-primary w-full py-3 text-base" disabled={submitting}>
							{#if submitting}
								<span
									class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
								></span>
							{:else}
								{t(data.locale, 'contact.send')}
							{/if}
						</button>

						<p class="text-center text-sm text-secondary">
							{t(data.locale, 'contact.response_time')}
						</p>
					</form>
				</BlurFade>
			{/if}
		</div>

		<!-- Portrait column: a real person will read your message -->
		<BlurFade delay={150}>
			<div class="hidden overflow-hidden rounded-xl border border-border lg:block">
				<img
					src="/images/web/contact-portrait.webp"
					alt={t(data.locale, 'web.image.contact_portrait.alt')}
					loading="lazy"
					decoding="async"
					class="aspect-[4/5] w-full object-cover"
				/>
			</div>
		</BlurFade>
	</div>
</div>
