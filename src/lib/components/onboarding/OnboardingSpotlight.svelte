<script lang="ts">
	/**
	 * OnboardingSpotlight
	 *
	 * First-visit coach mark that draws attention to the onboarding nav
	 * link without blocking the user. On mount, checks a localStorage
	 * flag — if the user has never seen the spotlight before, it dims
	 * the main content area, adds a pulsing ring to the target nav link
	 * (which sits above the dim layer because the sidebar has a higher
	 * z-index), and renders a small callout bubble pointing at the link.
	 *
	 * Non-blocking by design: a click anywhere, the Escape key, a route
	 * change, or the explicit dismiss button will all close it. The nav
	 * link itself remains clickable throughout — if the user clicks it,
	 * they land on the onboarding page and the spotlight is dismissed
	 * as a side effect.
	 *
	 * Skipped entirely on mobile (< lg breakpoint) because the sidebar
	 * is hidden behind a drawer there and spotlighting off-screen UI
	 * would be pointless. If the user later visits on desktop the
	 * spotlight fires normally — the flag is only set once the user
	 * has actually seen and dismissed it.
	 *
	 * Part of the removable onboarding feature — see
	 * src/lib/components/onboarding/paths.ts for the removal checklist.
	 */

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';

	interface Props {
		locale: Locale;
		/** DOM id of the element to highlight (the onboarding nav link) */
		targetId: string;
	}

	let { locale, targetId }: Props = $props();

	/**
	 * localStorage key. Bumping the suffix re-triggers the spotlight for
	 * every user — useful if the onboarding content changes significantly
	 * and you want existing users to notice.
	 */
	const STORAGE_KEY = 'primer_onboarding_spotlight_seen_v1';

	/** Tailwind `lg` breakpoint — matches the layout's `lg:` sidebar rules. */
	const DESKTOP_MIN_WIDTH = 1024;

	/** Is the spotlight currently visible? */
	let visible = $state(false);

	/** Viewport-space position of the callout bubble, recomputed on resize. */
	let calloutTop = $state(0);
	let calloutLeft = $state(0);

	/**
	 * Mark the spotlight as seen and tear it down. Safe to call multiple
	 * times — subsequent calls are no-ops.
	 */
	function dismiss() {
		if (!visible) return;
		visible = false;
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEY, '1');
			} catch {
				// localStorage can throw in private browsing / quota cases.
				// Failing silent is fine — worst case the spotlight shows again.
			}
		}
		removeListeners();
		removeTargetClass();
	}

	/**
	 * Read the target element's bounding rect and position the callout
	 * to its right, vertically centered.
	 */
	function positionCallout(): boolean {
		const target = document.getElementById(targetId);
		if (!target) return false;
		const rect = target.getBoundingClientRect();
		// Width/height of zero means the element is display:none or
		// translated off-screen (e.g. the mobile sidebar drawer) — bail.
		if (rect.width === 0 || rect.height === 0) return false;
		calloutTop = rect.top + rect.height / 2;
		calloutLeft = rect.right + 12;
		return true;
	}

	function addTargetClass() {
		document.getElementById(targetId)?.classList.add('onboarding-spotlight-active');
	}

	function removeTargetClass() {
		document.getElementById(targetId)?.classList.remove('onboarding-spotlight-active');
	}

	function handleWindowClick() {
		// Any click anywhere dismisses — including clicks on the nav
		// link itself, which still navigate normally because we don't
		// call preventDefault.
		dismiss();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') dismiss();
	}

	function handleResize() {
		if (!visible) return;
		if (window.innerWidth < DESKTOP_MIN_WIDTH) {
			// Dropped below the breakpoint — hide rather than dismiss, so
			// a later resize back up can reposition cleanly.
			dismiss();
			return;
		}
		positionCallout();
	}

	function addListeners() {
		// `capture: true` so clicks on child elements still count.
		window.addEventListener('click', handleWindowClick, { capture: true });
		window.addEventListener('keydown', handleKey);
		window.addEventListener('resize', handleResize);
	}

	function removeListeners() {
		window.removeEventListener('click', handleWindowClick, { capture: true });
		window.removeEventListener('keydown', handleKey);
		window.removeEventListener('resize', handleResize);
	}

	onMount(() => {
		if (!browser) return;

		// Don't spotlight the tab while the user is already on it.
		if ($page.url.pathname.startsWith('/app/onboarding')) return;

		// Desktop only — skip on mobile, see component doc.
		if (window.innerWidth < DESKTOP_MIN_WIDTH) return;

		// Has the user already seen it? Respect localStorage if available.
		try {
			if (localStorage.getItem(STORAGE_KEY) === '1') return;
		} catch {
			// Treat an inaccessible localStorage as "first visit" — worst
			// case we show the spotlight once per page load until storage
			// works, which is still a better default than hiding it.
		}

		// Defer one frame so the target nav link is definitely in the DOM
		// and laid out. Without this, getBoundingClientRect may return
		// zeros during the initial mount pass.
		const frameId = requestAnimationFrame(() => {
			if (!positionCallout()) return;
			visible = true;
			addTargetClass();
			// Delay attaching the click listener a tick so the click that
			// navigated the user to /app (or any in-page click that
			// happened to bubble up during mount) doesn't instantly
			// dismiss the spotlight.
			setTimeout(addListeners, 80);
		});

		return () => {
			cancelAnimationFrame(frameId);
			removeListeners();
			removeTargetClass();
		};
	});
