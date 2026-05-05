-- =============================================================================
-- Seed 04: Metrics and Thresholds
-- Depends on: seeds 02_users.sql, 03_organizations.sql,
--             migration 20260101000004_metrics.sql
--
-- Inserts sixteen metrics across the five Meridian Construction hierarchy nodes
-- and twenty metric_threshold rows covering Hans's full five-tier calibration.
--
-- Threshold IDs are generated (threshold rows are deleted by CASCADE when
-- their parent metric is deleted during reset).
--
-- UUID conventions (metrics):
--   Hans's stack:    00000000-0000-4000-a000-0000000010xx
--   Marcus's stack:  00000000-0000-4000-a000-0000000010(1x)
--   Rachel's stack:  00000000-0000-4000-a000-0000000010(2x)
--   James's stack:   00000000-0000-4000-a000-0000000010(3x)
--   Nina's stack:    00000000-0000-4000-a000-0000000010(4x)
-- =============================================================================


-- ===========================================================================
-- METRICS
-- ===========================================================================

INSERT INTO metrics
  (id, organization_id, node_id, assigned_by,
   name, description, measurement_type, indicator_type,
   weight, current_tier, current_value, origin, sort_order)
VALUES

  -- ── Hans Ruber — CEO (board-origin, all calibrated) ──────────────────────

  ('00000000-0000-4000-a000-000000001001',
   '00000000-0000-4000-a000-000000000010',   -- Meridian Construction
   '00000000-0000-4000-a000-000000000100',   -- Hans's node
   '00000000-0000-4000-a000-000000000001',   -- assigned by Hans
   'Schedule Adherence',
   'Percentage of projects meeting or beating schedule targets',
   'percentage', 'health',
   30, 'effective', '{"value": 96}',
   'board', 0),

  ('00000000-0000-4000-a000-000000001002',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000100',
   '00000000-0000-4000-a000-000000000001',
   'Budget Variance',
   'Cost variance across active projects as a percentage of total budget',
   'percentage', 'health',
   25, 'concern', '{"value": -7.2}',
   'board', 1),

  ('00000000-0000-4000-a000-000000001003',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000100',
   '00000000-0000-4000-a000-000000000001',
   'Win Rate',
   'Percentage of bids submitted that result in awarded contracts',
   'percentage', 'leading',
   25, 'effective', '{"value": 38}',
   'board', 2),

  ('00000000-0000-4000-a000-000000001004',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000100',
   '00000000-0000-4000-a000-000000000001',
   'Cash Position',
   'Days of operating capital available based on current burn rate',
   'numeric', 'health',
   20, 'concern', '{"value": 52}',
   'board', 3),

  -- ── Marcus Chen — VP of Operations (2 calibrated, 1 draft) ───────────────

  ('00000000-0000-4000-a000-000000001011',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000101',   -- Marcus's node
   '00000000-0000-4000-a000-000000000002',   -- assigned by Marcus
   'Crew Productivity',
   'Average labour hours per unit of installed work',
   'numeric', 'health',
   40, 'content', '{"value": 82}',
   'co_authored', 0),

  ('00000000-0000-4000-a000-000000001012',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000101',
   '00000000-0000-4000-a000-000000000002',
   'Equipment Utilization',
   'Percentage of fleet hours actively deployed versus available',
   'percentage', 'lagging',
   35, 'effective', '{"value": 87}',
   'co_authored', 1),

  -- Rework Rate — draft state: no current tier, no current value, no thresholds
  ('00000000-0000-4000-a000-000000001013',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000101',
   '00000000-0000-4000-a000-000000000002',
   'Rework Rate',
   'Percentage of completed work requiring correction',
   'percentage', 'lagging',
   25, NULL, NULL,
   'self_defined', 2),

  -- ── Rachel Torres — CFO (4 metrics, all calibrated) ──────────────────────

  ('00000000-0000-4000-a000-000000001021',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000102',   -- Rachel's node
   '00000000-0000-4000-a000-000000000003',   -- assigned by Rachel
   'Budget Variance',
   'Aggregate cost overrun/underrun across all active projects',
   'percentage', 'health',
   30, 'effective', '{"value": -2.1}',
   'co_authored', 0),

  ('00000000-0000-4000-a000-000000001022',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000102',
   '00000000-0000-4000-a000-000000000003',
   'Margin Improvement',
   'Quarter-over-quarter gross margin delta',
   'percentage', 'leading',
   30, 'effective', '{"value": 1.8}',
   'co_authored', 1),

  ('00000000-0000-4000-a000-000000001023',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000102',
   '00000000-0000-4000-a000-000000000003',
   'Receivables Aging',
   'Percentage of receivables over 90 days',
   'percentage', 'lagging',
   20, 'content', '{"value": 12}',
   'self_defined', 2),

  -- Lead Quality Score — target of James's peer inquiry
  ('00000000-0000-4000-a000-000000001024',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000102',
   '00000000-0000-4000-a000-000000000003',
   'Lead Quality Score',
   'Qualified lead conversion readiness rating',
   'scale', 'leading',
   20, 'content', '{"value": 3}',
   'co_authored', 3),

  -- ── James Park — VP of Business Development ───────────────────────────────

  -- Win Rate — at Concern; this is the affected metric in the peer inquiry
  ('00000000-0000-4000-a000-000000001031',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000103',   -- James's node
   '00000000-0000-4000-a000-000000000004',   -- assigned by James
   'Win Rate',
   'Percentage of proposals resulting in signed contracts',
   'percentage', 'health',
   40, 'concern', '{"value": 23}',
   'co_authored', 0),

  ('00000000-0000-4000-a000-000000001032',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000103',
   '00000000-0000-4000-a000-000000000004',
   'Pipeline Value',
   'Total dollar value of active proposals and qualified opportunities',
   'currency', 'leading',
   35, 'effective', '{"value": 4200000}',
   'co_authored', 1),

  ('00000000-0000-4000-a000-000000001033',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000103',
   '00000000-0000-4000-a000-000000000004',
   'Client Retention',
   'Percentage of repeat clients from prior 12 months',
   'percentage', 'lagging',
   25, 'content', '{"value": 68}',
   'self_defined', 2),

  -- ── Nina Okafor — VP of Safety ────────────────────────────────────────────

  -- Incident Frequency Rate — target and affected metric in Nina's self-inquiry
  ('00000000-0000-4000-a000-000000001041',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000104',   -- Nina's node
   '00000000-0000-4000-a000-000000000005',   -- assigned by Nina
   'Incident Frequency Rate',
   'OSHA recordable incidents per 200,000 labour hours',
   'numeric', 'health',
   40, 'content', '{"value": 2.1}',
   'regulatory', 0),

  ('00000000-0000-4000-a000-000000001042',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000104',
   '00000000-0000-4000-a000-000000000005',
   'Safety Training Completion',
   'Percentage of required safety certifications current across all crews',
   'percentage', 'leading',
   35, 'effective', '{"value": 94}',
   'regulatory', 1),

  ('00000000-0000-4000-a000-000000001043',
   '00000000-0000-4000-a000-000000000010',
   '00000000-0000-4000-a000-000000000104',
   '00000000-0000-4000-a000-000000000005',
   'Near-Miss Reporting',
   'Ratio of near-miss reports to recordable incidents',
   'numeric', 'leading',
   25, 'effective', '{"value": 8.5}',
   'self_defined', 2);


