<script lang="ts">
	/**
	 * Reset Password Page
	 *
	 * Set a new password using the session established by /auth/callback.
	 * Part of the /web Supabase-backed auth flow.
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>{t(data.locale, 'auth.reset_password')} | Primer</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="inline-block">
				<img src="/logo.svg" alt="Tier" class="h-10" />
			</a>
		</div>

		<!-- Reset password card -->
		<div class="rounded-lg border border-border bg-surfaceMid p-8">
			{#if data.invalidToken}
				<!-- Invalid/expired token state -->
				<div class="text-center">
					<div
						class="bg-alarm/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
					>
						<svg class="text-alarm h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
					<h1 class="text-2xl font-medium text-primary">
						{t(data.locale, 'auth.reset_password')}
					</h1>
					<p class="mt-4 text-secondary">
						{t(data.locale, 'auth.verification_expired')}
					</p>
					<a href={resolve('/web/forgot-password')} class="btn-primary mt-6 px-6 py-2">
						{t(data.locale, 'auth.forgot_password')}
					</a>
				</div>
			{:else}
				<!-- Form state -->
				<h1 class="text-2xl font-medium text-primary">
					{t(data.locale, 'auth.reset_password')}
				</h1>

				{#if form?.error}
					<div class="bg-alarm/10 text-alarm mt-4 rounded-lg p-4 text-sm">
						{t(data.locale, form.error)}
					</div>
				{/if}

				<form
					method="POST"
					class="mt-6 space-y-4"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}
				>
					<div>
						<label for="password" class="block text-sm font-medium text-primary">
							{t(data.locale, 'auth.new_password')}
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength="8"
							autocomplete="new-password"
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
						/>
						<p class="mt-1 text-xs text-secondary">
							{t(data.locale, 'validation.password_min', { min: 8 })}
						</p>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-primary">
							{t(data.locale, 'auth.password_confirm')}
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							autocomplete="new-password"
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-accent1 px-4 py-2 font-medium text-white transition-colors hover:bg-accent1/90 disabled:opacity-50"
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
								{t(data.locale, 'auth.reset_password')}...
							</span>
						{:else}
							{t(data.locale, 'auth.reset_password')}
						{/if}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
