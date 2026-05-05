<script lang="ts">
	/**
	 * CompositeScore Component
	 *
	 * Displays a composite score with its tier designation.
	 * Shows the numeric score and overall operational health tier.
	 * Animates the score value on mount using NumberTicker.
	 *
	 * @example
	 * <CompositeScore score={3.6} tier="effective" />
	 */

	import type { TierLevel, Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import { getTierColor, getTierBackgroundColor } from '$lib/utils/score.js';
	import TierIndicator from './TierIndicator.svelte';
	import { NumberTicker } from '$lib/components/animations/index.js';

	interface Props {
		/** The composite score value (1.0 to 5.0) */
		score: number;
		/** The overall tier based on the score */
		tier: TierLevel;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Current locale for translation */
		locale?: Locale;
		/** Show compact version */
		compact?: boolean;
	}

	let { score, tier, size = 'md', locale = 'en', compact = false }: Props = $props();

	const tierColor = $derived(getTierColor(tier));
	const tierBgColor = $derived(getTierBackgroundColor(tier));

	const scoreSizeClasses = {
		sm: 'text-xl',
		md: 'text-3xl',
		lg: 'text-5xl'
	};

	const labelSizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};
</script>

{#if compact}
	<div class="inline-flex items-center gap-2">
		<span style="color: {tierColor};">
			<NumberTicker
				value={score}
				decimalPlaces={1}
				class="font-mono font-medium {scoreSizeClasses[size]}"
				duration={1200}
			/>
		</span>
		<TierIndicator {tier} {locale} {size} />
	</div>
{:else}
	<div class="rounded-lg p-4 text-center" style="background-color: {tierBgColor};">
		<div class="{labelSizeClasses[size]} text-secondary-600 mb-1 font-medium">
			{t(locale, 'score.composite')}
		</div>
		<span style="color: {tierColor};">
			<NumberTicker
				value={score}
				decimalPlaces={1}
				class="font-mono font-medium {scoreSizeClasses[size]}"
				duration={1200}
			/>
		</span>
		<div class="mt-2">
			<TierIndicator {tier} {locale} {size} />
		</div>
	</div>
{/if}
