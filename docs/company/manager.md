# Persona: Manager

## Priya Nair

**Title:** Engineering Manager, Platform Team  
**Company tenure:** 2 years  
**Direct reports:** 8 engineers  
**System role:** `editor`  
**Node type:** `team`  
**Reports to:** Director of Engineering (James)

---

## Who She Is

Priya manages the platform team — eight engineers building and operating the company's internal deployment infrastructure. She transitioned from a senior engineering IC role eighteen months ago. She is technically strong and still close to the work, which means she sometimes operates at the wrong altitude: diving into architectural decisions when she should be managing operational health at the team level.

The framework is a forcing function for her. Defining metrics and thresholds requires her to articulate what team-level operational health actually looks like — a question she found surprisingly hard to answer the first time through. The exercise surfaced how little she had thought explicitly about what "good" meant for her team versus what "working on interesting problems" felt like.

---

## What She Does in Primer

- Defines 4–5 metrics for her team node (delivery reliability, on-call health, incident response time, documentation coverage, cycle time)
- Writes threshold descriptions for each tier — this is the most demanding part of her Primer interaction, and the one she finds most valuable after the fact
- Assigns weights reflecting current priorities (on-call health weighted highest following a rough production quarter)
- Submits to James for approval; often iterates on threshold language once or twice
- Records performance data against her metrics each week or month (depending on cadence set per metric)
- Captures her own composite score snapshots at the end of each cycle
- Creates goals for her team — some cascaded from James, some self-created; assigns due dates and tracks status
- Files self-inquiries on cycle when a metric threshold becomes inappropriate after a team change (e.g., headcount reduction changes what "optimized" means for cycle time)
- Files a peer inquiry if another team's behavior is creating a measurable impact on one of her metrics

---

## What She Cares About

- **Threshold ownership.** Priya resisted this part initially — she thought it was bureaucratic overhead. After her first threshold conversation with James, she understood the value. Her definition of "alarm" on on-call health (2+ P1 incidents in a sprint, no post-mortem completed within 48 hours) is now documented and approved. When it happens, there is no ambiguity.
- **Performance data fidelity.** She records actual measured values, not impressions. The performance log is immutable — she cannot retroactively adjust a bad week's entry to smooth the trend. That immutability makes her trust the data.
- **Goal traceability.** When James cascades a goal from the Director level, she can see where it came from and why. When she creates goals for her engineers, she can see the dependency chain.
- **Protecting her team from invisible dependencies.** If another team's incident pattern is creating on-call load on her team, she needs a formal channel to surface it. The peer inquiry is that channel.

---

## Pain Without the System

- She inherited her team's metrics from the previous manager. She is not sure some of them are still meaningful. She has mentioned this to James twice. Nothing has changed.
- Performance recording is currently done in a shared spreadsheet that different team members update inconsistently. There is no immutable record of what was actually measured when.
- Her weekly status update to James is a narrative. It reflects her judgment about what James wants to hear as much as what is actually happening.
- Goals exist in a project tracker with no connection to operational metrics. The team has OKRs that nobody looks at after Q1 planning.

---

## What Primer Resolves for Her

The performance logging gives her an immutable, time-series record of actual measured values. She stops managing narratives and starts managing data.

The threshold calibration gives her a documented contract with James about what each operational state means. She stops guessing what will land well in a 1:1 and starts reporting against agreed definitions.

The goal system connects strategic direction (cascaded from Director/VP) to team-level work. Goals have origin traceability, dependency links, and tie optionally to score snapshots.

---

## Edge Cases

- Priya is an `editor` with hierarchy position above her individual IC nodes. She can assign metrics to her engineers, capture snapshots for them, and start new cycles.
- She cannot adjust snapshots after capture — that requires `owner` or `system_admin`. If post-cycle context changes, she brings it to James.
- Her peer inquiry capability is gated by the peer relationship: she must share the same parent node as the other manager she is filing against. Cross-silo dependencies escalate up through James.
- When she records a performance log entry, it is immutable (`UNIQUE` on metric + period). If she made an error, she flags it to James.
