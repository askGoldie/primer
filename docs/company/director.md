# Persona: Director

## James Whitfield

**Title:** Director of Engineering  
**Company tenure:** 4 years  
**Direct reports:** 4 Engineering Managers  
**System role:** `editor`  
**Node type:** `department`  
**Reports to:** VP of Operations (Sarah)

---

## Who He Is

James runs engineering for the company's internal platform and client delivery teams — four managers, forty-plus engineers. He is technically fluent but operates primarily in the management layer. His job is to translate Sarah's operational priorities into engineering execution and to surface operational reality back up.

He is good at his job and he knows it. His frustration is not competence — it is visibility. He cannot tell whether his operational health reads the same way upstairs as it does from where he sits. When he says "delivery pipeline is healthy," does that mean what Sarah hears when she hears "healthy"? The threshold calibration process forces that conversation explicitly, and James finds it uncomfortable and useful in equal measure.

---

## What He Does in Primer

- Defines his own metrics (4–5), sets threshold descriptions, and assigns weights reflecting Engineering's current priorities
- Submits to Sarah for approval; negotiates threshold language in the review cycle
- Assigns metrics to his four Engineering Managers — mandatory (board-mandate delivery SLAs, compliance requirements) and co-authored (team health, velocity quality)
- Reviews manager threshold calibrations and approves or challenges
- Captures quarterly snapshots for each manager node
- Files self-inquiries on cycle when a metric or threshold no longer reflects operational reality (e.g., velocity metric becomes misleading after a platform migration)
- Monitors manager composite scores and goal status across his four teams
- Cascades strategic goals down to his managers, tracking origin and dependency

---

## What He Cares About

- **Threshold precision.** James's operational language is specific. "Alarm" on delivery pipeline means something technically precise to him — not "behind schedule" but a specific failure mode. Getting that language approved by Sarah means she sees it the way he sees it.
- **Manager alignment.** His four managers vary in how they think about metrics. The framework forces a calibration he could not otherwise produce — he can see whether Manager A and Manager B define "effective" for team health the same way.
- **Cycle discipline.** Engineering conditions change fast. The ability to file a self-inquiry on cycle — not every week — gives him a structured mechanism for updating metrics without creating noise.
- **Goal traceability.** When Sarah cascades a strategic goal to him and he cascades it further to managers, the source chain is visible. He does not want to explain three months later where a goal came from.

---

## Pain Without the System

- He is evaluated on metrics he sometimes co-authored but more often inherited. The threshold conversation has never happened explicitly — "good" is whatever his manager thinks is good that quarter.
- His four managers measure performance inconsistently. Two use similar frameworks. Two do not. Cross-team comparisons are not meaningful.
- When operational conditions shift (platform migration, new compliance requirement), he has no structured process to update his metrics. He raises it in a 1:1 and it gets lost.
- He cannot see whether what he reports up matches what is actually visible in the system to Sarah and Marcus.

---

## What Primer Resolves for Him

The threshold calibration gives him a documented, CEO-chain-approved definition of what each operational state looks like for his function. That documentation reduces the filtering that happens when he reports up — his tier scores carry the threshold definitions with them.

The self-inquiry process gives him a structured adaptation mechanism. When a metric becomes stale, he has a formal path: file a self-inquiry on cycle, present the updated definition, get Sarah to review it. That conversation is logged and traceable.

---

## Edge Cases

- James is an ancestor of all four manager nodes. His `editor` role combined with hierarchy position gives him snapshot and cycle management capabilities for those nodes.
- He cannot bypass hierarchy for nodes he is not above. If he tried to access a different Director's team node, it would be denied.
- When he cascades a goal from Sarah's org_goals to his managers, `goal_origin` = `cascaded` and `source_goal_id` links back to Sarah's goal. If Sarah's goal is later deleted, his cascaded goals survive (SET NULL on delete).
