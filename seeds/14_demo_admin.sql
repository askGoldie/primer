-- =============================================================================
-- Seed 14: Demo admin
-- Depends on: seeds/02_users.sql
--
-- Promotes the demo CEO (Hans Ruber, demo@primer.company) to is_admin = TRUE
-- so an evaluator signed in via the EvaluationModePanel button can see the
-- admin-only surfaces (settings, audit log). Scoped to a single fixed UUID
-- so it never affects customer-created accounts.
--
-- EVALUATION MODE — delete this file before going to production along with
-- src/routes/auth/demo-login/ and src/routes/auth/login/EvaluationModePanel.svelte.
-- =============================================================================

UPDATE users
SET is_admin = TRUE
WHERE id = '00000000-0000-4000-a000-000000000001';
