# Persona: CEO

## Marcus Chen

**Title:** Chief Executive Officer  
**Company tenure:** 6 years (founded the company)  
**Direct reports:** 5 VPs + Chief of Staff  
**System role:** `owner`  
**Node type:** `executive_leader`  
**Reports to:** Board of Directors

---

## Who He Is

Marcus runs a 230-person professional services and technology firm. He came up through operations, so he trusts process over narrative. He has been burned before by dashboards that showed green when the underlying operations were not — leaders who managed the reporting instead of managing the function. He bought Primer because he wants to build a common operational language that travels with his people.

He is not a micromanager. He delegates aggressively. But delegation without structured visibility is abdication, and he knows the difference. The framework is his mechanism for staying connected to operational reality across every silo simultaneously.

---

## What He Does in Primer

- Assigns metrics to each VP and defines which are board-mandated, regulatory, or strategic imperatives
- Reviews and approves threshold calibrations across senior leadership
- Reviews and can override VP-level metric weights
- Captures quarterly score snapshots for senior leadership nodes
- Reviews snapshot history to track composite tier movement over time
- Resolves peer inquiries between VPs (he is the convergence authority at the top)
- Grants visibility access to the Chief of Staff and HR Director
- Reviews the audit log when something changes without his knowledge
- Occasionally adjusts a snapshot with notes after a post-quarter conversation

---

## What He Cares About

- **Operational truth.** He needs to know what is actually happening, not what leaders want him to hear. The threshold calibration conversation is where he finds out whether a VP's definition of "alarm" matches his own.
- **Prioritization alignment.** When a VP submits weights, Marcus can see immediately whether that leader's stated priorities match the company's strategic direction. Misalignment is visible and negotiable rather than hidden.
- **Cross-silo dependencies.** A VP of Sales metric that creates damage downstream in Customer Success has to have a path to the surface. The peer inquiry process is that path.
- **Cycle discipline.** He expects metrics, weights, and thresholds to evolve. The inquiry cadence makes adaptation a feature rather than an exception.

---

## Pain Without the System

- Filtered information. VPs present status updates optimized for the room, not for accuracy.
- No common language across silos. Each function reports in its own format, making cross-functional comparison impossible.
- Strategic misalignment is invisible until it becomes a personnel problem.
- No structured mechanism for lateral challenges — a VP who believes another VP's metric is damaging their own operations has no formal channel.

---

## What Primer Resolves for Him

The threshold calibration conversation is the primary value. Marcus does not just see scores — he sees how each VP defines every tier of every metric. That conversation forces leaders to describe their operational reality explicitly. A leader who cannot describe what "optimized" looks like for their function has not thought clearly about their function.

The weighting conversation is the secondary value. Every VP submitting weights is making a strategic statement. Marcus can see whether that statement is consistent with where the company is going.

---

## Edge Cases

- Marcus occasionally needs to adjust a snapshot after a post-quarter review surfaces new context. The `adjusted_by` / `adjusted_at` fields and `notes` column on score_snapshots make this traceable.
- When he grants the Chief of Staff `system_admin`, he understands that role can capture and approve on his behalf but cannot adjust snapshots or assign roles — those stay with him.
- He relies on the audit log when a threshold or weight changes in a way he did not expect.
