/**
 * Demo Store
 *
 * Manages state for the demo quintile tool.
 * Tracks metrics, thresholds, weights, and calculated scores.
 */

import type { TierLevel, Industry, VisitorRole } from '$lib/types/index.js';
import { calculateCompositeScore, getTierFromScore } from '$lib/utils/score.js';

/**
 * Demo metric structure
 */
export interface DemoMetric {
	id: string;
	name: string;
	thresholds: {
		alarm: string;
		concern: string;
		content: string;
		effective: string;
		optimized: string;
	};
	weight: number;
	currentTier: TierLevel | null;
}

/**
 * Maximum metrics allowed in demo
 */
export const MAX_DEMO_METRICS = 7;

/**
 * Create an empty demo metric
 */
function createEmptyMetric(): DemoMetric {
	return {
		id: crypto.randomUUID(),
		name: '',
		thresholds: {
			alarm: '',
			concern: '',
			content: '',
			effective: '',
			optimized: ''
		},
		weight: 0,
		currentTier: null
	};
}

/**
 * Create the demo store with Svelte 5 runes
 */
function createDemoStore() {
	// Visitor context
	let industry = $state<Industry>('construction');
	let role = $state<VisitorRole>('ceo');
	let currentPart = $state(1);

	// Metrics for the quintile tool
	let metrics = $state<DemoMetric[]>([createEmptyMetric()]);

	// Computed values
	const totalWeight = $derived(metrics.reduce((sum, m) => sum + m.weight, 0));

	const isWeightValid = $derived(totalWeight === 100);

	const canCalculateScore = $derived(
		isWeightValid &&
			metrics.length > 0 &&
			metrics.every(
				(m) =>
					m.name.trim() !== '' &&
					m.currentTier !== null &&
					Object.values(m.thresholds).every((t) => t.trim() !== '')
			)
	);

	const compositeScore = $derived.by(() => {
		if (!canCalculateScore) return null;

		const validMetrics = metrics.filter((m) => m.currentTier !== null);
		if (validMetrics.length === 0) return null;

		return calculateCompositeScore(
			validMetrics.map((m) => ({
				tier: m.currentTier!,
				weight: m.weight
			}))
		);
	});

	const compositeTier = $derived(compositeScore !== null ? getTierFromScore(compositeScore) : null);

	return {
		// Visitor context getters/setters
		get industry() {
			return industry;
		},
		set industry(value: Industry) {
			industry = value;
		},

		get role() {
			return role;
		},
		set role(value: VisitorRole) {
			role = value;
		},

		get currentPart() {
			return currentPart;
		},
		set currentPart(value: number) {
			currentPart = Math.max(1, Math.min(6, value));
		},

		// Metrics getters
		get metrics() {
			return metrics;
		},
		get totalWeight() {
			return totalWeight;
		},
		get isWeightValid() {
			return isWeightValid;
		},
		get canCalculateScore() {
			return canCalculateScore;
		},
		get compositeScore() {
			return compositeScore;
		},
		get compositeTier() {
			return compositeTier;
		},

		// Metric actions
		addMetric() {
			if (metrics.length < MAX_DEMO_METRICS) {
				metrics = [...metrics, createEmptyMetric()];
			}
		},

		removeMetric(id: string) {
			if (metrics.length > 1) {
				metrics = metrics.filter((m) => m.id !== id);
			}
		},

		updateMetric(id: string, updates: Partial<DemoMetric>) {
			metrics = metrics.map((m) => (m.id === id ? { ...m, ...updates } : m));
		},

		updateThreshold(id: string, tier: TierLevel, description: string) {
			metrics = metrics.map((m) =>
				m.id === id ? { ...m, thresholds: { ...m.thresholds, [tier]: description } } : m
			);
		},

		setCurrentTier(id: string, tier: TierLevel | null) {
			metrics = metrics.map((m) => (m.id === id ? { ...m, currentTier: tier } : m));
		},

		setWeight(id: string, weight: number) {
			const clampedWeight = Math.max(0, Math.min(100, weight));
			metrics = metrics.map((m) => (m.id === id ? { ...m, weight: clampedWeight } : m));
		},

		// Reset
		reset() {
			industry = 'construction';
			role = 'ceo';
			currentPart = 1;
			metrics = [createEmptyMetric()];
		}
	};
}

export const demoStore = createDemoStore();
