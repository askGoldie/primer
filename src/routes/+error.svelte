<script lang="ts">
	/**
	 * Global Error Page
	 *
	 * Rendered by SvelteKit whenever a `+page.server.ts`, `+server.ts`,
	 * or load function throws (via `error()` or an uncaught exception),
	 * and for 404s. Replaces SvelteKit's unstyled default error screen
	 * with the Primer look.
	 *
	 * The status code and message are read from `page.status` /
	 * `page.error`. Locale comes from the root `+layout.server.ts`
	 * load, which always runs even for error renders, so `page.data.locale`
	 * is reliably set.
	 */

	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t, DEFAULT_LOCALE } from '$lib/i18n/index.js';
	import type { Locale } from '$lib/types/index.js';

	const locale = $derived<Locale>((page.data?.locale as Locale) ?? DEFAULT_LOCALE);
	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? t(locale, 'error.generic'));
</script>

<svelte:head>
	<title>{status} · {t(locale, 'error.page.title')} | Primer</title>
</svelte:head>

<div class="flex min-h-[70vh] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md text-center">
		<div class="mb-4 text-6xl font-semibold text-accent1">
			{status}
		</div>
		<h1 class="text-2xl font-medium text-primary">
			{t(locale, 'error.page.title')}
		</h1>
		<p class="mt-4 text-secondary">
			{message}
		</p>
		<div class="mt-8">
			<a
				href={resolve('/')}
				class="inline-block rounded-md bg-accent1 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
			>
				{t(locale, 'error.page.back_home')}
			</a>
		</div>
	</div>
</div>
