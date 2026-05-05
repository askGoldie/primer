# Primer Marketing Site (/web) — Persona Walkthrough & Grade

**Persona:** Dana — Director of HR, 400-person Ohio industrial manufacturer
**Context:** Paying $85K/yr for Workday Performance nobody uses. CFO just asked "what do we actually get for this?" Renewal quote hit her desk last week. She Googled _"alternative to workday performance"_ and landed on primer.company.
**Evaluation date:** 2026-04-14
**Evaluation mode:** Emotional walkthrough → grade card → likelihood-to-buy

---

## The Walkthrough

### Stop 1 — `/web/home` (the hero)

She sees: _"What if you could transform employee motivation for a one-time payment of $5,000?"_

**Emotion:** Stops scrolling. Raised eyebrow. The $5K number lands before the pitch does — which is unusual, and disarming. The product card on the right shows a real composite score (3.6, "Effective") with sample metrics. It's not a stock-photo mockup.

She scrolls. Sees the 21% engagement stat (Gallup), the $438B disengagement number, the "95% of managers frustrated with their review system" line. She mutters _"yep"_ twice.

**Internal monologue:** _"Either this is the most honest thing I've read all quarter or it's a $5K scam. I need to see if the rest holds up."_
**Buy-likelihood delta:** +25%

---

### Stop 2 — `/web/problem`

Animated funnel: 95% → 33% → 2% goal cascade dropoff. Three stat rings. A $438B hero number. Then the section that makes her actually lean in: **"Vendor-driven roadmaps."**

**Emotion:** Recognition, then quiet anger. This is the _exact_ conversation she had with her Workday CSM in December. She never got the feature she asked for. She forwards this section to herself in a draft email.

**Internal monologue:** _"Oh. They know."_
**Buy-likelihood delta:** +15%

---

### Stop 3 — `/web/how-it-works`

Five-tier framework (Alarm → Optimized). Five pillars (People, Balance, Reporting, Inquiry, Growth). A two-party metric ownership diagram: _leader proposes → manager approves_.

**Emotion:** Cautious approval. The "two-party ownership" model solves the thing that broke Workday for her — managers refusing to engage because HR forced the framework down their throats. But the page is heavy on i18n keys and the copy feels slightly abstract. She wants more "show me."

**Internal monologue:** _"Okay, but I want to click something."_
**Buy-likelihood delta:** +5%

---

### Stop 4 — `/web/demo` ← the moment of truth

Interactive five-step walkthrough: pick a tier, define thresholds, drag weight sliders, watch the composite score recalculate in real time, step through a mock inquiry (Filed → Reviewed → Resolved).

**Emotion:** She drags the Safety Record slider from 25% to 40% and watches the score shift. She does it again. She's smiling.

**Internal monologue:** _"I could show this to our plant managers in a 15-minute meeting and they'd get it. They never got Workday."_
**Buy-likelihood delta:** +25%

---

### Stop 5 — `/web/pricing`

$5,000 animated counter. "What's included" grid (source code, 10 languages, no recurring fees). Then the **TCO table**:

|        | Primer | SaaS | Save     |
| ------ | ------ | ---- | -------- |
| Year 1 | $5K    | $18K | $13K     |
| Year 3 | $5K    | $54K | $49K     |
| Year 5 | $5K    | $90K | **$85K** |

**Emotion:** Her breath catches on the Year 5 row. $85K is her _current annual spend_. She screenshots the table. She's already drafting the email to her CFO in her head.

**Internal monologue:** _"This is the page I show Jim. This is the whole case."_
**Buy-likelihood delta:** +30%

---

### Stop 6 — `/web/deployment`

Three boxes: Download → Install → Team uses it. A diagram of "Your Infrastructure" next to a grayed-out "DavidPM, LLC" box labeled _"No connection, no access, no data."_ Three deployment paths (local / on-prem / cloud). Database options: Postgres / MySQL / SQLite.

**Emotion:** Relief, but also a question mark. Her IT team is 4 people. The "optional managed hosting" mention is a one-liner with no price, no link. She wants more reassurance here.

**Internal monologue:** _"Ben in IT will love this. But I need to know the managed option exists before I commit."_
**Buy-likelihood delta:** +5% (would be +15% with better managed-hosting surfacing)

---

### Stop 7 — `/web/security`

Headline: _"DavidPM is not in your security loop."_ Six pillars. A SaaS-vs-Primer comparison table. Three bold statements including: _"You cannot be breached through Primer's infrastructure because Primer's infrastructure is not involved."_

Compliance section is refreshingly honest: _"DavidPM does not hold certifications. The product is source code running inside your compliance perimeter, so your controls cover Primer directly."_

**Emotion:** Surprise, then respect. Every vendor she's ever evaluated waves SOC2 badges around. This one says "your audit already covers us." She forwards the page to her CISO.

