<script lang="ts">
	/**
	 * PathSelector
	 *
	 * Landing view of the onboarding tab. Shows two short Primer
	 * principles ("we don't have to be right", "you don't have to wait
	 * for features") above the three path cards, so the editable-by-you
	 * pitch sets the tone before the user picks a direction.
	 *
	 * Each path card carries a visual accent — an icon badge plus a
	 * tiny data-driven illustration of what the path produces — so the
	 * landing view feels like the rest of Primer (see /web/demo) rather
	 * than a wall of text.
	 *
	 * Part of the removable onboarding feature — see
	 * src/lib/components/onboarding/paths.ts for the removal checklist.
	 */

	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import { ONBOARDING_PATHS, type OnboardingPath } from './paths.js';

	interface Props {
		/** Active locale for translating card copy */
		locale: Locale;
		/**
		 * Called when the user picks a path. The parent owns the routing
		 * decision — this component is presentational.
		 */
		onSelect: (path: OnboardingPath) => void;
	}

	let { locale, onSelect }: Props = $props();

	/**
	 * Per-path visual accent token. Kept as a plain color string (CSS
	 * variable) rather than a Tailwind class so inline styles can mix
	 * the color at different alphas without needing a new class per
	 * shade. All three colors come from tokens already shipped in the
	 * theme so customers re-theming the app only need to edit one place.
	 */
	const PATH_ACCENT: Record<OnboardingPath['id'], string> = {
		scratch: 'var(--color-accent1)',
		'tried-before': 'var(--color-tier-concern)',
		customize: 'var(--color-tier-effective)'
	};
</script>

