/**
 * Composite Score Calculation Utilities
 *
 * Implements the quintile framework scoring logic.
 * Each tier has a numeric value (1-5), and composite scores
 * are weighted averages that determine overall tier.
 *
 * @see /docs/tier-quintile-framework.md
 */

import { TIER_VALUES, COMPOSITE_RANGES } from '$lib/config/theme.js';
import type { TierLevel, MetricScoreDetail } from '$lib/types/index.js';

/**
 * Get the numeric value for a tier
 */
export function getTierValue(tier: TierLevel): number {
	return TIER_VALUES[tier];
}

/**
 * Calculate the composite score from metrics
 *
 * @param metrics - Array of metrics with their current tier and weight
 * @returns The weighted composite score (1.0 to 5.0)
 */
export function calculateCompositeScore(
	metrics: Array<{ tier: TierLevel; weight: number }>
): number {
	const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);

	if (totalWeight === 0) return 0;

	const weightedSum = metrics.reduce((sum, m) => {
		return sum + getTierValue(m.tier) * m.weight;
	}, 0);

	return weightedSum / totalWeight;
}

/**
 * Determine the overall tier from a composite score
 */
export function getTierFromScore(score: number): TierLevel {
	if (score <= COMPOSITE_RANGES.alarm.max) return 'alarm';
	if (score <= COMPOSITE_RANGES.concern.max) return 'concern';
	if (score <= COMPOSITE_RANGES.content.max) return 'content';
	if (score <= COMPOSITE_RANGES.effective.max) return 'effective';
	return 'optimized';
}

/**
 * Format a composite score for display
 */
export function formatScore(score: number): string {
	return score.toFixed(1);
}

/**
 * Calculate metric score details for a snapshot
 */
export function calculateMetricDetails(
	metrics: Array<{
		id: string;
		name: string;
		measurementType: string;
		origin: string;
		currentValue: unknown;
		currentTier: TierLevel;
		weight: number;
	}>
): MetricScoreDetail[] {
	const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);

	return metrics.map((m) => {
		const tierValue = getTierValue(m.currentTier);
		const weightedContribution = (tierValue * m.weight) / totalWeight;

		return {
			metricId: m.id,
			metricName: m.name,
			measurementType: m.measurementType as MetricScoreDetail['measurementType'],
			origin: m.origin as MetricScoreDetail['origin'],
			currentValue: m.currentValue as MetricScoreDetail['currentValue'],
			tier: m.currentTier,
			tierValue,
			weight: m.weight,
			weightedContribution
		};
	});
}

/**
 * Validate that weights sum to 100
 */
export function validateWeights(weights: number[]): {
	valid: boolean;
	total: number;
	error?: string;
} {
	const total = weights.reduce((sum, w) => sum + w, 0);

	if (total !== 100) {
		return {
			valid: false,
			total,
			error: total < 100 ? `Weights total ${total}%, need 100%` : `Weights exceed 100%`
		};
	}

	return { valid: true, total };
}

/**
 * Get tier indicator color from theme
 */
export function getTierColor(tier: TierLevel, isDark = false): string {
	const colorMap: Record<TierLevel, { light: string; dark: string }> = {
		alarm: { light: '#B03A2E', dark: '#F0877E' },
		concern: { light: '#7A4A00', dark: '#F5A842' },
		content: { light: '#6B6058', dark: '#A89E94' },
		effective: { light: '#2C6EA6', dark: '#6AAAD8' },
		optimized: { light: '#2A7A45', dark: '#5AAD78' }
	};

	return isDark ? colorMap[tier].dark : colorMap[tier].light;
}

/**
 * Get tier background color (lighter version for fills)
 */
export function getTierBackgroundColor(tier: TierLevel, isDark = false): string {
	const colorMap: Record<TierLevel, { light: string; dark: string }> = {
		alarm: { light: 'rgba(176, 58, 46, 0.1)', dark: 'rgba(240, 135, 126, 0.15)' },
		concern: { light: 'rgba(122, 74, 0, 0.1)', dark: 'rgba(245, 168, 66, 0.15)' },
		content: { light: 'rgba(107, 96, 88, 0.1)', dark: 'rgba(168, 158, 148, 0.15)' },
		effective: { light: 'rgba(44, 110, 166, 0.1)', dark: 'rgba(106, 170, 216, 0.15)' },
		optimized: { light: 'rgba(42, 122, 69, 0.1)', dark: 'rgba(90, 173, 120, 0.15)' }
	};

	return isDark ? colorMap[tier].dark : colorMap[tier].light;
}

/**
 * Calculate score trend direction
 */
export function getScoreTrend(
	currentScore: number,
	previousScore: number
): 'improving' | 'declining' | 'stable' {
	const diff = currentScore - previousScore;
	if (Math.abs(diff) < 0.1) return 'stable';
	return diff > 0 ? 'improving' : 'declining';
}
