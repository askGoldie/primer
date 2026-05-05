<script lang="ts">
	/**
	 * Security Page
	 *
	 * Explains Primer's security posture: customer-owned source code,
	 * self-hosted deployment, architecture overview, and compliance notes.
	 */

	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	/** Security pillars */
	const pillars = [
		{
			key: 'security.pillar1',
			icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2'
		},
		{
			key: 'security.pillar2',
			icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
		},
		{
			key: 'security.pillar3',
			icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
		},
		{
			key: 'security.pillar4',
			icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
		},
		{
			key: 'security.pillar5',
			icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
		},
		{
			key: 'security.pillar6',
			icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
		}
	];

	/** Alternating accent colors for the 6 security pillars */
	const securityAccents = ['accent2', 'accent3', 'accent2', 'accent3', 'accent2', 'accent3'];

	/** Compliance sections (reuse existing keys) */
	const compliance = [
		{
			heading: 'security.compliance.regulated.heading',
			body: 'security.compliance.regulated.body'
		},
		{
			heading: 'security.compliance.enterprise.heading',
			body: 'security.compliance.enterprise.body'
		},
		{
			heading: 'security.compliance.residency.heading',
			body: 'security.compliance.residency.body'
		},
		{ heading: 'security.compliance.gov.heading', body: 'security.compliance.gov.body' }
	];

	/**
	 * Compliance framework mapping.
	 *
	 * The stance: DavidPM does not hold certifications. The product is source
	 * code that runs inside the customer's existing compliance perimeter, so
	 * the customer's controls cover Primer directly. These cards give each
	 * framework its own defensible answer for the "forward to compliance" moment.
	 */
	const frameworks = [
		{
			id: 'hipaa',
			nameKey: 'security.frameworks.hipaa.name',
			tagKey: 'security.frameworks.hipaa.tag',
			questionKey: 'security.frameworks.hipaa.question',
			answerKey: 'security.frameworks.hipaa.answer',
			yoursKey: 'security.frameworks.hipaa.yours'
		},
		{
			id: 'gdpr',
			nameKey: 'security.frameworks.gdpr.name',
			tagKey: 'security.frameworks.gdpr.tag',
			questionKey: 'security.frameworks.gdpr.question',
			answerKey: 'security.frameworks.gdpr.answer',
			yoursKey: 'security.frameworks.gdpr.yours'
		},
		{
			id: 'soc2',
			nameKey: 'security.frameworks.soc2.name',
			tagKey: 'security.frameworks.soc2.tag',
			questionKey: 'security.frameworks.soc2.question',
			answerKey: 'security.frameworks.soc2.answer',
			yoursKey: 'security.frameworks.soc2.yours'
		},
		{
			id: 'fedramp',
			nameKey: 'security.frameworks.fedramp.name',
			tagKey: 'security.frameworks.fedramp.tag',
			questionKey: 'security.frameworks.fedramp.question',
			answerKey: 'security.frameworks.fedramp.answer',
			yoursKey: 'security.frameworks.fedramp.yours'
		},
		{
			id: 'airgap',
			nameKey: 'security.frameworks.airgap.name',
			tagKey: 'security.frameworks.airgap.tag',
			questionKey: 'security.frameworks.airgap.question',
			answerKey: 'security.frameworks.airgap.answer',
			yoursKey: 'security.frameworks.airgap.yours'
		},
		{
			id: 'sbom',
			nameKey: 'security.frameworks.sbom.name',
			tagKey: 'security.frameworks.sbom.tag',
			questionKey: 'security.frameworks.sbom.question',
			answerKey: 'security.frameworks.sbom.answer',
			yoursKey: 'security.frameworks.sbom.yours'
		}
	];
</script>

<Seo locale={data.locale} pageKey="security" path="/web/security" />

