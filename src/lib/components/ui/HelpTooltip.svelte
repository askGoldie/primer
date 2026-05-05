<script lang="ts">
	/**
	 * HelpTooltip Component
	 *
	 * A small `?` icon button that reveals a contextual guidance tooltip on
	 * hover, focus (keyboard), or click (touch). Designed to annotate key
	 * workflow steps throughout the Primer application.
	 *
	 * Accessibility:
	 * - Trigger button is keyboard-focusable and announces `role="tooltip"`
	 * - Tooltip text is linked via `aria-describedby`
	 * - Escape key dismisses the tooltip
	 * - Tooltip itself is non-interactive (no links or buttons inside)
	 *
	 * Positioning:
	 * - Uses `position: fixed` to escape overflow/z-index constraints
	 * - Prefers rendering above the trigger; flips below when near the top
	 * - Clamps horizontally to avoid viewport edges
	 *
	 * Usage:
	 *   <HelpTooltip text={t(data.locale, 'tooltip.stack.add_metric')} />
	 */

	import { browser } from '$app/environment';

	interface Props {
		/** Pre-translated tooltip text. Pass t(locale, key) from the parent. */
		text: string;
		/** Preferred placement. Flips automatically when near viewport edge. */
		position?: 'top' | 'bottom';
	}

	let { text, position = 'top' }: Props = $props();

	let visible = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let tooltipStyle = $state('');

	/**
	 * Unique ID so each tooltip instance has its own aria-describedby link.
	 * Math.random gives sufficient uniqueness for a session; no crypto needed.
	 */
	const tooltipId = `ht-${Math.random().toString(36).slice(2, 9)}`;

	/** Max width of the tooltip bubble (matches Tailwind max-w-xs = 320px) */
	const TOOLTIP_W = 280;
	const GAP = 8; // px gap between trigger and tooltip

	function computePosition() {
		if (!browser || !triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// Horizontal: centre on trigger, clamp to viewport with 12px margin
		const rawLeft = rect.left + rect.width / 2;
		const left = Math.max(TOOLTIP_W / 2 + 12, Math.min(vw - TOOLTIP_W / 2 - 12, rawLeft));

		// Vertical: prefer top unless too close to the top edge
		const showAbove = position === 'top' && rect.top > 100;
		if (showAbove) {
			const bottom = vh - rect.top + GAP;
			tooltipStyle = `position:fixed;bottom:${bottom}px;left:${left}px;transform:translateX(-50%);width:${TOOLTIP_W}px;`;
		} else {
			const top = rect.bottom + GAP;
			tooltipStyle = `position:fixed;top:${top}px;left:${left}px;transform:translateX(-50%);width:${TOOLTIP_W}px;`;
		}
	}

	function show() {
		computePosition();
		visible = true;
	}

	function hide() {
		visible = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && visible) hide();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!--
  Wrapper is `inline-flex` so it does not disrupt surrounding text flow.
  It must NOT be `relative` — the tooltip is fixed-positioned independently.
-->
<span class="inline-flex items-center">
	<button
		bind:this={triggerEl}
		type="button"
		aria-describedby={visible ? tooltipId : undefined}
		aria-label="Help"
		class="flex h-4 w-4 flex-shrink-0 cursor-help items-center justify-center rounded-full border border-border bg-surface text-[9px] leading-none font-semibold text-secondary transition-colors hover:border-accent1 hover:text-accent1 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent1"
		onmouseenter={show}
		onmouseleave={hide}
		onfocus={show}
		onblur={hide}
		onclick={() => (visible ? hide() : show())}
	>
		?
	</button>

	{#if visible}
		<div
			id={tooltipId}
			role="tooltip"
			style={tooltipStyle}
			class="z-50 max-w-xs rounded-lg border border-border bg-surfaceMid px-3 py-2.5 text-xs leading-relaxed text-secondary shadow-lg"
		>
			{text}
		</div>
	{/if}
</span>
