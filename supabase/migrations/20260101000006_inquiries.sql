-- =============================================================================
-- Migration 006: Inquiries
-- Domain: Inquiry process
--
-- The formal challenge mechanism. Leaders file self-inquiries or peer-inquiries
-- to challenge metrics, thresholds, weights, or measurement definitions.
-- Authority (parent node's bound user) resolves the dispute.
-- =============================================================================

CREATE TABLE inquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inquiry_type      inquiry_type NOT NULL,
  status            inquiry_status NOT NULL DEFAULT 'filed',
  filed_by          UUID NOT NULL REFERENCES users(id),
  filed_by_node_id  UUID NOT NULL REFERENCES org_hierarchy_nodes(id),
  target_metric_id  UUID NOT NULL REFERENCES metrics(id),
  affected_metric_id UUID NOT NULL REFERENCES metrics(id),
  authority_id      UUID NOT NULL REFERENCES users(id),
  authority_node_id UUID NOT NULL REFERENCES org_hierarchy_nodes(id),
  challenge_type    challenge_type NOT NULL,
  rationale         TEXT NOT NULL,
  resolution_summary TEXT,
  resolution_action  resolution_action,
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID REFERENCES users(id),
  filed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inquiry_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
