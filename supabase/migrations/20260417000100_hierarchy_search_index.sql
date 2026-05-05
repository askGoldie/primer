-- =============================================================================
-- Migration 013: Hierarchy Search Index
-- Domain: Hierarchy builder UX (large-org search)
--
-- Enables server-side fuzzy search (typeahead) on the hierarchy builder's
-- canvas view for organizations larger than ~1000 nodes, where a client-side
-- Array.filter() over the full node list starts to exceed the 100 ms
-- typeahead budget that research on search UX considers the perceptible
-- latency threshold.
--
-- Uses PostgreSQL's pg_trgm extension for trigram-based similarity search,
-- which supports both prefix matches ("sal" → "Sales") and mid-string
-- matches ("ops" → "Operations") — critical for the "users search for any
-- substring" expectation most typeahead UIs establish.
--
-- Safe to apply even on small orgs: the indexes are GIN-based and only
-- consume meaningful space / write cost when there are many rows. Empty
-- or small hierarchies pay essentially zero for these indexes.
--
-- @see /docs/hierarchy-system-reference.md §2.1 for the underlying schema
-- =============================================================================

-- pg_trgm ships with Postgres 9.1+ and is available on every provider we
-- target (Supabase, Neon, Railway, RDS, self-hosted). CREATE EXTENSION
-- is idempotent, so re-running the migration is safe.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN + gin_trgm_ops is the recommended index type for ILIKE / similarity
-- queries on text columns. We cover both `name` (always present) and
-- `title` (often present for department/individual nodes — e.g. "CFO",
-- "Sales Manager") so typeahead can match on either.
CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_name_trgm
  ON org_hierarchy_nodes USING gin (name gin_trgm_ops);

-- Partial index: skip rows where title is NULL. Saves write overhead on
-- every hierarchy insert (most nodes have NULL titles) without losing
-- any useful coverage — a NULL title has nothing to match against anyway.
CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_title_trgm
  ON org_hierarchy_nodes USING gin (title gin_trgm_ops)
  WHERE title IS NOT NULL;

-- Composite org-scoped index on lowercased name helps the common
-- "list all matches in MY org ordered by similarity" query pattern,
-- letting the planner avoid a filter step after the trigram lookup.
-- Lower(name) so queries can be `WHERE organization_id = $1 AND lower(name) ILIKE $2`
-- and hit this index directly.
CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_org_lower_name
  ON org_hierarchy_nodes (organization_id, lower(name));
