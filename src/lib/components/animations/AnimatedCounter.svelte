<script lang="ts">
	/**
	 * AnimatedCounter Component
	 *
	 * Animates an integer counter with a smooth counting effect.
	 * Optimized for whole numbers like stats and metrics.
	 *
	 * @example
	 * <AnimatedCounter value={1234} />
	 */

	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount, untrack } from 'svelte';

	interface Props {
		/** Target value to count to */
		value: number;
		/** Animation duration in milliseconds */
		duration?: number;
		/** Delay before animation starts in milliseconds */
		delay?: number;
		/** Additional CSS classes */
		class?: string;
		/** Locale for number formatting */
		locale?: string;
		/** Prefix (e.g., "$") */
		prefix?: string;
		/** Suffix (e.g., "%") */
		suffix?: string;
	}

	let {
		value,
		duration = 1200,
		delay = 0,
		class: className = '',
		locale = 'en-US',
		prefix = '',
		suffix = ''
	}: Props = $props();

	// Create tweened store with initial config values only (animation config is fixed at mount)
	const displayValue = tweened(0, {
		duration: untrack(() => duration),
		easing: cubicOut
	});

	let hasAnimated = $state(false);

	onMount(() => {
		const timeout = setTimeout(() => {
			displayValue.set(value);
			hasAnimated = true;
		}, delay);

		return () => clearTimeout(timeout);
	});

	// React to value changes after initial animation
	$effect(() => {
		if (hasAnimated) {
			displayValue.set(value);
		}
	});

	const formattedValue = $derived(new Intl.NumberFormat(locale).format(Math.round($displayValue)));
</script>

<span class="tabular-nums {className}">
	{prefix}{formattedValue}{suffix}
</span>
