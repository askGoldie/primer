<script lang="ts">
	/**
	 * ShimmerButton Component
	 *
	 * A button with a shimmering light effect that draws attention.
	 * Uses pure CSS animations - no external dependencies.
	 *
	 * @example
	 * <ShimmerButton onclick={handleClick}>Get Started</ShimmerButton>
	 */

	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/** Button content */
		children: Snippet;
		/** Background color */
		background?: string;
		/** Shimmer color */
		shimmerColor?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		children,
		background = 'var(--color-accent1)',
		shimmerColor = 'rgba(255, 255, 255, 0.3)',
		class: className = '',
		...restProps
	}: Props = $props();
</script>

<button
	class="shimmer-button group relative overflow-hidden rounded-lg px-8 py-3 font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] {className}"
	style="background: {background};"
	{...restProps}
>
	<!-- Shimmer effect -->
	<span
		class="shimmer-effect absolute inset-0 -translate-x-full"
		style="background: linear-gradient(90deg, transparent, {shimmerColor}, transparent);"
	></span>

	<!-- Button content -->
	<span class="relative z-10">
		{@render children()}
	</span>
</button>

<style>
	.shimmer-button:hover .shimmer-effect {
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
</style>
