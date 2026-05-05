-- =============================================================================
-- Seed 13: Performance Logs, Audit Log, Placement Requests — Tier Internal
-- Depends on: seeds 02–12
--
-- Three data categories:
--
--   A. performance_logs
--      Cameron Vega (Platform Team):
--        - On-Call Incident Load (b200-2110): 11 weekly entries showing realistic
--          variance from 0 to 4, including a 3-incident spike mid-period
--        - Deployment Reliability (b200-2111): 3 monthly entries (Jan–Mar 2026)
--      Derek Solís (IC):
--        - Code Review Turnaround (b200-2140): 8 weekly entries; two slow weeks
--          during a March incident crunch (12.3h, 14.1h) then recovery
--        - Documentation Coverage (b200-2141): 4 monthly entries (Dec–Mar);
--          gradual improvement from 62% to 72%
--
--   B. audit_log
--      6 entries covering: threshold update, weight change, snapshot capture,
--      role change, inquiry filed, cycle start — attributed to different actors
--
--   C. placement_requests
--      Aisha Torres — pending (no node, waiting for HR placement)
--      Derek Solís  — resolved 30 days ago (node b100-214 inserted in seed 07)
--
-- performance_logs columns: id, organization_id, node_id, metric_id,
--   period_start, period_end, cadence, measured_value, assessed_tier,
--   data_source, notes, recorded_by, created_at
-- audit_log columns: id, organization_id, entity_type, entity_id, action,
--   changed_by, previous_value, new_value, context, created_at
-- placement_requests columns: id, organization_id, user_id,
--   requested_at, resolved_at, resolved_by
-- =============================================================================


-- =============================================================================
-- A. PERFORMANCE LOGS
-- =============================================================================

INSERT INTO performance_logs
  (id, organization_id, node_id, metric_id,
   period_start, period_end, cadence,
   measured_value, assessed_tier,
   data_source, notes,
   recorded_by, created_at)
