-- =============================================================================
-- Migration 007: Audit Log
-- Domain: Change history
--
-- Captures change history for metrics, thresholds, weights, scores, and
-- inquiries. Supports both current-state queries and historical reconstruction.
-- =============================================================================

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type     audit_entity_type NOT NULL,
  entity_id       UUID NOT NULL,
  action          audit_action NOT NULL,
  changed_by      UUID NOT NULL REFERENCES users(id),
  previous_value  JSONB,
  new_value       JSONB,
  context         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
