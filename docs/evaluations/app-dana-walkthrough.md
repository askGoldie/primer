# Primer Product (/app) — Persona Walkthrough & Grade

**Persona:** Dana — Director of HR, 400-person Ohio industrial manufacturer
**Context:** The marketing site convinced her. She's now logged into the demo as an HR admin, imagining how she'd roll this out to 12 plant managers who refused to open Workday. She's not evaluating features — she's evaluating _manager adoption risk._
**Evaluation date:** 2026-04-14

---

## The Walkthrough

### Stop 1 — `/app` (dashboard, first login)

She sees: her name, her title, a big composite score badge on the right (3.6 Effective), a trend sparkline, two side-by-side cards (Goals + Metrics with color-coded tier bars), and a direct-reports grid. At the bottom, a scrolling research ticker of TED talks and HBR articles.

**Emotion:** First five seconds — _good._ The score is big, the tier colors are instantly legible (she doesn't need the legend). She gets it.

Seven seconds in — _confusion._ Why is the TED talk ticker here? She's looking at her performance data, not browsing a motivation blog. It feels like feature creep.

Twelve seconds in — _a question she can't answer._ Her composite is 3.6. Why? What's pulling it down? There's no "drill here to see what's driving your score" affordance. She clicks the Metrics card hoping that's where she goes.

**Internal monologue:** _"Clean, but I want to understand my score, not watch a TED talk."_

---

### Stop 2 — `/app/goals` (the three-tab workhorse)

Three tabs: Metrics | Goals | Performance. Default lands on Metrics.

She sees a weight-allocation bar ("Total: 75/100 — Remaining: 25"), a list of metric cards with sparklines, and a "Show tier framework" toggle. She expands it and finally gets the full Alarm → Concern → Content → Effective → Optimized definitions.

**Emotion:** Relief (the framework is here), then friction (why is it hidden behind a toggle?).

She tries to add a metric. The form is fine, but she can't figure out _how to set the tier thresholds_ — at what value does Schedule Adherence hit Effective vs. Content? There's no guided input, no "typical range for manufacturing" hint, no example. She guesses.

She clicks the Performance tab. Logs a weekly observation. Fine. She never would have found this tab on her own without being told it exists.

**Internal monologue:** _"My plant managers are going to ask me 'what number is Content?' and I don't have a good answer."_

---

### Stop 3 — `/app/team` (team health)

Four-column grid of direct-report health cards: name, title, tier badge, completion bar, current score. A tree/list view toggle. A "Capture snapshot" button that opens an inline form.

**Emotion:** Genuinely impressed. The cards are the single best UX moment in the app. She can see all 12 plant managers at a glance, color-coded, with completion bars telling her who's dragging their feet.

Then she looks for a legend on the tier colors. There isn't one. Red obviously means bad, green obviously means good, but her Chinese and Spanish-speaking plant managers will need a key.

She tries to capture a snapshot for _all_ direct reports at once. There's no bulk action — one at a time.

**Internal monologue:** _"This is the screen I'd show the CFO. But I'd be clicking 12 times every quarter."_

---

### Stop 4 — `/app/leaders/{id}` (the review workflow)

She clicks a plant manager card. Lands on a detail page with six stacked sections: assign metrics → edit thresholds → capture snapshot → adjust snapshot → start new cycle → view goals.

**Emotion:** _"Oh. This is the review."_

It's powerful — genuinely more flexible than Workday's review flow. But it's not a _workflow_. It's six sections on one page with no numbered steps, no "you are here" indicator, no "next" button. She's supposed to infer the sequence.

She locks a snapshot. Now the metrics card on her dashboard shows a lock banner. She didn't expect that. She wonders if she broke something. She hunts for "unlock" — finds it, clicks it, is relieved it works.

**Internal monologue:** _"Once I learn this, I'll be fast. But I'd need a one-page cheat sheet to train my managers, and that doesn't ship with the product."_

---

### Stop 5 — `/app/reports`

Scope selector (Self / Subtree / Org). Four stacked sections: composite trend, per-metric history, tier distribution donut, team overview bar chart + table.

**Emotion:** Initial delight at how pretty the charts are. Then she notices the table column header: **"Name"** — hardcoded in English while every other label is localized. Small thing, but she speaks i18n QA fluently at this point and it erodes trust.

No date range filter. No drill-through from a chart to the underlying data. CSV export with no preview.

**Internal monologue:** _"Pretty, but I can't answer 'why did Metric A drop in Q2' without leaving this page."_

---

### Stop 6 — `/app/peers`, `/app/inquiries`

**Peers:** Clean card grid, but the empty state ("You have no peers") looks like a bug to her. It's not — she's at the top of her subtree. But nothing tells her that.

**Inquiries:** She likes the concept — a formal way for a manager to challenge a metric they disagree with. The filing form is simple. But nowhere does the UI explain what _filed → under_review → resolved_ actually means in practice, or how long resolution takes. No SLA.

**Internal monologue:** _"The inquiry button is going to get me credit with my union-sensitive plant managers. Just don't tell them it's called 'inquiry.'"_

---

### Stop 7 — `/app/settings`

Four tabs: Organization | Hierarchy | Team | Audit.

**Emotion:** She clicks Hierarchy — the most important tab for a 400-person org with 5 departments and 12 plant subunits.

The tab says _"coming soon."_

**Internal monologue:** _"Wait. What?"_

This is the moment her stomach drops. She just spent 20 minutes believing this product could replace Workday, and the tab that defines _the org chart Workday replaced_ is unbuilt. She checks the other tabs. Organization works, Team works (role dropdowns, remove button), Audit works (bulk snapshot, cycle cadence, export). But Hierarchy is empty.

She notices the Audit tab has bulk "Capture snapshot for all" and "Unlock all metrics" buttons with no confirmation dialogs visible in the markup. She makes a mental note to warn her team.

---

### Stop 8 — `/app/setup` (imagined — she's already in an org)

She opens it in an incognito tab to see what onboarding looks like. Clean centered card: org name, industry dropdown, cycle cadence, her name, her title. Submit.

**Emotion:** Encouraged. It's a one-form org creation, no multi-step wizard. She can picture her IT guy walking through this in 45 seconds.

---

### Stop 9 — `/app/onboarding`

Three-path selector: Getting Started | Align Team | Measure Performance. She picks Getting Started. The walkthrough steps her through setup.

Then she accidentally refreshes the page. Progress is gone.

She also notices a `// TO REMOVE` comment in the source (she's the kind of HR director who peeks at devtools). Small thing, but combined with Hierarchy's "coming soon," it reinforces a theme: _this product is still being finished._

---

## Grade Card

| Criterion                                                        | Grade  | Notes                                                                                                                                                     |
| ---------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard clarity (first 10 seconds)**                         | **B+** | Score-front-and-center works; TED ticker is noise; no drill to "why 3.6?"                                                                                 |
| **5-tier framework legibility**                                  | **B**  | Colors + badges are consistent across routes; tier definitions are hidden behind a toggle on one screen; no legend anywhere.                              |
| **Threshold / metric definition UX**                             | **C**  | No guidance on what numbers equal what tier. Biggest "plant manager bounces" risk.                                                                        |
| **Team health view**                                             | **A−** | Best screen in the app. Would benefit from bulk snapshot + legend.                                                                                        |
| **Review workflow (leader detail)**                              | **C+** | Powerful but unnumbered and un-guided. Six sections with no sequence indicator. Needs a visual workflow map or numbered steps.                            |
| **Reports / analytics**                                          | **B**  | Pretty charts, tier-coloring consistent, no filters, no drill-through, hardcoded "Name" header.                                                           |
| **Inquiries**                                                    | **B+** | Clever feature, clean filing UX, weak status/SLA explanation.                                                                                             |
| **Peer visibility**                                              | **C+** | Works, but empty state reads as a bug; visibility gating not explained to the user.                                                                       |
| **Settings — Organization tab**                                  | **B+** | Works. Inquiry toggle and peer visibility dropdown need help text.                                                                                        |
| **Settings — Hierarchy tab**                                     | **F**  | "Coming soon" placeholder for a core feature. Single biggest confidence hit in the entire product.                                                        |
| **Settings — Team tab**                                          | **B**  | Role dropdowns work; no help text on what each role can do.                                                                                               |
| **Settings — Audit tab**                                         | **B−** | Powerful bulk actions with no visible confirmation dialogs. Dangerous for anxious admins.                                                                 |
| **Setup (new org)**                                              | **A−** | Best onboarding step. One form, friendly, industry-aware.                                                                                                 |
| **Onboarding walkthrough**                                       | **C+** | Smart three-path model undermined by lost-on-refresh state and a `// TO REMOVE` comment in source.                                                        |
| **i18n completeness**                                            | **C+** | Mostly good; hardcoded "Name" in reports is a real bug; hardcoded Tailwind tier colors in team view limit theming.                                        |
| **Manager adoption risk (will plant managers actually use it?)** | **B−** | The _ideas_ will land with her plant managers (composite score, weights, tiers). The _workflow_ will need a printed cheat sheet to survive first contact. |
| **Self-explanatory without support**                             | **C**  | No in-app tooltips, no help drawer, no "what is this?" affordances. For a product sold as "customer-maintained source code" this matters.                 |
| **Polish / perceived completeness**                              | **C**  | Hierarchy placeholder + onboarding `TO REMOVE` comment + hardcoded header = product feels ~85% finished.                                                  |

**Overall product grade: B−**

---

## Likelihood-to-Buy Assessment

**Entering /app:** 78% (from the /web walkthrough)
**Exiting /app:** **58%**

She lost 20 points inside the product. Where:

- **−8 from the Hierarchy "coming soon" tab.** Core feature unbuilt → "what else is unbuilt?"
- **−5 from the threshold definition gap.** Her plant managers will not accept "guess what number is Effective."
- **−4 from the review workflow confusion.** Six sections, no sequence, no training material.
- **−3 from the hardcoded "Name" header + onboarding state bug + TO REMOVE comment.** Polish erosion.

**She still likes:**

- The team health grid (A−).
- The tier colors and composite score clarity.
- The inquiries mechanism (her plant managers will feel heard).
- The setup form.
- The fact that it's faster, lighter, and less depressing than Workday.

**What would move her back to 78%+:**

1. **Ship the Hierarchy tab.** Not next quarter. Before she signs.
2. **Add tier threshold guidance** — even just "industry-typical ranges" as inline hints on the metric form.
3. **Turn the six-section leader detail page into a numbered workflow** with a "next step" affordance.
4. **Fix the hardcoded `Name` column header** in `/app/reports/+page.svelte:337`.
5. **Remove the `// TO REMOVE` comment** from `/app/onboarding/+page.svelte`.
6. **Add a legend** (or hoverable glossary) for tier colors somewhere persistent.

**What she'll do next:** Not buy yet. She'll send the CFO the /web pricing page and schedule a 30-minute call with contact@primer.company asking two questions: _(1) when does Hierarchy ship?_ and _(2) do you provide a manager training one-pager?_

She's still a likely buyer within 60 days _if the Hierarchy tab ships._ If it doesn't, she signs a 1-year Workday renewal in June and re-evaluates Primer in 2027.

---

## Top 5 Fixes to Raise /app from B− to A−

1. **Ship Hierarchy settings tab.** Single highest-leverage fix. Turns an F into at minimum a B.
2. **Add tier-threshold guidance on the metric form.** Inline hints ("typical Effective range for Schedule Adherence: 92–97%") or an industry template library. Fixes the "C" on threshold UX.
3. **Number the leader review workflow** (1. Assign → 2. Edit → 3. Snapshot → 4. Adjust → 5. Unlock). Or split into a wizard. Either removes the biggest friction point in the manager experience.
4. **Global tier legend** (pinned to dashboard sidebar or help drawer) so non-English managers and first-time users can decode the colors without hunting.
5. **Polish sweep:** hardcoded "Name" header, `// TO REMOVE` comment, onboarding state persistence, bulk-action confirmations. Individually minor, collectively the difference between "product" and "preview."

---

## Cross-cutting observation: the /web vs /app gap

Dana entered /app expecting the same polish she saw on /web. /web earned an A−. /app earned a B−. The **2-grade gap is the single most important finding** in this evaluation — and the easiest to misdiagnose.

The /web pages are effectively marketing artifacts: static, curated, infinitely polishable. /app is a real application with real state, real workflows, and real unfinished corners. That's normal. But Dana doesn't know that — she's comparing them side by side and feeling the drop.

**The gap isn't a feature problem. It's an expectations problem.** Two ways to close it:

- **Raise /app's polish floor** by fixing the top 5 items above. Realistic in 2–3 focused weeks.
- **Lower /web's implied promise** by adding one honest sentence on /home or /how-it-works: _"Primer is v1.x. Hierarchy management and advanced reporting ship in v1.3 (Q3 2026). You own the source — customize anything we haven't built yet."_ That single sentence would have prevented Dana's stomach-drop moment.

Do both.
