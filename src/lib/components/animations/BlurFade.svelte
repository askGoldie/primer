<script lang="ts">
	/**
	 * BlurFade Component
	 *
	 * Animates content with a combined blur and fade effect on mount.
	 * Uses CSS animations instead of DOM swaps to avoid forced reflows.
	 *
	 * @example
	 * <BlurFade delay={200}>
	 *   <h1>Welcome</h1>
	 * </BlurFade>
	 */

	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Content to animate */
		children: Snippet;
		/** Delay before animation starts in milliseconds */
		delay?: number;
		/** Animation duration in milliseconds */
		duration?: number;
		/** Direction of movement: up, down, left, right */
		direction?: 'up' | 'down' | 'left' | 'right';
		/** Distance to travel in pixels */
		offset?: number;
		/** Blur amount in pixels */
		blurAmount?: number;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		children,
		delay = 0,
		duration = 400,
		direction = 'up',
		offset = 12,
		blurAmount = 6,
		class: className = ''
	}: Props = $props();

	let visible = $state(false);

	const translate = $derived(
		{
			up: `translateY(${offset}px)`,
			down: `translateY(-${offset}px)`,
			left: `translateX(${offset}px)`,
			right: `translateX(-${offset}px)`
		}[direction]
	);

	onMount(() => {
		const timeout = setTimeout(() => {
			visible = true;
		}, delay);

		return () => clearTimeout(timeout);
	});
</script>

<div
	class={className}
	style="
		opacity: {visible ? 1 : 0};
		filter: blur({visible ? 0 : blurAmount}px);
		transform: {visible ? 'translateY(0) translateX(0)' : translate};
		transition: opacity {duration}ms cubic-bezier(0.33, 1, 0.68, 1),
			filter {duration}ms cubic-bezier(0.33, 1, 0.68, 1),
			transform {duration}ms cubic-bezier(0.33, 1, 0.68, 1);
		will-change: opacity, filter, transform;
	"
>
	{@render children()}
</div>
