<script lang="ts">
	/**
	 * Privacy Policy Page
	 *
	 * Covers data collection practices for the Primer demo site,
	 * GDPR compliance, and visitor/user rights. Does not cover
	 * self-hosted customer deployments.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/** Data collection categories */
	const dataCategories = [
		{
			heading: 'privacy.data_collected.account.heading',
			body: 'privacy.data_collected.account.body'
		},
		{
			heading: 'privacy.data_collected.contact.heading',
			body: 'privacy.data_collected.contact.body'
		},
		{ heading: 'privacy.data_collected.usage.heading', body: 'privacy.data_collected.usage.body' },
		{
			heading: 'privacy.data_collected.cookies.heading',
			body: 'privacy.data_collected.cookies.body'
		}
	];

	/** Legal bases for processing */
	const legalBases = [
		{ heading: 'privacy.legal_basis.consent.heading', body: 'privacy.legal_basis.consent.body' },
		{
			heading: 'privacy.legal_basis.legitimate.heading',
			body: 'privacy.legal_basis.legitimate.body'
		},
		{ heading: 'privacy.legal_basis.contract.heading', body: 'privacy.legal_basis.contract.body' }
	];

	/** GDPR rights */
	const gdprRights = [
		'privacy.gdpr_rights.access',
		'privacy.gdpr_rights.rectification',
		'privacy.gdpr_rights.erasure',
		'privacy.gdpr_rights.restrict',
		'privacy.gdpr_rights.portability',
		'privacy.gdpr_rights.object',
		'privacy.gdpr_rights.withdraw',
		'privacy.gdpr_rights.lodge'
	];
</script>

<Seo locale={data.locale} pageKey="privacy" path="/web/about/privacy-policy" />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'privacy.page_title')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'privacy.hero')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'privacy.hero_sub')}
			</p>
			<p class="mt-4 text-sm text-secondary/60">
				{t(data.locale, 'privacy.effective_date')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Scope -->
	<BlurFade delay={100}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'privacy.scope.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'privacy.scope.body')}</p>
		</section>
	</BlurFade>

	<!-- Data We Collect -->
	<BlurFade delay={200}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.data_collected.heading')}
			</h2>
			<div class="mt-6 grid gap-4 sm:grid-cols-2">
				{#each dataCategories as item (item.heading)}
					<div class="rounded-lg border border-border bg-surfaceMid p-5">
						<h3 class="font-medium text-primary">{t(data.locale, item.heading)}</h3>
						<p class="mt-2 text-sm text-secondary">{t(data.locale, item.body)}</p>
					</div>
				{/each}
			</div>
		</section>
	</BlurFade>

	<!-- Legal Basis -->
	<BlurFade delay={300}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.legal_basis.heading')}
			</h2>
			<div class="mt-6 grid gap-4 sm:grid-cols-3">
				{#each legalBases as item (item.heading)}
					<div class="rounded-lg border border-border bg-surfaceMid p-5">
						<h3 class="font-medium text-primary">{t(data.locale, item.heading)}</h3>
						<p class="mt-2 text-sm text-secondary">{t(data.locale, item.body)}</p>
					</div>
				{/each}
			</div>
		</section>
	</BlurFade>

	<!-- Data Sharing -->
	<BlurFade delay={350}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.data_sharing.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(data.locale, 'privacy.data_sharing.body')}
			</p>
		</section>
	</BlurFade>

	<!-- Data Retention -->
	<BlurFade delay={400}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.data_retention.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(data.locale, 'privacy.data_retention.body')}
			</p>
		</section>
	</BlurFade>

	<!-- GDPR Rights -->
	<BlurFade delay={450}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.gdpr_rights.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(data.locale, 'privacy.gdpr_rights.intro')}
			</p>
			<ul class="mt-4 space-y-2">
				{#each gdprRights as right (right)}
					<li class="flex items-start gap-2 text-sm text-secondary">
						<svg
							class="mt-0.5 h-4 w-4 flex-shrink-0 text-accent2"
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
						{t(data.locale, right)}
					</li>
				{/each}
			</ul>
			<p class="mt-4 text-sm text-secondary">{t(data.locale, 'privacy.gdpr_rights.contact')}</p>
		</section>
	</BlurFade>

	<!-- International Transfers -->
	<BlurFade delay={500}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.international.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(data.locale, 'privacy.international.body')}
			</p>
		</section>
	</BlurFade>

	<!-- Children's Privacy -->
	<BlurFade delay={525}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'privacy.children.heading')}
			</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'privacy.children.body')}</p>
		</section>
	</BlurFade>

	<!-- Changes -->
	<BlurFade delay={550}>
		<section class="mb-12">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'privacy.changes.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'privacy.changes.body')}</p>
		</section>
	</BlurFade>

	<!-- Contact -->
	<BlurFade delay={575}>
		<section class="rounded-lg border border-border bg-surfaceMid p-8">
			<h2 class="text-section-heading text-primary">{t(data.locale, 'privacy.contact.heading')}</h2>
			<p class="mt-3 leading-relaxed text-secondary">{t(data.locale, 'privacy.contact.body')}</p>
		</section>
	</BlurFade>
</div>
