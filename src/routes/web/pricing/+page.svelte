<script lang="ts">
	/**
	 * Pricing Page
	 *
	 * Displays the $5,000 perpetual license price, what's included,
	 * total-cost-of-ownership comparison, and pricing FAQ.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade, NumberTicker } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildSoftwareApplication, buildBreadcrumbs } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	/** Track which FAQ items are expanded */
	let expanded: Record<string, boolean> = $state({});

	function toggle(id: string) {
		expanded[id] = !expanded[id];
	}

	/** What's included in the license */
	const includes = [
		{ key: 'pricing.includes.ready', icon: 'check' },
		{ key: 'pricing.includes.source', icon: 'code' },
		{ key: 'pricing.includes.deploy', icon: 'server' },
		{ key: 'pricing.includes.languages', icon: 'globe' },
		{ key: 'pricing.includes.modify', icon: 'pencil' },
		{ key: 'pricing.includes.no_recurring', icon: 'shield' },
		{ key: 'pricing.includes.roadmap', icon: 'compass' }
	];

	/** TCO comparison data */
	const tcoData = [
		{ period: 'pricing.tco_year1', primer: 5000, saas: 18000 },
		{ period: 'pricing.tco_year3', primer: 5000, saas: 54000 },
		{ period: 'pricing.tco_year5', primer: 5000, saas: 90000 }
	];

	/** Pricing FAQ */
	const faqs = ['pricing.faq1', 'pricing.faq2', 'pricing.faq3', 'pricing.faq4', 'pricing.faq5'];
</script>

<Seo locale={data.locale} pageKey="pricing" path="/web/pricing" />
<StructuredData data={buildSoftwareApplication(data.locale)} />
<StructuredData
	data={buildBreadcrumbs([
		{ name: t(data.locale, 'nav.home'), path: '/web/home' },
		{ name: t(data.locale, 'seo.pricing.title'), path: '/web/pricing' }
	])}
