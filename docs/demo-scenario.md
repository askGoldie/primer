Demo Scenario Definition: Seed Data Needs by Role

New C-Suite Persona: CFO

Recommendation: Add Chief Financial Officer as the new non-CEO C-suite persona doc.

Why CFO over CTO/COO/CMO:

- Finance leaders are often the buying authority or key influencer at 200+ person
  companies
- Financial metrics (gross margin, budget variance, cash runway) are instantly legible to
  any visitor regardless of function
- The CFO's natural tension with Sales (forecast accuracy, discount discipline) produces
  the most universally relatable peer inquiry scenario
- CFOs are uniquely positioned to show the "board-mandated metric" flow — they receive
  mandates and cascade them, which demonstrates the full metric assignment chain
- Morgan Kim (VP Finance in Tier Internal seeds) can be re-titled CFO; executive_leader
  node type fits

Persona profile:

- Name: Morgan Kim
- Title: Chief Financial Officer
- System role: editor
- Node type: executive_leader
- Reports to: CEO (Alex Rivera)
- Direct reports: 3 Finance Directors (Accounting, FP&A, Treasury)

---

Gap Analysis: Current Tier Internal Seed State

The Tier Internal org (69 members, four-level hierarchy) has zero operational data: no
metrics, no thresholds, no snapshots, no goals, no performance logs, no inquiries, no
placement requests. HR Director and Chief of Staff personas have no corresponding users
or members in Tier Internal. Meridian Construction is richer but only supports 5
characters. The analysis below defines what needs to exist in Tier Internal to support
each persona demo.

---

Role-by-Role: Demo Tasks + Seed Data Requirements

---

1. CEO — Alex Rivera

Persona archetype: Marcus Chen (ceo.md)

Demo Task: Review VP metric weight submissions
What Visitor Sees: Each VP's weights are a strategic statement; CEO sees whether
Operations' priorities match company direction
Seed Data Required: 4 VP nodes each with 4–6 metrics at approved status, weights summing
to 100, at least one VP with a weight distribution that looks misaligned (e.g., VP
Sales
weighting pipeline volume >40% during a margin-squeeze quarter)
────────────────────────────────────────
Demo Task: Review threshold calibrations across senior leadership
What Visitor Sees: The "calibration conversation" — CEO sees each VP's definition of
"alarm"
Seed Data Required: Full 5-tier threshold rows for all CEO and VP metrics; each threshold

    description written in the VP's domain language (e.g., CFO's "Alarm" on gross margin =
    "< 48% for two consecutive months")

────────────────────────────────────────
Demo Task: Snapshot history showing composite tier movement
What Visitor Sees: CEO can track each VP's trend over 3 quarters, not just current state
Seed Data Required: 3 quarterly snapshots per VP executive node; at least one VP showing
decline (Q1 Effective → Q2 Concern), one showing recovery (Alarm → Content →
Effective),
one flat
────────────────────────────────────────
Demo Task: Resolve a peer inquiry between VP Sales and VP Operations
What Visitor Sees: The convergence authority story — CEO is where cross-silo dependencies

    surface

Seed Data Required: One open peer inquiry: VP Operations → VP Sales, Operations'
"Delivery
Commitment Fulfillment" metric affected by Sales' "Contract Commitment Accuracy"
metric;
inquiry has a detailed rationale and 2 comments but no resolution yet
────────────────────────────────────────
Demo Task: Review audit log after unexpected weight change
What Visitor Sees: CEO discovers a VP adjusted a metric weight mid-cycle; audit trail
surfaces who, what, when
Seed Data Required: 3–4 audit_log entries: one threshold update, one weight change, one
snapshot capture — all attributed to their respective actors
────────────────────────────────────────
Demo Task: Adjust a snapshot post-quarter with notes
What Visitor Sees: CEO uses adjusted_by/adjusted_at after a VP conversation reveals new
context
Seed Data Required: One snapshot for VP Operations node with adjusted_by = CEO, notes =
"Adjusted following Q3 post-mortem: two delivery misses attributed to client-side scope

    changes, not operational failure. Revised from Concern to Content."

---

2. VP of Operations — Jordan Lee

Persona archetype: Sarah Okonkwo (vp.md)

Demo Task: File a peer inquiry against VP Sales
What Visitor Sees: First formal channel to surface a cross-silo dependency
Seed Data Required: One open peer inquiry filed by Jordan (VP Ops) against Casey (VP
Sales): Operations' "Delivery Fulfillment Rate" (affecting metric) impacted by Sales'
"Client Commitment Accuracy" (target metric); rationale citing 3 quarters of overcommit

    pattern; one comment from Casey responding

