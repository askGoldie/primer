<script lang="ts">
	/**
	 * Root Layout
	 *
	 * Provides the global shell for all pages including header,
	 * footer, and HTML structure with locale support.
	 *
	 * Also wires up Supabase auth state change listener following the
	 * official @supabase/ssr pattern. When the user signs in or out in
	 * any tab, onAuthStateChange fires and invalidate('supabase:auth')
	 * tells SvelteKit to re-run +layout.ts, keeping the session in sync.
	 */

	import './layout.css';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import type { LayoutData } from './$types.js';
	import { t } from '$lib/i18n/index.js';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();
	let { supabase, session } = $derived(data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_, newSession) => {
			// Re-run +layout.ts load when session expiry changes (sign in/out/refresh)
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<div class="flex min-h-screen flex-col">
	<!-- Skip navigation link for keyboard/screen reader users -->
	<a
		href="#main-content"
		class="sr-only absolute top-4 left-4 z-50 rounded-md bg-accent1 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:outline-none"
	>
		{t(data.locale, 'a11y.skip_to_content')}
	</a>

	<Header locale={data.locale} {session} />

	<main id="main-content" class="flex-1">
		{@render children()}
	</main>

	<div class={$page.url.pathname.startsWith('/app') ? 'lg:ml-64' : ''}>
		<Footer locale={data.locale} />
	</div>
</div>
