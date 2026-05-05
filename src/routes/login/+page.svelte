<script lang="ts">
	/**
	 * Login Page - Customer Auth Integration Point
	 *
	 * On the demo site this is a stub: email is pre-filled, password is shared.
	 * On a real deployment, customers replace the form action in +page.server.ts
	 * with their actual authentication provider.
	 */

	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	// $state ensures the DOM input is initialised with the server-provided value.
	// On the demo site this pre-fills the shared password so visitors can pass
	// through without typing. On a real deployment, leave data.password empty
	// and let the user enter their own credentials.
	// svelte-ignore state_referenced_locally
	let password = $state(data.password ?? '');

	/** Role badge colors — uses theme.css accent tokens for contrast on warm surfaces */
	const roleBadge: Record<string, string> = {
		owner: 'bg-accent1/15 text-accent1',
		editor: 'bg-accent3/15 text-accent3',
		viewer: 'bg-surfaceHigh text-secondary'
	};
</script>

<svelte:head>
	<title>{t(data.locale, 'auth.login')} - {data.person.name} | Tier</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href={resolve('/')} class="inline-block">
				<img src="/logo.svg" alt="Tier" class="h-10" />
			</a>
		</div>

		<!-- Placeholder notice -->
		<div class="mb-6 rounded-lg border border-border bg-surfaceHigh px-5 py-4">
			<p class="text-sm font-semibold text-primary">
				{t(data.locale, 'login.placeholder_title')}
			</p>
			<p class="mt-1 text-sm text-secondary">
				{t(data.locale, 'login.placeholder_body')}
			</p>
		</div>

		<!-- Person identity card -->
		<div class="mb-4 rounded-lg border border-border bg-surface px-5 py-4 text-center">
			<div class="flex items-center justify-center gap-2">
				<span class="text-lg font-semibold text-primary">{data.person.name}</span>
				<span class="rounded-full px-2 py-0.5 text-xs font-medium {roleBadge[data.person.orgRole]}">
					{data.person.orgRole}
				</span>
			</div>
			<p class="mt-1 text-sm text-secondary">{data.person.title}</p>
		</div>

		<!-- Auth form - customers replace the POST action in +page.server.ts -->
		<div class="rounded-lg border border-border bg-surfaceMid p-8">
			{#if form?.error}
				<div class="bg-alarm/10 text-alarm mb-4 rounded-lg p-4 text-sm">
					{t(data.locale, form.error)}
				</div>
			{/if}

			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="nodeId" value={data.person.nodeId} />

				<div>
					<label for="email" class="block text-sm font-medium text-primary">
						{t(data.locale, 'auth.email')}
					</label>
					<input
						type="email"
						id="email"
						value={data.person.email}
						disabled
						class="mt-1 block w-full rounded-lg border border-border bg-surfaceHigh px-4 py-2 text-secondary"
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
						autocomplete="off"
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
							{t(data.locale, 'auth.login')}...
						</span>
					{:else}
						{t(data.locale, 'auth.login')}
					{/if}
				</button>
			</form>
		</div>

		<!-- Back to role picker -->
		<p class="mt-6 text-center text-sm text-secondary">
			<a href={resolve('/platform')} class="text-accent1 hover:underline">
				{t(data.locale, 'platform.back_to_roles')}
			</a>
		</p>
	</div>
</div>
