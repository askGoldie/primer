<script lang="ts">
	/**
	 * For Partners
	 *
	 * Consolidated landing page for everyone who deploys Primer on behalf
	 * of a client company: PE operating partners, fractional CFOs, EOS /
	 * Traction implementers, and operations consultants.
	 *
	 * The page pairs a persona toggle at the top — four pills, one per
	 * audience — with a shared body that covers the license rule, the
	 * deployment workflow, the concrete benefits, FAQs, and the final CTA.
	 * Only the narrative block directly under the toggle changes with the
	 * selected persona, so a fractional CFO never has to scroll past EOS
	 * implementer content to reach the license rule.
	 *
	 * The selection is reflected in the `?persona=` query string so a link
	 * like `/web/for-partners?persona=cfo` deep-links straight to that
	 * persona's narrative. `goto()` is called with `replaceState` +
	 * `noScroll` + `keepFocus` so toggling feels instantaneous.
	 *
	 * Narrative copy comes from `personas.<id>.*` i18n keys; the universal
	 * sections below the toggle continue to use `consultants.*` keys that
	 * already ship translated across all supported locales.
	 */

	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildWebPage, buildBreadcrumbs } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	/**
	 * Persona identifiers. Order drives the visual order of the toggle pills
	 * and the default (first) selection when `?persona=` is missing or
	 * invalid.
	 */
	type PersonaId = 'pe' | 'cfo' | 'eos' | 'consultant';

	const PERSONAS: readonly PersonaId[] = ['pe', 'cfo', 'eos', 'consultant'] as const;

	/**
	 * Per-persona accent theming. Matches the accent colors used on the
	 * original `/web/problem/personas` cards so the visual identity carries
	 * over for returning visitors.
	 */
	const accents: Record<PersonaId, { card: string; tag: string; pill: string }> = {
		pe: {
			card: 'border-accent1/30 bg-accent1/5',
			tag: 'text-accent1',
			pill: 'bg-accent1 text-white border-accent1'
		},
		cfo: {
			card: 'border-accent2/30 bg-accent2/5',
			tag: 'text-accent2',
			pill: 'bg-accent2 text-white border-accent2'
		},
		eos: {
			card: 'border-accent3/30 bg-accent3/5',
			tag: 'text-accent3',
			pill: 'bg-accent3 text-white border-accent3'
		},
		consultant: {
			card: 'border-accent1/30 bg-accent1/5',
			tag: 'text-accent1',
			pill: 'bg-accent1 text-white border-accent1'
		}
	};

	/** Pick the initial persona from the `?persona=` query param, or fall back to the first. */
	function initialPersona(): PersonaId {
		const qp = $page.url.searchParams.get('persona');
		if (qp && (PERSONAS as readonly string[]).includes(qp)) return qp as PersonaId;
		return PERSONAS[0];
	}

	let activePersona = $state<PersonaId>(initialPersona());

	/**
	 * Switch personas and sync the URL without triggering a full load. The
	 * `noScroll` flag keeps the viewport anchored on the toggle, so readers
	 * don't get bounced back to the top every time they change pills.
	 */
	function selectPersona(id: PersonaId) {
		activePersona = id;
		const params = new SvelteURLSearchParams($page.url.searchParams);
		params.set('persona', id);
		goto(`${$page.url.pathname}?${params.toString()}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	/** Steps in the deployment workflow — shared across all four personas. */
	const steps = [
		{ titleKey: 'consultants.workflow.step1.title', bodyKey: 'consultants.workflow.step1.body' },
		{ titleKey: 'consultants.workflow.step2.title', bodyKey: 'consultants.workflow.step2.body' },
		{ titleKey: 'consultants.workflow.step3.title', bodyKey: 'consultants.workflow.step3.body' },
		{ titleKey: 'consultants.workflow.step4.title', bodyKey: 'consultants.workflow.step4.body' }
	];

	/** Benefits grid — shared across all four personas. */
	const benefits = [
		{ titleKey: 'consultants.benefits.source.title', bodyKey: 'consultants.benefits.source.body' },
		{
			titleKey: 'consultants.benefits.rebrand.title',
			bodyKey: 'consultants.benefits.rebrand.body'
		},
		{ titleKey: 'consultants.benefits.i18n.title', bodyKey: 'consultants.benefits.i18n.body' },
		{ titleKey: 'consultants.benefits.nofee.title', bodyKey: 'consultants.benefits.nofee.body' },
		{
			titleKey: 'consultants.benefits.framework.title',
			bodyKey: 'consultants.benefits.framework.body'
		},
		{ titleKey: 'consultants.benefits.capex.title', bodyKey: 'consultants.benefits.capex.body' }
	];

	/** FAQ entries — shared across all four personas. */
	const faqs = [
		{ qKey: 'consultants.faq.q1', aKey: 'consultants.faq.a1' },
		{ qKey: 'consultants.faq.q2', aKey: 'consultants.faq.a2' },
		{ qKey: 'consultants.faq.q3', aKey: 'consultants.faq.a3' },
		{ qKey: 'consultants.faq.q4', aKey: 'consultants.faq.a4' }
	];

	let expanded: Record<string, boolean> = $state({});
	function toggleFaq(id: string) {
		expanded[id] = !expanded[id];
	}
</script>

<Seo locale={data.locale} pageKey="personas" path="/web/for-partners" />
<StructuredData
	data={buildWebPage(
		data.locale,
		t(data.locale, 'seo.personas.title'),
		t(data.locale, 'seo.personas.description'),
		'/web/for-partners'
	)}
/>
<StructuredData
	data={buildBreadcrumbs([
		{ name: t(data.locale, 'nav.home'), path: '/web/home' },
		{ name: t(data.locale, 'nav.for_partners'), path: '/web/for-partners' }
	])}
/>

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'consultants.eyebrow')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'personas.hero')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'personas.hero_sub')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!--
		Persona toggle — four pills, one per audience. Selecting a pill
		swaps the narrative card below, updates the URL, and keeps every
		other section on the page unchanged so the shared content (license
		rule, workflow, benefits, FAQ) stays visible without scrolling.
	-->
	<BlurFade delay={100}>
		<div class="text-center">
			<p
				id="persona-toggle-heading"
				class="text-sm font-medium tracking-wide text-secondary uppercase"
			>
				{t(data.locale, 'partners.toggle.heading')}
			</p>
			<div
				class="mt-4 flex flex-wrap justify-center gap-2"
				role="tablist"
				aria-labelledby="persona-toggle-heading"
			>
				{#each PERSONAS as id (id)}
					{@const isActive = activePersona === id}
					<button
						type="button"
						role="tab"
						aria-selected={isActive}
						aria-controls="persona-panel"
						class="rounded-full border px-4 py-2 text-sm font-medium transition-colors {isActive
							? accents[id].pill
							: 'border-border bg-surfaceMid text-secondary hover:bg-surfaceLight hover:text-primary'}"
						onclick={() => selectPersona(id)}
					>
						{t(data.locale, `partners.toggle.${id}`)}
					</button>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!--
		Persona-specific narrative. Only this block changes when the toggle
		is used. The keyed `{#key}` block replays the BlurFade so the swap
		has a subtle transition rather than an abrupt jump.
	-->
	{#key activePersona}
		<div id="persona-panel" role="tabpanel" aria-labelledby="persona-toggle-heading">
			<BlurFade delay={0}>
				<div class="mt-10 rounded-lg border-2 {accents[activePersona].card} p-6 sm:p-10">
					<p class="text-sm font-medium tracking-wide {accents[activePersona].tag} uppercase">
						{t(data.locale, `personas.${activePersona}.tag`)}
					</p>
					<h2 class="mt-3 text-2xl font-medium text-primary sm:text-3xl">
						{t(data.locale, `personas.${activePersona}.headline`)}
					</h2>
					<div class="mt-6 space-y-4 leading-relaxed text-secondary">
						<p>{t(data.locale, `personas.${activePersona}.body1`)}</p>
						<p>{t(data.locale, `personas.${activePersona}.body2`)}</p>
						<p>{t(data.locale, `personas.${activePersona}.body3`)}</p>
					</div>
					<div class="mt-6 rounded-md border border-border bg-surface p-4">
						<p class="text-sm font-medium text-primary">
							{t(data.locale, `personas.${activePersona}.next_label`)}
						</p>
						<p class="mt-1 text-sm text-secondary">
							{t(data.locale, `personas.${activePersona}.next_step`)}
						</p>
					</div>
				</div>
			</BlurFade>
		</div>
	{/key}

	<!-- License rule (load-bearing, universal across personas) -->
	<BlurFade delay={200}>
		<div class="mt-20 rounded-lg border-2 border-accent1/30 bg-accent1/5 p-8 sm:p-10">
			<h2 class="text-page-heading text-primary">
				{t(data.locale, 'consultants.license.title')}
			</h2>
			<p class="mt-4 text-lg leading-relaxed text-secondary">
				{t(data.locale, 'consultants.license.body')}
			</p>

			<h3 class="text-section-heading mt-8 text-primary">
				{t(data.locale, 'consultants.license.rule_heading')}
			</h3>
			<ul class="mt-4 space-y-3">
				{#each ['consultants.license.rule1', 'consultants.license.rule2', 'consultants.license.rule3', 'consultants.license.rule4'] as ruleKey (ruleKey)}
					<li class="flex items-start gap-3">
						<svg
							class="mt-1 h-5 w-5 flex-shrink-0 text-accent1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="text-secondary">{t(data.locale, ruleKey)}</span>
					</li>
				{/each}
			</ul>

			<h3 class="text-section-heading mt-8 text-primary">
				{t(data.locale, 'consultants.license.why_heading')}
			</h3>
			<p class="mt-3 leading-relaxed text-secondary">
				{t(data.locale, 'consultants.license.why_body')}
			</p>
		</div>
	</BlurFade>

	<!-- Workflow (universal) -->
	<BlurFade delay={300}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'consultants.workflow.title')}
			</h2>
			<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each steps as step (step.titleKey)}
					<div class="rounded-lg border border-border bg-surfaceMid p-6">
						<h3 class="font-medium text-primary">
							{t(data.locale, step.titleKey)}
						</h3>
						<p class="mt-2 text-sm text-secondary">
							{t(data.locale, step.bodyKey)}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- Benefits (universal) -->
	<BlurFade delay={400}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'consultants.benefits.title')}
			</h2>
			<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each benefits as benefit (benefit.titleKey)}
					<div class="rounded-lg bg-surfaceMid p-5">
						<h3 class="font-medium text-primary">
							{t(data.locale, benefit.titleKey)}
						</h3>
						<p class="mt-2 text-sm text-secondary">
							{t(data.locale, benefit.bodyKey)}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- FAQ (universal) -->
	<BlurFade delay={500}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'consultants.faq.title')}
			</h2>
			<div class="mt-8 divide-y divide-border rounded-lg border border-border">
				{#each faqs as faq (faq.qKey)}
					<div>
						<button
							type="button"
							class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surfaceHigh"
							onclick={() => toggleFaq(faq.qKey)}
							aria-expanded={expanded[faq.qKey] ?? false}
						>
							<span class="font-medium text-primary">
								{t(data.locale, faq.qKey)}
							</span>
							<svg
								class="h-5 w-5 shrink-0 text-secondary transition-transform {expanded[faq.qKey]
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
						{#if expanded[faq.qKey]}
							<div class="px-6 pb-4 text-secondary">
								{t(data.locale, faq.aKey)}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- CTA (universal) -->
	<BlurFade delay={600}>
		<div class="mt-20 rounded-lg bg-surfaceMid p-10 text-center">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'consultants.cta.title')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-secondary">
				{t(data.locale, 'consultants.cta.body')}
			</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a href={resolve('/web/demo')} class="btn-primary px-6 py-3">
					{t(data.locale, 'consultants.cta.demo')}
				</a>
				<a href={resolve('/web/contact')} class="btn-outline px-6 py-3">
					{t(data.locale, 'consultants.cta.contact')}
				</a>
			</div>
		</div>
	</BlurFade>
</div>
