-- =============================================================================
-- Seed 06: Inquiries and Comments
-- Depends on: seeds 02–05, migration 20260101000006_inquiries.sql
--
-- Two resolved inquiries and their five associated comments.
--
-- Nina's self-inquiry targets her own Incident Frequency Rate metric.
-- Resolution moved her composite score from Concern to Effective (visible
-- in the two Nina score snapshots from seed 05).
--
-- James's peer inquiry targets Rachel's Lead Quality Score as the root cause,
-- with his own Win Rate as the affected metric. Resolution tightened Rachel's
-- lead definition and recalibrated James's threshold.
--
-- Both inquiries are resolved by Hans (authority on his CEO node).
-- Comment IDs are generated (deleted by CASCADE when inquiry is deleted).
--
-- Timestamps are relative to seed time for consistent demo presentation.
-- =============================================================================

INSERT INTO inquiries
  (id, organization_id, inquiry_type, status,
   filed_by, filed_by_node_id,
   target_metric_id, affected_metric_id,
   authority_id, authority_node_id,
   challenge_type, rationale, resolution_summary, resolution_action,
   resolved_at, resolved_by, filed_at)
VALUES

  -- ── Nina's self-inquiry — threshold recalibration ─────────────────────────
  -- Filed 21 days ago, resolved 14 days ago.
  -- Target = affected = Incident Frequency Rate (self-inquiry, same metric).
  (
    '00000000-0000-4000-a000-000000002001',
    '00000000-0000-4000-a000-000000000010',
    'self', 'resolved',

    '00000000-0000-4000-a000-000000000005',   -- filed_by: Nina
    '00000000-0000-4000-a000-000000000104',   -- filed_by_node_id: Nina's node

    '00000000-0000-4000-a000-000000001041',   -- target_metric_id: IFR
    '00000000-0000-4000-a000-000000001041',   -- affected_metric_id: IFR (same)

    '00000000-0000-4000-a000-000000000001',   -- authority_id: Hans
    '00000000-0000-4000-a000-000000000100',   -- authority_node_id: Hans's node

    'threshold',
    'The incident frequency rate threshold was calibrated against an industry benchmark from 2020 that assumes a crew mix and project type no longer representative of our current operations. Our projects have shifted toward renovation and retrofit work with inherently different risk profiles. Requesting recalibration against updated OSHA data for our current project categories.',
    'Threshold recalibrated using current OSHA benchmarks for renovation/retrofit work. The updated threshold reflects actual operational risk profile. Score moved from Concern to Content based on accurate measurement.',
    'adjusted',

    NOW() - INTERVAL '14 days',              -- resolved_at
    '00000000-0000-4000-a000-000000000001',   -- resolved_by: Hans
    NOW() - INTERVAL '21 days'               -- filed_at
  ),

  -- ── James's peer inquiry — lead quality → win rate ────────────────────────
  -- Filed 18 days ago, resolved 7 days ago.
  -- Target = Rachel's Lead Quality Score (root cause).
  -- Affected = James's Win Rate (consequence).
  (
    '00000000-0000-4000-a000-000000002002',
    '00000000-0000-4000-a000-000000000010',
    'peer', 'resolved',

    '00000000-0000-4000-a000-000000000004',   -- filed_by: James
    '00000000-0000-4000-a000-000000000103',   -- filed_by_node_id: James's node

    '00000000-0000-4000-a000-000000001024',   -- target_metric_id: Rachel's Lead Quality Score
    '00000000-0000-4000-a000-000000001031',   -- affected_metric_id: James's Win Rate

    '00000000-0000-4000-a000-000000000001',   -- authority_id: Hans
    '00000000-0000-4000-a000-000000000100',   -- authority_node_id: Hans's node

    'threshold',
    'Win rate has been at Concern for six weeks. Analysis shows leads meeting Rachel''s current qualified-lead definition are converting at 23%, while my win rate threshold was set assuming 40% conversion of qualified leads. The gap is caused by the definition of "qualified" being too broad, not by sales execution. Requesting review of the lead quality threshold definition and corresponding adjustment to my win rate target.',
    'Both metrics adjusted. Rachel''s lead quality threshold tightened to require budget confirmation and timeline commitment before marking as qualified. James''s win rate threshold recalibrated to 30% conversion baseline, reflecting the improved but still selective lead pipeline. Both changes documented and approved.',
    'adjusted',

    NOW() - INTERVAL '7 days',               -- resolved_at
    '00000000-0000-4000-a000-000000000001',   -- resolved_by: Hans
    NOW() - INTERVAL '18 days'               -- filed_at
  );


-- ===========================================================================
-- INQUIRY COMMENTS
-- ===========================================================================

INSERT INTO inquiry_comments (inquiry_id, author_id, body, created_at)
VALUES

  -- ── Nina's inquiry — 2 comments ───────────────────────────────────────────

  -- Comment 1: Nina, one day after filing
  ('00000000-0000-4000-a000-000000002001',
   '00000000-0000-4000-a000-000000000005',
   'Attached updated OSHA benchmark data for renovation/retrofit category. Our current IFR of 2.1 places us 35% below the updated industry average for our project type.',
   NOW() - INTERVAL '20 days'),

  -- Comment 2: Hans, at resolution
  ('00000000-0000-4000-a000-000000002001',
   '00000000-0000-4000-a000-000000000001',
   'Reviewed the data. The 2020 benchmarks were clearly mismatched for our current project mix. Approving the recalibration. Updated thresholds will take effect this cycle.',
   NOW() - INTERVAL '14 days'),

  -- ── James's inquiry — 3 comments ──────────────────────────────────────────

  -- Comment 1: James, one day after filing
  ('00000000-0000-4000-a000-000000002002',
   '00000000-0000-4000-a000-000000000004',
   'Conversion analysis attached. Of 47 leads marked as qualified in Q4, only 11 converted to signed contracts. The definition of qualified needs to include budget confirmation at minimum.',
   NOW() - INTERVAL '17 days'),

  -- Comment 2: Rachel, three days after filing
  ('00000000-0000-4000-a000-000000002002',
   '00000000-0000-4000-a000-000000000003',
   'Fair point. The current definition was set before we tightened our bid criteria. I agree that budget confirmation and timeline commitment should be required before a lead is marked qualified.',
   NOW() - INTERVAL '15 days'),

  -- Comment 3: Hans, at resolution
  ('00000000-0000-4000-a000-000000002002',
   '00000000-0000-4000-a000-000000000001',
   'Both adjustments approved. Rachel updates lead quality definition this week. James''s win rate threshold recalibrated to 30% conversion baseline. This is exactly how the system is supposed to surface cross-functional dependencies.',
   NOW() - INTERVAL '7 days');
