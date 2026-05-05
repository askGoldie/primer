<script lang="ts">
	/**
	 * Onboarding Page
	 *
	 * CEO / system-admin facing tour of Primer. Presents three paths based
	 * on where the customer is in their goal-system maturity, then walks
	 * them through a short step sequence for the path they pick.
	 *
	 * ─────────────────────────────────────────────────────────────────────
	 * TO REMOVE: see the removal checklist at the top of
	 * src/lib/components/onboarding/paths.ts
	 * ─────────────────────────────────────────────────────────────────────
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import PathSelector from '$lib/components/onboarding/PathSelector.svelte';
	import PathWalkthrough from '$lib/components/onboarding/PathWalkthrough.svelte';
	import type { OnboardingPath } from '$lib/components/onboarding/paths.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Selected path, or `null` when the user is on the landing/selector view.
	 * Kept in component-local state (not a query param) so switching paths
	 * doesn't clutter the browser history — onboarding is a one-shot read,
	 * not a navigation surface.
	 */
	let activePath = $state<OnboardingPath | null>(null);

	function handleSelect(path: OnboardingPath) {
		activePath = path;
	}

	function handleBack() {
		activePath = null;
	}
</script>

<svelte:head>
	<title>{t(data.locale, 'onboarding.title')}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-6 py-8">
	<!--
		Admin-only pill — makes it obvious to the CEO/admin previewing the
		tab that regular users will not see it, so they don't have to go
		hunting for the access-control code.
	-->
	<div
		class="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surfaceMid px-3 py-1 text-xs text-secondary"
	>
		<svg
			class="h-3.5 w-3.5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
			/>
		</svg>
		{t(data.locale, 'onboarding.admin_only_note')}
	</div>

	{#if activePath}
		<PathWalkthrough locale={data.locale} path={activePath} onBack={handleBack} />
	{:else}
		<PathSelector locale={data.locale} onSelect={handleSelect} />
	{/if}
</div>
