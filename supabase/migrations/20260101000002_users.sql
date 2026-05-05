-- =============================================================================
-- Migration 002: Users
-- Domain: Identity
--
-- Application profile table. `id` matches auth.users.id (Supabase) or is a
-- standalone UUID (customer). `password_hash` is NULL for Supabase-auth users;
-- populated for custom auth deployments.
--
-- NOTE: No FK to auth.users so the schema stays provider-agnostic for
-- customer deployments.
-- =============================================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT,                          -- NULL for Supabase-auth users
  name            TEXT NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'en',
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  deactivated_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
