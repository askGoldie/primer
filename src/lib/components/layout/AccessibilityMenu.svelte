<script lang="ts">
	/**
	 * AccessibilityMenu Component
	 *
	 * Dropdown for public-facing accessibility options:
	 *   - Text size (normal / large / extra-large)
	 *   - High contrast mode
	 *   - Reduced motion
	 *
	 * Mirrors the LanguageSwitcher pattern. Preferences are persisted
	 * via cookie and applied as data attributes on <html>.
	 */

	import { browser } from '$app/environment';
	import { SvelteDate } from 'svelte/reactivity';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';

	interface Props {
		/** Current locale for i18n labels */
		locale: Locale;
		/** Direction the dropdown opens — "down" (default) or "up" for bottom-anchored contexts */
		direction?: 'up' | 'down';
	}

	let { locale, direction = 'down' }: Props = $props();

	let isOpen = $state(false);

	/** Cookie name for accessibility preferences */
	const A11Y_COOKIE = 'primer_a11y';

	/** Text size options */
	type TextSize = 'normal' | 'large' | 'xl';
	const TEXT_SIZES: TextSize[] = ['normal', 'large', 'xl'];

	/** Current state — read from cookie on mount */
	let textSize: TextSize = $state('normal');
	let highContrast: boolean = $state(false);
	let reducedMotion: boolean = $state(false);

	/** Read prefs from cookie on initialization */
	if (browser) {
		const prefs = readCookie();
		if (prefs) {
			textSize = prefs.textSize;
			highContrast = prefs.highContrast;
			reducedMotion = prefs.reducedMotion;
		}
		applyToDOM();
	}

	/** Apply current prefs to <html> data attributes */
	function applyToDOM() {
		if (!browser) return;
		const el = document.documentElement;

		if (textSize === 'normal') {
			el.removeAttribute('data-a11y-text');
		} else {
			el.setAttribute('data-a11y-text', textSize);
		}

		if (highContrast) {
			el.setAttribute('data-a11y-contrast', 'high');
		} else {
			el.removeAttribute('data-a11y-contrast');
		}

		if (reducedMotion) {
			el.setAttribute('data-a11y-motion', 'reduce');
		} else {
			el.removeAttribute('data-a11y-motion');
		}
	}

	/** Persist prefs to cookie */
	function saveCookie() {
		if (!browser) return;
		const expires = new SvelteDate();
		expires.setFullYear(expires.getFullYear() + 1);

		const value = JSON.stringify({ textSize, highContrast, reducedMotion });
		document.cookie = `${A11Y_COOKIE}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
	}

	/** Read prefs from cookie */
	function readCookie(): {
		textSize: TextSize;
		highContrast: boolean;
		reducedMotion: boolean;
	} | null {
		if (!browser) return null;
		const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${A11Y_COOKIE}=([^;]*)`));
		if (!match) return null;
		try {
			return JSON.parse(decodeURIComponent(match[1]));
		} catch {
			return null;
		}
	}

	/** Update a preference, persist, and apply */
	function setTextSize(size: TextSize) {
		textSize = size;
		saveCookie();
		applyToDOM();
	}

	function toggleContrast() {
		highContrast = !highContrast;
		saveCookie();
		applyToDOM();
	}

	function toggleMotion() {
		reducedMotion = !reducedMotion;
		saveCookie();
		applyToDOM();
	}

	/** i18n keys for text size labels */
	const textSizeLabelKey: Record<TextSize, string> = {
		normal: 'a11y.text_normal',
		large: 'a11y.text_large',
		xl: 'a11y.text_xl'
	};

	/** Check if any accessibility option is active */
	let hasActiveOption = $derived(textSize !== 'normal' || highContrast || reducedMotion);
</script>

<div class="relative">
	<button
		type="button"
		class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary hover:bg-surfaceMid hover:text-primary"
		onclick={() => (isOpen = !isOpen)}
		aria-expanded={isOpen}
		aria-haspopup="menu"
		aria-label={t(locale, 'a11y.menu_label')}
	>
		<!-- Accessibility icon -->
		<svg
			class="h-4 w-4"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="4.5" r="2.5" />
			<path d="M12 7v6m0 0l-3 5m3-5l3 5" />
			<path d="M6 10h12" />
		</svg>
		<!-- Active indicator dot -->
		{#if hasActiveOption}
			<span class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent1"></span>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute z-50 w-64 rounded-md border border-border bg-surfaceMid py-2 shadow-lg
				{direction === 'up'
				? 'bottom-full left-0 mb-1 rtl:right-0 rtl:left-auto'
				: 'right-0 mt-1 rtl:right-auto rtl:left-0'}"
			role="menu"
			aria-label={t(locale, 'a11y.menu_label')}
		>
			<!-- Menu heading -->
			<p class="mb-2 px-4 text-xs font-semibold tracking-wide text-secondary uppercase">
				{t(locale, 'a11y.menu_label')}
			</p>

			<!-- Text size selector -->
			<div class="px-4 py-2">
				<p class="mb-1.5 text-xs font-medium text-secondary">
					{t(locale, 'a11y.text_size')}
				</p>
				<div class="flex gap-1">
					{#each TEXT_SIZES as size (size)}
						<button
							type="button"
							class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors
								{size === textSize ? 'bg-accent1 text-white' : 'bg-surfaceHigh text-secondary hover:text-primary'}"
							onclick={() => setTextSize(size)}
							role="menuitemradio"
							aria-checked={size === textSize}
						>
							{t(locale, textSizeLabelKey[size])}
						</button>
					{/each}
				</div>
			</div>

			<div class="my-1 border-t border-border"></div>

			<!-- High contrast toggle -->
			<button
				type="button"
				class="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-surfaceLight
					{highContrast ? 'text-primary' : 'text-secondary'}"
				onclick={toggleContrast}
				role="menuitemcheckbox"
				aria-checked={highContrast}
			>
				<span class="flex items-center gap-2">
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
					</svg>
					{t(locale, 'a11y.high_contrast')}
				</span>
				<!-- Toggle indicator -->
				<span
					class="flex h-5 w-9 items-center rounded-full px-0.5 transition-colors
						{highContrast ? 'bg-accent1' : 'bg-surfaceHigh'}"
				>
					<span
						class="h-4 w-4 rounded-full bg-white shadow-sm transition-transform
							{highContrast ? 'translate-x-4' : 'translate-x-0'}"
					></span>
				</span>
			</button>

			<!-- Reduced motion toggle -->
			<button
				type="button"
				class="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-surfaceLight
					{reducedMotion ? 'text-primary' : 'text-secondary'}"
				onclick={toggleMotion}
				role="menuitemcheckbox"
				aria-checked={reducedMotion}
			>
				<span class="flex items-center gap-2">
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M5 12h14" />
						<path d="M5 12l4-4m-4 4l4 4" />
					</svg>
					{t(locale, 'a11y.reduced_motion')}
				</span>
				<!-- Toggle indicator -->
				<span
					class="flex h-5 w-9 items-center rounded-full px-0.5 transition-colors
						{reducedMotion ? 'bg-accent1' : 'bg-surfaceHigh'}"
				>
					<span
						class="h-4 w-4 rounded-full bg-white shadow-sm transition-transform
							{reducedMotion ? 'translate-x-4' : 'translate-x-0'}"
					></span>
				</span>
			</button>
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
