<script lang="ts">
	/**
	 * Deployment Requirements Page
	 *
	 * Explains how Primer is delivered and deployed in plain-language,
	 * visual terms: a non-technical reader should be able to "get it"
	 * from the diagrams alone.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';

	let { data }: { data: PageData } = $props();

	const zipItems = [
		{ name: '/src', labelKey: 'deployment.zip.src.label', descKey: 'deployment.zip.src.desc' },
		{ name: '/docs', labelKey: 'deployment.zip.docs.label', descKey: 'deployment.zip.docs.desc' },
		{
			name: '/migrations',
			labelKey: 'deployment.zip.migrations.label',
			descKey: 'deployment.zip.migrations.desc'
		},
		{
			name: 'docker-compose.yml',
			labelKey: 'deployment.zip.compose.label',
			descKey: 'deployment.zip.compose.desc'
		},
		{
			name: '.env.example',
			labelKey: 'deployment.zip.env.label',
			descKey: 'deployment.zip.env.desc'
		},
		{
			name: 'README.md',
			labelKey: 'deployment.zip.readme.label',
			descKey: 'deployment.zip.readme.desc'
		},
		{
			name: 'llms.txt',
			labelKey: 'deployment.zip.llms.label',
			descKey: 'deployment.zip.llms.desc'
		}
	];

	const controlItems = [
		{
			titleKey: 'deployment.control.where.title',
			descKey: 'deployment.control.where.desc',
			d: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 006.1 9H7a4 4 0 00-4 4v2z'
		},
		{
			titleKey: 'deployment.control.database.title',
			descKey: 'deployment.control.database.desc',
			d: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
		},
		{
			titleKey: 'deployment.control.login.title',
			descKey: 'deployment.control.login.desc',
			d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
		},
		{
			titleKey: 'deployment.control.look.title',
			descKey: 'deployment.control.look.desc',
			d: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
		},
		{
			titleKey: 'deployment.control.network.title',
			descKey: 'deployment.control.network.desc',
			d: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		}
	];
</script>

<Seo locale={data.locale} pageKey="deployment" path="/web/deployment" />

<!-- Hero -->
<div class="border-b border-border bg-surfaceMid">
	<div class="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
		<BlurFade delay={0}>
			<p class="text-eyebrow mb-4 text-accent1">{t(data.locale, 'nav.deployment')}</p>
			<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
				{t(data.locale, 'deployment.hero.title')}
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-secondary">
				{t(data.locale, 'deployment.hero.body')}
			</p>
		</BlurFade>
	</div>
</div>

<div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Big picture diagram: box → your server → your people -->
	<BlurFade delay={100}>
		<div class="rounded-lg border border-border bg-surfaceMid p-6 sm:p-10">
			<h2 class="text-section-heading text-center text-primary">
				{t(data.locale, 'deployment.bigpicture.title')}
			</h2>
			<p class="mx-auto mt-2 max-w-xl text-center text-sm text-secondary">
				{t(data.locale, 'deployment.bigpicture.subtitle')}
			</p>

			<div class="mt-10 grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
				<!-- Step 1: Download -->
				<div class="flex flex-col items-center text-center">
					<div
						class="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-accent1/40 bg-accent1/5"
					>
						<svg
							class="h-12 w-12 text-accent1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
					</div>
					<p class="mt-3 font-medium text-primary">
						{t(data.locale, 'deployment.step1.title')}
					</p>
					<p class="text-xs text-secondary">{t(data.locale, 'deployment.step1.desc')}</p>
				</div>

				<!-- Arrow -->
				<div class="hidden justify-center sm:flex">
					<svg
						class="h-6 w-6 text-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</div>

				<!-- Step 2: Install -->
				<div class="flex flex-col items-center text-center">
					<div
						class="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-accent2/40 bg-accent2/5"
					>
						<svg
							class="h-12 w-12 text-accent2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M4 7a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM4 17a2 2 0 012-2h12a2 2 0 012 2v0a2 2 0 01-2 2H6a2 2 0 01-2-2v0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M8 8h.01M8 17h.01"
							/>
						</svg>
					</div>
					<p class="mt-3 font-medium text-primary">
						{t(data.locale, 'deployment.step2.title')}
					</p>
					<p class="text-xs text-secondary">{t(data.locale, 'deployment.step2.desc')}</p>
				</div>

				<!-- Arrow -->
				<div class="hidden justify-center sm:flex">
					<svg
						class="h-6 w-6 text-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</div>

				<!-- Step 3: Your team uses it -->
				<div class="flex flex-col items-center text-center">
					<div
						class="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-accent1/40 bg-accent1/5"
					>
						<svg
							class="h-12 w-12 text-accent1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<p class="mt-3 font-medium text-primary">
						{t(data.locale, 'deployment.step3.title')}
					</p>
					<p class="text-xs text-secondary">{t(data.locale, 'deployment.step3.desc')}</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Where your data lives -->
	<BlurFade delay={200}>
		<div class="mt-16">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'deployment.data.title')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'deployment.data.subtitle')}
			</p>

			<div class="mt-8 grid gap-8 sm:grid-cols-[2fr_1fr]">
				<!-- Your Infrastructure box -->
				<div class="rounded-lg border-2 border-accent2 bg-accent2/5 p-6">
					<p class="text-eyebrow mb-4 text-accent2">
						{t(data.locale, 'deployment.data.your_org')}
					</p>
					<div class="grid gap-3 sm:grid-cols-3">
						<div class="rounded border border-accent2/30 bg-surface p-4 text-center">
							<svg
								class="mx-auto h-8 w-8 text-accent2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
								/>
							</svg>
							<div class="mt-2 text-sm font-medium text-primary">
								{t(data.locale, 'deployment.data.server.title')}
							</div>
							<div class="mt-1 text-xs text-secondary">
								{t(data.locale, 'deployment.data.server.desc')}
							</div>
						</div>
						<div class="rounded border border-accent2/30 bg-surface p-4 text-center">
							<svg
								class="mx-auto h-8 w-8 text-accent2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
								/>
							</svg>
							<div class="mt-2 text-sm font-medium text-primary">
								{t(data.locale, 'deployment.data.database.title')}
							</div>
							<div class="mt-1 text-xs text-secondary">
								{t(data.locale, 'deployment.data.database.desc')}
							</div>
						</div>
						<div class="rounded border border-accent2/30 bg-surface p-4 text-center">
							<svg
								class="mx-auto h-8 w-8 text-accent2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							<div class="mt-2 text-sm font-medium text-primary">
								{t(data.locale, 'deployment.data.users.title')}
							</div>
							<div class="mt-1 text-xs text-secondary">
								{t(data.locale, 'deployment.data.users.desc')}
							</div>
						</div>
					</div>
				</div>

				<!-- DavidPM (outside) -->
				<div
					class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surfaceMid p-6 opacity-60"
				>
					<p class="text-eyebrow mb-3 text-secondary">DavidPM, LLC</p>
					<svg
						class="h-10 w-10 text-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
						/>
					</svg>
					<p class="mt-3 text-center text-xs text-secondary">
						{t(data.locale, 'deployment.data.davidpm.line1')}<br />
						{t(data.locale, 'deployment.data.davidpm.line2')}<br />
						{t(data.locale, 'deployment.data.davidpm.line3')}
					</p>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- Three Deployment Paths -->
	<BlurFade delay={300}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'deployment.paths.title')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'deployment.paths.subtitle')}
			</p>

			<div class="mt-10 grid gap-6 lg:grid-cols-3">
				<!-- Path 1: Simplest -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent1/10">
							<span class="text-lg font-bold text-accent1">1</span>
						</div>
						<h3 class="text-section-heading text-primary">
							{t(data.locale, 'deployment.paths.simple.title')}
						</h3>
					</div>
					<div class="mt-4 flex justify-center">
						<svg
							class="h-20 w-20 text-accent1/60"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<p class="mt-4 text-sm text-secondary">
						{t(data.locale, 'deployment.paths.simple.desc')}
					</p>
					<div class="mt-4 rounded bg-surface p-3">
						<p class="text-xs font-medium text-primary">
							{t(data.locale, 'deployment.paths.best_for')}
						</p>
						<p class="mt-1 text-xs text-secondary">
							{t(data.locale, 'deployment.paths.simple.best')}
						</p>
					</div>
				</div>

				<!-- Path 2: Recommended -->
				<div class="rounded-lg border-2 border-accent2 bg-accent2/5 p-6">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent2/10">
								<span class="text-lg font-bold text-accent2">2</span>
							</div>
							<h3 class="text-section-heading text-primary">
								{t(data.locale, 'deployment.paths.recommended.title')}
							</h3>
						</div>
						<span class="rounded-full bg-accent2/20 px-2 py-0.5 text-xs font-medium text-accent2">
							{t(data.locale, 'deployment.paths.popular')}
						</span>
					</div>
					<div class="mt-4 flex justify-center">
						<svg
							class="h-20 w-20 text-accent2/70"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.2"
								d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM8 5v14M16 5v14M4 12h16"
							/>
						</svg>
					</div>
					<p class="mt-4 text-sm text-secondary">
						{t(data.locale, 'deployment.paths.recommended.desc')}
					</p>
					<div class="mt-4 rounded bg-surface p-3">
						<p class="text-xs font-medium text-primary">
							{t(data.locale, 'deployment.paths.best_for')}
						</p>
						<p class="mt-1 text-xs text-secondary">
							{t(data.locale, 'deployment.paths.recommended.best')}
						</p>
					</div>
				</div>

				<!-- Path 3: Flexible -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent1/10">
							<span class="text-lg font-bold text-accent1">3</span>
						</div>
						<h3 class="text-section-heading text-primary">
							{t(data.locale, 'deployment.paths.flexible.title')}
						</h3>
					</div>
					<div class="mt-4 flex justify-center">
						<svg
							class="h-20 w-20 text-accent1/60"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.2"
								d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 006.1 9H7a4 4 0 00-4 4v2z"
							/>
						</svg>
					</div>
					<p class="mt-4 text-sm text-secondary">
						{t(data.locale, 'deployment.paths.flexible.desc')}
					</p>
					<div class="mt-4 rounded bg-surface p-3">
						<p class="text-xs font-medium text-primary">
							{t(data.locale, 'deployment.paths.best_for')}
						</p>
						<p class="mt-1 text-xs text-secondary">
							{t(data.locale, 'deployment.paths.flexible.best')}
						</p>
					</div>
				</div>
			</div>
		</div>
	</BlurFade>

	<!-- What's in the zip -->
	<BlurFade delay={400}>
		<div class="mt-20">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'deployment.zip.title')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'deployment.zip.subtitle')}
			</p>

			<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each zipItems as item (item.name)}
					<div class="rounded-lg border border-border bg-surfaceMid p-5">
						<div class="flex items-center gap-2">
							<svg
								class="h-5 w-5 flex-shrink-0 text-accent1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<span class="font-mono text-sm text-accent1">{item.name}</span>
						</div>
						<p class="mt-2 text-sm font-medium text-primary">{t(data.locale, item.labelKey)}</p>
						<p class="mt-1 text-xs text-secondary">{t(data.locale, item.descKey)}</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- What you control -->
	<BlurFade delay={500}>
		<div class="mt-20 rounded-lg border-2 border-accent1/20 bg-accent1/5 p-8">
			<h2 class="text-page-heading text-center text-primary">
				{t(data.locale, 'deployment.control.title')}
			</h2>
			<p class="mx-auto mt-3 max-w-2xl text-center text-secondary">
				{t(data.locale, 'deployment.control.subtitle')}
			</p>

			<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each controlItems as item (item.titleKey)}
					<div class="rounded-lg bg-surface p-4 text-center">
						<svg
							class="mx-auto h-8 w-8 text-accent1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.d} />
						</svg>
						<p class="mt-2 text-sm font-medium text-primary">{t(data.locale, item.titleKey)}</p>
						<p class="mt-1 text-xs text-secondary">{t(data.locale, item.descKey)}</p>
					</div>
				{/each}
			</div>
		</div>
	</BlurFade>

	<!-- AI-assisted deployment -->
	<BlurFade delay={600}>
		<div class="mt-20 rounded-lg border border-border bg-surfaceMid p-8">
			<div class="mx-auto max-w-2xl text-center">
				<svg
					class="mx-auto h-10 w-10 text-accent2"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
					/>
				</svg>
				<h2 class="text-page-heading mt-4 text-primary">
					{t(data.locale, 'deployment.ai.title')}
				</h2>
				<p class="mt-3 text-secondary">
					{t(data.locale, 'deployment.ai.body')}
				</p>
			</div>
		</div>
	</BlurFade>

	<!-- Closing CTA -->
	<BlurFade delay={700}>
		<div class="mt-16 text-center">
			<p class="text-secondary">{t(data.locale, 'deployment.cta.lead')}</p>
			<a
				href={resolve('/web/demo')}
				class="btn-primary mt-4 inline-flex items-center gap-2 px-6 py-3"
			>
				{t(data.locale, 'common.try_demo')}
				<svg
					aria-hidden="true"
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</BlurFade>
</div>
