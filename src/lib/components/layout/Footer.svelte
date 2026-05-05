<script lang="ts">
	/**
	 * Footer Component — Redesigned
	 *
	 * Three-column footer: Product, Company, Security & Deployment.
	 * Demoted pages (License, FAQ, Deployment) live here.
	 */

	import { resolve } from '$app/paths';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import { theme } from '$lib/config/theme.js';

	interface Props {
		/** Current locale */
		locale: Locale;
	}

	let { locale }: Props = $props();

	const currentYear = new Date().getFullYear();
</script>

<footer class="border-t border-border bg-primary text-white">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid gap-8 md:grid-cols-3 lg:grid-cols-5">
			<!-- Brand column -->
			<div class="md:col-span-1">
				<div class="flex items-center gap-2">
					<img src={theme.brand.logoPath} alt={theme.brand.applicationName} class="h-8 w-auto" />
					<span class="text-xl font-medium">
						{theme.brand.applicationName}
					</span>
				</div>
				<p class="mt-4 max-w-md text-sm text-white/80">
					{t(locale, 'footer.descriptor')}
				</p>
				<p class="mt-4 text-sm text-white/80">
					{t(locale, 'footer.parent_company')}
					<a
						href="https://www.davidpm.pro"
						target="_blank"
						rel="noopener noreferrer"
						class="text-white underline hover:text-white/80"
					>
						davidpm.pro
					</a>
				</p>
			</div>

			<!-- Product column -->
			<div>
				<h3 class="text-sm font-medium">{t(locale, 'footer.product_heading')}</h3>
				<ul class="mt-4 space-y-3">
					<li>
						<a href={resolve('/web/how-it-works')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'nav.how_it_works')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/demo')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'nav.demo')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/pricing')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'nav.pricing')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/for-partners')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.for_partners')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/about/faq')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.faq')}
						</a>
					</li>
				</ul>
			</div>

			<!-- Company column -->
			<div>
				<h3 class="text-sm font-medium">{t(locale, 'footer.about_heading')}</h3>
				<ul class="mt-4 space-y-3">
					<li>
						<a href={resolve('/web/about')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.about')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/about/license')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.license')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/contact')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.contact')}
						</a>
					</li>
				</ul>
			</div>

			<!-- Security column -->
			<div>
				<h3 class="text-sm font-medium">{t(locale, 'footer.security')}</h3>
				<ul class="mt-4 space-y-3">
					<li>
						<a href={resolve('/web/security')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.security')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/deployment')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.deployment')}
						</a>
					</li>
				</ul>
			</div>

			<!-- Legal column -->
			<div>
				<h3 class="text-sm font-medium">{t(locale, 'footer.legal_heading')}</h3>
				<ul class="mt-4 space-y-3">
					<li>
						<a
							href={resolve('/web/about/privacy-policy')}
							class="text-sm text-white/80 hover:text-white"
						>
							{t(locale, 'footer.privacy_policy')}
						</a>
					</li>
					<li>
						<a href={resolve('/web/about/terms')} class="text-sm text-white/80 hover:text-white">
							{t(locale, 'footer.terms_of_service')}
						</a>
					</li>
					<li>
						<a
							href={resolve('/web/about/cookie-policy')}
							class="text-sm text-white/80 hover:text-white"
						>
							{t(locale, 'footer.cookie_policy')}
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Copyright -->
		<div class="mt-12 border-t border-white/10 pt-8">
			<p class="text-center text-sm text-white/80">
				{t(locale, 'footer.copyright', { year: String(currentYear) })}
			</p>
		</div>
	</div>
</footer>
