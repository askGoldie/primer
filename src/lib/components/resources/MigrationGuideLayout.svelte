<script lang="ts">
	/**
	 * MigrationGuideLayout
	 *
	 * Shared layout for every "From <existing system> to Primer" guide under
	 * /web/resources/migration-guides/*. Each guide is a thin +page.svelte that
	 * passes a single `i18nPrefix` plus its SEO/path metadata; this component
	 * resolves all user-facing strings from the locale files using that prefix
	 * so the content stays translatable and consistent across guides.
	 *
	 * ──────────────────────────────────────────────────────────────────────
	 * Editorial stance — read this before writing or editing a guide
	 * ──────────────────────────────────────────────────────────────────────
	 * The guides are deliberately humble. We do NOT position Primer as a
	 * replacement for any established framework. The reader's existing system
	 * (OKRs, KPIs, Balanced Scorecard, 4DX, EOS, Hoshin Kanri, MBO, V2MOM,
	 * KRAs, etc.) works for them, or they would not still be running it. Our
	 * job is to make it easy to:
	 *
	 *   1. Run Primer concurrently with their current system (no commitment)
	 *   2. Combine the two — fold their existing structure into Primer's
	 *      goal/metric/tier model without losing what they already have
	 *   3. A/B test side-by-side for a cycle, with the same teams reporting
	 *      into both, and let the data make the case
	 *
	 * What we never say:
	 *   - "Replace your <system>"
	 *   - "Better than <system>"
	 *   - "Limitations of <system>"
	 *   - "Upgrade from <system>"
	 *
	 * What we always say:
	 *   - "<system> works. Here is how Primer can run alongside it."
	 *   - "Translate, don't throw away."
	 *   - "Run them in parallel and let your team discover what fits."
	 *
	 * The reader is the one who decides — not us, not the guide.
	 *
	 * ──────────────────────────────────────────────────────────────────────
	 * Required i18n keys per guide (all under `${i18nPrefix}.*`)
	 * ──────────────────────────────────────────────────────────────────────
	 *   eyebrow                 — small label above the hero title
	 *   title                   — h1
	 *   subtitle                — hero sub-heading
	 *   stance                  — opening paragraph respecting the source system
	 *   concepts_heading        — "Translating concepts" section heading
	 *   concepts_intro          — short paragraph before the table
	 *   row1_src .. row5_src    — left column (source-system concept)
	 *   row1_dst .. row5_dst    — middle column (Primer equivalent)
	 *   row1_note .. row5_note  — right column (one-line translation note)
	 *   concurrent_heading      — "Run it concurrently" section heading
	 *   concurrent_body         — body for concurrent running
	 *   combine_heading         — "Combine inside Primer" section heading
	 *   combine_body            — body for combining
	 *   ab_heading              — "A/B test for one cycle" section heading
	 *   ab_body                 — body for A/B testing
	 *   additions_heading       — "What Primer contributes beyond…" heading
	 *   additions_intro         — short paragraph before the additions grid
	 *   addition1_label .. addition5_label  — card titles (one per element)
	 *   addition1_body  .. addition5_body   — card descriptions
	 *   modifications_heading   — "Customization suggestions" heading
	 *   modifications_intro     — short paragraph before the modifications list
	 *   mod1_label .. mod5_label            — modification titles
	 *   mod1_body  .. mod5_body             — modification descriptions
	 *   discover_heading        — "Let your team discover" section heading
	 *   discover_body           — closing paragraph (no claims, just an invite)
	 *   cta_heading             — final CTA heading
	 *   cta_body                — final CTA body
	 *
	 * Required SEO keys (under `seo.${pageKey}.*`):
	 *   title, description, keywords, og_title, og_description
	 */

	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/index.js';
	import type { Locale } from '$lib/types/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	interface Props {
		/** Current page locale (from `data.locale`) */
		locale: Locale;
		/** SEO key prefix — looks up `seo.<pageKey>.*` in locale files */
		pageKey: string;
		/** Page path (no origin) — e.g. `/web/resources/migration-guides/from-okrs` */
		path: string;
		/** i18n key prefix for this guide's body content — e.g. `resources.mg.okrs` */
		i18nPrefix: string;
	}

	let { locale, pageKey, path, i18nPrefix }: Props = $props();

	/**
	 * Each guide ships with exactly five translation-table rows. Five is
	 * enough to cover the core concept map of any framework we currently
	 * write a guide for, and keeping the count fixed lets the layout, the
	 * locale schema, and the visual rhythm stay consistent across guides.
	 */
	const ROWS = [1, 2, 3, 4, 5] as const;

	/**
	 * "Additional elements" cards and "Customization suggestions" list items
	 * are also fixed at five apiece. Five is enough to give each guide a
	 * meaningful comparison surface without bloating the locale schema, and
	 * keeping the count fixed means the layout stays balanced visually no
	 * matter which guide is being rendered.
	 *
	 * Editorial reminder: the `additions_*` keys are where we describe what
	 * Primer contributes *on top of* the reader's existing framework — they
	 * are descriptive, not dismissive. The `mod_*` keys are concrete,
	 * source-code-level changes a customer might make (this is a perpetual
	 * source-license product) to better fit Primer to their house style of
	 * the framework they already use.
	 */
	const ADDITIONS = [1, 2, 3, 4, 5] as const;
	const MODS = [1, 2, 3, 4, 5] as const;

	/** Resolve a guide-scoped i18n key like `resources.mg.okrs.title`. */
	function key(suffix: string): string {
		return `${i18nPrefix}.${suffix}`;
	}
