-- =============================================================================
-- Migration 010: Analytics Events
-- Domain: Demo site — admin analytics
--
-- Event tracking tables for the demo site admin dashboard. These capture
-- anonymous narrative flow, account lifecycle, demo usage, purchases, and
-- downloads. Not included in the customer source code package.
-- =============================================================================

-- Anonymous session-based event tracking (narrative flow)
CREATE TABLE narrative_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  event_value TEXT,
  locale      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User lifecycle event tracking
CREATE TABLE account_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID REFERENCES users(id),
  license_id   UUID REFERENCES licenses(id),
  event_type   TEXT NOT NULL,
  error_detail TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Authenticated demo environment event tracking
CREATE TABLE demo_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES users(id),
  event_type  TEXT NOT NULL,
  event_value TEXT,
  locale      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase flow tracking
CREATE TABLE purchase_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     UUID REFERENCES users(id),
  customer_email TEXT,
  event_type     TEXT NOT NULL,
  locale         TEXT,
  error_detail   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Source code download tracking
CREATE TABLE download_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES users(id),
  license_id   UUID NOT NULL REFERENCES licenses(id),
  version      TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  error_detail TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
