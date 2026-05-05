<script lang="ts">
	/**
	 * LineChart — SVG line chart for score trends
	 *
	 * Renders a responsive SVG line chart with optional area fill,
	 * data point dots, and tier-coloured segments. Built with pure
	 * SVG so customers don't need a charting library dependency.
	 *
	 * @example
	 * <LineChart
	 *   points={[{ value: 3.2, label: 'Jan 25' }, { value: 3.8, label: 'Feb 25' }]}
	 *   min={1}
	 *   max={5}
	 *   height={200}
	 *   color="#8B4E1E"
	 * />
	 */

	import { getTierColor } from '$lib/utils/score.js';
	import type { TierLevel } from '$lib/types/index.js';

	interface ChartPoint {
		value: number;
		label: string;
		tier?: TierLevel;
	}

	let {
		points = [],
		min = 1,
		max = 5,
		height = 200,
		color = '#8B4E1E',
		showArea = true,
		showDots = true,
		showLabels = true,
		tierColored = false
	}: {
		points: ChartPoint[];
		min?: number;
		max?: number;
		height?: number;
		color?: string;
		showArea?: boolean;
		showDots?: boolean;
		showLabels?: boolean;
		tierColored?: boolean;
	} = $props();

	/** Chart layout constants */
	const PADDING = { top: 16, right: 16, bottom: 32, left: 40 };

	/** Internal width — 100% of container, calculated from viewBox */
	const viewBoxWidth = 600;

	/** Usable drawing area */
	const plotWidth = viewBoxWidth - PADDING.left - PADDING.right;
	const plotHeight = $derived(height - PADDING.top - PADDING.bottom);

	/** Convert a data value to y-coordinate */
	function yScale(v: number): number {
		const ratio = (v - min) / (max - min);
		return PADDING.top + plotHeight - ratio * plotHeight;
	}

	/** Convert a data index to x-coordinate */
	function xScale(i: number): number {
		if (points.length <= 1) return PADDING.left + plotWidth / 2;
		return PADDING.left + (i / (points.length - 1)) * plotWidth;
	}

	/** SVG path for the line */
	const linePath = $derived(
		points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.value).toFixed(1)}`)
			.join(' ')
	);

	/** SVG path for the filled area under the line */
	const areaPath = $derived(
		linePath +
			` L ${xScale(points.length - 1).toFixed(1)} ${yScale(min).toFixed(1)}` +
			` L ${xScale(0).toFixed(1)} ${yScale(min).toFixed(1)} Z`
	);

	/** Y-axis tier reference lines */
	const tierLines = [
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 3, label: '3' },
		{ value: 4, label: '4' },
		{ value: 5, label: '5' }
	].filter((t) => t.value >= min && t.value <= max);
</script>

{#if points.length > 0}
	<svg
		viewBox="0 0 {viewBoxWidth} {height}"
		class="w-full"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Line chart showing score trend"
	>
		<!-- Grid lines -->
		{#each tierLines as line (line.value)}
			<line
				x1={PADDING.left}
				y1={yScale(line.value)}
				x2={viewBoxWidth - PADDING.right}
				y2={yScale(line.value)}
				stroke="currentColor"
				stroke-opacity="0.1"
				stroke-dasharray="4 4"
			/>
			<text
				x={PADDING.left - 8}
				y={yScale(line.value) + 4}
				text-anchor="end"
				fill="currentColor"
				fill-opacity="0.5"
				font-size="11"
			>
				{line.label}
			</text>
		{/each}

		<!-- Area fill -->
		{#if showArea && points.length > 1}
			<path d={areaPath} fill={color} fill-opacity="0.08" />
		{/if}

		<!-- Line -->
		{#if points.length > 1}
			<path
				d={linePath}
				fill="none"
				stroke={color}
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		<!-- Data points -->
		{#if showDots}
			{#each points as point, i (i)}
				<circle
					cx={xScale(i)}
					cy={yScale(point.value)}
					r="4"
					fill={tierColored && point.tier ? getTierColor(point.tier) : color}
					stroke="white"
					stroke-width="2"
				/>
			{/each}
		{/if}

		<!-- X-axis labels -->
		{#if showLabels}
			{#each points as point, i (i)}
				{#if points.length <= 12 || i % Math.ceil(points.length / 8) === 0}
					<text
						x={xScale(i)}
						y={height - 4}
						text-anchor="middle"
						fill="currentColor"
						fill-opacity="0.5"
						font-size="10"
					>
						{point.label}
					</text>
				{/if}
			{/each}
		{/if}
	</svg>
{/if}
