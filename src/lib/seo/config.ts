/**
 * SEO & GAO (Generative AI Optimization) Configuration
 *
 * Central configuration for all search-engine and AI-assistant-facing
 * metadata. Used by:
 *   - `<Seo>` component (per-page <head> tags)
 *   - `<StructuredData>` component (JSON-LD emission)
 *   - `/sitemap.xml` route
 *   - `/robots.txt` route
 *   - `/llms.txt` + `/llms-full.txt` routes (GAO)
 *
 * ----------------------------------------------------------------------------
 * SEO vs GAO — quick primer
 * ----------------------------------------------------------------------------
 * SEO targets traditional search engines (Google, Bing) via meta tags,
 * canonical links, hreflang, sitemaps, and structured data (JSON-LD).
 *
 * GAO (Generative AI Optimization, sometimes called "LLMO" or "AEO") targets
 * AI assistants (ChatGPT, Claude, Perplexity, Gemini) that answer user
 * questions by synthesising information from the web. GAO practices:
 *   1. Expose a `/llms.txt` file summarising the product in plain prose
 *      (emerging standard — see https://llmstxt.org/)
 *   2. Emit rich JSON-LD structured data (Organization, Product, FAQPage,
 *      HowTo, SoftwareApplication) so AI systems can cite precise facts
 *   3. Use semantic HTML and Q&A patterns that LLMs can easily extract
 *   4. Keep descriptions factual, concise, and direct-answer in nature
 *
 * @see /docs/multilingual-implementation-spec.md
 */

import type { Locale } from '$lib/types/index.js';
import { SUPPORTED_LOCALES } from '$lib/types/index.js';

/**
 * Production site origin. Used to build absolute URLs for canonical links,
 * OpenGraph `og:url`, sitemap entries, and hreflang alternates.
 *
 * IMPORTANT: This is the canonical public origin — do not change without
 * coordinating with DNS, marketing, and the search console property.
 */
export const SITE_ORIGIN = 'https://primer.company';

/**
 * Default social share image (1200×630). Customers can override this by
 * dropping a new asset at this path in their own deployment.
 */
export const DEFAULT_OG_IMAGE = '/og-default.png';

/**
 * Organization identity — used for `Organization` JSON-LD and OpenGraph
 * `og:site_name`. Kept in code (not i18n) because an entity name is a
 * proper noun and does not translate.
 */
export const ORGANIZATION = {
	name: 'DavidPM',
	legalName: 'DavidPM',
	url: SITE_ORIGIN,
	logo: `${SITE_ORIGIN}/images/logo.png`,
	sameAs: [] as string[] // populated later if/when social accounts exist
} as const;

/**
 * Product identity — used for `Product` / `SoftwareApplication` JSON-LD.
 * The product name is a proper noun ("Primer") and does not translate; the
 * description is looked up via i18n so it does translate.
 */
export const PRODUCT = {
	name: 'Primer',
	brand: 'DavidPM',
	category: 'BusinessApplication',
	applicationCategory: 'BusinessApplication',
	operatingSystem: 'Web',
	priceCurrency: 'USD',
	price: '5000'
} as const;

/**
 * Mapping from our internal locale codes to the BCP 47 language tags that
 * `hreflang` attributes and `og:locale` expect. The mapping is 1:1 for
 * most locales, with regional qualifiers added where a plain ISO 639-1
 * code is ambiguous (e.g. `zh` → `zh-CN`, `pt` → `pt-BR`).
 *
 * `og:locale` uses underscore form (`en_US`); `hreflang` uses hyphen form
 * (`en-US`). We store the hyphen form here and convert in the component.
 */
export const LOCALE_TO_HREFLANG: Record<Locale, string> = {
	en: 'en-US',
	zh: 'zh-CN',
	es: 'es-ES',
	ar: 'ar',
	fr: 'fr-FR',
	de: 'de-DE',
	ja: 'ja-JP',
	pt: 'pt-BR',
	ko: 'ko-KR'
};

/**
 * Convert a hreflang tag to `og:locale` format (underscore).
 */
export function toOgLocale(locale: Locale): string {
	const tag = LOCALE_TO_HREFLANG[locale] ?? LOCALE_TO_HREFLANG.en;
	return tag.replace('-', '_');
}

/**
 * Build an absolute URL for a given path on the production origin.
 * Idempotent: if `path` is already absolute, returned as-is.
 */
export function absoluteUrl(path: string): string {
	if (/^https?:\/\//i.test(path)) return path;
	if (!path.startsWith('/')) path = '/' + path;
	return SITE_ORIGIN + path;
}

/**
 * Public marketing pages — the surface that should be indexed by search
 * engines and ingested by AI assistants. This list drives the sitemap
 * and the llms.txt manifest.
 *
 * Each entry has:
 *   - `path`: the URL path (no origin, no trailing slash except for root)
 *   - `key`: the i18n key prefix under `seo.<key>.*` in locale files
 *   - `priority`: sitemap priority (0.0–1.0)
 *   - `changefreq`: sitemap change frequency hint
 *
 * IMPORTANT: keep this in sync with the `seo.*` keys in the locale files.
 * The Phase 2 seed ensures every entry below has matching i18n keys.
 */
export interface PublicPage {
	path: string;
	key: string;
	priority: number;
	changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const PUBLIC_PAGES: readonly PublicPage[] = [
	{ path: '/web/home', key: 'home', priority: 1.0, changefreq: 'weekly' },
	{ path: '/web/problem', key: 'problem', priority: 0.8, changefreq: 'monthly' },
	{ path: '/web/how-it-works', key: 'how', priority: 0.9, changefreq: 'monthly' },
	{ path: '/web/pricing', key: 'pricing', priority: 0.9, changefreq: 'monthly' },
	{ path: '/web/about', key: 'about', priority: 0.7, changefreq: 'monthly' },
	{ path: '/web/about/faq', key: 'faq', priority: 0.8, changefreq: 'monthly' },
	{ path: '/web/about/pricing', key: 'about_pricing', priority: 0.6, changefreq: 'monthly' },
	{ path: '/web/about/license', key: 'license', priority: 0.7, changefreq: 'monthly' },
	{ path: '/web/security', key: 'security', priority: 0.8, changefreq: 'monthly' },
	{ path: '/web/deployment', key: 'deployment', priority: 0.7, changefreq: 'monthly' },
	{ path: '/web/contact', key: 'contact', priority: 0.5, changefreq: 'yearly' },
	{ path: '/web/demo', key: 'demo', priority: 0.6, changefreq: 'monthly' }
] as const;

/**
 * Disallowed paths — anything under these prefixes is excluded from the
 * sitemap and blocked in robots.txt. These are application / auth / admin
 * surfaces that should not appear in search results.
 */
export const DISALLOWED_PATHS: readonly string[] = [
	'/app',
	'/platform',
	'/web/admin',
	'/web/dashboard',
	'/web/login',
	'/web/register',
	'/web/forgot-password',
	'/web/reset-password',
	'/web/verify-email',
	'/api'
] as const;

/**
 * Re-export the canonical locale list so SEO consumers don't need to
 * import from two places.
 */
export { SUPPORTED_LOCALES };
