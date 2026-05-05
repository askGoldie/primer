-- =============================================================================
-- Seed 12: Goals — Tier Internal
-- Depends on: seeds 02–11
--
-- Goals across four hierarchy levels for the CEO, VP, Director, Manager,
-- and IC demo scenarios.
--
-- IMPORTANT: goal_origin and source_goal_id are intentionally excluded.
-- These columns may be absent in deployed environments where migration 003
-- was applied before those fields were added. The cascading chain is expressed
-- through description text and the goal_dependencies table instead.
--
-- Also excluded: target_tier, actual_tier, target_value, actual_value, swot
--
-- goal_status enum: 'defined' | 'in_progress' | 'completed' | 'deferred'
-- goal_type enum:   'strategic' | 'operational' | 'developmental' | 'compliance'
-- goal_priority enum: 'low' | 'medium' | 'high'
--
-- UUID conventions (goals):
--   CEO:                b400-000000000001
--   VP Ops (Jordan):    b400-00000000001[0-1]
--   VP Eng (Sam):       b400-000000000020
--   Dir Ops (Taylor):   b400-000000000110
--   Dir Ops (Reese):    b400-000000000120
--   Dir Ops (Jamie):    b400-000000000130
--   Dir Ops (Quinn):    b400-000000000140
--   Dir Eng (Hayden):   b400-00000000002[1-3]
--   Platform Mgr:       b400-00000000021[1-4]
--   IC Derek:           b400-00000000024[0-2]
-- =============================================================================

INSERT INTO org_goals
  (id, organization_id, hierarchy_node_id,
   title, description,
   priority, status, goal_type,
   due_date, assigned_by, created_by)
