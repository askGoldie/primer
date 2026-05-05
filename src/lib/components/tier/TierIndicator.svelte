<script lang="ts">
	/**
	 * TierIndicator Component
	 *
	 * Displays a tier level with three redundant signals: color, shape/icon, and label.
	 * This satisfies WCAG 1.4.1 (color not the sole differentiator) and follows the
	 * IBM Carbon / Datadog pattern of color + icon + text for status indicators.
	 *
	 * Visual weight is intentionally asymmetric:
	 * - Alarm / Concern: bold treatment - these should surface to attention
	 * - Content: subdued - hollow, muted, no icon - "nothing to see here"
	 * - Effective / Optimized: quiet positive - small filled dot, understated
	 *
	 * Hover tooltip surfaces the tier description from i18n for progressive disclosure.
	 *
	 * @example
	 * <TierIndicator tier="effective" />
	 * <TierIndicator tier="alarm" size="lg" />
	 * <TierIndicator tier="content" dotOnly />
	 */

	import type { TierLevel, Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import { getTierColor, getTierBackgroundColor } from '$lib/utils/score.js';

	interface Props {
		/** The tier level to display */
		tier: TierLevel;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Current locale for translation */
		locale?: Locale;
		/** Show as filled badge or outline */
		variant?: 'filled' | 'outline';
		/** Show just the dot indicator without text */
		dotOnly?: boolean;
	}

	let { tier, size = 'md', locale = 'en', variant = 'filled', dotOnly = false }: Props = $props();

	const sizeClasses = {
		sm: 'text-xs px-2 py-0.5',
		md: 'text-sm px-3 py-1',
		lg: 'text-base px-4 py-1.5'
	};

	const dotSizeClasses = {
		sm: 'w-2 h-2',
		md: 'w-2.5 h-2.5',
		lg: 'w-3 h-3'
	};

	const iconSizeClasses = {
		sm: 'w-3 h-3',
		md: 'w-3.5 h-3.5',
		lg: 'w-4 h-4'
	};

	const tierColor = $derived(getTierColor(tier));
	const tierBgColor = $derived(getTierBackgroundColor(tier));
	const label = $derived(t(locale, `tier.${tier}`));
	const description = $derived(t(locale, `tier.${tier}.description`));

	/**
	 * Alarm and Concern have high urgency - bold filled treatment.
	 * Content is neutral - hollow/outline, no icon, muted.
	 * Effective and Optimized are quietly positive.
	 */
	const isNeutral = $derived(tier === 'content');
</script>

{#if dotOnly}
	<!-- Dot-only: use hollow circle for content, filled for all others -->
	<span
		class="inline-block {dotSizeClasses[size]} {isNeutral
			? 'rounded-full border-2'
			: 'rounded-full'}"
		style={isNeutral
			? `border-color: ${tierColor}; background: transparent;`
			: `background-color: ${tierColor};`}
		role="img"
		aria-label={label}
		title={description}
	></span>
{:else}
	<!-- Full badge with tooltip on hover -->
	<span
		class="group relative inline-flex items-center gap-1.5 rounded-full font-medium {sizeClasses[
			size
		]}"
		style={variant === 'filled'
			? `background-color: ${isNeutral ? 'transparent' : tierBgColor}; color: ${tierColor}; ${isNeutral ? `border: 1.5px solid ${tierColor};` : ''}`
			: `border: 1.5px solid ${tierColor}; color: ${tierColor};`}
		aria-label="{label}: {description}"
	>
		<!-- Shape/icon signal - redundant with color -->
		{#if tier === 'alarm'}
			<!-- Diamond shape for alarm - most visually distinct -->
			<svg
				class="{iconSizeClasses[size]} flex-shrink-0"
				viewBox="0 0 12 12"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M6 1L11 6L6 11L1 6Z" />
			</svg>
		{:else if tier === 'concern'}
			<!-- Triangle for concern -->
			<svg
				class="{iconSizeClasses[size]} flex-shrink-0"
				viewBox="0 0 12 12"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M6 1L11.5 10.5H0.5Z" />
			</svg>
		{:else if tier === 'content'}
			<!-- Hollow circle for content - visually recedes -->
			<span
				class="inline-block rounded-full border {dotSizeClasses[size]} flex-shrink-0"
				style="border-color: {tierColor}; background: transparent;"
				aria-hidden="true"
			></span>
		{:else if tier === 'effective'}
			<!-- Upward chevron for effective -->
			<svg
				class="{iconSizeClasses[size]} flex-shrink-0"
				viewBox="0 0 12 12"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M2 8L6 4L10 8" />
			</svg>
		{:else if tier === 'optimized'}
			<!-- Checkmark for optimized -->
			<svg
				class="{iconSizeClasses[size]} flex-shrink-0"
				viewBox="0 0 12 12"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M1.5 6.5L4.5 9.5L10.5 2.5" />
			</svg>
		{/if}

		{label}

		<!-- Progressive disclosure tooltip - surfaces description on hover -->
		<span
			class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-md px-3 py-2 text-xs leading-snug font-normal opacity-0 shadow-lg transition-opacity delay-150 duration-150 group-hover:opacity-100"
			style="background-color: var(--color-primary); color: var(--color-surface-light);"
			role="tooltip"
		>
			{description}
			<!-- Arrow -->
			<span
				class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
				style="border-top-color: var(--color-primary);"
				aria-hidden="true"
			></span>
		</span>
	</span>
{/if}
