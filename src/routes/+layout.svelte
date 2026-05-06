<script lang="ts">
	/**
	 * Root Layout
	 *
	 * Intentionally minimal. The product chrome (sidebar, header) is provided
	 * by the per-route layouts under /app — this root layout exists so that
	 * unauthenticated screens like /auth/login can render full-bleed.
	 */

	import './layout.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types.js';
	import { t } from '$lib/i18n/index.js';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();
</script>

<div class="flex min-h-screen flex-col">
	<!-- Skip navigation link for keyboard/screen reader users -->
	<a
		href="#main-content"
		class="sr-only absolute top-4 left-4 z-50 rounded-md bg-accent1 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:outline-none"
	>
		{t(data.locale, 'a11y.skip_to_content')}
	</a>

	<main id="main-content" class="flex-1">
		{@render children()}
	</main>
</div>
