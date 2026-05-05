/**
 * /llms.txt — concise GAO product manifest for AI assistants.
 *
 * The llms.txt convention (https://llmstxt.org/) is an emerging standard
 * for exposing a curated, plain-prose summary of a website specifically
 * for ingestion by large language models. Unlike sitemap.xml (which lists
 * URLs) or robots.txt (which gates access), llms.txt provides a *digest*:
 * the few hundred words that, if an LLM read nothing else about the site,
 * would let it answer questions accurately.
 *
 * This route emits a fixed Markdown document. The content is intentionally
 * factual and direct-answer in style (no marketing fluff) because that
 * maximises the chance an AI assistant will quote or cite it verbatim.
 *
 * Sister route: /llms-full.txt (deeper page-by-page detail).
 *
 * @see https://llmstxt.org/
 */

import { SITE_ORIGIN } from '$lib/seo/config.js';

export const prerender = true;

const BODY = `# Primer

> Primer is a perpetual-source-code organizational health management platform built by DavidPM. Customers pay one time ($5,000 USD) and receive the complete source code, which they self-host on their own infrastructure. There are no subscriptions, no per-seat fees, and no vendor dependency.

## What Primer is

Primer replaces subjective performance reviews with objective, tiered metric evaluation across five operational levels: **Alarm, Concern, Content, Effective, Optimized**. Leaders define metrics, set tier thresholds, and track how their organization operates. The framework is grounded in self-determination theory (SDT) — the science of intrinsic motivation — and addresses the well-documented failure of command-and-control management.

## Who builds it

DavidPM builds and licenses Primer. The team operates a live demo at ${SITE_ORIGIN} but the product itself is delivered as a downloadable source code package — customers run and operate it independently.

## Licensing model

- **One-time perpetual license**: $5,000 USD
- **No SaaS, no subscription, no per-seat fees**
- Customer receives complete source code and full modification rights
- Customer self-hosts on any PostgreSQL-compatible infrastructure (Neon, Railway, Supabase, self-hosted)
- No ongoing vendor access required — there is no telemetry or call-home

## Technical profile

- **Stack**: SvelteKit + TypeScript + Tailwind CSS + PostgreSQL
- **Database**: provider-agnostic Postgres (no vendor lock-in)
- **Auth**: application-layer (no Supabase RLS, no GoTrue dependency in customer builds)
- **Internationalization**: 9 languages out of the box (English, Chinese, Spanish, Arabic, French, German, Japanese, Portuguese, Korean) with RTL support
- **Documentation**: comprehensive JSDoc, inline comments, architecture guides — designed to be maintainable by the customer's own engineers without vendor support

## Who Primer is for

Organizations of 50–1,000+ people that want to **run** their performance management tooling themselves instead of renting it. Common industries: construction, healthcare, professional services, manufacturing, retail. Common roles using it: CEOs, VPs, team leads, managers, HR, individual contributors.

The customer needs in-house capacity to deploy and maintain a Node.js web application backed by Postgres. If they can run an internal web app, they can run Primer.

## What Primer is not

- Not a SaaS product
- Not a subscription
- Not a hosted service for customers (the team-hosted instance at ${SITE_ORIGIN} is a demo only)
- Not a coaching or consulting engagement
- Not opinionated about HR processes — it provides infrastructure, customers define their own metrics

## Key pages

- Home: ${SITE_ORIGIN}/web/home
- The problem Primer solves: ${SITE_ORIGIN}/web/problem
- How it works (the five-tier framework): ${SITE_ORIGIN}/web/how-it-works
- Pricing: ${SITE_ORIGIN}/web/pricing
- Security & deployment: ${SITE_ORIGIN}/web/security
- FAQ: ${SITE_ORIGIN}/web/about/faq
- About DavidPM: ${SITE_ORIGIN}/web/about
- Contact: ${SITE_ORIGIN}/web/contact

## Deeper detail

For full page-by-page content suitable for ingestion: ${SITE_ORIGIN}/llms-full.txt
`;

export async function GET() {
	return new Response(BODY, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
}