-- ===========================================================================
-- PLATFORM ORG METRICS (Tier Internal — CEO + 4 VPs)
--
-- Node IDs:  00000000-0000-4000-b100-{12-digit-idx}
-- Metric IDs: 00000000-0000-4000-b200-{12-digit-idx}
-- CEO user (assigned_by): 00000000-0000-4000-b000-000000000001
-- ===========================================================================

INSERT INTO metrics
  (id, organization_id, node_id, assigned_by,
   name, description, measurement_type, indicator_type,
   weight, current_tier, current_value, origin, sort_order)
VALUES

  -- ── Alex Rivera — CEO ────────────────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000001',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000001',
   '00000000-0000-4000-b000-000000000001',
   'ARR Growth Rate',
   'Year-over-year growth in annual recurring revenue',
   'percentage', 'leading',
   30, 'effective', '{"value": 28}',
   'board', 0),

  ('00000000-0000-4000-b200-000000000002',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000001',
   '00000000-0000-4000-b000-000000000001',
   'Net Revenue Retention',
   'Revenue retained from existing customers after churn and expansion',
   'percentage', 'health',
   25, 'content', '{"value": 104}',
   'board', 1),

  ('00000000-0000-4000-b200-000000000003',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000001',
   '00000000-0000-4000-b000-000000000001',
   'Employee Engagement',
   'Quarterly engagement survey score on a 1–5 scale',
   'scale', 'health',
   25, 'content', '{"value": 3.6}',
   'self_defined', 2),

  ('00000000-0000-4000-b200-000000000004',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000001',
   '00000000-0000-4000-b000-000000000001',
   'Gross Margin',
   'Gross profit as a percentage of revenue',
   'percentage', 'health',
   20, 'effective', '{"value": 71}',
   'board', 3),

  -- ── Jordan Lee — VP of Operations ────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000010',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   '00000000-0000-4000-b000-000000000001',
   'On-Time Delivery',
   'Percentage of commitments delivered by agreed date',
   'percentage', 'health',
   35, 'content', '{"value": 88}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000000011',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   '00000000-0000-4000-b000-000000000001',
   'Operational Cost per Unit',
   'Total ops spend divided by units of output delivered',
   'currency', 'health',
   35, 'concern', '{"value": 142}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000000012',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000010',
   '00000000-0000-4000-b000-000000000001',
   'Incident Rate',
   'Critical incidents per month across operational systems',
   'numeric', 'lagging',
   30, 'effective', '{"value": 1.2}',
   'self_defined', 2),

  -- ── Sam Patel — VP of Engineering ────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000020',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000020',
   '00000000-0000-4000-b000-000000000001',
   'Deployment Frequency',
   'Production deployments per week across all services',
   'numeric', 'leading',
   35, 'effective', '{"value": 18}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000000021',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000020',
   '00000000-0000-4000-b000-000000000001',
   'System Uptime',
   'Aggregate uptime across production services over trailing 30 days',
   'percentage', 'health',
   35, 'optimized', '{"value": 99.97}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000000022',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000020',
   '00000000-0000-4000-b000-000000000001',
   'Engineering Cycle Time',
   'Median days from ticket open to production merge',
   'numeric', 'lagging',
   30, 'content', '{"value": 6.4}',
   'self_defined', 2),

  -- ── Morgan Kim — VP of Finance ────────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000030',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   '00000000-0000-4000-b000-000000000001',
   'Budget Variance',
   'Actual vs. planned spend as a percentage of budget',
   'percentage', 'health',
   35, 'content', '{"value": -3.1}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000000031',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   '00000000-0000-4000-b000-000000000001',
   'Cash Runway',
   'Months of operating runway at current burn rate',
   'numeric', 'health',
   35, 'effective', '{"value": 19}',
   'board', 1),

  ('00000000-0000-4000-b200-000000000032',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000030',
   '00000000-0000-4000-b000-000000000001',
   'Cost per Employee',
   'Total loaded cost divided by headcount',
   'currency', 'lagging',
   30, 'concern', '{"value": 187000}',
   'self_defined', 2),

  -- ── Casey Chen — VP of Sales ──────────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000040',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000040',
   '00000000-0000-4000-b000-000000000001',
   'New ARR',
   'New annual recurring revenue closed in the current quarter',
   'currency', 'leading',
   35, 'effective', '{"value": 2100000}',
   'co_authored', 0),

  ('00000000-0000-4000-b200-000000000041',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000040',
   '00000000-0000-4000-b000-000000000001',
   'Win Rate',
   'Percentage of qualified opportunities closed as won',
   'percentage', 'health',
   35, 'concern', '{"value": 22}',
   'co_authored', 1),

  ('00000000-0000-4000-b200-000000000042',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000040',
   '00000000-0000-4000-b000-000000000001',
   'Pipeline Coverage',
   'Ratio of pipeline value to quarterly ARR target',
   'numeric', 'leading',
   30, 'content', '{"value": 3.1}',
   'self_defined', 2);


