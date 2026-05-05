# Persona: Chief of Staff

## Carlos Mendez

**Title:** Chief of Staff  
**Company tenure:** 2 years  
**Direct reports:** None  
**System role:** `system_admin`  
**Node type:** `individual`  
**Reports to:** CEO (Marcus)

---

## Who He Is

Carlos is Marcus's operational right hand. He does not own a function. He owns the space between functions — process, coordination, visibility, and execution of things that do not fit neatly into any VP's domain. His relationship to the framework is operational: he makes it run.

Marcus granted Carlos `system_admin` because he needs someone who can operate the system at the pilot level — full org-wide access to every management function — without requiring Carlos to hold a position above any node in the hierarchy. `system_admin` is not a partial delegation. It is a full operational proxy for every system capability Marcus can exercise, with one exception: role assignment stays with Marcus alone.

Carlos is comfortable with the weight of this access. He uses it in service of the framework, not in place of the judgment calls that belong to Marcus. The system enables him; it does not replace Marcus's authority in the conversations that matter.

---

## What He Does in Primer

- Captures quarterly score snapshots across the org when Marcus is traveling or when the cycle deadline is close and a VP hasn't done it
- Starts new cycles for nodes after snapshots are captured, unlocking metric editing for the next round (clears `locked_by_snapshot_id`)
- Assigns metrics to nodes across the org on Marcus's instruction — used when a new node is created mid-cycle and needs metrics before the next calibration round
- Approves threshold calibrations and metric submissions across the org on Marcus's direction
- Adjusts snapshots after capture on Marcus's explicit direction — the power exists, the norm is restraint
- Manages org settings (name, cycle cadence, inquiry toggle) when Marcus delegates it — e.g., enabling the inquiry process after the first cycle completes
- Resolves any open inquiry when instructed — `canResolveAnyInquiry` = true for `system_admin`, surfaced in the resolve UI on any inquiry regardless of who the named authority is
- Monitors metric and snapshot status across the full org hierarchy — his view is complete
- Helps new managers through their first threshold calibration by reviewing their metric and threshold submissions and providing feedback before they reach VP level
- Coordinates goal cascades from Marcus down to the VP layer
- Reviews the audit log when Marcus has questions about what changed and when

---

## What He Cares About

- **Cycle hygiene.** His primary operational concern is that the framework actually runs on schedule. Snapshots captured on time, cycles started promptly, metrics not sitting in draft indefinitely. He is the person who chases this.
- **Framework adoption.** When a manager is not using the system — thresholds not written, no performance data logged — Carlos is often the first to notice and the first to intervene (usually through the manager's VP).
- **Using the access appropriately.** `system_admin` is a full operational proxy, not a license to act unilaterally. Carlos uses the access Marcus explicitly delegates, not the full range of what the system permits. The audit log makes every action visible. He operates as if Marcus is watching, because Marcus is — through the log.
- **Audit trail integrity.** He is often the person Marcus calls when something unexpected appears in the audit log. Carlos needs to understand what changed, who changed it, and why. The audit log is his primary diagnostic tool.

---

## Pain Without the System

- Without org-wide snapshot access, every cycle requires Marcus to personally capture each VP's snapshot. That is five separate actions during a busy quarter close. Marcus has missed cycles before. The downstream effect was a quarter without comparable data.
- Without a structured inquiry resolution mechanism, disputes that surface between teams often land on Carlos's desk as informal mediation requests. He has no formal authority in these situations. He tries to facilitate. It works about 70% of the time.
- Without a central view of metric and goal status, Carlos has to aggregate status updates manually from each VP to give Marcus a picture of organizational health.

---

## What Primer Resolves for Him

`system_admin` gives Carlos the full operational scope of the system. He can execute on Marcus's behalf in every management-layer task: snapshots, cycle management, metric assignment, approvals, inquiry resolution, org settings, and audit review. The one boundary is role assignment — promoting a user to `system_admin`, `hr_admin`, or changing anyone's `org_role` requires Marcus directly.

The inquiry resolution capability means that when Marcus is unavailable and an inquiry reaches a stalemate, Carlos can resolve it. The system surfaces the resolve UI to Carlos on any inquiry, regardless of who the named authority is. This keeps the framework moving.

The org-wide snapshot and metric visibility means Carlos can give Marcus a real-time picture of organizational health at any point in the cycle — not a compiled narrative, but actual tier data.

---

## Edge Cases

- Carlos cannot assign roles (`canAssignRoles` = false for `system_admin`). If a new VP needs an `editor` role, he coordinates with Marcus. This is the only capability the system withholds from `system_admin`.
- When he adjusts a snapshot, the `adjusted_by` and `adjusted_at` fields record him as the actor. Marcus can see exactly what Carlos did and when. This transparency is intentional.
- His own individual node exists in the hierarchy but he is not above any other node. His `system_admin` capabilities come from the role, not the hierarchy position.
- He has full visibility into all inquiries across the org. He monitors for patterns — a cluster of peer inquiries in one department is a signal he escalates to Marcus.
- When he captures a snapshot, starts a new cycle, resolves an inquiry, or changes org settings, the audit log records him as the actor. Marcus can see exactly what Carlos did and when.
