<script lang="ts">
	/**
	 * FAQ Page
	 *
	 * Frequently asked questions about Tier's perpetual license model,
	 * deployment, support, and product capabilities.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildFaqPage, buildBreadcrumbs } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	/** Track which FAQ items are expanded */
	let expanded: Record<string, boolean> = $state({});

	function toggle(id: string) {
		expanded[id] = !expanded[id];
	}

	/** FAQ sections with their question keys */
	const sections = [
		{
			heading: 'faq.section_product',
			items: ['faq.what_is_grasp', 'faq.who_is_it_for', 'faq.is_it_saas']
		},
		{
			heading: 'faq.section_licensing',
			items: ['faq.what_do_i_get', 'faq.how_much', 'faq.updates']
		},
		{
			heading: 'faq.section_deployment',
			items: ['faq.what_do_i_need', 'faq.which_database', 'faq.can_i_modify']
		},
		{
			heading: 'faq.section_support',
			items: ['faq.do_you_offer_support', 'faq.what_if_something_breaks', 'faq.deployment_help']
		}
	];
</script>

<Seo locale={data.locale} pageKey="faq" path="/web/about/faq" />
<!--
	FAQPage JSON-LD — lifted from the existing faq.* i18n keys so AI assistants
	(and Google's rich-result FAQ snippet) can ingest the Q&A pairs verbatim.
	The list mirrors the `sections` array above; keep them in sync if you
	add or remove FAQ entries.
-->
<StructuredData
	data={buildFaqPage(
		sections.flatMap((section) =>
			section.items.map((id) => ({
				question: t(data.locale, `${id}.q`),
				answer: t(data.locale, `${id}.a`)
			}))
		)
	)}
/>
<StructuredData
	data={buildBreadcrumbs([
		{ name: t(data.locale, 'nav.home'), path: '/web/home' },
		{ name: t(data.locale, 'nav.about'), path: '/web/about' },
		{ name: t(data.locale, 'seo.faq.title'), path: '/web/about/faq' }
	])}
/>

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<h1 class="text-hero text-primary">
		{t(data.locale, 'faq.heading')}
	</h1>
	<p class="mt-4 text-lg text-secondary">
		{t(data.locale, 'faq.subheading')}
	</p>

	{#each sections as section (section.heading)}
		<div class="mt-12">
			<h2 class="text-page-heading text-primary">
				{t(data.locale, section.heading)}
			</h2>
			<div class="mt-6 divide-y divide-border rounded-lg border border-border">
				{#each section.items as itemKey (itemKey)}
					<div>
						<button
							type="button"
							class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surfaceHigh"
							onclick={() => toggle(itemKey)}
							aria-expanded={expanded[itemKey] ?? false}
						>
							<span class="font-medium text-primary">
								{t(data.locale, `${itemKey}.q`)}
							</span>
							<svg
								class="h-5 w-5 shrink-0 text-secondary transition-transform {expanded[itemKey]
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
						{#if expanded[itemKey]}
							<div class="px-6 pb-4 text-secondary">
								{t(data.locale, `${itemKey}.a`)}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
