-- =============================================================================
-- Migration 011: Indexes
-- Domain: Performance
--
-- All performance indexes for common query patterns. Separated from table
-- definitions so the structural migrations stay clean and readable.
-- =============================================================================

-- Sessions
CREATE INDEX idx_sessions_user_id              ON sessions(user_id);

-- Organization members
CREATE INDEX idx_org_members_org_id            ON org_members(organization_id);
CREATE INDEX idx_org_members_user_id           ON org_members(user_id);

-- Hierarchy nodes
CREATE INDEX idx_hierarchy_nodes_org_id        ON org_hierarchy_nodes(organization_id);
CREATE INDEX idx_hierarchy_nodes_parent_id     ON org_hierarchy_nodes(parent_id);
CREATE INDEX idx_hierarchy_nodes_user_id       ON org_hierarchy_nodes(user_id);

-- Metrics
CREATE INDEX idx_metrics_org_id               ON metrics(organization_id);
CREATE INDEX idx_metrics_node_id              ON metrics(node_id);

-- Metric thresholds
CREATE INDEX idx_metric_thresholds_metric     ON metric_thresholds(metric_id);

-- Score snapshots
CREATE INDEX idx_score_snapshots_node         ON score_snapshots(node_id);

-- Inquiries
CREATE INDEX idx_inquiries_org_id             ON inquiries(organization_id);
CREATE INDEX idx_inquiry_comments_inquiry     ON inquiry_comments(inquiry_id);

-- Audit log
CREATE INDEX idx_audit_log_org_id             ON audit_log(organization_id);

-- Goals
CREATE INDEX idx_org_goals_goal_type          ON org_goals(goal_type);
CREATE INDEX idx_org_goals_target_tier        ON org_goals(target_tier) WHERE target_tier IS NOT NULL;
CREATE INDEX idx_org_goals_actual_tier        ON org_goals(actual_tier) WHERE actual_tier IS NOT NULL;
CREATE INDEX idx_org_goals_due_date           ON org_goals(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_org_goals_source             ON org_goals(source_goal_id) WHERE source_goal_id IS NOT NULL;

-- Goal dependencies
CREATE INDEX idx_goal_dependencies_goal_id    ON goal_dependencies(goal_id);
CREATE INDEX idx_goal_dependencies_depends_on ON goal_dependencies(depends_on_goal_id);

-- Goal adjustments (audit log)
CREATE INDEX idx_goal_adjustments_goal_id     ON goal_adjustments(goal_id);
CREATE INDEX idx_goal_adjustments_adjusted_by ON goal_adjustments(adjusted_by);

-- Placement requests (pending only — most lookups filter for unresolved)
CREATE INDEX idx_placement_requests_org_pending
  ON placement_requests(organization_id)
  WHERE resolved_at IS NULL;
