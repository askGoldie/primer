<script lang="ts">
	/**
	 * Marquee Component
	 *
	 * Infinite scrolling content in horizontal or vertical direction.
	 * Adapted from animation-svelte library for Primer's design system.
	 *
	 * @example
	 * <Marquee pauseOnHover>
	 *   <div>Item 1</div>
	 *   <div>Item 2</div>
	 * </Marquee>
	 */

	import type { Snippet } from 'svelte';

	interface Props {
		/** Content to scroll */
		children: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Reverse scroll direction */
		reverse?: boolean;
		/** Pause animation on hover */
		pauseOnHover?: boolean;
		/** Scroll vertically instead of horizontally */
		vertical?: boolean;
		/** Number of times to repeat content for seamless loop */
		repeat?: number;
	}

	let {
		children,
		class: className = '',
		reverse = false,
		pauseOnHover = false,
		vertical = false,
		repeat = 4
	}: Props = $props();
</script>

<div
	class="group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem] {vertical
		? 'flex-col'
		: 'flex-row'} {className}"
>
	{#each Array(repeat).fill(0) as _item, i (i)}
		<div
			class="flex shrink-0 justify-around gap-(--gap) {vertical
				? 'animate-marquee-vertical flex-col'
				: 'animate-marquee flex-row'} {pauseOnHover ? 'group-hover:paused' : ''} {reverse
				? 'direction-[reverse]'
				: ''}"
		>
			{@render children()}
		</div>
	{/each}
</div>
