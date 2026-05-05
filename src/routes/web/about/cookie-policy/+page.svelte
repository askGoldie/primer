<script lang="ts">
	/**
	 * Cookie Policy Page
	 *
	 * GDPR-compliant cookie disclosure for the Primer demo site.
	 * Documents all cookies used (essential only) with a clear table
	 * and explains user choices.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/** Cookie inventory for the table */
	const cookies = [
		{
			name: 'cookie.types.lang.name',
			purpose: 'cookie.types.lang.purpose',
			duration: 'cookie.types.lang.duration',
			type: 'cookie.types.lang.type'
		},
		{
			name: 'cookie.types.session.name',
			purpose: 'cookie.types.session.purpose',
			duration: 'cookie.types.session.duration',
			type: 'cookie.types.session.type'
		},
		{
			name: 'cookie.types.perspective.name',
			purpose: 'cookie.types.perspective.purpose',
			duration: 'cookie.types.perspective.duration',
			type: 'cookie.types.perspective.type'
		}
	];
</script>

<Seo locale={data.locale} pageKey="cookie" path="/web/about/cookie-policy" />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'cookie.page_title')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'cookie.hero')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'cookie.hero_sub')}
			</p>
			<p class="mt-4 text-sm text-secondary/60">
				{t(data.locale, 'cookie.effective_date')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- What Are Cookies -->
	<BlurFade delay={100}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'cookie.what.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'cookie.what.body')}</p>
		</section>
	</BlurFade>

	<!-- How We Use Cookies -->
	<BlurFade delay={200}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'cookie.how.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'cookie.how.body')}</p>
		</section>
	</BlurFade>

	<!-- Cookie Table -->
	<BlurFade delay={300}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'cookie.types.heading')}</h2>
			<div class="mt-6 overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border text-left">
							<th class="pr-4 pb-3 font-medium text-primary"
								>{t(data.locale, 'cookie.table.name')}</th
							>
							<th class="pr-4 pb-3 font-medium text-primary"
								>{t(data.locale, 'cookie.table.purpose')}</th
							>
							<th class="pr-4 pb-3 font-medium text-primary"
								>{t(data.locale, 'cookie.table.duration')}</th
							>
							<th class="pb-3 font-medium text-primary">{t(data.locale, 'cookie.table.type')}</th>
						</tr>
					</thead>
					<tbody>
						{#each cookies as cookie (cookie.name)}
							<tr class="border-b border-border/50">
								<td class="py-3 pr-4 font-mono text-xs text-primary"
									>{t(data.locale, cookie.name)}</td
								>
								<td class="py-3 pr-4 text-secondary">{t(data.locale, cookie.purpose)}</td>
								<td class="py-3 pr-4 text-secondary">{t(data.locale, cookie.duration)}</td>
								<td class="py-3">
									<span
										class="inline-block rounded-full bg-accent2/10 px-2 py-0.5 text-xs font-medium text-accent2"
									>
										{t(data.locale, cookie.type)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</BlurFade>

	<!-- Third-Party Cookies -->
	<BlurFade delay={400}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'cookie.third_party.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'cookie.third_party.body')}</p>
		</section>
	</BlurFade>

	<!-- Your Choices -->
	<BlurFade delay={450}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'cookie.consent.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'cookie.consent.body')}</p>
		</section>
	</BlurFade>

	<!-- Changes -->
	<BlurFade delay={500}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'cookie.changes.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'cookie.changes.body')}</p>
		</section>
	</BlurFade>

	<!-- Contact -->
	<BlurFade delay={550}>
		<section class="rounded-lg border border-border bg-surfaceMid p-8">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'cookie.contact.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'cookie.contact.body')}</p>
		</section>
	</BlurFade>
</div>
