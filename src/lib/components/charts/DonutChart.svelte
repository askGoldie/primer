<script lang="ts">
	/**
	 * DonutChart — SVG donut/pie chart for tier distribution
	 *
	 * Renders a responsive SVG donut chart with tier-coloured segments
	 * and a centre label. Built with pure SVG.
	 *
	 * @example
	 * <DonutChart
	 *   segments={[
	 *     { label: 'Alarm', value: 2, color: '#B03A2E' },
	 *     { label: 'Effective', value: 5, color: '#2C6EA6' }
	 *   ]}
	 *   size={180}
	 * />
	 */

	interface Segment {
		label: string;
		value: number;
		color: string;
	}

	let {
		segments = [],
		size = 180,
		strokeWidth = 28,
		centerLabel = '',
		centerValue = ''
	}: {
		segments: Segment[];
		size?: number;
		strokeWidth?: number;
		centerLabel?: string;
		centerValue?: string;
	} = $props();

	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const center = $derived(size / 2);
	const total = $derived(segments.reduce((sum, s) => sum + s.value, 0));

	/** Calculate arc segments with cumulative offsets */
	const arcs = $derived(
		(() => {
			let offset = 0;
			return segments
				.filter((s) => s.value > 0)
				.map((s) => {
					const fraction = total > 0 ? s.value / total : 0;
					const dashLength = fraction * circumference;
					const dashOffset = -offset;
					offset += dashLength;
					return {
						...s,
						fraction,
						dashLength,
						dashOffset,
						percentage: Math.round(fraction * 100)
					};
				});
		})()
	);
</script>

{#if total > 0}
	<div class="flex flex-col items-center gap-3">
		<svg
			width={size}
			height={size}
			viewBox="0 0 {size} {size}"
			role="img"
			aria-label="Donut chart showing tier distribution"
		>
			<!-- Background ring -->
			<circle
				cx={center}
				cy={center}
				r={radius}
				fill="none"
				stroke="currentColor"
				stroke-opacity="0.08"
				stroke-width={strokeWidth}
			/>

			<!-- Segments -->
			{#each arcs as arc (arc.label)}
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					stroke={arc.color}
					stroke-width={strokeWidth}
					stroke-dasharray="{arc.dashLength} {circumference - arc.dashLength}"
					stroke-dashoffset={arc.dashOffset}
					transform="rotate(-90 {center} {center})"
					stroke-linecap="butt"
				/>
			{/each}

			<!-- Centre text -->
			{#if centerValue}
				<text
					x={center}
					y={center - 6}
					text-anchor="middle"
					dominant-baseline="auto"
					fill="currentColor"
					font-size="22"
					font-weight="600"
				>
					{centerValue}
				</text>
			{/if}
			{#if centerLabel}
				<text
					x={center}
					y={center + 14}
					text-anchor="middle"
					dominant-baseline="auto"
					fill="currentColor"
					fill-opacity="0.5"
					font-size="11"
				>
					{centerLabel}
				</text>
			{/if}
		</svg>

		<!-- Legend -->
		<div class="flex flex-wrap justify-center gap-x-4 gap-y-1">
			{#each arcs as arc (arc.label)}
				<div class="flex items-center gap-1.5 text-xs">
					<span class="inline-block h-2.5 w-2.5 rounded-full" style="background-color: {arc.color}"
					></span>
					<span class="text-secondary">{arc.label}</span>
					<span class="font-medium text-primary">{arc.percentage}%</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