────────────────────────────────────────
Demo Task: Review and push back on a Director's threshold calibration
What Visitor Sees: VP approves two Directors, challenges one
Seed Data Required: Director Taylor Brooks: approved metrics with full thresholds.
Director Reese Donovan: metrics submitted, with a VP comment "The 'Optimized'
definition
here assumes zero defect escapes — that's not achievable at current team size. Revise
the upper bound." Director Jamie Navarro: metrics still in draft
────────────────────────────────────────
Demo Task: Track goal status across her subtree
What Visitor Sees: VP can see which Director goals are on track vs. slipping
Seed Data Required: 5–6 goals: 2 at VP level (cascaded from CEO), 4 at Director level (2
cascaded from VP, 2 self-created); statuses: 2 on_track, 1 at_risk, 1 completed, 1
not_started
────────────────────────────────────────
Demo Task: Review her composite score trend
What Visitor Sees: 3-quarter improvement arc validates her operational work
Seed Data Required: 3 quarterly snapshots for Jordan's node: Q1 concern (2.8), Q2 content

    (3.3), Q3 effective (3.9)

---

3. CFO — Morgan Kim (new persona)

Persona archetype: New cfo.md to be created

Demo Task: Define financial health metrics with board-mandated origins
What Visitor Sees: CFO receives board directives and owns threshold calibration for each
Seed Data Required: 5 metrics on CFO node: "Gross Margin %" (board), "Operating Expense
Ratio" (board), "Days Sales Outstanding" (self), "Cash Runway" (self), "Revenue
Forecast
Accuracy" (self); all approved with full 5-tier threshold descriptions using precise
financial language
────────────────────────────────────────
Demo Task: Show 3-quarter snapshot arc with one concerning quarter resolved
What Visitor Sees: CFO's operational health had a rough Q2 (DSO spiked), recovered by Q3
Seed Data Required: 3 snapshots for Morgan's node: Q1 effective (3.8), Q2 concern (2.9,
notes = "DSO climbed to 58 days following AR process gap in two enterprise accounts"),
Q3 effective (3.7, notes = "AR aging resolved; DSO returned to 41 days")
────────────────────────────────────────
Demo Task: File a peer inquiry against VP Sales over forecast accuracy
What Visitor Sees: The CFO-Sales tension story: Finance's cash forecast depends on Sales'

    pipeline data

Seed Data Required: One resolved peer inquiry: Morgan (CFO) → Casey (VP Sales); CFO's
"Revenue Forecast Accuracy" metric was materially affected by Sales' "Pipeline Commit
Accuracy" metric; resolution = threshold recalibration on Sales' commit definition, new

    process agreed

────────────────────────────────────────
Demo Task: Assign mandatory compliance metrics to Finance Directors
What Visitor Sees: CFO cascades board-mandated metrics down to Accounting and FP&A
Seed Data Required: 2 metrics on Rory Langston (Accounting) node with origin =
'cascaded',
assigned by Morgan: "Audit Finding Rate" and "Close Cycle Time"; both approved
────────────────────────────────────────
Demo Task: Review Director composite scores across Finance
What Visitor Sees: CFO evaluating whether Finance function is operationally healthy
Seed Data Required: 1 snapshot per Finance Director node (Accounting, FP&A, Treasury); at

    least one Director at content, one at effective, one at concern to show variance

---

4. Director of Engineering — Hayden Park

Persona archetype: James Whitfield (director.md)