</script>

{#if visible}
	<!--
		Dim layer for the main content area. Lives at z-30, which sits
		below the sidebar (z-40) so the sidebar — and the pulsing nav
		link inside it — stay crisp above the dim without any z-index
		escape hatch. pointer-events-none so the dim never intercepts
		clicks: the window-level click handler above is what actually
		dismisses.
	-->
	<div
		class="pointer-events-none fixed inset-0 z-30 bg-black/40 transition-opacity"
		aria-hidden="true"
	></div>

	<!--
		Callout bubble. Fixed-positioned so we can place it next to the
		nav link using viewport coordinates. z-50 keeps it above both the
		dim layer and the sidebar. Rendered as role="status" + aria-live
		so screen readers announce it without stealing focus.
	-->
	<div
		class="fixed z-50 max-w-xs"
		style="top: {calloutTop}px; left: {calloutLeft}px; transform: translateY(-50%);"
		role="status"
		aria-live="polite"
	>
		<div class="relative rounded-lg border border-accent1/40 bg-surfaceMid p-4 shadow-lg">
			<!-- Arrow tip pointing left at the nav link -->
			<div
				class="absolute top-1/2 -left-1.5 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-accent1/40 bg-surfaceMid"
				aria-hidden="true"
			></div>

			<h3 class="text-sm font-semibold text-primary">
				{t(locale, 'onboarding.spotlight.title')}
			</h3>
			<p class="mt-1 text-xs leading-relaxed text-secondary">
				{t(locale, 'onboarding.spotlight.body')}
			</p>
			<button
				type="button"
				onclick={dismiss}
				class="mt-3 text-xs font-medium text-accent1 hover:underline"
			>
				{t(locale, 'onboarding.spotlight.dismiss_label')}
			</button>
		</div>
	</div>
{/if}

<style>
	/*
	 * :global because the class is applied to an element that lives
	 * outside this component's scope (the onboarding nav <a> in the
	 * app layout). Keeping the styling here rather than in layout.css
	 * so everything related to the spotlight is removable in one folder.
	 */
	:global(.onboarding-spotlight-active) {
		outline: 2px solid var(--color-accent1);
		outline-offset: 2px;
		border-radius: 0.5rem;
		animation: onboarding-spotlight-pulse 1.8s ease-in-out infinite;
	}

	@keyframes onboarding-spotlight-pulse {
		0%,
		100% {
			outline-color: var(--color-accent1);
			outline-offset: 2px;
		}
		50% {
			outline-color: var(--color-accent1-light, var(--color-accent1));
			outline-offset: 4px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.onboarding-spotlight-active) {
			animation: none;
		}
	}
</style>
