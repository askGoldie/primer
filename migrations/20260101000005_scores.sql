-- =============================================================================
-- Migration 005: Scores
-- Domain: Scoring
--
-- Immutable point-in-time composite scores. Each snapshot captures the
-- weighted composite tier for a hierarchy node at a specific cycle.
--
-- Also finalises two back-references that can only be expressed after
-- score_snapshots exists:
--   - metrics.locked_by_snapshot_id  (snapshot → lock a metric's edit window)
--   - org_goals.snapshot_id          (snapshot → tie a goal to a cycle)
-- =============================================================================

CREATE TABLE score_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id          UUID NOT NULL REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  composite_score  REAL NOT NULL,
  composite_tier   tier_level NOT NULL,
  metric_details   JSONB NOT NULL,
  cycle_label      TEXT,
  notes            TEXT,
  adjusted_by      UUID REFERENCES users(id),
  adjusted_at      TIMESTAMPTZ,
  recorded_by      UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN score_snapshots.notes IS
  'Optional notes from the CEO/leader about this snapshot period.';

COMMENT ON COLUMN score_snapshots.adjusted_by IS
  'If the snapshot was adjusted after capture, records who made the change.';

COMMENT ON COLUMN score_snapshots.adjusted_at IS
  'Timestamp of the most recent post-capture adjustment.';

-- When set, the metric is frozen because a snapshot was captured.
-- Only a CEO/leader can clear this by starting a new cycle.
-- Employees cannot edit locked metrics.
ALTER TABLE metrics
  ADD COLUMN locked_by_snapshot_id UUID REFERENCES score_snapshots(id);

COMMENT ON COLUMN metrics.locked_by_snapshot_id IS
  'When set, the metric is frozen because a snapshot was captured. '
  'Only a CEO/leader can clear this by starting a new cycle. '
  'Employees cannot edit locked metrics.';

-- Optionally tie a goal to a specific score snapshot for point-in-time records
ALTER TABLE org_goals
  ADD COLUMN snapshot_id UUID REFERENCES score_snapshots(id);
