<script lang="ts">
	/**
	 * About Page
	 *
	 * Company info, mission, thesis.
	 * Lightweight page focused on who DavidPM is and why Primer exists.
	 */

	import { resolve } from '$app/paths';
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { BlurFade } from '$lib/components/animations/index.js';
	import Seo from '$lib/components/seo/Seo.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { buildOrganization } from '$lib/seo/structured.js';

	let { data }: { data: PageData } = $props();
</script>

<Seo locale={data.locale} pageKey="about" path="/web/about" />
<StructuredData data={buildOrganization(data.locale)} />

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<BlurFade delay={0}>
		<h1 class="text-3xl font-medium tracking-tight text-primary sm:text-4xl">
			{t(data.locale, 'about.hero')}
		</h1>
		<p class="mt-4 text-lg text-secondary">
			{t(data.locale, 'about.hero_sub')}
		</p>
	</BlurFade>

	<!-- Team hero: legitimacy signal — DavidPM is real people -->
	<BlurFade delay={150}>
		<div class="mt-12 overflow-hidden rounded-xl border border-border">
			<img
				src="/images/web/about-team.webp"
				alt={t(data.locale, 'web.image.about_team.alt')}
				loading="lazy"
				decoding="async"
				class="aspect-[16/9] w-full object-cover"
			/>
		</div>
	</BlurFade>

	<BlurFade delay={200}>
		<div class="mt-16">
			<h2 class="text-page-heading text-primary">{t(data.locale, 'about.thesis_heading')}</h2>
			<div class="mt-6 space-y-4">
				<p class="leading-relaxed text-secondary">{t(data.locale, 'about.thesis_p1')}</p>
				<p class="leading-relaxed text-secondary">{t(data.locale, 'about.thesis_p2')}</p>
				<p class="leading-relaxed text-secondary">{t(data.locale, 'about.thesis_p3')}</p>
			</div>
		</div>
	</BlurFade>

	<BlurFade delay={400}>
		<div class="mt-16 rounded-lg bg-surfaceMid p-8">
			<h2 class="text-section-heading text-primary">
				{t(data.locale, 'about.contact_heading')}
			</h2>
			<p class="mt-3 text-secondary">
				{t(data.locale, 'about.contact_body')}
			</p>
			<div class="mt-6">
				<a href={resolve('/web/contact')} class="btn-primary">
					{t(data.locale, 'nav.contact')}
				</a>
			</div>
		</div>
	</BlurFade>
</div>
