-- =============================================================================
-- Seed 05: Score Snapshots
-- Depends on: seeds 02–04, migration 20260101000005_scores.sql
--
-- Seven point-in-time composite scores for the five Meridian Construction
-- leaders. Snapshots are immutable records — they are never updated, only
-- inserted or deleted (on reset).
--
-- Hans has three snapshots showing upward progression over two quarters.
-- Nina has two snapshots showing the jump from Concern to Effective after
-- her self-inquiry resolved. The remaining three leaders each have one.
--
-- metric_details is an empty JSON array for all seed rows; detailed
-- per-metric breakdowns are not pre-populated.
--
-- Timestamps are expressed relative to seed time so the history always
-- looks recent regardless of when the seed is applied.
--
-- UUID conventions (snapshots):
--   Hans:   00000000-0000-4000-a000-00000000300x
--   Marcus: 00000000-0000-4000-a000-0000000030(1x)
--   Rachel: 00000000-0000-4000-a000-0000000030(2x)
--   James:  00000000-0000-4000-a000-0000000030(3x)
--   Nina:   00000000-0000-4000-a000-0000000030(4x)
-- =============================================================================

INSERT INTO score_snapshots
  (id, organization_id, node_id, composite_score, composite_tier,
   metric_details, cycle_label, recorded_by, created_at)
VALUES

  -- ── Hans Ruber — three snapshots showing upward progression ──────────────

  ('00000000-0000-4000-a000-000000003001',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000100',
   3.2, 'content', '[]',
   'Q3 2025',
   '00000000-0000-4000-a000-000000000001',
   NOW() - INTERVAL '60 days'),

  ('00000000-0000-4000-a000-000000003002',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000100',
   3.4, 'content', '[]',
   'Q4 2025',
   '00000000-0000-4000-a000-000000000001',
   NOW() - INTERVAL '30 days'),

  ('00000000-0000-4000-a000-000000003003',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000100',
   3.6, 'effective', '[]',
   'Q1 2026',
   '00000000-0000-4000-a000-000000000001',
   NOW()),

  -- ── Marcus Chen — incomplete stack pulling score to Content ───────────────

  ('00000000-0000-4000-a000-000000003011',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000101',
   3.3, 'content', '[]',
   'Q1 2026',
   '00000000-0000-4000-a000-000000000002',
   NOW()),

  -- ── Rachel Torres — Effective composite ──────────────────────────────────

  ('00000000-0000-4000-a000-000000003021',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000102',
   3.8, 'effective', '[]',
   'Q1 2026',
   '00000000-0000-4000-a000-000000000003',
   NOW()),

  -- ── James Park — Win Rate at Concern dragging composite below peers ───────

  ('00000000-0000-4000-a000-000000003031',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000103',
   3.1, 'content', '[]',
   'Q1 2026',
   '00000000-0000-4000-a000-000000000004',
   NOW()),

  -- ── Nina Okafor — two snapshots illustrating self-inquiry resolution ───────
  -- Before: Concern tier. After recalibration: Effective tier.

  ('00000000-0000-4000-a000-000000003041',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000104',
   2.8, 'concern', '[]',
   'Q4 2025',
   '00000000-0000-4000-a000-000000000005',
   NOW() - INTERVAL '30 days'),

  ('00000000-0000-4000-a000-000000003042',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000104',
   3.6, 'effective', '[]',
   'Q1 2026',
   '00000000-0000-4000-a000-000000000005',
   NOW());