**Internal monologue:** _"Bold. And correct."_
**Buy-likelihood delta:** +10%

---

### Stop 8 — `/web/about`

Team photo. Thesis paragraphs (all behind i18n keys, so the structure is thin). No founder bio. No company history. No "here's why we built this."

**Emotion:** Mild letdown. After the honesty of /security, she wanted to meet the humans. Who is David? Why did he build this? How long has DavidPM been shipping?

**Internal monologue:** _"…and?"_
**Buy-likelihood delta:** −5%

---

### Stop 9 — `/web/for-consultants`

Not her page, but she skims. License rule: _one per legal entity_. Reinforces in her mind that the $5K covers her whole 400-person org. Good.

**Buy-likelihood delta:** +2%

---

### Stop 10 — `/web/contact`

Simple form. Name, email, company, message. Honeypot. Portrait photo of the person who reads messages. _"We'll respond in 24 hours."_

**Emotion:** Calm. This is what a contact form should be. She fills it out.

**Internal monologue:** _"Sending."_
**Buy-likelihood delta:** +3%

---

## Grade Card

| Criterion                                             | Grade          | Notes                                                                                                                                                    |
| ----------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **First impression / hero clarity**                   | **A**          | Price-first, product-card-visible, no mystery. Rare.                                                                                                     |
| **Pain articulation**                                 | **A**          | Vendor-roadmap section is surgical. Problem page earns its stats.                                                                                        |
| **Product explanation (how-it-works)**                | **B+**         | Framework is clear, copy is slightly abstract, needs more visuals.                                                                                       |
| **Interactive demo**                                  | **A+**         | Best page on the site. Converts skeptics into believers in 90 seconds.                                                                                   |
| **Pricing transparency**                              | **A+**         | TCO table is the close. $85K/5yr savings is Dana's exact current spend.                                                                                  |
| **Self-host / sovereignty story**                     | **A−**         | Deployment page is strong; managed-hosting escape hatch is buried.                                                                                       |
| **Security posture**                                  | **A**          | Honest compliance stance is a differentiator, not a weakness.                                                                                            |
| **About / trust-building**                            | **C**          | Sparse. No founder, no history, no "why." Biggest gap on the site.                                                                                       |
| **Consultant / licensing clarity**                    | **A−**         | One-per-entity rule is clean, FAQ handles edge cases.                                                                                                    |
| **Contact / objection handling**                      | **B+**         | Works, but no calendar booking or live chat; 24hr response is slow for urgent buyers.                                                                    |
| **Copy quality (English strings)**                    | **B**          | Home/pricing/security excellent. Problem/how-it-works heavily i18n'd — can't fully grade.                                                                |
| **Trust signals (testimonials, case studies, logos)** | **D**          | Zero. Only research citations. For a $5K purchase on a plastic card this is survivable; for a $5K capex approval with a CFO in the loop it's a real gap. |
| **Mobile / responsive feel**                          | **Not tested** | Would need browser review.                                                                                                                               |
| **Accessibility / i18n completeness**                 | **B+**         | 10 languages + RTL shipped, which is remarkable. Grade held back pending QA of Arabic/CJK rendering.                                                     |
| **Conversion path coherence**                         | **A−**         | home → demo → pricing → contact is a clean funnel. No dark patterns.                                                                                     |

**Overall site grade: A−**

---

## Likelihood-to-Buy Assessment

**Baseline (before landing):** 15% — actively shopping but deeply burned.
**After walkthrough:** **78%**

**What would push her to 90%+:**

1. One manufacturing-sector case study or testimonial on the home or pricing page.
2. A founder bio / "why we built this" on /about.
3. Clear pricing + scope on the managed-hosting option (even if it's $2K/mo, _say so_).
4. A "book 15 min" calendar link on /contact for buyers in a hurry.

**What would kill the deal:**

1. If the registration flow or demo trial requires a credit card before she can show her CFO.
2. If the "I'll talk to the CISO" callback never happens within 48 hours (24hr promise + weekend).
3. If /app (the product she demos to her CFO) doesn't match the polish of /web.

**Next action Dana takes:** Submits the contact form with subject _"Evaluating as Workday replacement — 400 employees"_, then opens a new tab to register for the demo trial.

---

## Top 3 Fixes to Raise /web from A− to A

1. **Add one customer quote + logo strip** on /home and /pricing. Even a single real voice ("We replaced Workday Performance with Primer in 6 weeks") would move the trust-signals grade from D to B and add ~10 points to conversion on CFO-gated deals.
2. **Flesh out /about.** Founder photo, 2-paragraph origin story, "we've been shipping Primer since [year]." This costs nothing and fixes the only page that leaks confidence.
3. **Surface managed-hosting pricing** on /deployment as a proper callout (price, what it includes, SLA). Right now it's a one-liner that raises more questions than it answers.
