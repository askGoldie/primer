<script lang="ts">
	/**
	 * Pricing Philosophy Page
	 *
	 * Explains the $5,000 perpetual license model.
	 * @see /docs/tier-about-pages.md
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();
</script>

<Seo locale={data.locale} pageKey="about_pricing" path="/web/about/pricing" />

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<h1 class="text-hero text-primary">
		{t(data.locale, 'pricing.heading')}
	</h1>

	<p class="mt-6 text-lg text-secondary">
		{t(data.locale, 'pricing.intro')}
	</p>

	<div class="mt-12 space-y-8">
		<div>
			<h2 class="text-section-heading text-primary">{t(data.locale, 'pricing.gimmick.heading')}</h2>
			<p class="mt-2 text-secondary">{t(data.locale, 'pricing.gimmick.body')}</p>
		</div>

		<div>
			<h2 class="text-section-heading text-primary">{t(data.locale, 'pricing.trap.heading')}</h2>
			<p class="mt-2 text-secondary">{t(data.locale, 'pricing.trap.body')}</p>
		</div>

		<div>
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'pricing.economics.heading')}
			</h2>
			<p class="mt-2 text-secondary">{t(data.locale, 'pricing.economics.body')}</p>
		</div>

		<div>
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'pricing.constraints.heading')}
			</h2>
			<p class="mt-2 text-secondary">{t(data.locale, 'pricing.constraints.body')}</p>
		</div>
	</div>

	<div class="mt-16 border-t border-border pt-12">
		<h2 class="text-page-heading text-primary">{t(data.locale, 'pricing.perpetual.heading')}</h2>
		<p class="mt-4 text-secondary">{t(data.locale, 'pricing.perpetual.p1')}</p>
		<p class="mt-4 text-secondary">{t(data.locale, 'pricing.perpetual.p2')}</p>
		<p class="mt-4 text-secondary">{t(data.locale, 'pricing.perpetual.p3')}</p>
	</div>

	<div class="mt-12 border-t border-border pt-12">
		<h2 class="text-page-heading text-primary">{t(data.locale, 'pricing.investor.heading')}</h2>
		<p class="mt-4 text-secondary">{t(data.locale, 'pricing.investor.p1')}</p>
		<p class="mt-4 text-secondary">{t(data.locale, 'pricing.investor.p2')}</p>
		<p class="mt-4 text-secondary">{t(data.locale, 'pricing.investor.p3')}</p>
	</div>

	<!-- Price display -->
	<div class="mt-16 rounded-lg bg-surfaceMid p-8 text-center">
		<div class="text-5xl font-medium text-primary">$5,000</div>
		<div class="mt-2 text-lg text-secondary">{t(data.locale, 'account.perpetual')}</div>
		<div class="mx-auto mt-6 max-w-md text-sm text-secondary">
			{t(data.locale, 'purchase.disclaimer')}
		</div>
	</div>
</div>