VALUES

  -- ── Cameron Vega: On-Call Incident Load (weekly) ──────────────────────────
  -- 11 consecutive weeks; values vary 0–4 to show realistic operational pattern.
  -- Week 5 shows a 3-incident spike that triggers the peer inquiry against Drew.

  ('00000000-0000-4000-b600-000000010001',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-01-19', '2026-01-25', 'weekly',
   '{"value": 1}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '77 days'),

  ('00000000-0000-4000-b600-000000010002',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-01-26', '2026-02-01', 'weekly',
   '{"value": 2}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '70 days'),

  ('00000000-0000-4000-b600-000000010003',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-02-02', '2026-02-08', 'weekly',
   '{"value": 0}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '63 days'),

  ('00000000-0000-4000-b600-000000010004',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-02-09', '2026-02-15', 'weekly',
   '{"value": 2}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '56 days'),

  ('00000000-0000-4000-b600-000000010005',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-02-16', '2026-02-22', 'weekly',
   '{"value": 1}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '49 days'),

  ('00000000-0000-4000-b600-000000010006',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-02-23', '2026-03-01', 'weekly',
   '{"value": 4}', 'alarm',
   'Manual entry', 'Spike: API gateway outage traced to infra deployment rollback (March incident)',
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '42 days'),

  ('00000000-0000-4000-b600-000000010007',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-03-02', '2026-03-08', 'weekly',
   '{"value": 3}', 'concern',
   'Manual entry', 'Continued elevated load; auth service degradation follow-on',
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '35 days'),

  ('00000000-0000-4000-b600-000000010008',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-03-09', '2026-03-15', 'weekly',
   '{"value": 2}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '28 days'),

  ('00000000-0000-4000-b600-000000010009',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-03-16', '2026-03-22', 'weekly',
   '{"value": 1}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '21 days'),

  ('00000000-0000-4000-b600-000000010010',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-03-23', '2026-03-29', 'weekly',
   '{"value": 0}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '14 days'),

  ('00000000-0000-4000-b600-000000010011',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002110',
   '2026-03-30', '2026-04-05', 'weekly',
   '{"value": 2}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '2 days'),


  -- ── Cameron Vega: Deployment Reliability (monthly) ────────────────────────

  ('00000000-0000-4000-b600-000000010020',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002111',
   '2026-01-01', '2026-01-31', 'monthly',
   '{"value": 94.1}', 'content',
   'Deployment pipeline logs', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '67 days'),

  ('00000000-0000-4000-b600-000000010021',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002111',
   '2026-02-01', '2026-02-28', 'monthly',
   '{"value": 97.2}', 'effective',
   'Deployment pipeline logs', NULL,
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '38 days'),

  ('00000000-0000-4000-b600-000000010022',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b200-000000002111',
   '2026-03-01', '2026-03-31', 'monthly',
   '{"value": 91.8}', 'concern',
   'Deployment pipeline logs', 'Reduced by two rollbacks tied to infra instability in March',
   '00000000-0000-4000-b000-000000000211', NOW() - INTERVAL '7 days'),


  -- ── Derek Solís: Code Review Turnaround (weekly) ──────────────────────────
  -- 8 consecutive weeks. Weeks 4–5 (Mar 9–22) show slow turnaround during
  -- incident crunch when Derek was pulled into on-call response.

  ('00000000-0000-4000-b600-000000010030',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-02-09', '2026-02-15', 'weekly',
   '{"value": 4.2}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '56 days'),

  ('00000000-0000-4000-b600-000000010031',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-02-16', '2026-02-22', 'weekly',
   '{"value": 8.7}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '49 days'),

  ('00000000-0000-4000-b600-000000010032',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-02-23', '2026-03-01', 'weekly',
   '{"value": 6.1}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '42 days'),

  ('00000000-0000-4000-b600-000000010033',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-03-02', '2026-03-08', 'weekly',
   '{"value": 5.8}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '35 days'),

  -- Slow weeks during incident crunch
  ('00000000-0000-4000-b600-000000010034',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-03-09', '2026-03-15', 'weekly',
   '{"value": 12.3}', 'concern',
   'Manual entry', 'On-call incident crunch — pulled into P1 response two days this week',
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '28 days'),

  ('00000000-0000-4000-b600-000000010035',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-03-16', '2026-03-22', 'weekly',
   '{"value": 14.1}', 'concern',
   'Manual entry', 'Continued incident follow-up; backlog of review requests building',
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '21 days'),

  -- Recovery
  ('00000000-0000-4000-b600-000000010036',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-03-23', '2026-03-29', 'weekly',
   '{"value": 6.4}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '14 days'),

  ('00000000-0000-4000-b600-000000010037',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002140',
   '2026-03-30', '2026-04-05', 'weekly',
   '{"value": 5.9}', 'effective',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '2 days'),


  -- ── Derek Solís: Documentation Coverage (monthly) ────────────────────────
  -- 4 months of gradual improvement toward the 90% goal.

  ('00000000-0000-4000-b600-000000010040',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002141',
   '2025-12-01', '2025-12-31', 'monthly',
   '{"value": 62}', 'concern',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '97 days'),

  ('00000000-0000-4000-b600-000000010041',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002141',
   '2026-01-01', '2026-01-31', 'monthly',
   '{"value": 68}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '67 days'),

  ('00000000-0000-4000-b600-000000010042',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002141',
   '2026-02-01', '2026-02-28', 'monthly',
   '{"value": 72}', 'content',
   'Manual entry', NULL,
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '38 days'),

  ('00000000-0000-4000-b600-000000010043',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b200-000000002141',
   '2026-03-01', '2026-03-31', 'monthly',
   '{"value": 72}', 'content',
   'Manual entry', 'No change from February; incident crunch consumed documentation sprint time',
   '00000000-0000-4000-b000-000000000092', NOW() - INTERVAL '7 days');


-- =============================================================================
-- B. AUDIT LOG
-- 6 entries covering different actors and event types.
-- entity_type: 'metric' | 'threshold' | 'weight' | 'score' | 'inquiry' | 'organization' | 'user' | 'node'
-- action:      'created' | 'updated' | 'deleted' | 'approved' | 'filed' | 'resolved' | 'dismissed' | 'deactivated' | 'bound' | 'unbound'
-- =============================================================================

INSERT INTO audit_log
  (id, organization_id, entity_type, entity_id, action,
   changed_by, previous_value, new_value, context, created_at)
VALUES

  -- 1. Cycle start — CEO opens Q1 2026
  ('00000000-0000-4000-b600-000000020001',
   '00000000-0000-4000-a000-000000000020',
   'organization',
   '00000000-0000-4000-a000-000000000020',
   'updated',
   '00000000-0000-4000-b000-000000000001',   -- changed_by: Alex Rivera (CEO)
   '{"cycle_label": "Q4 2025", "status": "closed"}',
   '{"cycle_label": "Q1 2026", "status": "open"}',
   'Q1 2026 cycle started — all metrics unlocked for new calibration period',
   NOW() - INTERVAL '45 days'),

  -- 2. Role change — Alex updates Linda Reyes from viewer to editor
  ('00000000-0000-4000-b600-000000020002',
   '00000000-0000-4000-a000-000000000020',
   'user',
   '00000000-0000-4000-b000-000000000070',
   'updated',
   '00000000-0000-4000-b000-000000000001',   -- changed_by: CEO
   '{"role": "viewer"}',
   '{"role": "editor"}',
   'Role updated to enable HR placement request management',
   NOW() - INTERVAL '25 days'),

  -- 3. Weight change — Morgan raises Revenue Forecast Accuracy from 15 to 20
  ('00000000-0000-4000-b600-000000020003',
   '00000000-0000-4000-a000-000000000020',
   'weight',
   '00000000-0000-4000-b200-000000000034',
   'updated',
   '00000000-0000-4000-b000-000000000030',   -- changed_by: Morgan Kim (CFO)
   '{"weight": 15}',
   '{"weight": 20}',
   'Weight increased following Q4 board review — forecast accuracy elevated to primary CFO metric',
   NOW() - INTERVAL '14 days'),

  -- 4. Threshold updated — Reese revises Corrective Action Close Rate Optimized tier
  ('00000000-0000-4000-b600-000000020004',
   '00000000-0000-4000-a000-000000000020',
   'threshold',
   '00000000-0000-4000-b200-000000001202',
   'updated',
   '00000000-0000-4000-b000-000000000012',   -- changed_by: Reese Donovan
   '{"tier": "optimized", "description": "100% of corrective actions closed within agreed timeframe for two consecutive periods"}',
   '{"tier": "optimized", "description": "95%+ of corrective actions closed within agreed timeframe for two consecutive periods, with no critical findings remaining open past 30 days"}',
   'Optimized tier revised per VP Jordan feedback — original 100% threshold not achievable at current team size',
   NOW() - INTERVAL '10 days'),

  -- 5. Inquiry filed — Jordan files peer inquiry against Casey
  ('00000000-0000-4000-b600-000000020005',
   '00000000-0000-4000-a000-000000000020',
   'inquiry',
   '00000000-0000-4000-b500-000000001001',
   'filed',
   '00000000-0000-4000-b000-000000000010',   -- changed_by: Jordan Lee
   NULL,
   '{"inquiry_type": "peer", "status": "filed", "challenge_type": "definition"}',
   'Peer inquiry filed against VP Sales — Delivery Fulfillment Rate affected by Client Commitment Accuracy',
   NOW() - INTERVAL '21 days'),

  -- 6. Score snapshot captured — Carlos records Sam Patel on CEO behalf
  ('00000000-0000-4000-b600-000000020006',
   '00000000-0000-4000-a000-000000000020',
   'score',
   '00000000-0000-4000-b300-000000000020',
   'created',
   '00000000-0000-4000-b000-000000000080',   -- changed_by: Carlos Mendez (Chief of Staff)
   NULL,
   '{"node_id": "00000000-0000-4000-b100-000000000020", "composite_tier": "content", "cycle_label": "Q1 2026"}',
   'Snapshot captured on behalf of CEO — 2 days before Q1 cycle deadline',
   NOW() - INTERVAL '2 days');


-- =============================================================================
-- C. PLACEMENT REQUESTS
-- placement_requests table is not present in this deployment.
-- Skipped.
-- =============================================================================
