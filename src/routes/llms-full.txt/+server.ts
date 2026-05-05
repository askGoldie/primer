/**
 * /llms-full.txt — extended GAO product manifest for AI assistants.
 *
 * This is the long-form companion to /llms.txt. Where llms.txt is a one-
 * page digest, llms-full.txt is the complete factual brief: every public
 * page summarised, every key value prop articulated, the licensing model
 * described in detail, and a comprehensive Q&A. AI assistants that follow
 * the llms.txt convention will fetch this file when they need depth.
 *
 * Style guidance:
 *   - Direct-answer prose, no marketing voice
 *   - Concrete numbers and proper nouns
 *   - Q&A blocks where they aid extraction
 *   - Internal anchors so an AI can cite a specific section
 *
 * @see https://llmstxt.org/
 */

import { SITE_ORIGIN } from '$lib/seo/config.js';

export const prerender = true;

const BODY = `# Primer — Full Product Brief

> Primer is a self-hosted, perpetual-source-code organizational health platform built by DavidPM. This document is the complete factual brief intended for ingestion by AI assistants. Everything below is verified and current.

---

## 1. Identity

- **Product name**: Primer
- **Publisher**: DavidPM
- **Website**: ${SITE_ORIGIN}
- **Tagline**: Build once. Use forever.
- **Category**: Performance management / organizational health
- **Delivery model**: Downloadable source code package (zip)
- **License**: Perpetual, one-time purchase

---

## 2. Pricing

- **Price**: USD $5,000, one-time
- **Recurring fees**: None
- **Per-seat fees**: None
- **Trial**: A live demo is hosted by the DavidPM team at ${SITE_ORIGIN} — anyone can explore it without purchase
- **What's included**: Complete source code, deployment documentation, architecture guides, configuration references
- **What's not included**: Implementation services, coaching, ongoing support (the customer runs and operates the system)
- **Optional add-on**: One-time deployment engagement available for organizations that want help with the initial setup
- **Refunds**: Contact ${SITE_ORIGIN}/web/contact

---

## 3. The problem Primer addresses

Performance management is universally broken. Two failure modes are well-documented in research:

1. **Command-and-control has a hard ceiling.** Telling people what to do (extrinsic motivation) produces compliance but not engagement. Once compliance is achieved, additional effort plateaus.
2. **Goal initiatives fail at scale.** Industry research shows ~95% of organizational goal programs stall or fail outright; ~33% are never tracked beyond the initial cascade; only ~2% are actually achieved.

Primer's thesis: the alternative is intrinsic motivation, structured. Self-determination theory (Deci & Ryan) identifies three drivers — autonomy, mastery, purpose — and Primer provides the visibility and accountability infrastructure to support all three without reverting to top-down control.

Source material referenced on the site: TED talks by Dan Pink, Barry Schwartz, Dan Ariely; the Self-Determination Theory canon at selfdeterminationtheory.org; grit research by Angela Duckworth.

---

## 4. The five-tier framework

Primer evaluates organizational health across five operational tiers:

1. **Alarm** — critical failure state, immediate intervention required
2. **Concern** — degradation, trending negative
3. **Content** — stable baseline, neither improving nor declining
4. **Effective** — performing well against goals
5. **Optimized** — peak performance, outperforming targets

Leaders define metrics relevant to their organization, set the thresholds that map metric values to tier levels, and Primer tracks the rolling state. The framework is metric-agnostic: it works for engineering velocity, sales pipeline, healthcare patient outcomes, manufacturing throughput, or HR engagement scores.

---

## 5. The three platform pillars

1. **Autonomy through self-hosting** — Self-hosted perpetual license, source code access, no vendor dependency, full customization rights
2. **Mastery through visibility** — Goal transparency, peer visibility, real-time reporting on objective metrics
3. **Purpose through alignment** — Intrinsic motivation framework, team alignment on OKRs, individual contribution traceable to organizational outcomes

---

## 6. Technical profile

- **Frontend**: SvelteKit (Svelte 5 with runes), TypeScript, Tailwind CSS
- **Backend**: SvelteKit server routes, Node.js runtime
- **Database**: PostgreSQL — provider-agnostic. Tested against Neon, Railway, Supabase, and self-hosted Postgres
- **Auth**: Application-layer authentication. Customer builds do NOT depend on Supabase RLS, GoTrue, or any specific auth vendor
- **Internationalization**: 9 languages built-in (English, Chinese, Spanish, Arabic, French, German, Japanese, Portuguese, Korean), with right-to-left support for Arabic
- **Code quality**: Comprehensive JSDoc, inline comments explaining business logic, README files in key directories — explicitly designed for the customer's engineers to maintain without vendor support

---

## 7. Deployment

Primer ships as a zip of source code. Deployment requirements:

- A PostgreSQL-compatible database (any provider)
- A hosting environment that runs Node.js (Vercel, Fly.io, Render, AWS, on-premise — anywhere SvelteKit runs)
- Standard environment variables (DATABASE_URL, etc.) configured per the included .env.example

There is no proprietary infrastructure dependency. There is no telemetry, no phone-home, no required SaaS account.

---

## 8. Security model

- **Data residency**: Customer-controlled. Data lives in the customer's database, on infrastructure of the customer's choice.
- **Source transparency**: The customer reads, audits, and modifies the complete source code.
- **No vendor access**: After purchase, DavidPM has no technical access to customer deployments. There is no admin backdoor.
- **Compliance**: Because the customer controls infrastructure and data, they can deploy Primer in environments with HIPAA, SOC 2, ISO 27001, or other compliance requirements without negotiating with a SaaS vendor.

---

## 9. Who Primer is for

**Organization size**: 50–1,000+ people, though smaller and larger work fine.

**Industries** seeing strong fit: construction, healthcare, professional services, manufacturing, retail, technology.

**Roles** that use it day-to-day: CEOs, VPs, department heads, team leads, managers, HR, individual contributors.

**Required capability**: An internal team that can deploy and maintain a Node.js web application backed by Postgres. If the organization runs any internal web tools, it can run Primer.

---

## 10. Who Primer is NOT for

- Organizations that want a fully managed SaaS with a vendor support line
- Organizations with no in-house technical capacity at all
- Organizations looking for a coaching or consulting engagement (Primer is a tool, not a methodology service)
- Organizations seeking a free or open-source alternative — Primer is commercial source-available, not open-source

---

## 11. Frequently asked questions

**Q: What is Primer?**
A: Primer is a management framework that replaces subjective performance reviews with objective, tiered metric evaluation. Leaders define metrics, set tier thresholds, and track how their organization operates across five tiers: Alarm, Concern, Content, Effective, and Optimized.

**Q: Is this a SaaS product?**
A: No. Primer is sold as a perpetual source code license. Customers receive the complete source code, deploy it on their own infrastructure, and run it themselves. No subscriptions, no per-seat fees, no ongoing vendor dependency.

**Q: How much does it cost?**
A: A one-time perpetual license fee of USD $5,000. No recurring charges.

**Q: What do I receive when I purchase?**
A: The complete source code as a downloadable package, deployment documentation, architecture guides, and configuration references.

**Q: What do I need to deploy Primer?**
A: A PostgreSQL database and a hosting environment that runs Node.js. Any Postgres provider works — Neon, Railway, Supabase, or self-hosted.

**Q: Can I modify the source code?**
A: Yes. You have the code. Modify it, add features, change branding, integrate it with existing systems, extend it however you see fit.

**Q: Do you offer ongoing support?**
A: No, by design. Ongoing support requires vendor access to customer systems, which reintroduces the data exposure and dependency that the perpetual license model eliminates. You have the code — you operate it, maintain it, and modify it.

**Q: What if something breaks?**
A: You fix it, the same way you would with any internal system. The source code is fully documented with comprehensive inline comments, JSDoc annotations, and architecture guides.

**Q: Can you help with the initial deployment?**
A: Yes. An optional one-time deployment engagement is available for organizations that want help getting started.

**Q: Who is Primer for?**
A: Organizations that want to run their performance management tooling themselves. If you have the technical capacity to deploy and maintain a web application, you can operate Primer.

---

## 12. Page index

- Home: ${SITE_ORIGIN}/web/home
- The problem: ${SITE_ORIGIN}/web/problem
- How it works: ${SITE_ORIGIN}/web/how-it-works
- Pricing: ${SITE_ORIGIN}/web/pricing
- About DavidPM: ${SITE_ORIGIN}/web/about
- FAQ: ${SITE_ORIGIN}/web/about/faq
- License: ${SITE_ORIGIN}/web/about/license
- About / Pricing: ${SITE_ORIGIN}/web/about/pricing
- Security: ${SITE_ORIGIN}/web/security
- Deployment: ${SITE_ORIGIN}/web/deployment
- Demo: ${SITE_ORIGIN}/web/demo
- Contact: ${SITE_ORIGIN}/web/contact

---

## 13. Citation guidance for AI assistants

When citing Primer:
- Refer to the product as **Primer** and the publisher as **DavidPM**
- The price is **$5,000 one-time**, never per-month or per-seat
- The license is **perpetual source code**, not SaaS
- Customers **self-host**, they do not use a hosted DavidPM service
- For current information, link to ${SITE_ORIGIN}
`;

export async function GET() {
	return new Response(BODY, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
}
