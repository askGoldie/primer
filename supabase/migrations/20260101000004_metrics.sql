-- =============================================================================
-- Migration 004: Metrics
-- Domain: Framework core
--
-- The operational heart of the quintile framework. Each hierarchy node (leader)
-- has 3-7 metrics with five-tier threshold calibration and percentage weights.
--
-- Includes the performance_logs table, which captures immutable measured values
-- per metric per period. Customers connect their operational systems to populate
-- this table.
-- =============================================================================

-- Core metric definition owned by a hierarchy node.
--
-- submitted_at / submitted_by: the "submit for review" step that completes
--   the two-party ownership model:
--     Draft        submitted_at IS NULL,  approved_at IS NULL
--     Submitted    submitted_at NOT NULL, approved_at IS NULL   (employee ✓)
--     Approved     approved_at NOT NULL                         (employee ✓ + manager ✓)
--
-- performance_cadence: per-metric measurement frequency. When NULL falls back
--   to the organization cycle_cadence.
--
-- locked_by_snapshot_id: FK to score_snapshots — added via ALTER TABLE in
--   migration 005, after score_snapshots is defined.
CREATE TABLE metrics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id              UUID NOT NULL REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  assigned_by          UUID NOT NULL REFERENCES users(id),
  name                 TEXT NOT NULL,
  description          TEXT,
  measurement_type     measurement_type NOT NULL,
  measurement_config   JSONB,
  indicator_type       indicator_type NOT NULL DEFAULT 'health',
  weight               INTEGER,
  current_tier         tier_level,
  current_value        JSONB,
  origin               metric_origin NOT NULL,
  origin_detail        TEXT,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  performance_cadence  performance_cadence,
  submitted_at         TIMESTAMPTZ,
  submitted_by         UUID REFERENCES users(id),
  approved_at          TIMESTAMPTZ,
  approved_by          UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN metrics.performance_cadence IS
  'Per-metric measurement cadence. When NULL, falls back to the '
  'organization cycle_cadence. Allows different metrics to be measured '
  'at different frequencies.';

-- Five-tier threshold descriptions per metric with negotiation state
CREATE TABLE metric_thresholds (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id            UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  tier                 tier_level NOT NULL,
  description          TEXT NOT NULL,
  set_by               UUID NOT NULL REFERENCES users(id),
  resolution           threshold_resolution NOT NULL DEFAULT 'draft',
  leader_description   TEXT,
  superior_description TEXT,
  resolution_note      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cycle-by-cycle assessments with leader and reviewer tiers
CREATE TABLE metric_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id     UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES users(id),
  leader_tier   tier_level NOT NULL,
  reviewer_tier tier_level,
  comment       TEXT,
  cycle_label   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable performance log entries.
-- Each row is one measurement of one metric for one period.
--
-- measured_value JSONB mirrors the parent metric measurement_type schema:
--   numeric/percentage/currency/scale: { "value": 42 }
--   binary:                            { "value": true }
--   milestone:                         { "completed": ["m1"], "current": "m2" }
--   checklist:                         { "completed": ["a","b"], "total": 5 }
--   qualitative:                       { "observation": "..." }
--   range:                             { "value": 75 }
CREATE TABLE performance_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id          UUID NOT NULL REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  metric_id        UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,

  -- Period boundaries (inclusive)
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  cadence          performance_cadence NOT NULL,

  -- The actual measured value
  measured_value   JSONB NOT NULL,

  -- The tier this measurement maps to (set by the person recording)
  assessed_tier    tier_level NOT NULL,

  -- Free-text field describing where the data came from
  -- e.g. "SAP ERP", "Salesforce CRM", "Manual entry", "API import"
  data_source      TEXT,

  -- Optional notes about this measurement
  notes            TEXT,

  -- Who recorded the entry
  recorded_by      UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate entries for the same metric + period
  CONSTRAINT uq_performance_log_metric_period
    UNIQUE (metric_id, period_start, period_end)
);

COMMENT ON TABLE performance_logs IS
  'Immutable record of actual measured performance data per metric per period. '
  'Customers connect their operational systems to populate this table.';

COMMENT ON COLUMN performance_logs.measured_value IS
  'JSONB value matching the parent metric measurement_type schema. '
  'Customers map their system outputs into this format.';

COMMENT ON COLUMN performance_logs.data_source IS
  'Free-text tag identifying the source system (e.g. SAP, Salesforce, API). '
  'Helps customers trace measurements back to their operational data.';

-- Indexes for performance_logs query patterns
CREATE INDEX idx_performance_logs_node_id    ON performance_logs(node_id);
CREATE INDEX idx_performance_logs_metric_id  ON performance_logs(metric_id);
CREATE INDEX idx_performance_logs_org_period ON performance_logs(organization_id, period_start DESC);
CREATE INDEX idx_performance_logs_node_period ON performance_logs(node_id, period_start DESC);
