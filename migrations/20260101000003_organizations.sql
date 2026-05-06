-- =============================================================================
-- Migration 003: Organizations
-- Domain: Tenancy and structure
--
-- Creates the four hierarchy-system tables adapted for the Primer context:
-- organizations, org_members, org_hierarchy_nodes, and org_goals.
--
-- These form the structural foundation that all operational data (metrics,
-- scores, inquiries) attaches to via hierarchy node references.
-- =============================================================================

-- Top-level tenant entity
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  industry        TEXT,
  cycle_cadence   cycle_cadence NOT NULL DEFAULT 'quarterly',
  inquiry_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role-based membership with soft-delete via removed_at
CREATE TABLE org_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  role            org_role NOT NULL,
  assigned_by     UUID REFERENCES users(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at      TIMESTAMPTZ,
  removal_reason  TEXT
);

-- Self-referencing organizational tree structure
CREATE TABLE org_hierarchy_nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id       UUID,                          -- self-referencing FK added below
  node_type       node_type NOT NULL,
  name            TEXT NOT NULL,
  title           TEXT,
  description     TEXT,
  user_id         UUID REFERENCES users(id),
  position_x      REAL NOT NULL DEFAULT 0,
  position_y      REAL NOT NULL DEFAULT 0,
  is_collapsed    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  peer_visibility peer_visibility NOT NULL DEFAULT 'score_only',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self-referencing FK for parent-child hierarchy
ALTER TABLE org_hierarchy_nodes
  ADD CONSTRAINT org_hierarchy_nodes_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES org_hierarchy_nodes(id);

-- Goals with SWOT analysis attached to nodes or the organization.
--
-- goal_type: strategic | operational | developmental | compliance
-- target_tier / actual_tier: quintile-aligned achievement tracking
-- target_value / actual_value: structured JSONB matching measurement_type shapes
-- goal_origin: self_created | cascaded | superior_assigned
-- source_goal_id: the parent goal when goal_origin = 'cascaded' (SET NULL on delete)
-- assigned_by: who created or delegated this goal
-- due_date: optional deadline
--
-- NOTE: snapshot_id (FK to score_snapshots) is added via ALTER TABLE in
-- migration 005, after score_snapshots is defined.
CREATE TABLE org_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hierarchy_node_id UUID REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  priority          goal_priority NOT NULL DEFAULT 'medium',
  status            goal_status NOT NULL DEFAULT 'defined',
  goal_type         goal_type NOT NULL DEFAULT 'operational',
  target_tier       tier_level,
  actual_tier       tier_level,
  target_value      JSONB,
  actual_value      JSONB,
  due_date          DATE,
  assigned_by       UUID REFERENCES users(id),
  goal_origin       goal_origin NOT NULL DEFAULT 'self_created',
  source_goal_id    UUID REFERENCES org_goals(id) ON DELETE SET NULL,
  swot              JSONB,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cross-goal dependency relationships.
-- Dependencies are broadly defined — a goal can block, inform, or support
-- another goal regardless of which node owns it.
CREATE TABLE goal_dependencies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id             UUID NOT NULL REFERENCES org_goals(id) ON DELETE CASCADE,
  depends_on_goal_id  UUID NOT NULL REFERENCES org_goals(id) ON DELETE CASCADE,
  dependency_type     goal_dependency_type NOT NULL DEFAULT 'supports',
  description         TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate dependency pairs
  CONSTRAINT goal_dependencies_unique UNIQUE (goal_id, depends_on_goal_id),
  -- Prevent self-referencing
  CONSTRAINT goal_dependencies_no_self CHECK (goal_id <> depends_on_goal_id)
);

-- Immutable audit trail for all post-creation goal edits.
-- Each changed field produces one row — granular enough to reconstruct
-- the full edit history of any goal. Leaders cannot silently modify goals;
-- every change is logged with the editor's identity and an optional reason.
CREATE TABLE goal_adjustments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       UUID NOT NULL REFERENCES org_goals(id) ON DELETE CASCADE,
  adjusted_by   UUID NOT NULL REFERENCES users(id),
  field         TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visibility grants: elevated access for specific people (HR, CoS, auditor)
-- A leader can grant a person ancestor-equivalent visibility into a subtree
-- or the entire org, regardless of their position in the hierarchy.
-- scope_node_id = NULL means entire organization.
CREATE TABLE visibility_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grantee_node_id UUID NOT NULL REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  scope_node_id   UUID REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  visibility      peer_visibility NOT NULL DEFAULT 'full',
  granted_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

-- A person should only have one active grant per scope
CREATE UNIQUE INDEX visibility_grants_active_unique
  ON visibility_grants (grantee_node_id, scope_node_id)
  WHERE revoked_at IS NULL;

-- Placement requests: users who have joined but haven't been placed in the
-- hierarchy yet. Resolved by owner, system_admin, or hr_admin in the admin panel.
CREATE TABLE placement_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES users(id)
);
