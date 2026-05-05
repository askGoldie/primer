<script lang="ts">
	/**
	 * Seo — reusable per-page SEO + GAO head-tag emitter.
	 *
	 * Renders into `<svelte:head>`:
	 *   - <title>
	 *   - <meta name="description">
	 *   - <meta name="keywords">          (used by some non-Google engines)
	 *   - <meta name="robots">            (index/noindex control)
	 *   - <link rel="canonical">
	 *   - hreflang alternates             (one per supported locale + x-default)
	 *   - OpenGraph tags                  (og:title, og:description, og:url,
	 *                                      og:type, og:image, og:site_name,
	 *                                      og:locale, og:locale:alternate)
	 *   - Twitter card tags               (summary_large_image)
	 *
	 * The component is content-agnostic: every user-facing string is read
	 * from i18n via the `pageKey` prop. Required keys per page:
	 *
	 *   seo.<pageKey>.title           — title tag (~50–60 chars)
	 *   seo.<pageKey>.description     — meta description (~150–160 chars)
	 *   seo.<pageKey>.keywords        — comma-separated, optional but recommended
	 *   seo.<pageKey>.og_title        — falls back to title if absent
	 *   seo.<pageKey>.og_description  — falls back to description if absent
	 *
	 * Shared keys (one set per locale):
	 *   seo.org.name                  — "DavidPM"
	 *   seo.site.name                 — "Primer"
	 *   seo.site.tagline              — "Build once. Use forever."
	 *
	 * @example
	 *   <Seo locale={data.locale} pageKey="home" path="/web/home" />
	 *
	 * @example with overrides
	 *   <Seo
	 *     locale={data.locale}
	 *     pageKey="pricing"
	 *     path="/web/pricing"
	 *     noindex={false}
	 *     image="/images/og/pricing.png"
	 *   />
	 */

	import { t } from '$lib/i18n/index.js';
	import {
		DEFAULT_OG_IMAGE,
		LOCALE_TO_HREFLANG,
		SUPPORTED_LOCALES,
		toOgLocale,
		absoluteUrl
	} from '$lib/seo/config.js';
	import type { Locale } from '$lib/types/index.js';

	interface Props {
		/** Current page locale (from `data.locale`) */
		locale: Locale;
		/** i18n key prefix — looks up `seo.<pageKey>.title` etc. */
		pageKey: string;
		/** Page path (no origin), e.g. `/web/home`. Used for canonical + hreflang. */
		path: string;
		/** Override the OG image. Defaults to DEFAULT_OG_IMAGE. */
		image?: string;
		/** Set to true to emit `noindex,nofollow`. */
		noindex?: boolean;
		/** OG type — "website" for marketing pages, "article" for blog posts. */
		ogType?: 'website' | 'article';
	}

	let {
		locale: rawLocale,
		pageKey,
		path,
		image = DEFAULT_OG_IMAGE,
		noindex = false,
		ogType = 'website'
	}: Props = $props();

	// Guard against undefined locale (can happen if layout data merging
	// drops the server-side value during SSR on certain adapters).
	const locale = $derived(rawLocale ?? ('en' as Locale));

	// ------------------------------------------------------------------
	// Resolve i18n strings — title/description/keywords + OG variants
	// ------------------------------------------------------------------
	// Using $derived so the values stay reactive if `locale` flips at
	// runtime (e.g. user toggles language without a full reload).

	const title = $derived(t(locale, `seo.${pageKey}.title`));
	const description = $derived(t(locale, `seo.${pageKey}.description`));
	const keywords = $derived(t(locale, `seo.${pageKey}.keywords`));

	// OG variants fall back to the base title/description so locale files
	// only need to override them when they want a punchier social headline.
	const ogTitle = $derived(t(locale, `seo.${pageKey}.og_title`) || title);
	const ogDescription = $derived(t(locale, `seo.${pageKey}.og_description`) || description);

	const siteName = $derived(t(locale, 'seo.site.name'));
	const fullTitle = $derived(`${title} | ${siteName}`);

	const canonicalUrl = $derived(absoluteUrl(path));
	const ogImageUrl = $derived(absoluteUrl(image));
	const ogLocale = $derived(toOgLocale(locale));

	// Alternate locales for og:locale:alternate (everything except current).
	const alternateLocales = $derived(SUPPORTED_LOCALES.filter((l) => l !== locale).map(toOgLocale));

	// hreflang alternates — one per locale, plus x-default pointing at en.
	// We use a query parameter (`?lang=`) for the alternate URLs because the
	// site is cookie-based, not URL-path-based. Search engines accept this
	// pattern as long as the server respects the parameter (which it does
	// via the locale cookie precedence chain in hooks.server.ts — and we
	// add explicit handling in Phase 1.5 if needed).
	//
	// Note: because the cookie wins over Accept-Language, the most reliable
	// hreflang signal we can give today is the same canonical URL plus the
	// locale-specific querystring as a hint. If you later move to URL-path
	// locale routing (`/en/web/home`), update this builder accordingly.
	const hreflangAlternates = $derived(
		SUPPORTED_LOCALES.map((l) => ({
			hreflang: LOCALE_TO_HREFLANG[l],
			href: `${canonicalUrl}?lang=${l}`
		}))
	);

	const robotsContent = $derived(noindex ? 'noindex,nofollow' : 'index,follow');
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if keywords && !keywords.startsWith('seo.')}
		<meta name="keywords" content={keywords} />
	{/if}
	<meta name="robots" content={robotsContent} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- hreflang alternates: one per supported locale + x-default → English -->
	{#each hreflangAlternates as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={`${canonicalUrl}?lang=en`} />

	<!-- OpenGraph -->
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={ogLocale} />
	{#each alternateLocales as alt (alt)}
		<meta property="og:locale:alternate" content={alt} />
	{/each}

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>
