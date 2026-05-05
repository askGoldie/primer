-- =============================================================================
-- Seed 08: Metrics
-- Depends on: seeds 02–07
--
-- Updates existing VP metric weights to accommodate new metrics, renames
-- Morgan Kim's metrics to match the CFO persona, then inserts all new
-- demo metrics across VP, Director, Manager, and IC levels.
--
-- Only columns present in seed 04 are used: id, organization_id, node_id,
-- assigned_by, name, description, measurement_type, indicator_type,
-- weight, current_tier, current_value, origin, sort_order.
--
-- UUID conventions:
--   VP additions:            b200-000000000013, -23, -33, -34, -43, -44
--   Operations Directors:    b200-000000001100–1302
--   Logistics IC (draft):    b200-000000001110–1111
--   Engineering Directors:   b200-000000002100–2202
--   Platform Team (manager): b200-000000002110–2114
--   IC Derek Solís:          b200-000000002140–2142
--   Finance Directors:       b200-000000003100–3101
-- =============================================================================


-- ===========================================================================
-- WEIGHT UPDATES ON EXISTING VP METRICS
-- Rebalanced to accommodate one or two new metrics per VP so weights sum to 100.
-- ===========================================================================

-- Jordan Lee (VP Ops) — 30 / 25 / 25 / 20 across 4 metrics
UPDATE metrics SET weight = 30 WHERE id = '00000000-0000-4000-b200-000000000010';  -- On-Time Delivery
UPDATE metrics SET weight = 25 WHERE id = '00000000-0000-4000-b200-000000000011';  -- Operational Cost per Unit
UPDATE metrics SET weight = 25 WHERE id = '00000000-0000-4000-b200-000000000012';  -- Incident Rate

-- Sam Patel (VP Eng) — 30 / 30 / 20 / 20 across 4 metrics
UPDATE metrics SET weight = 30 WHERE id = '00000000-0000-4000-b200-000000000020';  -- Deployment Frequency
UPDATE metrics SET weight = 30 WHERE id = '00000000-0000-4000-b200-000000000021';  -- System Uptime
UPDATE metrics SET weight = 20 WHERE id = '00000000-0000-4000-b200-000000000022';  -- Engineering Cycle Time

-- Morgan Kim (CFO) — rename existing metrics to match CFO persona
UPDATE metrics
SET    name          = 'Gross Margin %',
       description   = 'Gross profit as a percentage of total revenue, measured quarterly',
       origin        = 'board',
       weight        = 25,
       current_tier  = 'effective',
       current_value = '{"value": 68.4}',
       updated_at    = NOW()
WHERE  id = '00000000-0000-4000-b200-000000000030';  -- was Budget Variance

UPDATE metrics
SET    weight     = 20,
       updated_at = NOW()
WHERE  id = '00000000-0000-4000-b200-000000000031';  -- Cash Runway (keep, adjust weight)

UPDATE metrics
SET    name          = 'Operating Expense Ratio',
       description   = 'Total operating expenses as a percentage of revenue',
       origin        = 'board',
       weight        = 20,
       current_tier  = 'content',
       current_value = '{"value": 58.2}',
       updated_at    = NOW()
WHERE  id = '00000000-0000-4000-b200-000000000032';  -- was Cost per Employee

-- Casey Chen (VP Sales) — 30 / 25 / 20 / 15 / 10 across 5 metrics
UPDATE metrics SET weight = 30 WHERE id = '00000000-0000-4000-b200-000000000040';  -- New ARR
UPDATE metrics SET weight = 25 WHERE id = '00000000-0000-4000-b200-000000000041';  -- Win Rate
UPDATE metrics SET weight = 20 WHERE id = '00000000-0000-4000-b200-000000000042';  -- Pipeline Coverage


-- ===========================================================================
-- NEW METRICS
-- ===========================================================================

INSERT INTO metrics
  (id, organization_id, node_id, assigned_by,
   name, description, measurement_type, indicator_type,
   weight, current_tier, current_value, origin, sort_order)
