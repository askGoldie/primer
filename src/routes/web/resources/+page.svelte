<script lang="ts">
	/**
	 * Resources Landing Page
	 *
	 * Top of the /web/resources/* section. Two resources live here today:
	 *
	 *   1. Deployment Requirements — what your team needs in place to host
	 *      Primer in your environment. Surfaced first because it is the
	 *      highest-intent resource for buyers in evaluation.
	 *   2. Migration Guides — how Primer can run alongside or absorb the
	 *      goal/metric framework your team already uses.
	 *
	 * The page is structured to grow: case studies, threshold-calibration
	 * playbooks, cadence guides, and the glossary all belong here as
	 * additional cards (and eventually their own sub-folders) later.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/**
	 * Resource cards in display order. Deployment is intentionally first.
	 *
	 * `href` is resolved eagerly (vs. `resolve(card.href)` in the template)
	 * so each call receives a single literal route string, satisfying
	 * SvelteKit's generic `resolve<T extends Route…>()` signature. Passing
	 * a widened `string` through the template would fail type inference.
	 */
	const cards = [
		{
			href: resolve('/web/deployment'),
			eyebrowKey: 'resources.deployment_card.eyebrow',
			titleKey: 'resources.deployment_card.title',
			bodyKey: 'resources.deployment_card.body',
			ctaKey: 'resources.deployment_card.cta',
			tone: 'accent3' as const
		},
		{
			href: resolve('/web/resources/migration-guides'),
			eyebrowKey: 'resources.migration_card.eyebrow',
			titleKey: 'resources.migration_card.title',
			bodyKey: 'resources.migration_card.body',
			ctaKey: 'resources.migration_card.cta',
			tone: 'accent1' as const
		}
	];
</script>

<Seo locale={data.locale} pageKey="resources" path="/web/resources" />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">
				{t(data.locale, 'resources.eyebrow')}
			</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'resources.hero.title')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'resources.hero.body')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="space-y-6">
		{#each cards as card, i (card.href)}
			<BlurFade delay={100 + i * 100}>
				<a
					href={card.href}
					class="block rounded-lg border-2 p-8 transition-colors sm:p-12
						{card.tone === 'accent1' ? 'border-accent1/30 bg-accent1/5 hover:border-accent1/50' : ''}
						{card.tone === 'accent3' ? 'border-accent3/30 bg-accent3/5 hover:border-accent3/50' : ''}"
				>
					<p
						class="text-eyebrow mb-3
							{card.tone === 'accent1' ? 'text-accent1' : ''}
							{card.tone === 'accent3' ? 'text-accent3' : ''}"
					>
						{t(data.locale, card.eyebrowKey)}
					</p>
					<h2 class="text-page-heading text-primary">
						{t(data.locale, card.titleKey)}
					</h2>
					<p class="mt-4 max-w-2xl leading-relaxed text-secondary">
						{t(data.locale, card.bodyKey)}
					</p>
					<p
						class="mt-6 inline-flex items-center gap-2 text-sm font-medium
							{card.tone === 'accent1' ? 'text-accent1' : ''}
							{card.tone === 'accent3' ? 'text-accent3' : ''}"
					>
						{t(data.locale, card.ctaKey)}
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
			</BlurFade>
		{/each}
	</div>

	<!-- Honest "more coming" placeholder so the page reads as a growing library -->
	<BlurFade delay={400}>
		<div class="mt-8 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
			<p class="text-sm text-secondary">
				{t(data.locale, 'resources.coming_soon')}
			</p>
		</div>
	</BlurFade>
</div>
