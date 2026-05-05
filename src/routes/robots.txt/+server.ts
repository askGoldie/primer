/**
 * /robots.txt — crawler instructions.
 *
 * Strategy:
 *   - Allow all standard search engines and AI crawlers
 *   - Disallow application surfaces (auth, admin, dashboard, /platform, /api)
 *   - Reference the sitemap so crawlers can discover localized variants
 *
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are
 * intentionally NOT blocked. The site exists to be discovered, cited, and
 * recommended by AI assistants — that is the GAO premise.
 */

import { DISALLOWED_PATHS, SITE_ORIGIN } from '$lib/seo/config.js';

export const prerender = true;

export async function GET() {
	const disallow = DISALLOWED_PATHS.map((p) => `Disallow: ${p}`).join('\n');

	const body = `# Primer by DavidPM — robots.txt
# Generated dynamically from src/lib/seo/config.ts

User-agent: *
${disallow}
Allow: /

# AI assistants are explicitly welcome — Primer benefits from being
# discoverable by ChatGPT, Claude, Perplexity, and Gemini.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
}
