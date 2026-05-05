<script lang="ts">
	/**
	 * Verify Email Page
	 *
	 * Shows verification pending state after registration.
	 * Successful verification happens via /auth/callback (Supabase magic link).
	 * Part of the /web Supabase-backed auth flow.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{t(data.locale, 'auth.verify_email')} | Primer</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="inline-block">
				<img src="/logo.svg" alt="Tier" class="h-10" />
			</a>
		</div>

		<!-- Verification card -->
		<div class="rounded-lg border border-border bg-surfaceMid p-8">
			{#if data.pending}
				<!-- Pending verification state -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent2/10"
					>
						<svg class="h-6 w-6 text-accent2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h1 class="text-2xl font-medium text-primary">
						{t(data.locale, 'auth.verify_email')}
					</h1>
					<p class="mt-4 text-secondary">
						{t(data.locale, 'auth.verify_sent')}
					</p>
					{#if data.email}
						<p class="mt-2 font-medium text-primary">
							{data.email}
						</p>
					{/if}
					<div class="mt-6 space-y-3">
						<a
							href={resolve(
								`/web/verify-email/resend?email=${encodeURIComponent(
									data.email || ''
								)}&redirect=${encodeURIComponent(data.redirectTo || '/')}`
							)}
							class="block text-sm text-accent1 hover:underline"
						>
							{t(data.locale, 'auth.resend_verification')}
						</a>
						<a href={resolve('/web/login')} class="block text-sm text-secondary hover:text-primary">
							{t(data.locale, 'auth.login')}
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
