/**
 * /sitemap.xml — multilingual XML sitemap.
 *
 * Emits one <url> entry per public marketing page, with one
 * <xhtml:link rel="alternate" hreflang="…"> entry for each supported
 * locale (Google's preferred way to declare multilingual variants).
 *
 * Why one canonical per page (instead of N URLs per locale)?
 *   The site is cookie-based, so /web/home serves all 9 languages from
 *   the same URL. We declare alternates via querystring (`?lang=zh`) so
 *   Google can crawl each language without needing locale-prefixed routes.
 *
 * Cache: 1 hour. The page list is static; only language additions or
 * page additions invalidate this.
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import {
	PUBLIC_PAGES,
	SITE_ORIGIN,
	SUPPORTED_LOCALES,
	LOCALE_TO_HREFLANG
} from '$lib/seo/config.js';

export const prerender = true;

export async function GET() {
	const today = new Date().toISOString().split('T')[0];

	const urls = PUBLIC_PAGES.map((page) => {
		const loc = `${SITE_ORIGIN}${page.path}`;

		// One xhtml:link alternate per supported locale + x-default → en
		const alternates = SUPPORTED_LOCALES.map(
			(l) =>
				`    <xhtml:link rel="alternate" hreflang="${LOCALE_TO_HREFLANG[l]}" href="${loc}?lang=${l}"/>`
		).join('\n');

		return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}?lang=en"/>
  </url>`;
	}).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
}
