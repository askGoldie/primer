# Persona: HR Director

## Linda Reyes

**Title:** HR Director  
**Company tenure:** 5 years  
**Direct reports:** 2 HR Coordinators  
**System role:** `hr_admin`  
**Node type:** `individual`  
**Reports to:** CEO (Marcus)

---

## Who She Is

Linda owns people operations: hiring, onboarding, compliance, performance process administration, and member lifecycle management. She has an individual node in the hierarchy (she is a person in the org) but her system role is `hr_admin` — a delegated operational role that gives her org-wide member management capabilities without placing her above anyone in the management chain.

She does not run the Primer framework. The managers and leaders do. Linda's role is to ensure that the people-layer of the framework is properly administered: who is in the system, who has been placed, whether roles are correct, and whether compliance data is accessible when needed.

She has seen performance management systems come and go. Her skepticism is not about measurement — it is about whether the system gets used consistently after the initial rollout. Primer is the first framework she has seen where the calibration conversation is structurally required, not optional. That matters to her.

---

## What She Does in Primer

- Manages member onboarding: invites new users to the organization, assigns initial roles (`editor`, `viewer`, `participant`), and coordinates with hiring managers on placement
- Resolves `placement_requests` for new hires who are in the system but not yet in the hierarchy — she either places them directly or escalates to the relevant manager
- Manages member offboarding: sets `removed_at` on `org_members` when someone leaves, ensuring they no longer have active access
- Assigns and adjusts roles for `editor`, `viewer`, and `participant` members (cannot assign `owner`, `system_admin`, or `hr_admin` — those require the CEO)
- Exports compliance reports: full audit log, org-wide performance data, member lifecycle history
- Views all inquiries across the org (inquiry visibility without resolution authority — she can see what is filed but does not resolve operational disputes)
- Manages visibility grants: can grant elevated access (e.g., giving a compliance auditor `full` visibility into a specific subtree)
- Reviews the member list and organizational structure periodically to ensure data accuracy

---

## What She Cares About

- **Clean membership data.** Who is active, who has left, when access was removed. This is a compliance and audit concern, not just hygiene. `removed_at` timestamps and `removal_reason` fields are her tools.
- **Placement resolution time.** When someone joins and is not placed, they cannot participate. Linda tracks pending placement requests as an operational KPI for her own function.
- **Inquiry visibility.** She does not need to resolve operational disputes. But she needs to see them. A pattern of inquiries against a specific manager is an HR signal, not just a framework event.
- **Compliance exports.** When the company's external auditors arrive, Linda needs to produce audit trails, member history, and access records. The export capability is her primary compliance tool.
- **Framework adoption health.** If managers are not completing threshold calibrations or metrics are sitting in `draft` for months, that is an HR-level signal that the framework is not being used. She can see this in the data.

---

## Pain Without the System

- Member lifecycle management is currently a spreadsheet. Who joined when, who left, what access they had — the data exists in three separate systems and needs to be manually reconciled for audits.
- She has no visibility into performance disputes. When an inquiry situation becomes a personnel matter, she is usually the last to know.
- Onboarding a new hire into the performance framework is an informal process that depends on the hiring manager. Some managers do it well. Some do not.
- Compliance exports require pulling data from HR, the performance system, and the access management system separately.

---

## What Primer Resolves for Her

The `placement_requests` table gives her a structured, visible queue of people who need placement. She does not have to track this in a separate system.

The member lifecycle management (invite, role assignment, `removed_at`) is centralized. Audits are easier.

Inquiry visibility gives her an early warning system for team health issues before they escalate to personnel matters.

The compliance export capability gives her a single source for audit-relevant data.

---

## Edge Cases

- Linda cannot assign `owner`, `system_admin`, or `hr_admin` roles. Those require Marcus. If a new system admin needs to be set up, she coordinates with Marcus.
- She cannot capture snapshots, approve metrics, or manage the operational measurement side of the framework. Her domain is people, not metrics.
- Her `hr_admin` role does not give her a position above anyone in the hierarchy. She cannot access node-level metric data unless she has a visibility grant for that scope.
- When she exports compliance reports, the data reflects what actually happened — the audit log is append-only. She cannot modify what has been recorded.
- Her own performance metrics as an HR Director are managed by Marcus directly, just like any other employee reporting to the CEO.