<!-- Hero with accent warmth -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent2">{t(data.locale, 'security.page_title')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl lg:text-5xl">
				{t(data.locale, 'security.hero_new')}
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'security.hero_sub')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- The One Answer -->
	<BlurFade delay={100}>
		<div class="rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8 text-center sm:p-12">
			<p class="text-2xl font-medium text-primary sm:text-3xl">
				{t(data.locale, 'security.answer')}
			</p>
			<p class="mx-auto mt-4 max-w-xl text-secondary">
				{t(data.locale, 'security.answer_body')}
			</p>
		</div>
	</BlurFade>

	<!-- Architecture diagram concept -->
	<BlurFade delay={200}>
		<div class="mt-20">
			<div class="grid gap-8 sm:grid-cols-3">
				<!-- Your Infrastructure -->
				<div class="rounded-lg border-2 border-accent2 bg-accent2/5 p-6 sm:col-span-2">
					<p class="text-eyebrow mb-4 text-accent2">{t(data.locale, 'security.arch.your_infra')}</p>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="rounded border border-accent2/30 bg-surfaceMid p-4 text-center">
							<div class="text-sm font-medium text-primary">
								{t(data.locale, 'security.arch.your_servers')}
							</div>
							<div class="mt-1 text-xs text-secondary">
								{t(data.locale, 'security.arch.servers_desc')}
							</div>
						</div>
						<div class="rounded border border-accent2/30 bg-surfaceMid p-4 text-center">
							<div class="text-sm font-medium text-primary">
								{t(data.locale, 'security.arch.your_database')}
							</div>
							<div class="mt-1 text-xs text-secondary">
								{t(data.locale, 'security.arch.database_desc')}
							</div>
						</div>
						<div class="rounded border border-accent2/30 bg-surfaceMid p-4 text-center">
							<div class="text-sm font-medium text-primary">
								{t(data.locale, 'security.arch.your_users')}
							</div>
							<div class="mt-1 text-xs text-secondary">
								{t(data.locale, 'security.arch.users_desc')}
							</div>
						</div>
					</div>
				</div>

				<!-- DavidPM, LLC (the company behind Primer) -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6 opacity-50">
					<p class="text-eyebrow mb-4 text-secondary">
						{t(data.locale, 'security.arch.davidpm')}<sup>*</sup>
					</p>
					<div class="flex h-24 items-center justify-center text-center">
						<p class="text-sm text-secondary">
							{t(data.locale, 'security.arch.no_connection')}<br />{t(
								data.locale,
								'security.arch.no_access'
							)}<br />{t(data.locale, 'security.arch.no_data')}
						</p>
					</div>
				</div>
			</div>
			<p class="mt-4 text-xs text-secondary italic">
				<sup>*</sup>{t(data.locale, 'security.arch.footnote', { company: 'DavidPM, LLC' })}
			</p>
		</div>
	</BlurFade>

	<!-- 5 Security Pillars — alternating moss and slate accents -->
	<BlurFade delay={300}>
		<div class="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each pillars as pillar, i (pillar.key)}
				<div
					class="rounded-lg border border-border bg-surfaceMid p-6 transition-colors hover:bg-surfaceHigh"
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg"
						style="background-color: color-mix(in srgb, var(--color-{securityAccents[
							i
						]}) 10%, transparent);"
					>
						<svg
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							style="color: var(--color-{securityAccents[i]});"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d={pillar.icon}
							/>
						</svg>
					</div>
					<h3 class="text-section-heading mt-4 text-primary">
						{t(data.locale, `${pillar.key}.heading`)}
					</h3>
					<p class="mt-2 text-sm text-secondary">
						{t(data.locale, `${pillar.key}.body`)}
					</p>
				</div>
			{/each}
		</div>
	</BlurFade>

	<!-- SaaS vs Primer comparison -->
	<BlurFade delay={400}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'security.compare_heading')}
			</h2>
			<div class="mt-8 grid gap-6 sm:grid-cols-2">
				<!-- Typical SaaS -->
				<div class="rounded-lg border border-red-200 bg-red-50/30 p-6">
					<h3 class="font-medium text-red-800">{t(data.locale, 'security.compare_saas')}</h3>
					<ul class="mt-4 space-y-3">
						{#each ['saas_item.your_data', 'saas_item.user_credentials', 'saas_item.usage_analytics', 'saas_item.api_keys', 'saas_item.billing_info', 'saas_item.support_access'] as itemKey (itemKey)}
							<li class="flex items-center gap-2 text-sm text-red-700">
								<svg
									class="h-4 w-4 flex-shrink-0"
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
								{t(data.locale, `security.${itemKey}`)}
							</li>
						{/each}
					</ul>
				</div>

				<!-- Primer -->
				<div class="rounded-lg border-2 border-accent2 bg-accent2/5 p-6">
					<h3 class="font-medium text-accent2">{t(data.locale, 'security.compare_primer')}</h3>
					<div class="mt-4 flex h-[calc(100%-2rem)] items-center justify-center">
						<div class="text-center">
							<div class="flex items-center justify-center">
								<svg
									class="h-12 w-12 text-accent2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<p class="mt-3 font-medium text-accent2">
								{t(data.locale, 'security.compare_primer_items')}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Three bold statements -->
	<BlurFade delay={500}>
		<div class="mt-20 space-y-6 border-y border-border py-12">
			<p class="text-center text-xl font-medium text-primary">
				{t(data.locale, 'security.statement1')}
			</p>
			<p class="text-center text-xl font-medium text-primary">
				{t(data.locale, 'security.statement2')}
			</p>
			<p class="text-center text-xl font-medium text-primary">
				{t(data.locale, 'security.statement3')}
			</p>
		</div>
	</BlurFade>

	<!-- Compliance cards -->
	<BlurFade delay={600}>
		<div class="mt-16">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'security.compliance_new_heading')}
			</h2>
			<div class="mt-8 grid gap-4 sm:grid-cols-2">
				{#each compliance as item (item.heading)}
					<div class="rounded-lg border border-border bg-surfaceMid p-6">
						<h3 class="text-label text-primary">{t(data.locale, item.heading)}</h3>
						<p class="mt-2 text-sm text-secondary">{t(data.locale, item.body)}</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Compliance framework mapping -->
	<BlurFade delay={650}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'security.frameworks.title')}
			</h2>
			<p class="mx-auto mt-3 max-w-3xl text-center text-secondary">
				{t(data.locale, 'security.frameworks.intro')}
			</p>

			<!-- Stance callout -->
			<div class="mt-8 rounded-lg border-2 border-accent2/30 bg-accent2/5 p-6 sm:p-8">
				<p class="text-eyebrow mb-2 text-accent2">
					{t(data.locale, 'security.frameworks.stance.title')}
				</p>
				<p class="leading-relaxed text-secondary">
					{t(data.locale, 'security.frameworks.stance.body')}
				</p>
			</div>

			<!-- Framework cards -->
			<div class="mt-8 grid gap-4 sm:grid-cols-2">
				{#each frameworks as framework (framework.id)}
					<div class="rounded-lg border border-border bg-surfaceMid p-6">
						<div class="flex items-baseline justify-between gap-3">
							<h3 class="text-section-heading text-primary">
								{t(data.locale, framework.nameKey)}
							</h3>
							<span class="rounded-full bg-accent2/10 px-2 py-0.5 text-xs font-medium text-accent2">
								{t(data.locale, framework.tagKey)}
							</span>
						</div>
						<p class="mt-3 text-sm font-medium text-primary italic">
							{t(data.locale, framework.questionKey)}
						</p>
						<p class="mt-2 text-sm leading-relaxed text-secondary">
							{t(data.locale, framework.answerKey)}
						</p>
						<p class="mt-3 border-t border-border pt-3 text-xs text-secondary">
							<span class="font-medium text-primary"
								>{t(data.locale, 'security.frameworks.your_responsibility')}</span
							>
							{t(data.locale, framework.yoursKey)}
						</p>
					</div>
				{/each}
			</div>

			<!-- What we do not claim (transparency block) -->
			<div class="mt-8 rounded-lg border border-dashed border-border bg-surface p-6 sm:p-8">
				<h3 class="text-section-heading text-primary">
					{t(data.locale, 'security.frameworks.not_claim.title')}
				</h3>
				<p class="mt-3 leading-relaxed text-secondary">
					{t(data.locale, 'security.frameworks.not_claim.body')}
				</p>
			</div>
		</div>
	</BlurFade>

	<!-- Closing -->
	<BlurFade delay={700}>
		<div class="mt-16 rounded-lg bg-surfaceMid p-8">
			<p class="text-secondary">{t(data.locale, 'security.closing.p2')}</p>
		</div>
	</BlurFade>
</div>
