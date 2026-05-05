<script lang="ts">
	/**
	 * Migration Guides Index
	 *
	 * Library page listing every "From <existing system> to Primer" guide.
	 * Each guide has its own page under /from-<slug>/ and reuses
	 * MigrationGuideLayout for consistent structure and tone.
	 *
	 * Editorial stance:
	 *   The guides do not position Primer as a replacement for any existing
	 *   framework. Each one shows how to (1) run Primer concurrently, (2)
	 *   combine it with the system you already use, or (3) A/B test for a
	 *   single cycle. Whatever conclusion the team reaches is the team's
	 *   conclusion — we never claim it.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/**
	 * The nine guides currently in the library. Order is intentional:
	 * OKRs lead because they are the most-asked-about source system,
	 * the operational frameworks (KPIs, BSC, 4DX) come next, the
	 * SMB/founder-led frameworks (EOS, V2MOM, Scaling Up adjacent)
	 * follow, and the lean / classical / regional frameworks close.
	 */
	/**
	 * Each guide's href is resolved eagerly with its literal route so
	 * SvelteKit's generic `resolve<T extends Route…>()` can narrow T to
	 * a single route string. Passing a runtime-built template literal
	 * widens T past the Route union and TypeScript fails to dispatch.
	 * The `slug` is retained for keying + future deep-link logic.
	 */
	const guides = [
		{
			slug: 'from-okrs',
			href: resolve('/web/resources/migration-guides/from-okrs'),
			titleKey: 'resources.mg.okrs.title',
			summaryKey: 'resources.mg.okrs.summary'
		},
		{
			slug: 'from-kpis',
			href: resolve('/web/resources/migration-guides/from-kpis'),
			titleKey: 'resources.mg.kpis.title',
			summaryKey: 'resources.mg.kpis.summary'
		},
		{
			slug: 'from-balanced-scorecard',
			href: resolve('/web/resources/migration-guides/from-balanced-scorecard'),
			titleKey: 'resources.mg.bsc.title',
			summaryKey: 'resources.mg.bsc.summary'
		},
		{
			slug: 'from-4dx',
			href: resolve('/web/resources/migration-guides/from-4dx'),
			titleKey: 'resources.mg.four_dx.title',
			summaryKey: 'resources.mg.four_dx.summary'
		},
		{
			slug: 'from-eos',
			href: resolve('/web/resources/migration-guides/from-eos'),
			titleKey: 'resources.mg.eos.title',
			summaryKey: 'resources.mg.eos.summary'
		},
		{
			slug: 'from-hoshin-kanri',
			href: resolve('/web/resources/migration-guides/from-hoshin-kanri'),
			titleKey: 'resources.mg.hoshin.title',
			summaryKey: 'resources.mg.hoshin.summary'
		},
		{
			slug: 'from-mbo',
			href: resolve('/web/resources/migration-guides/from-mbo'),
			titleKey: 'resources.mg.mbo.title',
			summaryKey: 'resources.mg.mbo.summary'
		},
		{
			slug: 'from-v2mom',
			href: resolve('/web/resources/migration-guides/from-v2mom'),
			titleKey: 'resources.mg.v2mom.title',
			summaryKey: 'resources.mg.v2mom.summary'
		},
		{
			slug: 'from-kras',
			href: resolve('/web/resources/migration-guides/from-kras'),
			titleKey: 'resources.mg.kras.title',
			summaryKey: 'resources.mg.kras.summary'
		}
	];
</script>

<Seo locale={data.locale} pageKey="mg_index" path="/web/resources/migration-guides" />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">
				{t(data.locale, 'resources.mg.index.eyebrow')}
			</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'resources.mg.index.title')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'resources.mg.index.subtitle')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Stance: not a replacement -->
	<BlurFade delay={100}>
		<div class="rounded-lg border-2 border-accent2/30 bg-accent2/5 p-8 sm:p-10">
			<p class="text-eyebrow mb-3 text-accent2">
				{t(data.locale, 'resources.mg.index.stance_eyebrow')}
			</p>
			<p class="text-lg leading-relaxed text-secondary">
				{t(data.locale, 'resources.mg.index.stance_body')}
			</p>
		</div>
	</BlurFade>

	<!-- Decision helper: which guide should I read? -->
	<BlurFade delay={200}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">
				{t(data.locale, 'resources.mg.index.helper_heading')}
			</h2>
			<p class="mt-3 max-w-2xl text-secondary">
				{t(data.locale, 'resources.mg.index.helper_intro')}
			</p>

			<div class="mt-8 grid gap-4 sm:grid-cols-3">
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<p class="text-eyebrow mb-2 text-accent1">
						{t(data.locale, 'resources.mg.index.helper_q1_label')}
					</p>
					<p class="text-sm leading-relaxed text-secondary">
						{t(data.locale, 'resources.mg.index.helper_q1_body')}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<p class="text-eyebrow mb-2 text-accent2">
						{t(data.locale, 'resources.mg.index.helper_q2_label')}
					</p>
					<p class="text-sm leading-relaxed text-secondary">
						{t(data.locale, 'resources.mg.index.helper_q2_body')}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<p class="text-eyebrow mb-2 text-accent3">
						{t(data.locale, 'resources.mg.index.helper_q3_label')}
					</p>
					<p class="text-sm leading-relaxed text-secondary">
						{t(data.locale, 'resources.mg.index.helper_q3_body')}
					</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Guide cards -->
	<BlurFade delay={300}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">
				{t(data.locale, 'resources.mg.index.library_heading')}
			</h2>
			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each guides as guide (guide.slug)}
					<a
						href={guide.href}
						class="block rounded-lg border border-border bg-surfaceMid p-6 transition-colors hover:border-accent1/50 hover:bg-surfaceHigh"
					>
						<h3 class="text-section-heading text-primary">
							{t(data.locale, guide.titleKey)}
						</h3>
						<p class="mt-3 text-sm leading-relaxed text-secondary">
							{t(data.locale, guide.summaryKey)}
						</p>
						<p class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent1">
							{t(data.locale, 'resources.mg.index.read_guide')}
							<svg
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
						</p>
					</a>
				{/each}
			</div>
		</div>
	</BlurFade>
</div>
