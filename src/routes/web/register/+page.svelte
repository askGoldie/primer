<script lang="ts">
	/**
	 * Registration Page
	 *
	 * Account creation form with email verification.
	 * Part of the /web Supabase-backed auth flow.
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let password = $state('');
	let confirmPassword = $state('');

	/**
	 * Only show the mismatch warning once the user has typed something in
	 * the confirm field — avoids shouting at them mid-keystroke on the first
	 * field.
	 */
	let passwordMismatch = $derived(confirmPassword.length > 0 && password !== confirmPassword);
</script>

<svelte:head>
	<title>{t(data.locale, 'auth.create_account')} | Primer</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="inline-block">
				<img src="/logo.svg" alt="Tier" class="h-10" />
			</a>
		</div>

		<!-- Registration card -->
		<div class="rounded-lg border border-border bg-surfaceMid p-8">
			<h1 class="text-2xl font-medium text-primary">
				{t(data.locale, 'auth.create_account_title')}
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
				<input type="hidden" name="redirect" value={data.redirectTo} />

				<div>
					<label for="name" class="block text-sm font-medium text-primary">
						{t(data.locale, 'auth.name')}
					</label>
					<input
						type="text"
						id="name"
						name="name"
						value={form?.name ?? ''}
						required
						autocomplete="name"
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-primary">
						{t(data.locale, 'auth.email')}
					</label>
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email ?? ''}
						required
						autocomplete="email"
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-primary">
						{t(data.locale, 'auth.password')}
					</label>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						required
						minlength="8"
						autocomplete="new-password"
						class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
					<p class="mt-1 text-xs text-secondary">
						{t(data.locale, 'validation.password_complexity')}
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
						bind:value={confirmPassword}
						required
						autocomplete="new-password"
						aria-invalid={passwordMismatch}
						aria-describedby={passwordMismatch ? 'confirmPassword-error' : undefined}
						class="mt-1 block w-full rounded-lg border bg-surface px-4 py-2 text-primary placeholder:text-secondary focus:ring-1 focus:outline-none {passwordMismatch
							? 'border-alarm focus:border-alarm focus:ring-alarm'
							: 'border-border focus:border-accent1 focus:ring-accent1'}"
					/>
					{#if passwordMismatch}
						<p id="confirmPassword-error" class="text-alarm mt-1 text-xs">
							{t(data.locale, 'auth.password_mismatch')}
						</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={loading || passwordMismatch}
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
							{t(data.locale, 'auth.create_account')}...
						</span>
					{:else}
						{t(data.locale, 'auth.create_account')}
					{/if}
				</button>
			</form>
		</div>

		<!-- Sign in link -->
		<p class="mt-6 text-center text-sm text-secondary">
			{t(data.locale, 'auth.have_account')}
			<a
				href={resolve(`/web/login?redirect=${encodeURIComponent(data.redirectTo)}`)}
				class="text-accent1 hover:underline"
			>
				{t(data.locale, 'auth.login')}
			</a>
		</p>
	</div>
</div>
