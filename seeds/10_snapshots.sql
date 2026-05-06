-- =============================================================================
-- Seed 10: Score Snapshots — Tier Internal
-- Depends on: seeds 02–09
--
-- Point-in-time composite scores for demo personas in the Tier Internal org.
-- Columns match the 12 safe columns from seed 05 + notes/adjusted_by/adjusted_at
-- which are defined in migration 005 (score_snapshots).
--
-- Narrative arcs:
--   Jordan Lee (VP Ops)  — Q3 concern → Q4 content → Q1 effective
--                          Q3 snapshot was adjusted post-quarter by CEO with notes
--   Morgan Kim (CFO)     — Q3 effective → Q4 concern (DSO spike) → Q1 effective
--                          Q4 and Q1 snapshots include contextual notes
--   Sam Patel (VP Eng)   — Single Q1 snapshot; recorded_by = Carlos (Chief of Staff demo)
--   Casey Chen (VP Sales)— Single Q1 snapshot at content
--   Finance Directors    — One each: Rory effective, Frankie content, Dakota concern
--   Platform Managers    — One each: Cameron effective, Ashton alarm, Peyton content
--
-- UUID conventions (snapshots):
--   Jordan:    00000000-0000-4000-b300-00000000000[1-3]
--   Morgan:    00000000-0000-4000-b300-0000000000[10-12]
--   Sam/Casey: 00000000-0000-4000-b300-0000000000[20,30]
--   Finance:   00000000-0000-4000-b300-0000000000[31-33]
--   Platform:  00000000-0000-4000-b300-0000000000[40-42]
-- =============================================================================

INSERT INTO score_snapshots
  (id, organization_id, node_id,
   composite_score, composite_tier,
   metric_details, cycle_label,
   notes, adjusted_by, adjusted_at,
   recorded_by, created_at)
VALUES

  -- ── Jordan Lee (VP Ops) — three-quarter improvement arc ──────────────────

  -- Q3 2025: originally Concern; adjusted post-quarter by CEO
  ('00000000-0000-4000-b300-000000000001',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   3.1, 'content', '[]',
   'Q3 2025',
   'Adjusted following Q3 post-mortem: two delivery misses attributed to client-side scope changes, not operational failure. Revised from Concern to Content.',
   '00000000-0000-4000-b000-000000000001',   -- adjusted_by: Alex Rivera (CEO)
   NOW() - INTERVAL '160 days',              -- adjusted ~3 weeks after capture
   '00000000-0000-4000-b000-000000000010',   -- recorded_by: Jordan
   NOW() - INTERVAL '180 days'),             -- Q3 captured ~6 months ago

  -- Q4 2025: improving, no adjustment
  ('00000000-0000-4000-b300-000000000002',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   3.3, 'content', '[]',
   'Q4 2025',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000010',
   NOW() - INTERVAL '90 days'),

  -- Q1 2026: effective — delivery fulfillment recovered
  ('00000000-0000-4000-b300-000000000003',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   3.9, 'effective', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000010',
   NOW() - INTERVAL '7 days'),


  -- ── Morgan Kim (CFO) — effective → concern (DSO spike) → effective ────────

  -- Q3 2025: effective — pre-AR issue
  ('00000000-0000-4000-b300-000000000010',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   3.8, 'effective', '[]',
   'Q3 2025',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000030',   -- recorded_by: Morgan
   NOW() - INTERVAL '180 days'),

  -- Q4 2025: concern — DSO spiked to 58 days
  ('00000000-0000-4000-b300-000000000011',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   2.9, 'concern', '[]',
   'Q4 2025',
   'DSO climbed to 58 days following AR process gap in two enterprise accounts. Revenue Forecast Accuracy also impacted by uncommitted pipeline changes in Sales CRM.',
   NULL, NULL,
   '00000000-0000-4000-b000-000000000030',
   NOW() - INTERVAL '90 days'),

  -- Q1 2026: effective — AR aging resolved
  ('00000000-0000-4000-b300-000000000012',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   3.7, 'effective', '[]',
   'Q1 2026',
   'AR aging resolved; DSO returned to 41 days. Forecast accuracy improved following new pipeline commit process agreed with Sales.',
   NULL, NULL,
   '00000000-0000-4000-b000-000000000030',
   NOW() - INTERVAL '7 days'),


  -- ── Sam Patel (VP Engineering) — recorded by Chief of Staff ──────────────
  -- Carlos captured this 2 days before cycle deadline on CEO's behalf.

  ('00000000-0000-4000-b300-000000000020',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000020',
   3.4, 'content', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000080',   -- recorded_by: Carlos Mendez (Chief of Staff)
   NOW() - INTERVAL '2 days'),


  -- ── Casey Chen (VP Sales) ─────────────────────────────────────────────────

  ('00000000-0000-4000-b300-000000000030',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000040',
   3.1, 'content', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000040',
   NOW() - INTERVAL '7 days'),


  -- ── Finance Directors — three-way spread to show CFO review variance ─────

  -- Rory Langston (Accounting) — effective; audit findings at 1, close cycle at 5 days
  ('00000000-0000-4000-b300-000000000031',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000031',
   3.8, 'effective', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000030',   -- recorded_by: Morgan (CFO)
   NOW() - INTERVAL '7 days'),

  -- Frankie Novak (FP&A) — content; solid forecasting but room to improve
  ('00000000-0000-4000-b300-000000000032',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000032',
   3.3, 'content', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000030',
   NOW() - INTERVAL '7 days'),

  -- Dakota Webb (Treasury) — concern; cash runway planning under pressure
  ('00000000-0000-4000-b300-000000000033',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000033',
   2.7, 'concern', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000030',
   NOW() - INTERVAL '7 days'),


  -- ── Platform Engineering Managers — Director Hayden sees performance spread

  -- Cameron Vega (Platform Team) — effective; strong deployment reliability
  ('00000000-0000-4000-b300-000000000040',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   3.8, 'effective', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000021',   -- recorded_by: Hayden Park
   NOW() - INTERVAL '7 days'),

  -- Ashton Cruz (Backend Team) — alarm; triggers Director conversation
  ('00000000-0000-4000-b300-000000000041',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000212',
   1.9, 'alarm', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000021',
   NOW() - INTERVAL '7 days'),

  -- Peyton Lam (Frontend Team) — content; metrics submitted, calibration in progress
  ('00000000-0000-4000-b300-000000000042',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000213',
   3.2, 'content', '[]',
   'Q1 2026',
   NULL, NULL, NULL,
   '00000000-0000-4000-b000-000000000021',
   NOW() - INTERVAL '7 days');