/>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Hero: price display with primary CTAs -->
	<BlurFade delay={0}>
		<div class="text-center">
			<div class="text-7xl font-medium tracking-tight text-primary sm:text-8xl">
				<span class="font-mono">{t(data.locale, 'pricing.currency_symbol')}</span><NumberTicker
					value={5000}
					duration={1200}
				/>
				<span class="ml-2 text-lg font-normal text-secondary">USD</span>
			</div>
			<h1 class="mt-4 text-2xl font-medium text-primary sm:text-3xl">
				{t(data.locale, 'pricing.hero_tagline')}
			</h1>
			<p class="mt-3 text-lg text-secondary">
				{t(data.locale, 'pricing.hero_sub')}
			</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a href={resolve('/web/register')} class="btn-primary px-8 py-3 text-base">
					{t(data.locale, 'pricing.cta_button')}
				</a>
				<a href={resolve('/web/contact')} class="btn-outline px-8 py-3 text-base">
					{t(data.locale, 'pricing.cta_contact')}
				</a>
			</div>
		</div>
	</BlurFade>

	<!-- What's Included -->
	<BlurFade delay={200}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'pricing.includes_heading')}
			</h2>
			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each includes as item (item.key)}
					<div
						class="rounded-lg border border-border bg-surfaceMid p-5 transition-colors hover:bg-surfaceHigh"
					>
						<div class="flex items-start gap-3">
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent2/10"
							>
								<svg
									class="h-4 w-4 text-accent2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<p class="text-sm font-medium text-primary">{t(data.locale, item.key)}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Why This Model + Canvas — elevated for prominence -->
	<BlurFade delay={400}>
		<div class="mt-20 rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8 sm:p-12">
			<h2 class="text-page-heading text-primary">{t(data.locale, 'pricing.philosophy_heading')}</h2>
			<p class="mt-4 leading-relaxed text-secondary">
				{t(data.locale, 'pricing.philosophy_body')}
			</p>
			<div class="mt-8 border-t border-accent1/10 pt-8">
				<h3 class="text-section-heading text-primary">
					{t(data.locale, 'pricing.canvas_heading')}
				</h3>
				<p class="mt-3 leading-relaxed text-secondary">
					{t(data.locale, 'pricing.canvas_body')}
				</p>
			</div>
		</div>
	</BlurFade>

	<!--
		Your roadmap, not ours: surfaces the SaaS feature-request trap as a
		first-class section instead of leaving it buried in the FAQ. This is
		the single biggest reason "free updates" matter less than they sound:
		owning the source means you're not waiting on anyone's roadmap.
	-->
	<BlurFade delay={450}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'pricing.roadmap_heading')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'pricing.roadmap_sub')}
			</p>

			<div class="mt-8 grid gap-6 sm:grid-cols-2">
				<!-- Typical SaaS column -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6 sm:p-8">
					<p class="text-eyebrow mb-3 text-secondary">
						{t(data.locale, 'pricing.roadmap_saas_label')}
					</p>
					<h3 class="text-xl font-medium text-primary sm:text-2xl">
						{t(data.locale, 'pricing.roadmap_saas_title')}
					</h3>
					<p class="mt-4 leading-relaxed text-secondary">
						{t(data.locale, 'pricing.roadmap_saas_body')}
					</p>
				</div>

				<!-- Primer column -->
				<div class="rounded-lg border-2 border-accent2 bg-accent2/5 p-6 sm:p-8">
					<p class="text-eyebrow mb-3 text-accent2">
						{t(data.locale, 'pricing.roadmap_primer_label')}
					</p>
					<h3 class="text-xl font-medium text-primary sm:text-2xl">
						{t(data.locale, 'pricing.roadmap_primer_title')}
					</h3>
					<p class="mt-4 leading-relaxed text-secondary">
						{t(data.locale, 'pricing.roadmap_primer_body')}
					</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- License Scope: one per legal entity -->
	<BlurFade delay={475}>
		<div class="mt-20 rounded-lg border border-accent2/30 bg-accent2/5 p-8 sm:p-10">
			<h2 class="text-page-heading text-primary">
				{t(data.locale, 'pricing.license_scope.title')}
			</h2>
			<p class="mt-4 leading-relaxed text-secondary">
				{t(data.locale, 'pricing.license_scope.body')}
			</p>
			<h3 class="text-section-heading mt-8 text-primary">
				{t(data.locale, 'pricing.license_scope.examples_heading')}
			</h3>
			<ul class="mt-4 space-y-3">
				<li class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-accent2"
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
					<span class="text-secondary">{t(data.locale, 'pricing.license_scope.example1')}</span>
				</li>
				<li class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-accent2"
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
					<span class="text-secondary">{t(data.locale, 'pricing.license_scope.example2')}</span>
				</li>
				<li class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-accent2"
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
					<span class="text-secondary">{t(data.locale, 'pricing.license_scope.example3')}</span>
				</li>
				<li class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-accent2"
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
					<span class="text-secondary">{t(data.locale, 'pricing.license_scope.example4')}</span>
				</li>
			</ul>
			<p class="mt-6 text-sm text-secondary">
				<a href={resolve('/web/for-partners')} class="text-accent1 underline hover:text-accent1/80">
					{t(data.locale, 'nav.for_partners')} →
				</a>
			</p>
		</div>
	</BlurFade>

	<!-- TCO Comparison -->
	<BlurFade delay={500}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'pricing.tco_heading')}
			</h2>
			<p class="mt-2 text-center text-secondary">
				{t(data.locale, 'pricing.tco_sub')}
			</p>

			<div class="mt-8 overflow-hidden rounded-lg border border-border">
				<table class="w-full">
					<thead>
						<tr class="bg-surfaceMid">
							<th class="px-6 py-4 text-left text-sm font-medium text-primary"></th>
							<th class="px-6 py-4 text-right text-sm font-medium text-primary">
								{t(data.locale, 'pricing.tco_primer')}
							</th>
							<th class="px-6 py-4 text-right text-sm font-medium text-secondary">
								{t(data.locale, 'pricing.tco_saas')}
							</th>
							<th class="px-6 py-4 text-right text-sm font-medium text-accent2">
								{t(data.locale, 'pricing.tco_savings')}
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each tcoData as row (row.period)}
							<tr class="transition-colors hover:bg-surfaceMid/50">
								<td class="px-6 py-4 text-sm font-medium text-primary">
									{t(data.locale, row.period)}
								</td>
								<td class="px-6 py-4 text-right font-mono text-sm text-primary">
									${row.primer.toLocaleString()}
								</td>
								<td class="px-6 py-4 text-right font-mono text-sm text-secondary line-through">
									${row.saas.toLocaleString()}
								</td>
								<td class="px-6 py-4 text-right font-mono text-sm font-medium text-accent2">
									${(row.saas - row.primer).toLocaleString()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="mt-4 text-center text-sm text-secondary">
				{t(data.locale, 'pricing.tco_footnote')}
			</p>
			<p class="mt-1 text-center text-xs text-secondary/60">
				{t(data.locale, 'pricing.tco_disclaimer')}
			</p>
		</div>
	</BlurFade>

	<!-- Integrated FAQ -->
	<BlurFade delay={600}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'pricing.faq_heading')}
			</h2>
			<div class="mt-8 divide-y divide-border rounded-lg border border-border">
				{#each faqs as faqKey (faqKey)}
					<div>
						<button
							type="button"
							class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surfaceHigh"
							onclick={() => toggle(faqKey)}
							aria-expanded={expanded[faqKey] ?? false}
						>
							<span class="font-medium text-primary">
								{t(data.locale, `${faqKey}.q`)}
							</span>
							<svg
								class="h-5 w-5 shrink-0 text-secondary transition-transform {expanded[faqKey]
									? 'rotate-180'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						{#if expanded[faqKey]}
							<div class="px-6 pb-4 text-secondary">
								{t(data.locale, `${faqKey}.a`)}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Bottom CTA -->
	<div class="mt-20 text-center">
		<a href={resolve('/web/register')} class="btn-primary px-10 py-3 text-base">
			{t(data.locale, 'pricing.cta_button')}
		</a>
	</div>
</div>
