-- =============================================================================
-- Primer / DavidPM — Seed Data
-- File: supabase/seed.sql
--
-- Run AFTER 20260101000000_initial_schema.sql.
-- Paste into the Supabase SQL editor or run via:
--   psql $DATABASE_URL -f supabase/seed.sql
--
-- What this seeds:
--
--   1. Demo org — "Meridian Construction" (5 users, hierarchy, metrics,
--      thresholds, score snapshots, inquiries, comments).
--      These are the characters from the narrative walkthrough.
--
--   2. Platform org — "Primer Internal" (69-person org tree: 1 CEO → 4 VPs →
--      16 Directors → 48 ICs).  Visitors browse this tree at /platform and
--      experience the system from any persona's perspective.
--
-- NOTE: These rows are inserted into the `public.users` application profile
-- table only — NOT into Supabase `auth.users`.  The platform personas are
-- fictional test accounts used exclusively via the `primer_perspective` cookie
-- mechanism; they are not real login accounts.
--
-- Real visitor accounts are created through Supabase Auth (signUp) and have
-- their own `public.users` profile row created at registration time.
--
-- =============================================================================

-- Each domain is seeded in a separate file that mirrors the migration order.
-- Files are included relative to this file's location using \ir.
--
-- Apply order:
--   02_users.sql         — Meridian characters + Primer Internal personas
--   03_organizations.sql — orgs, members, hierarchy nodes
--   04_metrics.sql       — metrics + Hans's threshold calibrations
--   05_scores.sql        — composite score snapshots
--   06_inquiries.sql     — resolved inquiries + comments
--
-- NOTE: Before running this seed, the five Meridian Construction Supabase
-- Auth accounts (Hans, Marcus, Rachel, James, Nina) must already exist.
-- See docs/supabase-auth-setup.md for instructions.

\ir seeds/02_users.sql
\ir seeds/03_organizations.sql
\ir seeds/04_metrics.sql
\ir seeds/05_scores.sql
\ir seeds/06_inquiries.sql
