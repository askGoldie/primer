-- ============================================================================
-- ADDON MIGRATION — purchase_events contact fields
-- ============================================================================
--
-- This file is an addon to the existing migration set (20260101000001 through
-- 20260101000011). It is designed to be folded into the base migrations at a
-- later date — specifically into 20260101000010_analytics.sql where the
-- purchase_events table is defined.
--
-- Until that fold-in happens, this file can run standalone against a database
-- that already has the base schema applied.
--
-- Purpose
-- -------
-- The dashboard purchase form is being reworked so a visitor can choose
-- between "buy a license" and "request a meeting," and so the DavidPM sales
-- team can attribute incoming requests to a named sales agent. The industry
-- and company-size dropdowns are being removed — neither fit the source-code
-- license model and neither was being persisted anyway.
--
-- Schema changes
-- --------------
--   1. purchase_events.request_type  — 'purchase' | 'meeting'
--        Captures whether the visitor wants to buy now or schedule a call.
--        Defaults to 'purchase' so historical rows keep their meaning.
--
--   2. purchase_events.sales_agent   — free-text agent name / slug
--        Optional. Recorded when the visitor picks a named agent from the
--        form (or when a marketing campaign preselects one via querystring
--        in future work). NULL for self-serve inquiries.
--
-- Both fields are additive and nullable-or-defaulted so this migration is
-- safe to apply to a live database with existing purchase_events rows.
-- ============================================================================

ALTER TABLE purchase_events
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'purchase'
    CHECK (request_type IN ('purchase', 'meeting')),
  ADD COLUMN IF NOT EXISTS sales_agent  TEXT;

COMMENT ON COLUMN purchase_events.request_type IS
  'Whether the visitor wanted to buy (''purchase'') or schedule a sales call (''meeting''). Set by the dashboard inquiry form.';

COMMENT ON COLUMN purchase_events.sales_agent IS
  'Optional sales agent attribution. Free-text name or slug captured from the form or a campaign querystring. NULL for unattributed self-serve inquiries.';

-- Index to support "inquiries by agent" reporting in the admin dashboard.
CREATE INDEX IF NOT EXISTS purchase_events_sales_agent_idx
  ON purchase_events (sales_agent)
  WHERE sales_agent IS NOT NULL;