Demo Task: File a self-inquiry after a platform migration changes metric meaning
What Visitor Sees: Structured mechanism for metric adaptation mid-cycle
Seed Data Required: One open self-inquiry filed by Hayden: target = "Deployment
Frequency"
metric (own node), rationale = "Migration to Kubernetes has changed deployment unit
definition. Previous threshold of 10 deploys/week assumed monolith releases. Current
microservice architecture produces 40–80 micro-deploys/week. Threshold no longer
meaningful."
────────────────────────────────────────
Demo Task: Review manager threshold calibrations — mixed states
What Visitor Sees: Director can see calibration health across 3 team managers
Seed Data Required: 3 manager nodes under Hayden: Manager A (Cameron Vega's team) =
metrics approved, Manager B (Ashton Cruz's team) = metrics submitted with one Director
comment, Manager C (Peyton Lam's team) = metrics in draft
────────────────────────────────────────
Demo Task: Cascade strategic goals to managers with traceability
What Visitor Sees: Director receives from VP, breaks into team-level goals
Seed Data Required: 1 goal at VP Engineering (Sam Patel) level, origin cascaded from CEO;

    3 goals at Hayden's Director level cascaded from VP goal; 3 goals at manager level
    cascaded from Director goals; source_goal_id chain visible

────────────────────────────────────────
Demo Task: Track composite score variance across teams
What Visitor Sees: Director sees that team performance is not uniform
Seed Data Required: 3 snapshots (one per manager team node under Hayden): Q3 results at
effective, content, and alarm respectively — the alarm case prompts a conversation

---

5. Engineering Manager — Team Lead under Director

Persona archetype: Priya Nair (manager.md)

Note: The Tier Internal seed has ICs under Directors but no Manager-level nodes. A
manager (team node type) needs to be created between Hayden Park and his ICs for this
demo.

Demo Task: Write threshold descriptions for on-call health metric
What Visitor Sees: The core manager Primer interaction — makes "alarm" explicit
Seed Data Required: One manager team node (Platform Team) under Hayden Park; 5 metrics
with complete 5-tier threshold descriptions; the "On-Call Incident Load" metric
threshold should have specific, technical language ("Alarm: 3+ P1 incidents in a single

    sprint with no post-mortem completed within 72 hours")

────────────────────────────────────────
Demo Task: Record weekly performance data showing realistic variance
What Visitor Sees: Immutable time-series log; manager tracks actual measurements
Seed Data Required: 10–12 performance_log entries across 2 metrics over 3 months:
"On-Call
Incident Load" (weekly) with values varying from 0 to 4, "Deployment Reliability"
(monthly) showing 94.1%, 97.2%, 91.8%
────────────────────────────────────────
Demo Task: File a peer inquiry against Infrastructure team
What Visitor Sees: On-call load spilling over from another team
Seed Data Required: One open peer inquiry from Platform Manager → Infrastructure Manager
(Drew Castillo's node); Platform's "On-Call Incident Load" affected by Infrastructure's

    "Deployment Stability" metric; rationale cites 2 specific incidents in the log period

────────────────────────────────────────
Demo Task: Track goals at team level
What Visitor Sees: Goals connected to strategic direction and individual work
Seed Data Required: 4 goals: 1 cascaded from Director (reduce P1 incident rate), 1
self-created (team health retro process), 1 cascaded and completed, 1 at_risk with a
status note

---

6. Individual Contributor — IC under Manager

Persona archetype: Derek Solís (ic.md)

Note: IC nodes under a manager team node are needed. Currently ICs in Tier Internal are
under Directors, not a Manager team node.

Demo Task: Co-authored threshold calibration
What Visitor Sees: IC had input on what "optimized" means for their own metrics
Seed Data Required: 3 metrics on Derek's individual node, all approved; threshold
descriptions in first-person collaborative voice ("Co-authored with manager: Optimized
=
zero open P2s assigned to me for 3+ consecutive sprints, documentation maintained
without prompts")
────────────────────────────────────────
Demo Task: Personal performance log showing trend
What Visitor Sees: IC's data is their data — immutable, honest
Seed Data Required: 8 performance_log entries on "Code Review Turnaround" (weekly) and 4
on "Documentation Coverage" (monthly); values show realistic pattern — two weeks with
slow turnaround during an incident crunch
────────────────────────────────────────
Demo Task: Self-directed developmental goals
What Visitor Sees: IC owns their career goals alongside cascaded work goals
Seed Data Required: 3 goals: 1 origin = 'self_created' ("Complete Rust fundamentals for
platform migration"), 1 cascaded from manager (P1 incident response contributor), 1
goal_dependency_type = 'supports' linking to Director-level platform migration goal

---

7. New Hire — Pending Placement

Persona archetype: Aisha Torres (new-hire.md)

Demo Task: Placement request in pending state
What Visitor Sees: New hire is in system, not yet in hierarchy — HR has a queue to manage
Seed Data Required: New user record (Aisha Torres equivalent in Tier Internal), member
record with participant role; placement_request record with status = 'pending',
requested_at = NOW() - 18 days, notes = 'Hired as Associate Product Manager, reports to

    Hayden Park. Manager traveling. Awaiting placement into Product team node.'

────────────────────────────────────────
Demo Task: Browsing org hierarchy without node
What Visitor Sees: New hire can see structure, cannot participate
Seed Data Required: No individual node for this user — they exist as a member but are
unplaced
────────────────────────────────────────
Demo Task: First metric calibration (post-placement path shown)
What Visitor Sees: Shows what the new hire will do next once placed
Seed Data Required: 2 metrics on an individual node in draft state assigned to a
recently-placed user (to show the first-calibration state as a contrast)

---

8. HR Director — People Operations

Persona archetype: Linda Reyes (hr.md)

Note: No HR Director user or member exists in Tier Internal seeds. One needs to be added.

Demo Task: Placement request queue
What Visitor Sees: HR has a structured, visible queue of unplaced people
Seed Data Required: The placement_request from the New Hire above, status pending; a
second resolved placement request (resolved 30 days ago, placed user now has a node) to

    show the lifecycle

────────────────────────────────────────
Demo Task: Recently offboarded member
What Visitor Sees: Clean lifecycle management — access removed, timestamped
Seed Data Required: One org_member record with removed_at = NOW() - 7 days,
removal_reason
= 'voluntary_resignation'; the member's node is still in the hierarchy but user_id is
cleared (or retained per system design)
────────────────────────────────────────
Demo Task: Inquiry pattern across the org
What Visitor Sees: Two inquiries filed against the same manager = HR signal
Seed Data Required: Two inquiries (one resolved, one open) where the same Director node
is
the target; HR can see this without resolving it
────────────────────────────────────────
Demo Task: Member role audit
What Visitor Sees: HR reviewing whether roles are correctly assigned
Seed Data Required: Membership list with at least one editor role recently updated
(audit_log entry showing role change)

---

9. Chief of Staff — Operational Proxy

Persona archetype: Carlos Mendez (chief-of-staff.md)

Note: No Chief of Staff user or member exists in Tier Internal seeds. One needs to be
added with system_admin role.

Demo Task: Snapshot captured on CEO's behalf
What Visitor Sees: Carlos recorded the snapshot; recorded_by = Carlos, not Alex
Seed Data Required: One VP-level snapshot where recorded_by = Chief of Staff user ID (not

    CEO); timestamp = "captured 2 days before cycle deadline"

────────────────────────────────────────
Demo Task: Resolving a stalled inquiry
What Visitor Sees: system_admin can resolve any inquiry regardless of named authority
Seed Data Required: One open inquiry where the named authority_id is a VP but resolved_by

    will show Carlos — the inquiry has been open 14+ days and is overdue

────────────────────────────────────────
Demo Task: Org-wide metric status view
What Visitor Sees: Carlos can see every node's metric state in one view
Seed Data Required: A spread of metric states across the full Tier Internal hierarchy:
some approved, some submitted, some draft; at least 2 nodes with no metrics started
(showing framework adoption gap)
────────────────────────────────────────
Demo Task: Audit log review for CEO
What Visitor Sees: Carlos diagnosed an unexpected change
Seed Data Required: 5–6 audit_log entries covering: threshold update, weight change, role

    change, snapshot capture, cycle start — covering different actors so the log tells a
    story

---

Summary: Missing Seed Data Categories

┌───────────────────┬─────────────────┬──────────────────────────────────────────────┐
│ Data Type │ Currently in │ Needed │
│ │ Tier Internal │ │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ HR Director user │ None │ 1 user, 1 member, hr_admin role │
│ + member │ │ │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Chief of Staff │ None │ 1 user, 1 member, system_admin role │
│ user + member │ │ │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Manager (team) │ None │ 1–2 team nodes between Directors and ICs │
│ nodes │ │ │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ CFO persona doc │ None │ docs/company/cfo.md │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Metrics + │ None │ ~40–50 metrics across VP/Director/Manager/IC │
│ thresholds │ │ nodes │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Performance logs │ None │ ~25 entries across 3–4 nodes │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Goals │ None │ ~15 goals at 4 hierarchy levels with │
│ │ │ cascading chain │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Score snapshots │ None │ ~15 snapshots (3 per VP + Director level │
│ │ │ samples) │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ │ │ 3 open inquiries (1 peer VP-level, 1 peer │
│ Inquiries (open) │ None │ manager-level, 1 self-inquiry │
│ │ │ Director-level) │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Inquiries │ None │ 2 resolved inquiries (1 CFO→Sales, 1 │
│ (resolved) │ │ self-inquiry) │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Placement │ None │ 1 pending + 1 resolved │
│ requests │ │ │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Offboarded member │ None │ 1 removed_at member │
├───────────────────┼─────────────────┼──────────────────────────────────────────────┤
│ Audit log entries │ None │ 5–6 entries covering key system events │
└───────────────────┴─────────────────┴──────────────────────────────────────────────┘
