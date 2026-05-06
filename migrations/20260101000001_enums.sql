-- =============================================================================
-- Migration 001: Enum Types
-- Domain: Type definitions
--
-- All PostgreSQL enum types used across the schema. These must be created
-- before any table that references them.
-- =============================================================================

-- Tier assessment levels (quintile framework)
CREATE TYPE tier_level AS ENUM (
  'alarm', 'concern', 'content', 'effective', 'optimized'
);

-- Organization membership roles
-- owner:        Full control including org settings and role assignment
-- system_admin: Delegated management (snapshots, metrics, cycles) without hierarchy position
-- hr_admin:     HR leadership — member management, compliance exports, inquiry visibility
-- editor:       Hierarchy-gated metric and snapshot operations
-- participant:  Active contributor — own goals, performance data, metric submission
-- viewer:       Read-only access to reports and hierarchy
CREATE TYPE org_role AS ENUM (
  'owner', 'system_admin', 'hr_admin', 'editor', 'participant', 'viewer'
);

-- Hierarchy node classifications
CREATE TYPE node_type AS ENUM (
  'executive_leader', 'department', 'team', 'individual'
);

-- Review cycle frequency
CREATE TYPE cycle_cadence AS ENUM (
  'monthly', 'quarterly'
);

-- How a metric is measured (determines UI rendering and data capture)
CREATE TYPE measurement_type AS ENUM (
  'numeric', 'percentage', 'currency', 'binary', 'scale',
  'milestone', 'checklist', 'range', 'qualitative'
);

-- Metric classification by time orientation
CREATE TYPE indicator_type AS ENUM (
  'health', 'leading', 'lagging'
);

-- Where the metric originated
CREATE TYPE metric_origin AS ENUM (
  'regulatory', 'board', 'superior_assigned', 'co_authored', 'self_defined'
);

-- Threshold negotiation state machine
CREATE TYPE threshold_resolution AS ENUM (
  'draft', 'aligned', 'leader_accepted', 'superior_accepted', 'committed'
);

-- Cadence for performance measurement (superset of cycle_cadence)
CREATE TYPE performance_cadence AS ENUM (
  'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'
);

-- Inquiry classifications
CREATE TYPE inquiry_type AS ENUM (
  'self', 'peer'
);

CREATE TYPE inquiry_status AS ENUM (
  'filed', 'under_review', 'resolved', 'dismissed'
);

CREATE TYPE challenge_type AS ENUM (
  'threshold', 'weight', 'definition', 'measurement'
);

CREATE TYPE resolution_action AS ENUM (
  'adjusted', 'no_change', 'deferred'
);

-- Goal management
CREATE TYPE goal_priority AS ENUM (
  'low', 'medium', 'high'
);

CREATE TYPE goal_status AS ENUM (
  'defined', 'in_progress', 'completed', 'deferred'
);

-- Goal classification by time orientation and purpose
CREATE TYPE goal_type AS ENUM (
  'strategic',     -- long-term organizational direction
  'operational',   -- day-to-day operational health
  'developmental', -- skill/capability growth
  'compliance'     -- regulatory, legal, board mandates
);

-- How a cross-goal dependency should be interpreted
CREATE TYPE goal_dependency_type AS ENUM (
  'blocks',    -- this goal cannot progress until the dependency is met
  'informs',   -- this goal's outcome shapes decisions on the dependent goal
  'supports'   -- this goal contributes to but does not gate the dependent goal
);

-- How a goal came to exist on a node
CREATE TYPE goal_origin AS ENUM (
  'self_created',       -- user created the goal themselves
  'cascaded',           -- goal was cascaded down from a parent node's goal
  'superior_assigned'   -- goal was directly assigned by a superior
);

-- Audit log classifications
CREATE TYPE audit_entity_type AS ENUM (
  'metric', 'threshold', 'weight', 'score', 'inquiry',
  'organization', 'user', 'node'
);

CREATE TYPE audit_action AS ENUM (
  'created', 'updated', 'deleted', 'approved', 'filed',
  'resolved', 'dismissed', 'deactivated', 'bound', 'unbound'
);

-- Peer visibility levels (controls what same-level peers see of each other)
CREATE TYPE peer_visibility AS ENUM (
  'score_only', 'metrics', 'full'
);
