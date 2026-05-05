<script lang="ts">
	/**
	 * NumberTicker Component
	 *
	 * Animates a number from a start value to the target value using
	 * Svelte's built-in tweened store with spring-like easing.
	 *
	 * @example
	 * <NumberTicker value={3.6} decimalPlaces={1} />
	 */

	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount, untrack } from 'svelte';

	interface Props {
		/** Target value to animate to */
		value: number;
		/** Starting value (defaults to 0) */
		startValue?: number;
		/** Number of decimal places to display */
		decimalPlaces?: number;
		/** Animation duration in milliseconds */
		duration?: number;
		/** Delay before animation starts in milliseconds */
		delay?: number;
		/** Additional CSS classes */
		class?: string;
		/** Locale for number formatting */
		locale?: string;
	}

	let {
		value,
		startValue = 0,
		decimalPlaces = 0,
		duration = 1500,
		delay = 0,
		class: className = '',
		locale = 'en-US'
	}: Props = $props();

	// Create tweened store with initial config values only (animation config is fixed at mount)
	const displayValue = tweened(
		untrack(() => startValue),
		{
			duration: untrack(() => duration),
			easing: cubicOut
		}
	);

	/**
	 * Format the number for display
	 */
	const formattedValue = $derived(
		new Intl.NumberFormat(locale, {
			minimumFractionDigits: decimalPlaces,
			maximumFractionDigits: decimalPlaces
		}).format($displayValue)
	);

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
</script>

<span class="tabular-nums {className}">
	{formattedValue}
</span>
