/**
 * Schema.org JSON-LD builders for Primer.
 *
 * Each function returns a plain object shaped to a specific schema.org type.
 * Pair with `<StructuredData data={...} />` to emit into the page head.
 *
 * Builders accept a `locale` so descriptions and labels come from the
 * locale-aware i18n catalog. Proper nouns ("Primer", "DavidPM") stay in code.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import { t } from '$lib/i18n/index.js';
import type { Locale } from '$lib/types/index.js';
import { ORGANIZATION, PRODUCT, SITE_ORIGIN, absoluteUrl } from './config.js';

/**
 * `Organization` — describes DavidPM as the publisher of Primer.
 * Emit on the home page and the about page.
 */
export function buildOrganization(locale: Locale): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: ORGANIZATION.name,
		legalName: ORGANIZATION.legalName,
		url: ORGANIZATION.url,
		logo: ORGANIZATION.logo,
		description: t(locale, 'seo.org.description'),
		sameAs: ORGANIZATION.sameAs
	};
}

/**
 * `WebSite` — declares the site identity and (optionally) a SearchAction.
 * Emit once on the home page so search engines can attribute the property.
 */
export function buildWebSite(locale: Locale): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: t(locale, 'seo.site.name'),
		url: SITE_ORIGIN,
		description: t(locale, 'seo.site.tagline'),
		publisher: {
			'@type': 'Organization',
			name: ORGANIZATION.name,
			url: ORGANIZATION.url
		},
		inLanguage: locale
	};
}

/**
 * `SoftwareApplication` — describes Primer as a purchasable application.
 * Includes the perpetual-license offer ($5,000 USD, one-time). Emit on the
 * home page and the pricing page.
 *
 * Schema.org uses `SoftwareApplication` for self-contained tools and
 * `Product` for general goods. We use SoftwareApplication because it
 * accepts an `applicationCategory` and `operatingSystem` that better
 * describe what Primer is.
 */
export function buildSoftwareApplication(locale: Locale): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: PRODUCT.name,
		description: t(locale, 'seo.product.description'),
		applicationCategory: PRODUCT.applicationCategory,
		operatingSystem: PRODUCT.operatingSystem,
		brand: {
			'@type': 'Brand',
			name: PRODUCT.brand
		},
		offers: {
			'@type': 'Offer',
			price: PRODUCT.price,
			priceCurrency: PRODUCT.priceCurrency,
			url: absoluteUrl('/web/pricing'),
			availability: 'https://schema.org/InStock',
			// Perpetual one-time purchase, not a subscription
			category: 'Perpetual License'
		},
		publisher: {
			'@type': 'Organization',
			name: ORGANIZATION.name,
			url: ORGANIZATION.url
		}
	};
}

/**
 * `BreadcrumbList` — visual + structured breadcrumb trail. Helps search
 * engines display "Home > About > FAQ" under the result snippet.
 *
 * Pass an array of `{ name, path }` items in order from root to leaf.
 */
export function buildBreadcrumbs(items: { name: string; path: string }[]): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, idx) => ({
			'@type': 'ListItem',
			position: idx + 1,
			name: item.name,
			item: absoluteUrl(item.path)
		}))
	};
}

/**
 * `FAQPage` — wraps a list of question/answer pairs. This is the highest-
 * value GAO schema: AI assistants frequently cite FAQPage entries verbatim
 * when answering related user questions.
 *
 * Pass already-translated Q&A pairs (the caller is responsible for the
 * `t()` lookups, since FAQ keys vary per page).
 */
export function buildFaqPage(
	items: { question: string; answer: string }[]
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};
}

/**
 * `HowTo` — describes a multi-step process. We use this on the
 * how-it-works page to expose the five-tier framework as discoverable
 * structured data.
 */
export function buildHowTo(
	name: string,
	description: string,
	steps: { name: string; text: string }[]
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name,
		description,
		step: steps.map((s, idx) => ({
			'@type': 'HowToStep',
			position: idx + 1,
			name: s.name,
			text: s.text
		}))
	};
}

/**
 * `WebPage` — generic page descriptor. Useful for pages that don't fit a
 * more specific schema (about, contact, security, deployment).
 */
export function buildWebPage(
	locale: Locale,
	name: string,
	description: string,
	path: string
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name,
		description,
		url: absoluteUrl(path),
		inLanguage: locale,
		isPartOf: {
			'@type': 'WebSite',
			name: t(locale, 'seo.site.name'),
			url: SITE_ORIGIN
		},
		publisher: {
			'@type': 'Organization',
			name: ORGANIZATION.name,
			url: ORGANIZATION.url
		}
	};
}