VALUES

  -- ── CEO — Alex Rivera ─────────────────────────────────────────────────────

  ('00000000-0000-4000-b400-000000000001',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000001',
   'Platform Modernization Initiative',
   'Migrate all core product services to Kubernetes by end of Q3 2026 to improve deployment reliability, reduce infrastructure costs, and enable team autonomy. This goal cascades to VP Engineering and Director Product Engineering.',
   'high', 'in_progress', 'strategic',
   '2026-09-30',
   '00000000-0000-4000-b000-000000000001',   -- assigned_by: CEO (self-owned)
   '00000000-0000-4000-b000-000000000001'),


  -- ── VP of Operations — Jordan Lee ────────────────────────────────────────

  -- Cascaded from CEO strategic direction (improve operational reliability)
  ('00000000-0000-4000-b400-000000000010',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   'Raise Delivery Fulfillment Rate to 95%',
   'Cascaded from CEO operational reliability mandate. Bring Delivery Fulfillment Rate from current 81.3% to 95% by end of Q2 2026 by improving capacity verification at point of sale and tightening logistics SLAs.',
   'high', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000001',   -- assigned_by: CEO
   '00000000-0000-4000-b000-000000000010'),

  -- Self-created by Jordan
  ('00000000-0000-4000-b400-000000000011',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   'Complete Vendor Compliance Audit Across All Tier-1 Suppliers',
   'Self-created operational goal. Audit all Tier-1 vendors against updated compliance standards. At least 80% must pass with no critical findings before contract renewal window opens in Q3.',
   'medium', 'defined', 'compliance',
   '2026-07-15',
   '00000000-0000-4000-b000-000000000010',   -- assigned_by: Jordan (self)
   '00000000-0000-4000-b000-000000000010'),


  -- ── VP of Engineering — Sam Patel ─────────────────────────────────────────

  -- Cascaded from CEO Platform Modernization
  ('00000000-0000-4000-b400-000000000020',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000020',
   'Complete Kubernetes Migration for All Product Services',
   'Cascaded from CEO Platform Modernization Initiative. All product services migrated to Kubernetes by Q3 2026. Hayden Park owns execution; Sam owns cross-team coordination and resource allocation.',
   'high', 'in_progress', 'strategic',
   '2026-09-30',
   '00000000-0000-4000-b000-000000000001',   -- assigned_by: CEO
   '00000000-0000-4000-b000-000000000020'),


  -- ── Operations Directors ───────────────────────────────────────────────────

  -- Taylor Brooks (Logistics) — cascaded from Jordan, on track
  ('00000000-0000-4000-b400-000000000110',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000011',
   'Improve Logistics On-Time Rate to 96%',
   'Cascaded from VP Ops delivery fulfillment goal. Renegotiate carrier SLAs and implement real-time tracking integration to push on-time rate from 93.7% to 96% by Q2.',
   'high', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000010',   -- assigned_by: Jordan
   '00000000-0000-4000-b000-000000000011'),

  -- Reese Donovan (Quality) — self-created, at_risk represented as in_progress with deferred follow-up
  ('00000000-0000-4000-b400-000000000120',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000012',
   'Reduce Defect Escape Rate to Below 1%',
   'Self-created quality improvement goal. Defect escape rate currently at 1.8%. Target is below 1% through implementation of automated pre-ship inspection checkpoints. Timeline at risk due to equipment procurement delays; escalated to VP Ops.',
   'high', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000012',   -- assigned_by: Reese (self)
   '00000000-0000-4000-b000-000000000012'),

  -- Jamie Navarro (Facilities) — not started (defined)
  ('00000000-0000-4000-b400-000000000130',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000013',
   'Establish Preventive Maintenance Completion Baseline',
   'Cascaded from VP Ops vendor compliance audit goal. Document baseline maintenance completion rate across all facilities before Q3 audit. Metrics currently in draft; goal not yet started.',
   'medium', 'defined', 'compliance',
   '2026-08-01',
   '00000000-0000-4000-b000-000000000010',   -- assigned_by: Jordan
   '00000000-0000-4000-b000-000000000013'),

  -- Quinn Mercer (Procurement) — completed
  ('00000000-0000-4000-b400-000000000140',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000014',
   'Consolidate Tier-2 Supplier List from 47 to 30',
   'Completed Q4 2025. Reduced supplier roster from 47 to 28 through evaluation against quality, cost, and delivery criteria. Under target; exceeded goal.',
   'medium', 'completed', 'operational',
   '2025-12-31',
   '00000000-0000-4000-b000-000000000010',
   '00000000-0000-4000-b000-000000000014'),


  -- ── Director of Product Engineering — Hayden Park ────────────────────────

  -- Cascaded from VP Eng, on track
  ('00000000-0000-4000-b400-000000000021',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000021',
   'Complete Platform K8s Migration by Q3',
   'Cascaded from VP Engineering. Migrate all Platform Engineering services to Kubernetes. Cameron Vega leading execution; target is full migration with 98%+ deployment reliability before Q3 cycle close.',
   'high', 'in_progress', 'strategic',
   '2026-09-30',
   '00000000-0000-4000-b000-000000000020',   -- assigned_by: Sam Patel
   '00000000-0000-4000-b000-000000000021'),

  -- Cascaded from VP Eng, at_risk
  ('00000000-0000-4000-b400-000000000022',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000021',
   'Reduce Production P1 Incident Rate by 40%',
   'Cascaded from VP Engineering reliability mandate. Target is a 40% reduction in P1 incidents across product services by Q2 2026. Ashton Cruz team currently at alarm tier — this goal is at risk if Backend Team calibration gap is not resolved this sprint.',
   'high', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000020',
   '00000000-0000-4000-b000-000000000021'),

  -- Self-created
  ('00000000-0000-4000-b400-000000000023',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000021',
   'Ship 3 Net-New Product Features in Q1 2026',
   'Self-created delivery goal for Q1 2026. Three features committed to the roadmap; two shipped as of week 11. Third is on track for end-of-quarter delivery.',
   'medium', 'completed', 'operational',
   '2026-03-31',
   '00000000-0000-4000-b000-000000000021',
   '00000000-0000-4000-b000-000000000021'),


  -- ── Platform Engineering Manager — Cameron Vega ───────────────────────────

  -- Cascaded from Hayden's P1 reduction goal
  ('00000000-0000-4000-b400-000000000211',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   'Reduce On-Call Incident Rate by 40% in Platform Team',
   'Cascaded from Director goal to reduce P1 incident rate. Platform team target: on-call incident load below 1.5 per sprint by Q2. Current value is 2. Requires upstream infrastructure stability improvement and improved pre-deploy smoke testing.',
   'high', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000021',   -- assigned_by: Hayden
   '00000000-0000-4000-b000-000000000211'),

  -- Self-created
  ('00000000-0000-4000-b400-000000000212',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   'Implement Team Health Retrospective Process',
   'Self-created team development goal. Establish bi-weekly team health retros with a structured format covering workload, clarity, and collaboration. First retro completed; cadence now running.',
   'medium', 'in_progress', 'developmental',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000211',   -- assigned_by: Cameron (self)
   '00000000-0000-4000-b000-000000000211'),

  -- Cascaded, completed
  ('00000000-0000-4000-b400-000000000213',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   'Deploy Automated Runbook System for Platform Services',
   'Cascaded from Hayden K8s migration goal. Automated runbook generation for all platform services using Backstage. Completed Q4 2025 — all 14 platform services have current runbooks.',
   'medium', 'completed', 'operational',
   '2025-12-31',
   '00000000-0000-4000-b000-000000000021',
   '00000000-0000-4000-b000-000000000211'),

  -- At-risk
  ('00000000-0000-4000-b400-000000000214',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   'Migrate Platform CI/CD to GitHub Actions',
   'Self-created infrastructure modernization goal. Migrating legacy Jenkins pipelines to GitHub Actions. Currently at risk: two services have complex dependency chains blocking migration. Revised target moved from Q1 to Q2.',
   'medium', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000211',
   '00000000-0000-4000-b000-000000000211'),


  -- ── Individual Contributor — Derek Solís ─────────────────────────────────

  -- Self-created developmental goal
  ('00000000-0000-4000-b400-000000000240',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   'Complete Rust Fundamentals for Platform Migration',
   'Self-initiated learning goal to build Rust proficiency in preparation for platform migration work. Working through The Rust Programming Language book and building a side project. Target: complete by end of Q2 before migration sprints begin.',
   'medium', 'in_progress', 'developmental',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000092',   -- assigned_by: Derek (self)
   '00000000-0000-4000-b000-000000000092'),

  -- Cascaded from manager — P1 incident response
  ('00000000-0000-4000-b400-000000000241',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   'Contribute to P1 Incident Response Protocol',
   'Cascaded from Platform Team on-call incident reduction goal. Derek is responsible for documenting the runbook for two platform services and joining on-call rotation as secondary responder starting Q2.',
   'high', 'in_progress', 'operational',
   '2026-06-30',
   '00000000-0000-4000-b000-000000000211',   -- assigned_by: Cameron
   '00000000-0000-4000-b000-000000000092'),

  -- Developmental goal linked to platform migration
  ('00000000-0000-4000-b400-000000000242',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   'Bring Owned Service Documentation Coverage to 90%',
   'Self-created documentation goal supporting K8s migration readiness. Current documentation coverage at 72%. Target is 90% across all owned services before migration sprints begin in Q3.',
   'medium', 'in_progress', 'operational',
   '2026-08-01',
   '00000000-0000-4000-b000-000000000092',
   '00000000-0000-4000-b000-000000000092');


-- =============================================================================
-- GOAL DEPENDENCIES
-- Derek's Rust learning goal supports the Platform K8s migration goal.
-- =============================================================================

INSERT INTO goal_dependencies
  (id, goal_id, depends_on_goal_id, dependency_type, description, created_by)
VALUES
  (
    '00000000-0000-4000-b400-000000009001',
    '00000000-0000-4000-b400-000000000240',   -- Derek's Rust fundamentals goal
    '00000000-0000-4000-b400-000000000021',   -- Hayden's K8s migration goal
    'supports',
    'Derek''s Rust proficiency goal supports the Platform K8s migration: migration work requires familiarity with Rust-based tooling in the new platform stack.',
    '00000000-0000-4000-b000-000000000092'    -- created_by: Derek
  );
