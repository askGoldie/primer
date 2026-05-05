<script lang="ts">
	/**
	 * BarChart — SVG horizontal bar chart for metric comparisons
	 *
	 * Renders a responsive SVG horizontal bar chart with tier-coloured
	 * bars and labels. Used for period comparison and team overview.
	 *
	 * @example
	 * <BarChart
	 *   bars={[
	 *     { label: 'Revenue Growth', value: 4.2, maxValue: 5, color: '#2C6EA6' }
	 *   ]}
	 * />
	 */

	import type { TierLevel } from '$lib/types/index.js';
	import { getTierColor } from '$lib/utils/score.js';

	interface Bar {
		label: string;
		value: number;
		maxValue?: number;
		tier?: TierLevel;
		color?: string;
		sublabel?: string;
	}

	let {
		bars = [],
		height: _barHeight = 32,
		maxValue = 5,
		showValues = true
	}: {
		bars: Bar[];
		height?: number;
		maxValue?: number;
		showValues?: boolean;
	} = $props();
</script>

{#if bars.length > 0}
	<div class="space-y-2">
		{#each bars as bar, i (i)}
			{@const barMax = bar.maxValue ?? maxValue}
			{@const width = barMax > 0 ? Math.min(100, (bar.value / barMax) * 100) : 0}
			{@const barColor = bar.color ?? (bar.tier ? getTierColor(bar.tier) : '#8B4E1E')}

			<div class="space-y-1">
				<div class="flex items-baseline justify-between text-xs">
					<span class="font-medium text-primary">{bar.label}</span>
					{#if showValues}
						<span class="text-secondary tabular-nums">
							{bar.value.toFixed(1)}
							{#if bar.sublabel}
								<span class="text-secondary/60">· {bar.sublabel}</span>
							{/if}
						</span>
					{/if}
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-surfaceHigh">
					<div
						class="h-full rounded-full transition-all duration-500"
						style="width: {width}%; background-color: {barColor};"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
