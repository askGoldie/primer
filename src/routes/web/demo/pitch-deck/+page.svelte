<script lang="ts">
	/**
	 * Pitch Deck Page
	 *
	 * Full-viewport slide deck with keyboard and click navigation.
	 * Each slide fills the screen. Transitions animate between slides.
	 * Arrow keys, spacebar, and on-screen controls advance the deck.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		AnimatedGradientText,
		AnimatedCounter,
		NumberTicker,
		ShimmerButton
	} from '$lib/components/animations/index.js';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildWebPage, buildBreadcrumbs } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	const TOTAL_SLIDES = 12;
	const tiers = ['alarm', 'concern', 'content', 'effective', 'optimized'] as const;

	let current = $state(0);
	let direction = $state(1);

	function goto(n: number) {
		if (n < 0 || n >= TOTAL_SLIDES || n === current) return;
		direction = n > current ? 1 : -1;
		current = n;
	}

	function next() {
		goto(current + 1);
	}

	function prev() {
		goto(current - 1);
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
			e.preventDefault();
			next();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			prev();
		} else if (e.key === 'Home') {
			e.preventDefault();
			goto(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			goto(TOTAL_SLIDES - 1);
		}
	}

	const tcoRows = [
		{ year: 1, primer: 5000, saas: 18000 },
		{ year: 3, primer: 5000, saas: 54000 },
		{ year: 5, primer: 5000, saas: 90000 }
	];
</script>

<Seo locale={data.locale} pageKey="pitch_deck" path="/web/demo/pitch-deck" />
<StructuredData
	data={buildWebPage(
		data.locale,
		t(data.locale, 'seo.pitch_deck.title'),
		t(data.locale, 'seo.pitch_deck.description'),
		'/web/demo/pitch-deck'
	)}
/>
<StructuredData
	data={buildBreadcrumbs([
		{ name: t(data.locale, 'nav.home'), path: '/web/home' },
		{ name: t(data.locale, 'seo.demo.title'), path: '/web/demo' },
		{ name: t(data.locale, 'seo.pitch_deck.title'), path: '/web/demo/pitch-deck' }
	])}
/>

<svelte:window onkeydown={handleKey} />

<!-- Deck container: fixed viewport, no scroll -->
<div class="fixed inset-0 top-16 overflow-hidden bg-surface">
	<!-- Slide viewport -->
	<div class="relative h-full w-full">
		{#key current}
			<div
				class="absolute inset-0 flex items-center justify-center overflow-y-auto px-6 py-10 sm:px-12 sm:py-16"
				in:fly={{ x: direction * 600, duration: 500, easing: cubicOut }}
				out:fly={{ x: direction * -600, duration: 350, easing: cubicOut }}
			>
				<div class="w-full max-w-5xl">
					<!-- ========== SLIDE 1: Hero ========== -->
					{#if current === 0}
						<div class="grid items-center gap-12 lg:grid-cols-2">
							<div>
								<p class="text-eyebrow text-accent1">{t(data.locale, 'pitch_deck.s1.eyebrow')}</p>
								<h1
									class="mt-6 text-4xl font-medium tracking-tight text-primary sm:text-5xl lg:text-6xl"
								>
									<AnimatedGradientText speed={0.8}>
										{t(data.locale, 'pitch_deck.s1.title')}
									</AnimatedGradientText>
								</h1>
								<p class="mt-8 max-w-xl text-xl text-secondary">
									{t(data.locale, 'pitch_deck.s1.body')}
								</p>
							</div>
							<div class="flex justify-center">
								<img src="/pitch-deck/hero.webp" alt="" class="h-auto w-full max-w-md rounded-lg" />
							</div>
						</div>

						<!-- ========== SLIDE 2: Problem in three numbers ========== -->
					{:else if current === 1}
						<div>
							<p class="text-eyebrow text-center text-accent3">
								{t(data.locale, 'pitch_deck.s2.eyebrow')}
							</p>
							<h2
								class="mt-3 text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl"
							>
								{t(data.locale, 'pitch_deck.s2.title')}
							</h2>
							<div class="mt-16 grid gap-12 sm:grid-cols-3">
								<div class="text-center">
									<div class="text-6xl font-medium tracking-tight text-tier-alarm sm:text-7xl">
										<AnimatedCounter value={95} suffix="%" duration={1800} />
									</div>
									<p class="mt-4 text-secondary">{t(data.locale, 'pitch_deck.s2.stat1')}</p>
								</div>
								<div class="text-center">
									<div class="text-6xl font-medium tracking-tight text-tier-concern sm:text-7xl">
										<AnimatedCounter value={2} suffix="%" duration={1200} delay={300} />
									</div>
									<p class="mt-4 text-secondary">{t(data.locale, 'pitch_deck.s2.stat2')}</p>
								</div>
								<div class="text-center">
									<div class="text-6xl font-medium tracking-tight text-primary sm:text-7xl">
										$<NumberTicker value={35} duration={1500} delay={600} /><span
											class="text-4xl text-secondary">M</span
										>
									</div>
									<p class="mt-4 text-secondary">{t(data.locale, 'pitch_deck.s2.stat3')}</p>
								</div>
							</div>
						</div>

						<!-- ========== SLIDE 3: Why existing tools fail ========== -->
					{:else if current === 2}
						<div class="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
							<div class="hidden lg:block">
								<img
									src="/pitch-deck/broken-tools.webp"
									alt=""
									class="h-auto w-44 rounded-lg opacity-80"
								/>
							</div>
							<div>
								<h2
									class="text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl lg:text-left"
								>
									{t(data.locale, 'pitch_deck.s3.title')}
								</h2>
								<div class="mt-14 grid gap-8 sm:grid-cols-3">
									{#each ['roadmap', 'rent', 'data'] as key (key)}
										<div class="rounded-lg border border-border bg-surfaceMid p-8">
											<div
												class="flex h-12 w-12 items-center justify-center rounded-full bg-tier-alarm/10"
											>
												<svg
													class="h-6 w-6 text-tier-alarm"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-hidden="true"
												>
													{#if key === 'roadmap'}
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
														/>
													{:else if key === 'rent'}
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
														/>
													{:else}
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													{/if}
												</svg>
											</div>
											<h3 class="mt-5 text-lg font-medium text-primary">
												{t(data.locale, `pitch_deck.s3.${key}_title`)}
											</h3>
											<p class="mt-3 leading-relaxed text-secondary">
												{t(data.locale, `pitch_deck.s3.${key}_body`)}
											</p>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- ========== SLIDE 4: The Five-Tier Framework ========== -->
					{:else if current === 3}
						<div>
							<p class="text-eyebrow text-center text-accent2">
								{t(data.locale, 'pitch_deck.s4.eyebrow')}
							</p>
							<h2
								class="mt-3 text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl"
							>
								{t(data.locale, 'pitch_deck.s4.title')}
							</h2>
							<p class="mx-auto mt-4 max-w-2xl text-center text-secondary">
								{t(data.locale, 'pitch_deck.s4.body')}
							</p>

							<div class="mt-12 space-y-4">
								{#each tiers as tier (tier)}
									<div
										class="flex items-center gap-5 rounded-lg border border-border bg-surfaceMid px-6 py-4"
									>
										<TierIndicator {tier} size="lg" locale={data.locale} />
										<p class="text-sm text-secondary">
											{t(data.locale, `pitch_deck.s4.${tier}_label`)}
										</p>
									</div>
								{/each}
							</div>
						</div>

						<!-- ========== SLIDE 5: How Metrics Work ========== -->
					{:else if current === 4}
						<div class="grid items-start gap-10 lg:grid-cols-[auto_1fr]">
							<div class="hidden lg:block">
								<img
									src="/pitch-deck/metrics-flow.webp"
									alt=""
									class="h-auto w-44 rounded-lg opacity-80"
								/>
							</div>
							<div>
								<p class="text-eyebrow text-center text-accent1 lg:text-left">
									{t(data.locale, 'pitch_deck.s5.eyebrow')}
								</p>
								<h2
									class="mt-3 text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl lg:text-left"
								>
									{t(data.locale, 'pitch_deck.s5.title')}
								</h2>
								<p class="mx-auto mt-4 max-w-2xl text-center text-secondary lg:mx-0 lg:text-left">
									{t(data.locale, 'pitch_deck.s5.body')}
								</p>

								<div class="mt-10 grid gap-4 sm:grid-cols-3">
									{#each ['propose', 'approve', 'own'] as step (step)}
										<div class="rounded-lg border-2 border-accent1/20 bg-accent1/5 p-6">
											<h3 class="text-lg font-medium text-primary">
												{t(data.locale, `pitch_deck.s5.${step}_title`)}
											</h3>
											<p class="mt-2 text-sm leading-relaxed text-secondary">
												{t(data.locale, `pitch_deck.s5.${step}_body`)}
											</p>
										</div>
									{/each}
								</div>

								<div class="mt-8 grid gap-4 sm:grid-cols-2">
									{#each ['weight', 'challenge'] as pillar (pillar)}
										<div class="rounded-lg border border-accent2/20 bg-accent2/5 p-5">
											<h3 class="font-medium text-primary">
												{t(data.locale, `pitch_deck.s5.${pillar}_title`)}
											</h3>
											<p class="mt-2 text-sm leading-relaxed text-secondary">
												{t(data.locale, `pitch_deck.s5.${pillar}_body`)}
											</p>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- ========== SLIDE 6: What Your Team Sees ========== -->
					{:else if current === 5}
						<div>
							<p class="text-eyebrow text-center text-accent3">
								{t(data.locale, 'pitch_deck.s6.eyebrow')}
							</p>
							<h2
								class="mt-3 text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl"
							>
								{t(data.locale, 'pitch_deck.s6.title')}
							</h2>
							<p class="mx-auto mt-4 max-w-2xl text-center text-secondary">
								{t(data.locale, 'pitch_deck.s6.body')}
							</p>

							<div class="mt-12 grid gap-6 sm:grid-cols-3">
								{#each ['ic', 'manager', 'leader'] as role (role)}
									<div class="rounded-lg border border-border bg-surfaceMid p-8">
										<h3 class="text-lg font-medium text-primary">
											{t(data.locale, `pitch_deck.s6.${role}_title`)}
										</h3>
										<p class="mt-3 leading-relaxed text-secondary">
											{t(data.locale, `pitch_deck.s6.${role}_body`)}
										</p>
									</div>
								{/each}
							</div>

							<div
								class="mx-auto mt-6 max-w-lg rounded-lg border-2 border-accent3/20 bg-accent3/5 p-5 text-center"
							>
								<p class="font-medium text-primary">
									{t(data.locale, 'pitch_deck.s6.realtime_title')}
								</p>
								<p class="mt-1 text-sm text-secondary">
									{t(data.locale, 'pitch_deck.s6.realtime_body')}
								</p>
							</div>
						</div>

						<!-- ========== SLIDE 7: Framework Migration ========== -->
					{:else if current === 6}
						<div class="grid items-start gap-10 lg:grid-cols-[auto_1fr]">
							<div class="hidden lg:block">
								<img
									src="/pitch-deck/framework-bridge.webp"
									alt=""
									class="h-auto w-44 rounded-lg opacity-80"
								/>
							</div>
							<div>
								<p class="text-eyebrow text-center text-accent2 lg:text-left">
									{t(data.locale, 'pitch_deck.s7.eyebrow')}
								</p>
								<h2
									class="mt-3 text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl lg:text-left"
								>
									{t(data.locale, 'pitch_deck.s7.title')}
								</h2>
								<p class="mx-auto mt-4 max-w-2xl text-center text-secondary lg:mx-0 lg:text-left">
									{t(data.locale, 'pitch_deck.s7.body')}
								</p>

								<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{#each ['okr', 'kpi', 'bsc', 'eos', 'custom'] as fw (fw)}
										<div
											class="rounded-lg border border-border bg-surfaceMid p-6 {fw === 'custom'
												? 'sm:col-span-2 lg:col-span-1'
												: ''}"
										>
											<h3 class="font-medium text-accent2">
												{t(data.locale, `pitch_deck.s7.${fw}_title`)}
											</h3>
											<p class="mt-2 text-sm leading-relaxed text-secondary">
												{t(data.locale, `pitch_deck.s7.${fw}_body`)}
											</p>
										</div>
									{/each}
								</div>

								<p class="mt-8 max-w-2xl text-center text-sm text-secondary lg:text-left">
									{t(data.locale, 'pitch_deck.s7.footnote')}
								</p>
							</div>
						</div>

						<!-- ========== SLIDE 8: Already Running (Vignettes) ========== -->
					{:else if current === 7}
						<div>
							<h2 class="text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl">
								{t(data.locale, 'pitch_deck.s8.title')}
							</h2>
							<div class="mx-auto mt-6 hidden max-w-2xl lg:block">
								<img
									src="/pitch-deck/industries.webp"
									alt=""
									class="h-auto w-full rounded-lg opacity-80"
								/>
							</div>
							<div class="mt-8 grid gap-6 sm:grid-cols-3 lg:mt-6">
								{#each ['construction', 'pe', 'manufacturing'] as vignette (vignette)}
									<div class="rounded-lg border border-border bg-surfaceMid p-8">
										<p class="text-eyebrow text-accent1">
											{t(data.locale, `pitch_deck.s8.${vignette}_tag`)}
										</p>
										<p class="mt-4 leading-relaxed text-secondary">
											{t(data.locale, `pitch_deck.s8.${vignette}_body`)}
										</p>
									</div>
								{/each}
							</div>
						</div>

						<!-- ========== SLIDE 9: Cost Comparison ========== -->
					{:else if current === 8}
						<div>
							<h2 class="text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl">
								{t(data.locale, 'pitch_deck.s9.title')}
							</h2>
							<p class="mt-3 text-center text-secondary">{t(data.locale, 'pitch_deck.s9.sub')}</p>

							<div
								class="mx-auto mt-10 max-w-3xl overflow-hidden rounded-lg border-2 border-accent2"
							>
								<table class="w-full">
									<thead>
										<tr class="bg-accent2/10">
											<th class="px-6 py-4 text-left text-sm font-medium text-primary"></th>
											<th class="px-6 py-4 text-right text-sm font-medium text-accent2">Primer</th>
											<th class="px-6 py-4 text-right text-sm font-medium text-secondary"
												>{t(data.locale, 'pitch_deck.s9.saas_label')}</th
											>
											<th class="px-6 py-4 text-right text-sm font-medium text-accent2"
												>{t(data.locale, 'pitch_deck.s9.savings_label')}</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-border">
										{#each tcoRows as row, i (row.year)}
											<tr class="{i === 2 ? 'bg-accent2/5' : ''} transition-colors">
												<td class="px-6 py-4 text-sm font-medium text-primary"
													>{t(data.locale, `pitch_deck.s9.year${row.year}`)}</td
												>
												<td class="px-6 py-4 text-right font-mono text-sm text-accent2">
													$<NumberTicker value={row.primer} duration={800} delay={200 + i * 200} />
												</td>
												<td
													class="px-6 py-4 text-right font-mono text-sm text-secondary line-through"
												>
													$<NumberTicker value={row.saas} duration={1200} delay={200 + i * 200} />
												</td>
												<td
													class="px-6 py-4 text-right font-mono text-sm font-bold {i === 2
														? 'text-lg'
														: ''} text-accent2"
												>
													$<NumberTicker
														value={row.saas - row.primer}
														duration={1500}
														delay={400 + i * 200}
													/>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>

							<div
								class="mx-auto mt-8 max-w-md rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8 text-center"
							>
								<p class="text-sm font-medium tracking-wide text-accent1 uppercase">
									{t(data.locale, 'pitch_deck.s9.highlight_label')}
								</p>
								<div class="mt-2 text-5xl font-medium tracking-tight text-primary">
									$<NumberTicker value={85000} duration={2000} delay={1000} />
								</div>
								<p class="mt-2 text-sm text-secondary">
									{t(data.locale, 'pitch_deck.s9.highlight_sub')}
								</p>
							</div>

							<p class="mx-auto mt-6 max-w-xl text-center text-sm font-medium text-accent2">
								{t(data.locale, 'pitch_deck.s9.footnote')}
							</p>
						</div>

						<!-- ========== SLIDE 10: What Ships ========== -->
					{:else if current === 9}
						<div class="grid items-start gap-10 lg:grid-cols-[auto_1fr]">
							<div class="hidden lg:block">
								<img
									src="/pitch-deck/source-code.webp"
									alt=""
									class="h-auto w-44 rounded-lg opacity-80"
								/>
							</div>
							<div>
								<h2
									class="text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl lg:text-left"
								>
									{t(data.locale, 'pitch_deck.s10.title')}
								</h2>
								<p class="mt-3 text-center text-secondary lg:text-left">
									{t(data.locale, 'pitch_deck.s10.sub')}
								</p>

								<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
									{#each ['source', 'deploy', 'languages', 'airgap', 'rebrand', 'ai'] as key (key)}
										<div
											class="flex items-start gap-4 rounded-lg border border-border bg-surfaceMid p-6"
										>
											<div
												class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent2/10"
											>
												<svg
													class="h-4 w-4 text-accent2"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</div>
											<div>
												<p class="font-medium text-primary">
													{t(data.locale, `pitch_deck.s10.${key}_title`)}
												</p>
												<p class="mt-1 text-sm text-secondary">
													{t(data.locale, `pitch_deck.s10.${key}_body`)}
												</p>
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- ========== SLIDE 11: Getting Started ========== -->
					{:else if current === 10}
						<div class="mx-auto max-w-3xl">
							<h2 class="text-center text-3xl font-medium tracking-tight text-primary sm:text-4xl">
								{t(data.locale, 'pitch_deck.s11.title')}
							</h2>

							<div class="mt-14 space-y-6">
								{#each ['week1', 'week2', 'week3', 'week4'] as step, i (step)}
									<div class="flex items-start gap-5">
										<div
											class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent1 bg-accent1/10 font-mono text-sm font-medium text-accent1"
										>
											{i + 1}
										</div>
										<div class="pt-1">
											<p class="font-medium text-primary">
												{t(data.locale, `pitch_deck.timeline.${step}`)}
											</p>
											<p class="mt-1 text-secondary">
												{t(data.locale, `pitch_deck.timeline.${step}_body`)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- ========== SLIDE 12: Close ========== -->
					{:else if current === 11}
						<div class="text-center">
							<h2 class="text-4xl font-medium tracking-tight text-primary sm:text-5xl lg:text-6xl">
								<AnimatedGradientText speed={0.8}>
									{t(data.locale, 'pitch_deck.s12.title')}
								</AnimatedGradientText>
							</h2>
							<p class="mx-auto mt-8 max-w-xl text-lg text-secondary">
								{t(data.locale, 'pitch_deck.s12.body')}
							</p>
							<div class="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
								<a href={resolve('/web/demo')}>
									<ShimmerButton class="px-10 py-4 text-base">
										{t(data.locale, 'pitch_deck.cta_demo')}
									</ShimmerButton>
								</a>
								<a
									href={resolve('/web/pricing/calculator')}
									class="btn-outline px-8 py-3 text-base"
								>
									{t(data.locale, 'pitch_deck.cta_calculator')}
								</a>
							</div>
							<p class="mt-16 text-sm text-secondary">{t(data.locale, 'pitch_deck.s12.footer')}</p>
						</div>
					{/if}
				</div>
			</div>
		{/key}
	</div>

	<!-- Navigation controls -->
	<div
		class="absolute right-0 bottom-0 left-0 z-10 flex items-center justify-between px-6 py-4 sm:px-10"
	>
		<!-- Prev button -->
		<button
			type="button"
			class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-secondary transition-colors hover:bg-surfaceMid hover:text-primary disabled:opacity-30 disabled:hover:bg-surface"
			onclick={prev}
			disabled={current === 0}
			aria-label="Previous slide"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<!-- Slide indicators -->
		<div class="flex items-center gap-1.5">
			{#each Array(TOTAL_SLIDES) as _, i (i)}
				<button
					type="button"
					class="h-2 rounded-full transition-all {i === current
						? 'w-6 bg-accent1'
						: 'w-2 bg-border hover:bg-secondary/50'}"
					onclick={() => goto(i)}
					aria-label="Go to slide {i + 1}"
				></button>
			{/each}
		</div>

		<!-- Next button -->
		<button
			type="button"
			class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-secondary transition-colors hover:bg-surfaceMid hover:text-primary disabled:opacity-30 disabled:hover:bg-surface"
			onclick={next}
			disabled={current === TOTAL_SLIDES - 1}
			aria-label="Next slide"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<!-- Slide counter -->
	<div class="absolute top-4 right-6 z-10 font-mono text-sm text-secondary sm:right-10">
		{current + 1} / {TOTAL_SLIDES}
	</div>
</div>
