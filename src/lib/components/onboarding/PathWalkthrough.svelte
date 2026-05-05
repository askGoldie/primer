<script lang="ts">
	/**
	 * PathWalkthrough
	 *
	 * Steps the user through a chosen onboarding path, one card at a
	 * time, with prev/next navigation. On completion it renders the
	 * shared "roll this out to your team" next-step card — defined in
	 * paths.ts as ROLLOUT_NEXT_STEP — because all three personas ask the
	 * same question once they finish: "okay, now how do I get everyone
	 * else doing this?"
	 *
	 * Walkthrough chrome matches /web/demo: a numbered step tracker
	 * across the top, accent-colored ribbon on each card, and a subtle
	 * celebration visual on the completion screen. The per-path accent
	 * color is the same token used on the selector card, so the
	 * transition from "I picked this" to "I'm inside it" feels like
	 * one continuous surface.
	 *
	 * Part of the removable onboarding feature — see
	 * src/lib/components/onboarding/paths.ts for the removal checklist.
	 */

	import { resolve } from '$app/paths';
	import { href } from '$lib/utils/href.js';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import OnboardingStepCard from './OnboardingStepCard.svelte';
	import { ROLLOUT_NEXT_STEP, type OnboardingPath } from './paths.js';

	interface Props {
		locale: Locale;
		path: OnboardingPath;
		/** Called when the user clicks the back-to-paths button */
		onBack: () => void;
	}

	let { locale, path, onBack }: Props = $props();

	/** Zero-based index of the step currently being viewed */
	let stepIndex = $state(0);

	/** True once the user has clicked "Next" past the final step */
	let completed = $state(false);

	const currentStep = $derived(path.steps[stepIndex]);
	const isFirst = $derived(stepIndex === 0);
	const isLast = $derived(stepIndex === path.steps.length - 1);

	/**
	 * Per-path accent color. Kept in sync with PathSelector so both
	 * views share a single visual identity per path.
	 */
	const PATH_ACCENT: Record<OnboardingPath['id'], string> = {
		scratch: 'var(--color-accent1)',
		'tried-before': 'var(--color-tier-concern)',
		customize: 'var(--color-tier-effective)'
	};
	const accent = $derived(PATH_ACCENT[path.id]);

	function next() {
		if (isLast) {
			completed = true;
			return;
		}
		stepIndex += 1;
	}

	function prev() {
		if (isFirst) return;
		stepIndex -= 1;
	}

	function restart() {
		stepIndex = 0;
		completed = false;
	}
</script>