VALUES

  -- ── Jordan Lee (VP Ops): Delivery Fulfillment Rate ────────────────────────
  -- Affected metric in Jordan's peer inquiry against Casey.
  ('00000000-0000-4000-b200-000000000013',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   '00000000-0000-4000-b000-000000000001',
   'Delivery Fulfillment Rate',
   'Percentage of customer commitments fulfilled on the agreed delivery date without revision',
   'percentage', 'health',
   20, 'concern', '{"value": 81.3}',
   'co_authored', 3),

  -- ── Sam Patel (VP Eng): Team Retention Rate ───────────────────────────────
  ('00000000-0000-4000-b200-000000000023',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000020',
   '00000000-0000-4000-b000-000000000001',
   'Team Retention Rate',
   'Percentage of engineering staff retained over a rolling 12-month period',
   'percentage', 'health',
   20, 'content', '{"value": 88}',
   'co_authored', 3),

  -- ── Morgan Kim (CFO): Days Sales Outstanding ──────────────────────────────
  ('00000000-0000-4000-b200-000000000033',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   '00000000-0000-4000-b000-000000000030',
   'Days Sales Outstanding',
   'Average number of days to collect payment after a sale is made',
   'numeric', 'lagging',
   15, 'content', '{"value": 41}',
   'self_defined', 3),

  -- ── Morgan Kim (CFO): Revenue Forecast Accuracy ───────────────────────────
  -- Affected metric in the CFO→Sales peer inquiry.
  ('00000000-0000-4000-b200-000000000034',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   '00000000-0000-4000-b000-000000000030',
   'Revenue Forecast Accuracy',
   'Percentage variance between monthly revenue forecast and actual closed revenue',
   'percentage', 'lagging',
   20, 'concern', '{"value": 83.1}',
   'self_defined', 4),

  -- ── Casey Chen (VP Sales): Client Commitment Accuracy ────────────────────
  -- Target metric in Jordan's peer inquiry (root cause of delivery shortfalls).
  ('00000000-0000-4000-b200-000000000043',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000040',
   '00000000-0000-4000-b000-000000000001',
   'Client Commitment Accuracy',
   'Percentage of contracted delivery commitments that match Operations capacity at time of signing',
   'percentage', 'lagging',
   15, 'concern', '{"value": 71.2}',
   'co_authored', 3),

  -- ── Casey Chen (VP Sales): Pipeline Commit Accuracy ──────────────────────
  -- Target metric in Morgan's peer inquiry (root cause of forecast variance).
  ('00000000-0000-4000-b200-000000000044',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000040',
   '00000000-0000-4000-b000-000000000001',
   'Pipeline Commit Accuracy',
   'Accuracy of committed pipeline value used in monthly finance forecasts vs. actual bookings',
   'percentage', 'lagging',
   10, 'concern', '{"value": 69.4}',
   'co_authored', 4),

  -- ── Taylor Brooks (Director Logistics) — 3 approved metrics ──────────────
  ('00000000-0000-4000-b200-000000001100',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000011',
   '00000000-0000-4000-b000-000000000010',
   'Logistics On-Time Rate',
   'Percentage of inbound and outbound shipments meeting scheduled windows',
   'percentage', 'health',
   40, 'effective', '{"value": 93.7}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000001101',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000011',
   '00000000-0000-4000-b000-000000000010',
   'Fulfillment Cost per Unit',
   'Total logistics spend divided by units shipped in the period',
   'currency', 'lagging',
   35, 'content', '{"value": 8.42}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000001102',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000011',
   '00000000-0000-4000-b000-000000000010',
   'Inventory Accuracy',
   'Percentage match between system inventory records and physical stock counts',
   'percentage', 'lagging',
   25, 'effective', '{"value": 98.1}',
   'co_authored', 2),

  -- ── Reese Donovan (Director Quality) — 3 submitted metrics ───────────────
  ('00000000-0000-4000-b200-000000001200',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000012',
   '00000000-0000-4000-b000-000000000010',
   'Defect Escape Rate',
   'Percentage of production defects not caught before reaching customers',
   'percentage', 'lagging',
   40, 'content', '{"value": 1.8}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000001201',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000012',
   '00000000-0000-4000-b000-000000000010',
   'First Pass Yield',
   'Percentage of units passing quality inspection on first attempt',
   'percentage', 'health',
   35, 'effective', '{"value": 91.3}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000001202',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000012',
   '00000000-0000-4000-b000-000000000010',
   'Corrective Action Close Rate',
   'Percentage of open corrective actions resolved within agreed timeframe',
   'percentage', 'lagging',
   25, 'concern', '{"value": 74.0}',
   'self_defined', 2),

  -- ── Jamie Navarro (Director Facilities) — 3 draft metrics ────────────────
  ('00000000-0000-4000-b200-000000001300',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000013',
   '00000000-0000-4000-b000-000000000010',
   'Space Utilization Rate',
   'Percentage of assignable space actively in use across all facilities',
   'percentage', 'health',
   40, NULL, NULL,
   'self_defined', 0),

  ('00000000-0000-4000-b200-000000001301',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000013',
   '00000000-0000-4000-b000-000000000010',
   'Maintenance Completion Rate',
   'Percentage of scheduled preventive maintenance tasks completed on time',
   'percentage', 'health',
   35, NULL, NULL,
   'self_defined', 1),

  ('00000000-0000-4000-b200-000000001302',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000013',
   '00000000-0000-4000-b000-000000000010',
   'Vendor Compliance Score',
   'Average compliance rating across all active facilities vendors',
   'scale', 'lagging',
   25, NULL, NULL,
   'self_defined', 2),

  -- ── Riley Adams (IC Logistics) — 2 draft metrics ─────────────────────────
  -- Represents a recently-placed member starting their first calibration cycle;
  -- contrast to Aisha Torres who has no node at all.
  ('00000000-0000-4000-b200-000000001110',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000111',
   '00000000-0000-4000-b000-000000000011',
   'Process Adherence Rate',
   'Percentage of tasks completed according to documented standard operating procedures',
   'percentage', 'health',
   55, NULL, NULL,
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000001111',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000111',
   '00000000-0000-4000-b000-000000000011',
   'On-Time Task Completion',
   'Percentage of assigned tasks completed by the agreed due date',
   'percentage', 'health',
   45, NULL, NULL,
   'co_authored', 1),

  -- ── Hayden Park (Director Product Engineering) — 3 metrics ───────────────
  -- Deployment Frequency is the target of Hayden's self-inquiry.
  ('00000000-0000-4000-b200-000000002100',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000021',
   '00000000-0000-4000-b000-000000000020',
   'Deployment Frequency',
   'Number of production deployments per week across all product services',
   'numeric', 'leading',
   35, 'effective', '{"value": 42}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000002101',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000021',
   '00000000-0000-4000-b000-000000000020',
   'Feature Delivery Velocity',
   'Average number of product features shipped per two-week sprint cycle',
   'numeric', 'leading',
   35, 'content', '{"value": 3.2}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000002102',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000021',
   '00000000-0000-4000-b000-000000000020',
   'Product Defect Density',
   'Number of severity-1 or severity-2 bugs per 1,000 lines of shipped code',
   'numeric', 'lagging',
   30, 'content', '{"value": 0.8}',
   'co_authored', 2),

  -- ── Drew Castillo (Director Infrastructure) — 3 metrics ──────────────────
  -- Deployment Stability is the target of two peer inquiries.
  ('00000000-0000-4000-b200-000000002200',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000022',
   '00000000-0000-4000-b000-000000000020',
   'Deployment Stability',
   'Percentage of deployments that complete without rollback or immediate hotfix within 2 hours',
   'percentage', 'health',
   40, 'concern', '{"value": 84.2}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000002201',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000022',
   '00000000-0000-4000-b000-000000000020',
   'Infrastructure Uptime',
   'Aggregate uptime across all shared infrastructure services, trailing 30 days',
   'percentage', 'health',
   35, 'content', '{"value": 99.71}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000002202',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000022',
   '00000000-0000-4000-b000-000000000020',
   'Incident Response Time',
   'Mean time to acknowledge and begin remediation on P1/P2 infrastructure incidents (minutes)',
   'numeric', 'lagging',
   25, 'effective', '{"value": 12.4}',
   'self_defined', 2),

  -- ── Platform Engineering Team (Cameron Vega — b100-211) — 5 metrics ───────
  ('00000000-0000-4000-b200-000000002110',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b000-000000000021',
   'On-Call Incident Load',
   'Number of P1 or P2 incidents requiring on-call engineer response per sprint',
   'numeric', 'lagging',
   25, 'content', '{"value": 2}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000002111',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b000-000000000021',
   'Deployment Reliability',
   'Percentage of team deployments completing successfully without rollback',
   'percentage', 'health',
   25, 'effective', '{"value": 97.2}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000002112',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b000-000000000021',
   'Sprint Velocity',
   'Story points completed per sprint as a percentage of planned points',
   'percentage', 'leading',
   20, 'content', '{"value": 86}',
   'co_authored', 2),

  ('00000000-0000-4000-b200-000000002113',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b000-000000000021',
   'Team Satisfaction Score',
   'Average team health survey score on a 1–5 scale, collected bi-weekly',
   'scale', 'health',
   15, 'content', '{"value": 3.7}',
   'self_defined', 3),

  ('00000000-0000-4000-b200-000000002114',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   '00000000-0000-4000-b000-000000000021',
   'PR Cycle Time',
   'Median hours from pull request open to merge, excluding draft and on-hold PRs',
   'numeric', 'lagging',
   15, 'effective', '{"value": 18.3}',
   'co_authored', 4),

  -- ── Derek Solís (IC — b100-214) — 3 metrics ───────────────────────────────
  ('00000000-0000-4000-b200-000000002140',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b000-000000000211',
   'Code Review Turnaround',
   'Median hours from review request to first substantive review',
   'numeric', 'health',
   40, 'effective', '{"value": 6.2}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000002141',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b000-000000000211',
   'Documentation Coverage',
   'Percentage of owned services with up-to-date runbooks and API docs',
   'percentage', 'lagging',
   35, 'content', '{"value": 72}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000002142',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-b000-000000000211',
   'On-Call Contribution',
   'P1/P2 incidents independently resolved during on-call rotations per sprint',
   'numeric', 'lagging',
   25, 'effective', '{"value": 3}',
   'co_authored', 2),

  -- ── Rory Langston (Director Accounting) — 2 board-assigned metrics ────────
  ('00000000-0000-4000-b200-000000003100',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000031',
   '00000000-0000-4000-b000-000000000030',
   'Audit Finding Rate',
   'Number of material audit findings per review cycle, internal or external',
   'numeric', 'lagging',
   50, 'effective', '{"value": 1}',
   'superior_assigned', 0),

  ('00000000-0000-4000-b200-000000003101',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000031',
   '00000000-0000-4000-b000-000000000030',
   'Close Cycle Time',
   'Business days to complete monthly financial close from period end',
   'numeric', 'lagging',
   50, 'content', '{"value": 5}',
   'superior_assigned', 1);
