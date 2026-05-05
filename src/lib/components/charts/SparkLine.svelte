<script lang="ts">
	/**
	 * SparkLine — Compact SVG inline chart for mini trends
	 *
	 * Small, label-free line chart used inside table rows and cards
	 * to show directional trend at a glance.
	 *
	 * @example
	 * <SparkLine values={[3.2, 3.4, 3.1, 3.8]} color="#2C6EA6" />
	 */

	let {
		values = [],
		width = 80,
		height = 24,
		color = '#8B4E1E',
		min = 1,
		max = 5
	}: {
		values: number[];
		width?: number;
		height?: number;
		color?: string;
		min?: number;
		max?: number;
	} = $props();

	const padding = 2;
	const plotW = $derived(width - padding * 2);
	const plotH = $derived(height - padding * 2);

	function y(v: number): number {
		const ratio = (v - min) / (max - min || 1);
		return padding + plotH - ratio * plotH;
	}

	function x(i: number): number {
		if (values.length <= 1) return padding + plotW / 2;
		return padding + (i / (values.length - 1)) * plotW;
	}

	const path = $derived(
		values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
	);
</script>

{#if values.length > 1}
	<svg {width} {height} viewBox="0 0 {width} {height}" class="inline-block">
		<path
			d={path}
			fill="none"
			stroke={color}
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<!-- End dot -->
		<circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="2" fill={color} />
	</svg>
{/if}