<div class="space-y-6">
	<!-- Back link + path title -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1">
			<button
				type="button"
				onclick={onBack}
				class="mb-2 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary"
			>
				{t(locale, 'onboarding.back_to_paths')}
			</button>
			<h1 class="text-2xl font-semibold text-primary sm:text-3xl" style="letter-spacing: -0.02em;">
				{t(locale, path.titleKey)}
			</h1>
		</div>
	</div>

	<!--
		Step tracker. Renders one dot per step plus a virtual "rollout"
		dot at the end so the user can see the total length of the path
		at a glance. Matches the progress tracker on /web/demo and the
		inquiry flow visual, keeping the visual vocabulary consistent.
	-->
	<div class="flex items-center gap-2" aria-hidden="true">
		{#each path.steps as _, i (i)}
			{@const done = completed || i < stepIndex}
			{@const active = !completed && i === stepIndex}
			<div class="flex flex-1 items-center gap-2">
				<span
					class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-all duration-300"
					style="background-color: {done || active
						? `color-mix(in srgb, ${accent} ${active ? 20 : 14}%, transparent)`
						: 'var(--color-surfaceMid)'};
					   color: {done || active ? accent : 'var(--color-secondary)'};
					   border: 1px solid {done || active
						? `color-mix(in srgb, ${accent} 45%, transparent)`
						: 'var(--color-border)'};"
				>
					{#if done && !active}
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{:else}
						{i + 1}
					{/if}
				</span>
				{#if i < path.steps.length - 1}
					<span
						class="h-0.5 flex-1 rounded-full transition-all duration-500"
						style="background-color: {done ? accent : 'var(--color-border)'};"
					></span>
				{/if}
			</div>
		{/each}
	</div>

	{#if completed}
		<!-- Completion state -->
		<article
			class="relative overflow-hidden rounded-2xl border bg-surfaceMid p-6 sm:p-8"
			style="border-color: color-mix(in srgb, {accent} 35%, var(--color-border));"
		>
			<span
				class="absolute inset-x-0 top-0 h-1"
				style="background: linear-gradient(to right, {accent}, color-mix(in srgb, {accent} 20%, transparent));"
				aria-hidden="true"
			></span>
			<div class="flex items-start gap-4">
				<span
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
					style="background-color: color-mix(in srgb, {accent} 14%, transparent); color: {accent};"
					aria-hidden="true"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</span>
				<div>
					<h2 class="text-xl font-semibold text-primary">
						{t(locale, 'onboarding.complete_path')}
					</h2>
					<p class="mt-2 text-sm leading-relaxed text-secondary">
						{t(locale, 'onboarding.complete_message')}
					</p>
				</div>
			</div>
		</article>

		<!--
			Shared rollout next-step. Rendered once here rather than
			duplicated into every path's step array, because all three
			paths converge on the same "now get everyone else on board"
			question. Defined in paths.ts so customers can edit it in
			one place.
		-->
		<article
			class="relative overflow-hidden rounded-2xl border-2 border-accent1/40 bg-accent1/5 p-6 sm:p-8"
		>
			<div class="mb-4 flex items-center gap-4">
				<span
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent1/15 text-accent1"
					aria-hidden="true"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				</span>
				<div class="flex-1">
					<div class="text-[11px] font-medium tracking-wider text-accent1 uppercase">
						{t(locale, 'onboarding.step_label', {
							current: path.steps.length + 1,
							total: path.steps.length + 1
						})}
					</div>
					<h2 class="mt-1 text-lg font-semibold text-primary sm:text-xl">
						{t(locale, ROLLOUT_NEXT_STEP.titleKey)}
					</h2>
				</div>
			</div>
			<p class="text-sm leading-relaxed whitespace-pre-line text-secondary sm:text-[15px]">
				{t(locale, ROLLOUT_NEXT_STEP.bodyKey)}
			</p>
			<div class="mt-6">
				<a
					href={href(ROLLOUT_NEXT_STEP.ctaHref)}
					class="inline-flex items-center gap-2 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
				>
					{t(locale, ROLLOUT_NEXT_STEP.ctaLabelKey)}
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
		</article>

		<!-- Secondary actions: restart this path or bail to the dashboard -->
		<div class="flex items-center justify-between">
			<button
				type="button"
				onclick={restart}
				class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
			>
				{t(locale, 'onboarding.restart_path')}
			</button>
			<a
				href={resolve('/app')}
				class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
			>
				{t(locale, 'onboarding.go_to_dashboard')}
			</a>
		</div>
	{:else if currentStep}
		<OnboardingStepCard
			{locale}
			step={currentStep}
			currentIndex={stepIndex + 1}
			totalSteps={path.steps.length}
			accentColor={accent}
		/>

		<!-- Step controls -->
		<div class="flex items-center justify-between">
			<button
				type="button"
				onclick={prev}
				disabled={isFirst}
				class="rounded-lg border border-border px-4 py-2 text-sm text-secondary transition-colors hover:bg-surfaceHigh hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
			>
				{t(locale, 'onboarding.prev_step')}
			</button>
			<button
				type="button"
				onclick={next}
				class="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
				style="background-color: {accent};"
			>
				{isLast ? t(locale, 'onboarding.finish') : t(locale, 'onboarding.next_step')}
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
			</button>
		</div>
	{/if}
</div>
