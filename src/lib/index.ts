/**
 * Primer Component Library
 *
 * Public exports for the component library.
 * This file defines what is available when importing from '$lib'.
 */

// Configuration
export { theme, TIER_VALUES, COMPOSITE_RANGES, TYPE_SCALE } from './config/theme.js';
export type { TierName, Theme } from './config/theme.js';

// Types
export * from './types/index.js';

// i18n
export {
	t,
	parseAcceptLanguage,
	getLocaleFromCookie,
	setLocaleCookie,
	LOCALE_COOKIE_NAME,
	DEFAULT_LOCALE
} from './i18n/index.js';

// Utilities
export {
	calculateCompositeScore,
	getTierFromScore,
	formatScore,
	getTierColor,
	getTierBackgroundColor,
	validateWeights,
	getScoreTrend
} from './utils/score.js';

// Components - UI
export { default as Button } from './components/ui/Button.svelte';
export { default as Input } from './components/ui/Input.svelte';
export { default as Select } from './components/ui/Select.svelte';

// Components - Tier
export { default as TierIndicator } from './components/tier/TierIndicator.svelte';
export { default as CompositeScore } from './components/tier/CompositeScore.svelte';

// Stores
export { localeStore } from './stores/locale.svelte.js';
export { demoStore, MAX_DEMO_METRICS, type DemoMetric } from './stores/demo.svelte.js';
