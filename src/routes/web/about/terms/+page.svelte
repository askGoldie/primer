<script lang="ts">
	/**
	 * Terms of Service Page
	 *
	 * Governs usage of the Primer demo site only.
	 * Does not cover self-hosted customer deployments —
	 * those are governed by the License Terms.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/** Acceptable use items */
	const acceptableUseItems = [
		'terms.acceptable_use.item1',
		'terms.acceptable_use.item2',
		'terms.acceptable_use.item3',
		'terms.acceptable_use.item4',
		'terms.acceptable_use.item5',
		'terms.acceptable_use.item6'
	];

	/** Sequential content sections */
	const sections = [
		{ heading: 'terms.acceptance.heading', body: 'terms.acceptance.body' },
		{ heading: 'terms.scope.heading', body: 'terms.scope.body' },
		{ heading: 'terms.demo_account.heading', body: 'terms.demo_account.body' }
	];

	/** Post-acceptable-use sections */
	const legalSections = [
		{ heading: 'terms.ip.heading', body: 'terms.ip.body' },
		{ heading: 'terms.disclaimer.heading', body: 'terms.disclaimer.body' },
		{ heading: 'terms.liability.heading', body: 'terms.liability.body' },
		{ heading: 'terms.termination.heading', body: 'terms.termination.body' },
		{ heading: 'terms.governing_law.heading', body: 'terms.governing_law.body' },
		{ heading: 'terms.changes.heading', body: 'terms.changes.body' }
	];
</script>

<Seo locale={data.locale} pageKey="terms" path="/web/about/terms" />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'terms.page_title')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'terms.hero')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'terms.hero_sub')}
			</p>
			<p class="mt-4 text-sm text-secondary/60">
				{t(data.locale, 'terms.effective_date')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Acceptance, Scope, Demo Accounts -->
	{#each sections as item, i (i)}
		<BlurFade delay={100 + i * 75}>
			<section class="mb-12">
				<h2 class="text-section-heading text-primary">{t(data.locale, item.heading)}</h2>
				<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, item.body)}</p>
			</section>
		</BlurFade>
	{/each}

	<!-- Acceptable Use -->
	<BlurFade delay={325}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'terms.acceptable_use.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(data.locale, 'terms.acceptable_use.intro')}
			</p>
			<ul class="mt-4 space-y-2">
				{#each acceptableUseItems as item (item)}
					<li class="flex items-start gap-2 text-sm text-secondary">
						<svg
							class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						{t(data.locale, item)}
					</li>
				{/each}
			</ul>
		</section>
	</BlurFade>

	<!-- Legal Sections -->
	{#each legalSections as item, i (i)}
		<BlurFade delay={400 + i * 50}>
			<section class="mb-12">
				<h2 class="text-section-heading text-primary">{t(data.locale, item.heading)}</h2>
				<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, item.body)}</p>
			</section>
		</BlurFade>
	{/each}

	<!-- Contact -->
	<BlurFade delay={700}>
		<section class="rounded-lg border border-border bg-surfaceMid p-8">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'terms.contact.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'terms.contact.body')}</p>
		</section>
	</BlurFade>
</div>