-- ===========================================================================
-- METRIC THRESHOLDS
-- Hans's four metrics — full five-tier calibration, all committed.
-- Marcus, Rachel, James, and Nina's metrics have no threshold rows; their
-- calibration state is conveyed by the current_tier value on the metric row.
-- ===========================================================================

INSERT INTO metric_thresholds
  (metric_id, tier, description, set_by, resolution)
VALUES

  -- ── Schedule Adherence ────────────────────────────────────────────────────
  ('00000000-0000-4000-a000-000000001001', 'alarm',
   'Projects running 15%+ behind schedule',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001001', 'concern',
   'Projects running 8–15% behind schedule',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001001', 'content',
   'Projects within 5% of schedule',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001001', 'effective',
   'Projects consistently meeting or beating schedule',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001001', 'optimized',
   'Schedule buffer allows for scope additions without risk',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  -- ── Budget Variance ───────────────────────────────────────────────────────
  ('00000000-0000-4000-a000-000000001002', 'alarm',
   'Cost overruns exceeding 10%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001002', 'concern',
   'Cost overruns between 5–10%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001002', 'content',
   'Costs within 3% of budget',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001002', 'effective',
   'Consistent cost savings of 2–5%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001002', 'optimized',
   'Systematic margin improvement quarter over quarter',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  -- ── Win Rate ──────────────────────────────────────────────────────────────
  ('00000000-0000-4000-a000-000000001003', 'alarm',
   'Win rate below 15%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001003', 'concern',
   'Win rate between 15–25%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001003', 'content',
   'Win rate between 25–35%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001003', 'effective',
   'Win rate between 35–45%',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001003', 'optimized',
   'Win rate above 45% with selective bidding',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  -- ── Cash Position ─────────────────────────────────────────────────────────
  ('00000000-0000-4000-a000-000000001004', 'alarm',
   'Fewer than 30 days of operating capital',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001004', 'concern',
   '30–60 days of operating capital',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001004', 'content',
   '60–90 days of operating capital',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001004', 'effective',
   '90–120 days of operating capital',
   '00000000-0000-4000-a000-000000000001', 'committed'),

  ('00000000-0000-4000-a000-000000001004', 'optimized',
   '120+ days of operating capital with investment optionality',
   '00000000-0000-4000-a000-000000000001', 'committed');
