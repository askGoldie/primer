-- =============================================================================
-- Migration 009: Licenses
-- Domain: Demo site — purchase tracking
--
-- Maps users to purchases for the demo site. Not used in customer deployments.
-- =============================================================================

CREATE TABLE licenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
