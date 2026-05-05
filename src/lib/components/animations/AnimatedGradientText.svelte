<script lang="ts">
	/**
	 * AnimatedGradientText Component
	 *
	 * Renders text with a flowing gradient animation.
	 * Adapted from animation-svelte library for Primer's design system.
	 *
	 * @example
	 * <AnimatedGradientText colorFrom="#8B4E1E" colorTo="#3D5A3E">
	 *   Your Goals. Your Code.
	 * </AnimatedGradientText>
	 */

	import type { Snippet } from 'svelte';

	interface Props {
		/** Content to render with gradient */
		children: Snippet;
		/** Animation speed multiplier */
		speed?: number;
		/** Gradient start color */
		colorFrom?: string;
		/** Gradient end color */
		colorTo?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		children,
		speed = 1,
		colorFrom = '#8B4E1E',
		colorTo = '#3D5A3E',
		class: className = ''
	}: Props = $props();
</script>

<span
	style="--color-from:{colorFrom}; --color-to:{colorTo}; --bg-size:{300 * speed}%"
	class="animate-gradient inline bg-linear-to-r from-(--color-from) via-(--color-to) to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent {className}"
>
	{@render children()}
</span>
