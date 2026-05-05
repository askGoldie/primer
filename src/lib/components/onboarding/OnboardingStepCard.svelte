<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * OnboardingStepCard
	 *
	 * Renders a single step inside an onboarding path — numbered badge,
	 * title, body copy, optional deep-link CTA, and a progress indicator
	 * styled to match /web/demo (icon-forward, tier-colored accents, no
	 * walls of plain text). Styled as a standalone card so PathWalkthrough
	 * can cross-fade between steps without layout shift.
	 *
	 * Part of the removable onboarding feature — see
	 * src/lib/components/onboarding/paths.ts for the removal checklist.
	 */
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import type { OnboardingStep } from './paths.js';

	interface Props {
		locale: Locale;
		step: OnboardingStep;
		/** 1-based index of the current step */
		currentIndex: number;
		/** Total number of steps in the path */
		totalSteps: number;
		/**
		 * CSS color token for the path accent, passed in from the parent
		 * walkthrough so all steps in a given path share one visual tone.
		 * Defaults to accent1 when omitted.
		 */
		accentColor?: string;
	}

	let {
		locale,
		step,
		currentIndex,
		totalSteps,
		accentColor = 'var(--color-accent1)'
	}: Props = $props();
</script>

<article
	class="relative overflow-hidden rounded-2xl border bg-surfaceMid p-6 sm:p-8"
	style="border-color: color-mix(in srgb, {accentColor} 30%, var(--color-border));"
>
	<!-- Accent top ribbon, mirrors the selector card -->
	<span
		class="absolute inset-x-0 top-0 h-1"
		style="background: linear-gradient(to right, {accentColor}, color-mix(in srgb, {accentColor} 20%, transparent));"
		aria-hidden="true"
	></span>

	<!-- Step header: numbered badge + step-of-total label -->
	<div class="mb-5 flex items-center gap-4">
		<span
			class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl font-mono text-lg font-semibold"
			style="background-color: color-mix(in srgb, {accentColor} 14%, transparent); color: {accentColor};"
			aria-hidden="true"
		>
			{currentIndex}
		</span>
		<div class="flex-1">
			<div
				class="text-[11px] font-medium tracking-wider uppercase"
				style="color: color-mix(in srgb, {accentColor} 80%, var(--color-secondary));"
			>
				{t(locale, 'onboarding.step_label', {
					current: currentIndex,
					total: totalSteps
				})}
			</div>
			<h2 class="mt-1 text-lg font-semibold text-primary sm:text-xl">
				{t(locale, step.titleKey)}
			</h2>
		</div>
	</div>

	<!--
		Step body is plain text by design — customers who want rich formatting
		can swap this for a markdown renderer without touching the page layout.
	-->
	<p class="text-sm leading-relaxed whitespace-pre-line text-secondary sm:text-[15px]">
		{t(locale, step.bodyKey)}
	</p>

	{#if step.ctaHref && step.ctaLabelKey}
		<div class="mt-6">
			<a
				href={href(step.ctaHref)}
				class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
				style="background-color: {accentColor};"
			>
				{t(locale, step.ctaLabelKey)}
				<svg
					class="h-4 w-4 rtl:rotate-180"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 8l4 4m0 0l-4 4m4-4H3"
					/>
				</svg>
			</a>
		</div>
	{/if}
</article>
