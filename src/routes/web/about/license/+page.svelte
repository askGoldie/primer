<script lang="ts">
	/**
	 * License Terms Page
	 *
	 * Presents the perpetual source code license in plain language,
	 * covering what the customer can and cannot do with the code.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/** What you CAN do */
	const canDo = [
		{ heading: 'license.can.ready.heading', body: 'license.can.ready.body' },
		{ heading: 'license.can.deploy.heading', body: 'license.can.deploy.body' },
		{ heading: 'license.can.modify.heading', body: 'license.can.modify.body' },
		{ heading: 'license.can.rebrand.heading', body: 'license.can.rebrand.body' },
		{ heading: 'license.can.internal.heading', body: 'license.can.internal.body' },
		{ heading: 'license.can.forever.heading', body: 'license.can.forever.body' }
	];

	/** What you CANNOT do */
	const cannotDo = [
		{ heading: 'license.cannot.resell.heading', body: 'license.cannot.resell.body' },
		{ heading: 'license.cannot.whitelabel.heading', body: 'license.cannot.whitelabel.body' },
		{ heading: 'license.cannot.attribution.heading', body: 'license.cannot.attribution.body' }
	];
</script>

<Seo locale={data.locale} pageKey="license" path="/web/about/license" />

<!-- Hero with accent warmth -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'license.page_title')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'license.hero_new')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'license.hero_sub')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- The short version -->
	<BlurFade delay={100}>
		<div class="rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8 text-center">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'license.summary_heading')}</h2>
			<p class="mx-auto mt-3 max-w-xl leading-relaxed text-secondary">
				{t(data.locale, 'license.summary_body')}
			</p>
		</div>
	</BlurFade>

	<!-- What You Can Do -->
	<BlurFade delay={200}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">{t(data.locale, 'license.can.heading')}</h2>
			<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each canDo as item (item.heading)}
					<div
						class="rounded-lg border border-accent2/20 bg-accent2/5 p-5 transition-colors hover:bg-accent2/10"
					>
						<div class="flex items-center gap-2">
							<svg
								class="h-5 w-5 flex-shrink-0 text-accent2"
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
							<h3 class="font-medium text-primary">{t(data.locale, item.heading)}</h3>
						</div>
						<p class="mt-2 text-sm text-secondary">{t(data.locale, item.body)}</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- What You Cannot Do -->
	<BlurFade delay={400}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">{t(data.locale, 'license.cannot.heading')}</h2>
			<div class="mt-6 grid gap-4 sm:grid-cols-3">
				{#each cannotDo as item (item.heading)}
					<div class="rounded-lg border border-border bg-surfaceMid p-5">
						<div class="flex items-center gap-2">
							<svg
								class="h-5 w-5 flex-shrink-0 text-red-600"
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
							<h3 class="font-medium text-primary">{t(data.locale, item.heading)}</h3>
						</div>
						<p class="mt-2 text-sm text-secondary">{t(data.locale, item.body)}</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Updates -->
	<BlurFade delay={500}>
		<div class="mt-16 rounded-lg bg-surfaceMid p-8">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'license.updates.heading')}</h2>
			<p class="mt-3 text-secondary">{t(data.locale, 'license.updates.p1')}</p>
			<p class="mt-3 text-secondary">{t(data.locale, 'license.updates.p2')}</p>
		</div>
	</BlurFade>

	<!-- If Tier Disappears -->
	<BlurFade delay={600}>
		<div class="mt-8 rounded-lg border border-border bg-surfaceMid p-8">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'license.disappear.heading')}
			</h2>
			<p class="mt-3 text-secondary">{t(data.locale, 'license.disappear.p1')}</p>
			<p class="mt-3 text-secondary">{t(data.locale, 'license.disappear.p2')}</p>
		</div>
	</BlurFade>
</div>
