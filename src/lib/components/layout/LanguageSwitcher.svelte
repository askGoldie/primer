<script lang="ts">
	/**
	 * LanguageSwitcher Component
	 *
	 * Allows users to change the site language.
	 * Persists selection via cookie.
	 */

	import type { Locale } from '$lib/types/index.js';
	import { SUPPORTED_LOCALES, LOCALE_NAMES, isRTL } from '$lib/types/index.js';
	import { t, setLocaleCookie } from '$lib/i18n/index.js';

	interface Props {
		/** Current locale */
		locale: Locale;
		/** Callback when locale changes */
		onchange?: (locale: Locale) => void;
		/** Direction the dropdown opens — "down" (default) or "up" for bottom-anchored contexts */
		direction?: 'up' | 'down';
	}

	let { locale, onchange, direction = 'down' }: Props = $props();

	let isOpen = $state(false);

	function selectLocale(newLocale: Locale) {
		setLocaleCookie(newLocale);
		isOpen = false;
		onchange?.(newLocale);
		// Reload the page to apply the new locale
		window.location.reload();
	}
</script>

<div class="relative">
	<button
		type="button"
		class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary hover:bg-surfaceMid hover:text-primary"
		onclick={() => (isOpen = !isOpen)}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
			/>
		</svg>
		<span>{LOCALE_NAMES[locale]}</span>
		<svg
			class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute z-50 w-48 rounded-md border border-border bg-surfaceMid py-1 shadow-lg
			{direction === 'up'
				? 'bottom-full left-0 mb-1 rtl:right-0 rtl:left-auto'
				: 'right-0 mt-1 rtl:right-auto rtl:left-0'}"
			role="listbox"
			aria-label={t(locale, 'nav.language_switcher')}
		>
			{#each SUPPORTED_LOCALES as loc (loc)}
				<button
					type="button"
					class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-surfaceLight
						{loc === locale ? 'bg-surfaceLight font-medium text-primary' : 'text-secondary'}"
					onclick={() => selectLocale(loc)}
					role="option"
					aria-selected={loc === locale}
				>
					<span class="flex-1 text-left rtl:text-right">{LOCALE_NAMES[loc]}</span>
					{#if isRTL(loc)}
						<span class="text-xs text-secondary">(RTL)</span>
					{/if}
					{#if loc === locale}
						<svg class="h-4 w-4 text-accent1" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- Close dropdown when clicking outside or pressing Escape -->
<svelte:window
	onclick={(e) => {
		if (isOpen && !(e.target as HTMLElement).closest('.relative')) {
			isOpen = false;
		}
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') isOpen = false;
	}}
/>