</script>

<Seo {locale} {pageKey} {path} />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">
				{t(locale, key('eyebrow'))}
			</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(locale, key('title'))}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(locale, key('subtitle'))}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Stance: respect for the source system -->
	<BlurFade delay={100}>
		<div class="rounded-lg border-2 border-accent2/30 bg-accent2/5 p-8 sm:p-10">
			<p class="text-eyebrow mb-3 text-accent2">
				{t(locale, 'resources.mg.shared.stance_eyebrow')}
			</p>
			<p class="text-lg leading-relaxed text-secondary">
				{t(locale, key('stance'))}
			</p>
		</div>
	</BlurFade>

	<!-- Translation table -->
	<BlurFade delay={200}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">
				{t(locale, key('concepts_heading'))}
			</h2>
			<p class="mt-3 max-w-2xl text-secondary">
				{t(locale, key('concepts_intro'))}
			</p>

			<div class="mt-8 overflow-hidden rounded-lg border border-border">
				<table class="w-full text-left text-sm">
					<thead class="bg-surfaceMid">
						<tr>
							<th class="px-4 py-3 font-medium text-primary">
								{t(locale, 'resources.mg.shared.col_source')}
							</th>
							<th class="px-4 py-3 font-medium text-primary">
								{t(locale, 'resources.mg.shared.col_primer')}
							</th>
							<th class="px-4 py-3 font-medium text-primary">
								{t(locale, 'resources.mg.shared.col_note')}
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border bg-surface">
						{#each ROWS as n (n)}
							<tr class="align-top">
								<td class="px-4 py-3 font-medium text-primary">
									{t(locale, key(`row${n}_src`))}
								</td>
								<td class="px-4 py-3 text-secondary">
									{t(locale, key(`row${n}_dst`))}
								</td>
								<td class="px-4 py-3 text-secondary">
									{t(locale, key(`row${n}_note`))}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</BlurFade>

	<!-- Three ways to try Primer alongside the existing system -->
	<BlurFade delay={300}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">
				{t(locale, 'resources.mg.shared.three_paths_heading')}
			</h2>
			<p class="mt-3 max-w-2xl text-secondary">
				{t(locale, 'resources.mg.shared.three_paths_intro')}
			</p>

			<div class="mt-8 grid gap-4 sm:grid-cols-3">
				<!-- Path 1: Concurrent -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<p class="text-eyebrow mb-2 text-accent1">
						{t(locale, 'resources.mg.shared.path1_label')}
					</p>
					<h3 class="text-section-heading text-primary">
						{t(locale, key('concurrent_heading'))}
					</h3>
					<p class="mt-3 text-sm leading-relaxed text-secondary">
						{t(locale, key('concurrent_body'))}
					</p>
				</div>

				<!-- Path 2: Combine -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<p class="text-eyebrow mb-2 text-accent2">
						{t(locale, 'resources.mg.shared.path2_label')}
					</p>
					<h3 class="text-section-heading text-primary">
						{t(locale, key('combine_heading'))}
					</h3>
					<p class="mt-3 text-sm leading-relaxed text-secondary">
						{t(locale, key('combine_body'))}
					</p>
				</div>

				<!-- Path 3: A/B Test -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<p class="text-eyebrow mb-2 text-accent3">
						{t(locale, 'resources.mg.shared.path3_label')}
					</p>
					<h3 class="text-section-heading text-primary">
						{t(locale, key('ab_heading'))}
					</h3>
					<p class="mt-3 text-sm leading-relaxed text-secondary">
						{t(locale, key('ab_body'))}
					</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!--
		"What Primer adds" — descriptive comparison, not positioning.
		Every card names one element Primer contributes beyond the standard
		framework model and explains it in plain terms. The intent is to
		help a reader who is already running the source system decide what
		they would gain by also running Primer — not to claim superiority.
	-->
	<BlurFade delay={350}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">
				{t(locale, key('additions_heading'))}
			</h2>
			<p class="mt-3 max-w-2xl text-secondary">
				{t(locale, key('additions_intro'))}
			</p>

			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each ADDITIONS as n (n)}
					<div class="rounded-lg border border-border bg-surfaceMid p-6">
						<h3 class="text-section-heading text-primary">
							{t(locale, key(`addition${n}_label`))}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-secondary">
							{t(locale, key(`addition${n}_body`))}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!--
		"Customization suggestions" — concrete, source-code-level modifications
		a customer might consider making so Primer better expresses the
		framework they already run. Phrased as optional suggestions, not
		prescriptions, because each customer owns the source and their house
		style may differ. This section is what makes a "perpetual source
		license" product materially different from a SaaS migration guide.
	-->
	<BlurFade delay={380}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">
				{t(locale, key('modifications_heading'))}
			</h2>
			<p class="mt-3 max-w-2xl text-secondary">
				{t(locale, key('modifications_intro'))}
			</p>

			<ol class="mt-8 space-y-4">
				{#each MODS as n (n)}
					<li class="rounded-lg border border-border bg-surface p-5">
						<p class="font-medium text-primary">
							{t(locale, key(`mod${n}_label`))}
						</p>
						<p class="mt-2 text-sm leading-relaxed text-secondary">
							{t(locale, key(`mod${n}_body`))}
						</p>
					</li>
				{/each}
			</ol>
			<p class="mt-6 text-sm text-secondary/80 italic">
				{t(locale, 'resources.mg.shared.mods_footer')}
			</p>
		</div>
	</BlurFade>

	<!-- Discover (closing — no claims, just an invitation) -->
	<BlurFade delay={400}>
		<div class="mt-16 rounded-lg border border-border bg-surfaceMid p-8 sm:p-10">
			<h2 class="text-section-heading text-primary">
				{t(locale, key('discover_heading'))}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(locale, key('discover_body'))}
			</p>
		</div>
	</BlurFade>

	<!-- CTA -->
	<BlurFade delay={500}>
		<div class="mt-16 text-center">
			<h3 class="text-page-heading text-primary">
				{t(locale, key('cta_heading'))}
			</h3>
			<p class="mx-auto mt-3 max-w-lg text-secondary">
				{t(locale, key('cta_body'))}
			</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a href={resolve('/web/demo')} class="btn-primary px-8 py-3 text-base">
					{t(locale, 'resources.mg.shared.cta_demo')}
				</a>
				<a
					href={resolve('/web/resources/migration-guides')}
					class="btn-outline px-8 py-3 text-base"
				>
					{t(locale, 'resources.mg.shared.cta_more_guides')}
				</a>
			</div>
		</div>
	</BlurFade>
</div>