<div class="space-y-10">
	<header class="space-y-3">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-accent1/30 bg-accent1/5 px-3 py-1"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-accent1"></span>
			<span class="text-[11px] font-medium tracking-wider text-accent1 uppercase">
				{t(locale, 'onboarding.nav_label')}
			</span>
		</div>
		<h1 class="text-3xl font-semibold text-primary" style="letter-spacing: -0.02em;">
			{t(locale, 'onboarding.title')}
		</h1>
		<p class="max-w-2xl text-sm leading-relaxed text-secondary">
			{t(locale, 'onboarding.subtitle')}
		</p>
	</header>

	<!--
		Primer principles. Surfaced on the landing view so that the
		editable-by-design pitch frames every path the user is about to
		walk through. Each principle gets a simple icon so the two cards
		read visually distinct at a glance, matching the icon-forward
		tone of /web/demo.
	-->
	<section class="grid gap-4 md:grid-cols-2">
		<div class="rounded-xl border border-border bg-surfaceMid p-5">
			<div class="mb-3 flex items-center gap-3">
				<span
					class="flex h-9 w-9 items-center justify-center rounded-lg"
					style="background-color: color-mix(in srgb, var(--color-accent1) 12%, transparent);"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						style="color: var(--color-accent1);"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
				</span>
				<h2 class="text-sm font-semibold text-primary">
					{t(locale, 'onboarding.principle1.title')}
				</h2>
			</div>
			<p class="text-sm leading-relaxed text-secondary">
				{t(locale, 'onboarding.principle1.body')}
			</p>
		</div>
		<div class="rounded-xl border border-border bg-surfaceMid p-5">
			<div class="mb-3 flex items-center gap-3">
				<span
					class="flex h-9 w-9 items-center justify-center rounded-lg"
					style="background-color: color-mix(in srgb, var(--color-tier-effective) 12%, transparent);"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						style="color: var(--color-tier-effective);"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
						/>
					</svg>
				</span>
				<h2 class="text-sm font-semibold text-primary">
					{t(locale, 'onboarding.principle2.title')}
				</h2>
			</div>
			<p class="text-sm leading-relaxed text-secondary">
				{t(locale, 'onboarding.principle2.body')}
			</p>
		</div>
	</section>

	<!-- Path cards -->
	<div class="grid gap-4 md:grid-cols-3">
		{#each ONBOARDING_PATHS as path, idx (path.id)}
			{@const accent = PATH_ACCENT[path.id]}
			<button
				type="button"
				onclick={() => onSelect(path)}
				class="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surfaceMid p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-surfaceHigh hover:shadow-lg"
				style="border-color: color-mix(in srgb, {accent} 35%, var(--color-border));"
			>
				<!--
					Accent ribbon along the top of the card. Pure decoration
					but it anchors each path to its color so the rest of the
					walkthrough (which reuses the same accent) feels
					continuous from the selector onward.
				-->
				<span
					class="absolute inset-x-0 top-0 h-1"
					style="background: linear-gradient(to right, {accent}, color-mix(in srgb, {accent} 30%, transparent));"
					aria-hidden="true"
				></span>

				<!-- Icon badge + path number -->
				<div class="mb-5 flex items-start justify-between">
					<span
						class="flex h-12 w-12 items-center justify-center rounded-xl"
						style="background-color: color-mix(in srgb, {accent} 14%, transparent); color: {accent};"
					>
						{#if path.id === 'scratch'}
							<!-- Blueprint / blank page icon -->
							<svg
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V20a2 2 0 01-2 2z"
								/>
							</svg>
						{:else if path.id === 'tried-before'}
							<!-- Refresh / reset icon -->
							<svg
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						{:else}
							<!-- Sliders / customize icon -->
							<svg
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16m-7 6h7M4 18h3"
								/>
							</svg>
						{/if}
					</span>
					<span
						class="font-mono text-xs font-semibold tabular-nums"
						style="color: color-mix(in srgb, {accent} 80%, var(--color-secondary));"
					>
						0{idx + 1}
					</span>
				</div>

				<!-- Duration chip -->
				<div
					class="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
					style="background-color: color-mix(in srgb, {accent} 10%, transparent); color: {accent};"
				>
					<svg
						class="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					{t(locale, path.durationKey)}
				</div>

				<h2 class="text-base font-semibold text-primary">
					{t(locale, path.titleKey)}
				</h2>
				<p class="mt-2 flex-1 text-sm leading-relaxed text-secondary">
					{t(locale, path.descriptionKey)}
				</p>

				<!--
					Mini visual preview of what the path produces. Each
					path gets a distinct shape so the three cards don't
					blur together — this is the same "show, don't tell"
					pattern /web/demo uses for the tier bar and the
					weight sliders.
				-->
				<div class="mt-5 flex h-10 items-end gap-1.5">
					{#if path.id === 'scratch'}
						{#each [40, 70, 55] as h, i (i)}
							<div
								class="flex-1 rounded-sm transition-all duration-500 group-hover:brightness-110"
								style="height: {h}%; background-color: color-mix(in srgb, {accent} {20 +
									i *
										15}%, transparent); border: 1px dashed color-mix(in srgb, {accent} 60%, transparent);"
							></div>
						{/each}
					{:else if path.id === 'tried-before'}
						{#each [65, 35, 80, 25, 55] as h, i (i)}
							<div class="relative flex-1">
								<div
									class="w-full rounded-sm"
									style="height: {h}%; background-color: color-mix(in srgb, {accent} {i < 2
										? 60
										: 15}%, transparent);"
								></div>
								{#if i >= 2}
									<div
										class="absolute inset-x-0 top-1/2 h-px"
										style="background-color: {accent}; opacity: 0.6;"
									></div>
								{/if}
							</div>
						{/each}
					{:else}
						{#each [30, 60, 85] as w, i (i)}
							<div class="flex w-full items-center gap-1.5">
								<div
									class="h-1 flex-1 rounded-full"
									style="background: linear-gradient(to right, {accent} {w}%, color-mix(in srgb, {accent} 15%, transparent) {w}%);"
								></div>
								<span
									class="h-2 w-2 rounded-full"
									style="background-color: {accent};"
									aria-hidden="true"
								></span>
							</div>
						{/each}
					{/if}
				</div>

				<!-- CTA row -->
				<span
					class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium"
					style="color: {accent};"
				>
					{t(locale, path.ctaKey)}
					<svg
						class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
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
				</span>
			</button>
		{/each}
	</div>
</div>
