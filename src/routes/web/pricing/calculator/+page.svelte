<script lang="ts">
	/**
	 * Cost Comparison Calculator
	 *
	 * Interactive page where prospects plug in headcount and current
	 * SaaS tool to see 3-year and 5-year savings vs. Primer's $5,000
	 * perpetual license.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildWebPage, buildBreadcrumbs } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();

	/** Primer's one-time license cost */
	const PRIMER_COST = 5000;

	interface Competitor {
		name: string;
		perSeat: number;
	}

	const competitors: Competitor[] = [
		{ name: 'Lattice', perSeat: 11 },
		{ name: '15Five', perSeat: 10 },
		{ name: 'Culture Amp', perSeat: 12 },
		{ name: 'BambooHR + Performance', perSeat: 11 },
		{ name: '__other__', perSeat: 15 }
	];

	let headcount = $state(100);
	let selectedIndex = $state(4);
	let customRate = $state(15);

	let perSeat = $derived(
		selectedIndex < competitors.length - 1 ? competitors[selectedIndex].perSeat : customRate
	);

	let year1Saas = $derived(headcount * perSeat * 12);
	let year3Saas = $derived(headcount * perSeat * 36);
	let year5Saas = $derived(headcount * perSeat * 60);

	let savings1 = $derived(year1Saas - PRIMER_COST);
	let savings3 = $derived(year3Saas - PRIMER_COST);
	let savings5 = $derived(year5Saas - PRIMER_COST);

	let breakEvenMonths = $derived(
		perSeat > 0 && headcount > 0 ? Math.ceil(PRIMER_COST / (headcount * perSeat)) : 0
	);

	const localeMap: Record<string, string> = {
		en: 'en-US',
		de: 'de-DE',
		fr: 'fr-FR',
		es: 'es-ES',
		pt: 'pt-BR',
		ja: 'ja-JP',
		ko: 'ko-KR',
		zh: 'zh-CN',
		ar: 'ar-SA'
	};

	function formatUsd(n: number): string {
		return n.toLocaleString(localeMap[data.locale] ?? 'en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		});
	}

	/** Headcount presets for quick selection */
	const presets = [50, 100, 250, 500, 1000];
</script>

<Seo locale={data.locale} pageKey="calculator" path="/web/pricing/calculator" />
<StructuredData
	data={buildWebPage(
		data.locale,
		t(data.locale, 'seo.calculator.title'),
		t(data.locale, 'seo.calculator.description'),
		'/web/pricing/calculator'
	)}
/>
<StructuredData
	data={buildBreadcrumbs([
		{ name: t(data.locale, 'nav.home'), path: '/web/home' },
		{ name: t(data.locale, 'seo.pricing.title'), path: '/web/pricing' },
		{ name: t(data.locale, 'seo.calculator.title'), path: '/web/pricing/calculator' }
	])}
/>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Hero -->
	<BlurFade delay={0}>
		<div class="text-center">
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'calculator.hero')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'calculator.hero_sub')}
			</p>
		</div>
	</BlurFade>

	<!-- Calculator -->
	<BlurFade delay={200}>
		<div class="mt-12 rounded-lg border-2 border-accent1/20 bg-accent1/5 p-6 sm:p-10">
			<!-- Headcount input -->
			<div>
				<label for="headcount" class="block text-sm font-medium text-primary">
					{t(data.locale, 'calculator.headcount_label')}
				</label>
				<div class="mt-2 flex items-center gap-3">
					<input
						id="headcount"
						type="number"
						min="1"
						max="100000"
						bind:value={headcount}
						class="w-32 rounded-md border border-border bg-surface px-3 py-2 font-mono text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
					/>
					<div class="flex flex-wrap gap-2">
						{#each presets as preset (preset)}
							<button
								type="button"
								class="rounded-md border px-3 py-1 text-sm transition-colors {headcount === preset
									? 'border-accent1 bg-accent1/10 text-accent1'
									: 'border-border text-secondary hover:border-accent1/50 hover:text-primary'}"
								onclick={() => (headcount = preset)}
							>
								{preset}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Tool selection -->
			<div class="mt-6">
				<label for="tool" class="block text-sm font-medium text-primary">
					{t(data.locale, 'calculator.tool_label')}
				</label>
				<select
					id="tool"
					bind:value={selectedIndex}
					class="mt-2 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
				>
					{#each competitors as comp, i (comp.name)}
						<option value={i}>
							{i < competitors.length - 1
								? `${comp.name} ${t(data.locale, 'calculator.per_seat_display', { rate: `$${comp.perSeat}` })}`
								: t(data.locale, 'calculator.other_tool')}
						</option>
					{/each}
				</select>
			</div>

			<!-- Custom rate (only for "Other") -->
			{#if selectedIndex === competitors.length - 1}
				<div class="mt-4">
					<label for="custom-rate" class="block text-sm font-medium text-primary">
						{t(data.locale, 'calculator.custom_rate_label')}
					</label>
					<div class="mt-2 flex items-center gap-2">
						<span class="text-secondary">$</span>
						<input
							id="custom-rate"
							type="number"
							min="1"
							max="500"
							bind:value={customRate}
							class="w-24 rounded-md border border-border bg-surface px-3 py-2 font-mono text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
						/>
						<span class="text-sm text-secondary">{t(data.locale, 'calculator.per_user_month')}</span
						>
					</div>
				</div>
			{/if}
		</div>
	</BlurFade>

	<!-- Results -->
	<BlurFade delay={400}>
		<div class="mt-10">
			<!-- Big savings callout -->
			<div class="rounded-lg border-2 border-accent2 bg-accent2/5 p-8 text-center">
				<p class="text-sm font-medium tracking-wide text-accent2 uppercase">
					{t(data.locale, 'calculator.five_year_savings')}
				</p>
				<div class="mt-2 text-5xl font-medium tracking-tight text-primary sm:text-6xl">
					<span class="font-mono">{formatUsd(Math.max(0, savings5))}</span>
				</div>
				<p class="mt-2 text-secondary">
					{t(data.locale, 'calculator.breakeven_label')}:
					<span class="font-medium text-primary"
						>{breakEvenMonths}
						{t(data.locale, breakEvenMonths === 1 ? 'calculator.month' : 'calculator.months')}</span
					>
				</p>
			</div>

			<!-- Comparison table -->
			<div class="mt-8 overflow-hidden rounded-lg border border-border">
				<table class="w-full">
					<thead>
						<tr class="bg-surfaceMid">
							<th class="px-6 py-4 text-left text-sm font-medium text-primary"></th>
							<th class="px-6 py-4 text-right text-sm font-medium text-primary"
								>{t(data.locale, 'calculator.primer_label')}</th
							>
							<th class="px-6 py-4 text-right text-sm font-medium text-secondary">
								{selectedIndex < competitors.length - 1
									? competitors[selectedIndex].name
									: t(data.locale, 'calculator.other_tool')}
							</th>
							<th class="px-6 py-4 text-right text-sm font-medium text-accent2">
								{t(data.locale, 'calculator.savings')}
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						<tr class="transition-colors hover:bg-surfaceMid/50">
							<td class="px-6 py-4 text-sm font-medium text-primary"
								>{t(data.locale, 'calculator.year_1')}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm text-primary"
								>{formatUsd(PRIMER_COST)}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm text-secondary line-through"
								>{formatUsd(year1Saas)}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm font-medium text-accent2"
								>{formatUsd(Math.max(0, savings1))}</td
							>
						</tr>
						<tr class="transition-colors hover:bg-surfaceMid/50">
							<td class="px-6 py-4 text-sm font-medium text-primary"
								>{t(data.locale, 'calculator.year_3')}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm text-primary"
								>{formatUsd(PRIMER_COST)}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm text-secondary line-through"
								>{formatUsd(year3Saas)}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm font-medium text-accent2"
								>{formatUsd(Math.max(0, savings3))}</td
							>
						</tr>
						<tr class="bg-accent2/5 transition-colors hover:bg-accent2/10">
							<td class="px-6 py-4 text-sm font-medium text-primary"
								>{t(data.locale, 'calculator.year_5')}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm text-primary"
								>{formatUsd(PRIMER_COST)}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm text-secondary line-through"
								>{formatUsd(year5Saas)}</td
							>
							<td class="px-6 py-4 text-right font-mono text-sm font-bold text-accent2"
								>{formatUsd(Math.max(0, savings5))}</td
							>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="mt-4 text-center text-xs text-secondary/60">
				{t(data.locale, 'calculator.disclaimer')}
			</p>
		</div>
	</BlurFade>

	<!-- What the $5K includes -->
	<BlurFade delay={500}>
		<div class="mt-16">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'calculator.includes_heading')}
			</h2>
			<div class="mt-8 grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h3 class="font-medium text-primary">
						{t(data.locale, 'calculator.includes_code_title')}
					</h3>
					<p class="mt-2 text-sm text-secondary">
						{t(data.locale, 'calculator.includes_code_body')}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h3 class="font-medium text-primary">
						{t(data.locale, 'calculator.includes_deploy_title')}
					</h3>
					<p class="mt-2 text-sm text-secondary">
						{t(data.locale, 'calculator.includes_deploy_body')}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h3 class="font-medium text-primary">
						{t(data.locale, 'calculator.includes_languages_title')}
					</h3>
					<p class="mt-2 text-sm text-secondary">
						{t(data.locale, 'calculator.includes_languages_body')}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h3 class="font-medium text-primary">
						{t(data.locale, 'calculator.includes_updates_title')}
					</h3>
					<p class="mt-2 text-sm text-secondary">
						{t(data.locale, 'calculator.includes_updates_body')}
					</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Hidden costs section -->
	<BlurFade delay={600}>
		<div class="mt-16">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'calculator.hidden_heading')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'calculator.hidden_sub')}
			</p>
			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-lg border border-border bg-surfaceMid p-5 text-center">
					<p class="text-2xl font-medium text-primary">
						{t(data.locale, 'calculator.hidden_onboarding_value')}
					</p>
					<p class="mt-1 text-sm text-secondary">
						{t(data.locale, 'calculator.hidden_onboarding')}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-5 text-center">
					<p class="text-2xl font-medium text-primary">
						{t(data.locale, 'calculator.hidden_uplift_value')}
					</p>
					<p class="mt-1 text-sm text-secondary">{t(data.locale, 'calculator.hidden_uplift')}</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-5 text-center">
					<p class="text-2xl font-medium text-primary">
						{t(data.locale, 'calculator.hidden_waste_value')}
					</p>
					<p class="mt-1 text-sm text-secondary">{t(data.locale, 'calculator.hidden_waste')}</p>
				</div>
				<div class="rounded-lg border border-border bg-surfaceMid p-5 text-center">
					<p class="text-2xl font-medium text-primary">
						{t(data.locale, 'calculator.hidden_primer_value')}
					</p>
					<p class="mt-1 text-sm text-secondary">{t(data.locale, 'calculator.hidden_primer')}</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- CTA -->
	<div class="mt-16 text-center">
		<a href={resolve('/web/register')} class="btn-primary px-10 py-3 text-base">
			{t(data.locale, 'pricing.cta_button')}
		</a>
	</div>
</div>
