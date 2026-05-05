-- =============================================================================
-- Seed 09: Metric Thresholds
-- Depends on: seeds 02–08
--
-- Full five-tier committed thresholds for all approved metrics across
-- CEO, VP, Director, Manager, and IC levels.
--
-- Only the three columns used in seed 04 are inserted:
--   metric_id, tier, description, set_by, resolution
--
-- Reese Donovan's thresholds use resolution = 'leader_accepted' (submitted,
-- not yet approved). The VP challenge note is embedded in the description.
-- =============================================================================

INSERT INTO metric_thresholds
  (metric_id, tier, description, set_by, resolution)
VALUES

  -- ── CEO: ARR Growth Rate (b200-01) ────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000001', 'alarm',     '< 10% YoY ARR growth; growth has stalled and investor covenant review is triggered',                               '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000001', 'concern',   '10–18% YoY growth; below market rate, requires board-level discussion',                                            '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000001', 'content',   '18–25% YoY growth; on-plan but short of stretch targets',                                                          '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000001', 'effective',  '25–35% YoY growth; on or ahead of board-approved plan',                                                            '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000001', 'optimized', '> 35% YoY growth with improving unit economics',                                                                   '00000000-0000-4000-b000-000000000001', 'committed'),

  -- ── CEO: Net Revenue Retention (b200-02) ─────────────────────────────────
  ('00000000-0000-4000-b200-000000000002', 'alarm',     '< 90% NRR; churn exceeds expansion revenue',                                                                       '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000002', 'concern',   '90–100% NRR; flat or slight churn, expansion not offsetting losses',                                               '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000002', 'content',   '100–108% NRR; modest net expansion from existing customers',                                                       '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000002', 'effective',  '108–115% NRR; healthy expansion, low gross churn',                                                                 '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000002', 'optimized', '> 115% NRR with demonstrable land-and-expand motion',                                                              '00000000-0000-4000-b000-000000000001', 'committed'),

  -- ── CEO: Employee Engagement (b200-03) ───────────────────────────────────
  ('00000000-0000-4000-b200-000000000003', 'alarm',     'Survey score < 2.5/5; widespread disengagement flagged by People team',                                            '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000003', 'concern',   '2.5–3.0/5; meaningful dissatisfaction visible in qualitative feedback',                                            '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000003', 'content',   '3.0–3.5/5; baseline health, no significant systemic issues',                                                       '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000003', 'effective',  '3.5–4.2/5; high engagement, low voluntary attrition correlation',                                                  '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000003', 'optimized', '> 4.2/5 with eNPS score above +30',                                                                                '00000000-0000-4000-b000-000000000001', 'committed'),

  -- ── CEO: Gross Margin (b200-04) ───────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000004', 'alarm',     '< 55% gross margin; infrastructure or COGS spike requiring immediate intervention',                                '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000004', 'concern',   '55–62% gross margin; margin compression flagged in board reporting',                                               '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000004', 'content',   '62–68% gross margin; in-line with SaaS peer benchmarks',                                                           '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000004', 'effective',  '68–75% gross margin; above peer median, supports R&D reinvestment',                                                '00000000-0000-4000-b000-000000000001', 'committed'),
  ('00000000-0000-4000-b200-000000000004', 'optimized', '> 75% gross margin, sustained for 2+ quarters, with unit economics improving',                                     '00000000-0000-4000-b000-000000000001', 'committed'),

  -- ── VP Jordan: On-Time Delivery (b200-10) ────────────────────────────────
  ('00000000-0000-4000-b200-000000000010', 'alarm',     '< 80% on-time; systemic delivery failures requiring executive escalation',                                         '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000010', 'concern',   '80–87% on-time; pattern of delays impacting customer satisfaction scores',                                         '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000010', 'content',   '87–92% on-time; occasional misses traceable to specific controllable causes',                                      '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000010', 'effective',  '92–97% on-time; commitments reliably met with documented exception handling',                                      '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000010', 'optimized', '> 97% on-time; proactive capacity buffers prevent misses pre-emptively',                                           '00000000-0000-4000-b000-000000000010', 'committed'),

  -- ── VP Jordan: Operational Cost per Unit (b200-11) ───────────────────────
  ('00000000-0000-4000-b200-000000000011', 'alarm',     '> $165/unit; cost overrun exceeds budget by > 15%',                                                                '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000011', 'concern',   '$155–165/unit; cost creep visible, intervention required',                                                         '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000011', 'content',   '$140–155/unit; within budget tolerance',                                                                           '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000011', 'effective',  '$125–140/unit; cost efficiency improving quarter over quarter',                                                     '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000011', 'optimized', '< $125/unit with documented process improvement driving reduction',                                                 '00000000-0000-4000-b000-000000000010', 'committed'),

  -- ── VP Jordan: Incident Rate (b200-12) ───────────────────────────────────
  ('00000000-0000-4000-b200-000000000012', 'alarm',     '> 5 critical incidents/month; operational stability at risk',                                                      '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000012', 'concern',   '3–5 incidents/month; patterns indicate systemic gap',                                                              '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000012', 'content',   '1.5–3 incidents/month; manageable cadence with post-mortems completed',                                            '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000012', 'effective',  '0.5–1.5 incidents/month; strong operational controls in place',                                                    '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000012', 'optimized', '< 0.5 incidents/month with zero P1s for 2+ consecutive months',                                                    '00000000-0000-4000-b000-000000000010', 'committed'),

  -- ── VP Jordan: Delivery Fulfillment Rate (b200-13) ───────────────────────
  ('00000000-0000-4000-b200-000000000013', 'alarm',     '< 75%; contractual penalties triggered on 3+ accounts',                                                            '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000013', 'concern',   '75–84%; fulfillment shortfalls traceable to upstream commitment overruns',                                         '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000013', 'content',   '84–91%; isolated misses with documented root causes',                                                              '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000013', 'effective',  '91–96%; commitments reliably fulfilled with pre-shipment confirmation process',                                    '00000000-0000-4000-b000-000000000010', 'committed'),
  ('00000000-0000-4000-b200-000000000013', 'optimized', '> 96%; zero contractual shortfalls for the full quarter',                                                          '00000000-0000-4000-b000-000000000010', 'committed'),

  -- ── VP Sam: Deployment Frequency (b200-20) ───────────────────────────────
  ('00000000-0000-4000-b200-000000000020', 'alarm',     '< 5 deploys/week; release cadence has regressed to near-waterfall',                                               '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000020', 'concern',   '5–12 deploys/week; CI/CD pipeline friction slowing team velocity',                                                 '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000020', 'content',   '12–20 deploys/week; consistent cadence with occasional bottlenecks',                                               '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000020', 'effective',  '20–35 deploys/week; reliable automated pipeline, teams shipping independently',                                    '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000020', 'optimized', '> 35 deploys/week with zero deployment-caused P1 incidents in the quarter',                                       '00000000-0000-4000-b000-000000000020', 'committed'),

  -- ── VP Sam: System Uptime (b200-21) ──────────────────────────────────────
  ('00000000-0000-4000-b200-000000000021', 'alarm',     '< 99.0% uptime; SLA breach, customer credits issued',                                                              '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000021', 'concern',   '99.0–99.5% uptime; approaching SLA threshold, risk of breach',                                                     '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000021', 'content',   '99.5–99.9% uptime; within committed SLA, minor incidents managed',                                                 '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000021', 'effective',  '99.9–99.99% uptime; SLA consistently exceeded',                                                                   '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000021', 'optimized', '> 99.99% uptime with automated failover validated quarterly',                                                      '00000000-0000-4000-b000-000000000020', 'committed'),

  -- ── VP Sam: Engineering Cycle Time (b200-22) ─────────────────────────────
  ('00000000-0000-4000-b200-000000000022', 'alarm',     '> 14 days median; backlog growing faster than throughput',                                                         '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000022', 'concern',   '10–14 days; PRs queuing, context-switching visible in retros',                                                     '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000022', 'content',   '6–10 days; predictable flow, occasional spikes manageable',                                                        '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000022', 'effective',  '3–6 days; lean cycle with strong PR review culture',                                                               '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000022', 'optimized', '< 3 days median with zero tickets stale beyond sprint boundary',                                                   '00000000-0000-4000-b000-000000000020', 'committed'),

  -- ── VP Sam: Team Retention Rate (b200-23) ────────────────────────────────
  ('00000000-0000-4000-b200-000000000023', 'alarm',     '< 75% retention; critical knowledge loss, project continuity at risk',                                             '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000023', 'concern',   '75–83% retention; turnover above industry median',                                                                 '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000023', 'content',   '83–90% retention; within expected range, succession planning active',                                              '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000023', 'effective',  '90–95% retention; low regrettable attrition, strong team stability',                                               '00000000-0000-4000-b000-000000000020', 'committed'),
  ('00000000-0000-4000-b200-000000000023', 'optimized', '> 95% retention with internal promotion rate > 25%',                                                               '00000000-0000-4000-b000-000000000020', 'committed'),

  -- ── CFO Morgan: Gross Margin % (b200-30) ─────────────────────────────────
  ('00000000-0000-4000-b200-000000000030', 'alarm',     '< 55% for two consecutive months; board covenant review triggered',                                                '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000030', 'concern',   '55–62%; margin compression flagged to board, root-cause required',                                                 '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000030', 'content',   '62–68%; in-line with board plan',                                                                                  '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000030', 'effective',  '68–74%; board target met, R&D reinvestment capacity intact',                                                       '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000030', 'optimized', '> 74% sustained for 2+ quarters with documented efficiency drivers',                                               '00000000-0000-4000-b000-000000000030', 'committed'),

  -- ── CFO Morgan: Cash Runway (b200-31) ────────────────────────────────────
  ('00000000-0000-4000-b200-000000000031', 'alarm',     '< 9 months runway; emergency capital raise or cost reduction required immediately',                                '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000031', 'concern',   '9–12 months runway; capital plan refresh required within the quarter',                                             '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000031', 'content',   '12–18 months runway; operating within planned burn envelope',                                                      '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000031', 'effective',  '18–24 months runway; comfortable buffer for strategic initiatives',                                                '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000031', 'optimized', '> 24 months runway with investment-grade cash management policy active',                                            '00000000-0000-4000-b000-000000000030', 'committed'),

  -- ── CFO Morgan: Operating Expense Ratio (b200-32) ────────────────────────
  ('00000000-0000-4000-b200-000000000032', 'alarm',     '> 68% OpEx ratio; overhead consuming growth investment budget',                                                    '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000032', 'concern',   '63–68% OpEx ratio; creeping overhead requires headcount or vendor review',                                         '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000032', 'content',   '55–63% OpEx ratio; within board-approved operating model',                                                         '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000032', 'effective',  '48–55% OpEx ratio; efficient operations enabling reinvestment',                                                    '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000032', 'optimized', '< 48% OpEx ratio for two consecutive quarters via zero-based review',                                              '00000000-0000-4000-b000-000000000030', 'committed'),

  -- ── CFO Morgan: Days Sales Outstanding (b200-33) ─────────────────────────
  ('00000000-0000-4000-b200-000000000033', 'alarm',     '> 65 days DSO; AR aging indicates structural collection failure in 2+ enterprise accounts',                        '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000033', 'concern',   '55–65 days DSO; collection cycle lagging contract terms, escalation required',                                     '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000033', 'content',   '45–55 days DSO; within net-45 terms, minor aging visible',                                                         '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000033', 'effective',  '35–45 days DSO; AR process healthy, automated collection active',                                                  '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000033', 'optimized', '< 35 days DSO with < 2% of AR over 90 days',                                                                      '00000000-0000-4000-b000-000000000030', 'committed'),

  -- ── CFO Morgan: Revenue Forecast Accuracy (b200-34) ──────────────────────
  ('00000000-0000-4000-b200-000000000034', 'alarm',     '< 75% accuracy; cash planning requires emergency reforecast',                                                      '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000034', 'concern',   '75–83% accuracy; variance exceeds ±10% threshold in board package',                                               '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000034', 'content',   '83–90% accuracy; within acceptable variance for monthly close',                                                    '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000034', 'effective',  '90–95% accuracy; Finance and Sales forecasts closely aligned',                                                     '00000000-0000-4000-b000-000000000030', 'committed'),
  ('00000000-0000-4000-b200-000000000034', 'optimized', '> 95% accuracy for 3+ consecutive months; pipeline-to-close model validated',                                     '00000000-0000-4000-b000-000000000030', 'committed'),

  -- ── VP Casey: New ARR (b200-40) ───────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000040', 'alarm',     '< $1.2M new ARR; below 60% of quarterly target',                                                                  '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000040', 'concern',   '$1.2–1.6M; 60–80% of quarterly target, course correction required',                                               '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000040', 'content',   '$1.6–2.0M; 80–100% of quarterly target',                                                                          '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000040', 'effective',  '$2.0–2.5M; at or above quarterly plan with pipeline coverage for next quarter',                                   '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000040', 'optimized', '> $2.5M new ARR with > 3× pipeline coverage entering next quarter',                                               '00000000-0000-4000-b000-000000000040', 'committed'),

  -- ── VP Casey: Win Rate (b200-41) ─────────────────────────────────────────
  ('00000000-0000-4000-b200-000000000041', 'alarm',     '< 15% win rate; competitive position or qualification process critically broken',                                  '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000041', 'concern',   '15–22% win rate; below industry median for our ICP',                                                               '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000041', 'content',   '22–30% win rate; competitive with peer benchmark',                                                                 '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000041', 'effective',  '30–38% win rate; above-benchmark, strong sales motion',                                                            '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000041', 'optimized', '> 38% win rate with < 10% of losses to price alone',                                                               '00000000-0000-4000-b000-000000000040', 'committed'),

  -- ── VP Casey: Pipeline Coverage (b200-42) ────────────────────────────────
  ('00000000-0000-4000-b200-000000000042', 'alarm',     '< 2× coverage; quarter at-risk without extraordinary effort',                                                      '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000042', 'concern',   '2–2.5× coverage; thin pipeline requiring immediate sourcing focus',                                                '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000042', 'content',   '2.5–3.5× coverage; adequate pipeline for target attainment',                                                      '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000042', 'effective',  '3.5–4.5× coverage; healthy funnel with mix of early and late-stage opportunities',                                '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000042', 'optimized', '> 4.5× coverage with > 30% of pipeline inbound or expansion',                                                     '00000000-0000-4000-b000-000000000040', 'committed'),

  -- ── VP Casey: Client Commitment Accuracy (b200-43) ────────────────────────
  ('00000000-0000-4000-b200-000000000043', 'alarm',     '< 60% accuracy; Sales routinely committing delivery timelines without Operations sign-off',                        '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000043', 'concern',   '60–75% accuracy; overcommits creating sustained downstream fulfillment pressure',                                  '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000043', 'content',   '75–85% accuracy; most commitments aligned, exceptions documented',                                                 '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000043', 'effective',  '85–93% accuracy; pre-close Operations review process functioning',                                                 '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000043', 'optimized', '> 93% accuracy with zero retroactive commitment revisions for the quarter',                                        '00000000-0000-4000-b000-000000000040', 'committed'),

  -- ── VP Casey: Pipeline Commit Accuracy (b200-44) ─────────────────────────
  ('00000000-0000-4000-b200-000000000044', 'alarm',     '< 60% accuracy; Finance cannot rely on pipeline data for cash planning',                                           '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000044', 'concern',   '60–72% accuracy; forecast variance exceeds Finance tolerance threshold',                                           '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000044', 'content',   '72–82% accuracy; acceptable for monthly forecasting with manual adjustment',                                       '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000044', 'effective',  '82–90% accuracy; Finance and Sales forecasts tightly correlated',                                                  '00000000-0000-4000-b000-000000000040', 'committed'),
  ('00000000-0000-4000-b200-000000000044', 'optimized', '> 90% accuracy for 3 consecutive months; shared revenue model operational',                                        '00000000-0000-4000-b000-000000000040', 'committed'),

  -- ── Director Taylor Brooks: Logistics On-Time Rate (b200-1100) ───────────
  ('00000000-0000-4000-b200-000000001100', 'alarm',     '< 82% on-time; carrier failures or routing errors causing systemic latency',                                       '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001100', 'concern',   '82–88% on-time; repeated delay clusters in specific lanes or carriers',                                            '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001100', 'content',   '88–93% on-time; within SLA, sporadic delays with known causes',                                                    '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001100', 'effective',  '93–97% on-time; carrier scorecard consistently green',                                                             '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001100', 'optimized', '> 97% on-time with predictive delay alerting active',                                                               '00000000-0000-4000-b000-000000000011', 'committed'),

  -- ── Director Taylor Brooks: Fulfillment Cost per Unit (b200-1101) ─────────
  ('00000000-0000-4000-b200-000000001101', 'alarm',     '> $11.00/unit; routing or vendor repricing issue',                                                                 '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001101', 'concern',   '$9.50–11.00/unit; above budget, root cause required',                                                              '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001101', 'content',   '$7.50–9.50/unit; within planned cost envelope',                                                                    '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001101', 'effective',  '$6.00–7.50/unit; below budget, efficiency initiatives delivering',                                                 '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001101', 'optimized', '< $6.00/unit with documented network optimisation driving reduction',                                               '00000000-0000-4000-b000-000000000011', 'committed'),

  -- ── Director Taylor Brooks: Inventory Accuracy (b200-1102) ────────────────
  ('00000000-0000-4000-b200-000000001102', 'alarm',     '< 92% accuracy; physical inventory mismatches causing fulfillment failures',                                       '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001102', 'concern',   '92–95% accuracy; discrepancy rate requires cycle count intervention',                                              '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001102', 'content',   '95–97.5% accuracy; within acceptable tolerance for pick accuracy',                                                 '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001102', 'effective',  '97.5–99% accuracy; strong WMS discipline, infrequent discrepancies',                                               '00000000-0000-4000-b000-000000000011', 'committed'),
  ('00000000-0000-4000-b200-000000001102', 'optimized', '> 99% accuracy with scan-confirmation at every touchpoint',                                                        '00000000-0000-4000-b000-000000000011', 'committed'),

  -- ── Director Reese Donovan — submitted metrics (leader_accepted) ──────────
  -- VP challenge note is embedded in the optimized description for each metric.
  ('00000000-0000-4000-b200-000000001200', 'alarm',     '> 4% escape rate; QA process breakdown, customer-facing issues escalating',                                        '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001200', 'concern',   '2.5–4% escape rate; systemic gap in final inspection or testing coverage',                                         '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001200', 'content',   '1–2.5% escape rate; isolated defects with documented detection gap',                                               '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001200', 'effective',  '0.25–1% escape rate; robust QA controls, defects caught pre-shipment',                                             '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001200', 'optimized', '< 0.25% — VP NOTE: "The Optimized definition here assumes zero defect escapes — that''s not achievable at current team size. Revise the upper bound."', '00000000-0000-4000-b000-000000000012', 'leader_accepted'),

  ('00000000-0000-4000-b200-000000001201', 'alarm',     '< 80% FPY; rework consuming > 15% of production capacity',                                                        '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001201', 'concern',   '80–86% FPY; rework rate above target, inspection bottlenecks forming',                                             '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001201', 'content',   '86–91% FPY; minor rework manageable within planned capacity',                                                      '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001201', 'effective',  '91–96% FPY; strong first-pass discipline, rework < 5% of throughput',                                              '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001201', 'optimized', '> 96% FPY sustained across all product lines',                                                                     '00000000-0000-4000-b000-000000000012', 'leader_accepted'),

  ('00000000-0000-4000-b200-000000001202', 'alarm',     '< 55% close rate; CARs accumulating, compliance risk growing',                                                     '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001202', 'concern',   '55–72% close rate; backlog growing faster than resolution rate',                                                   '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001202', 'content',   '72–83% close rate; most CARs resolved within agreed timeframe',                                                    '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001202', 'effective',  '83–92% close rate; systematic CAR process with root-cause documentation',                                          '00000000-0000-4000-b000-000000000012', 'leader_accepted'),
  ('00000000-0000-4000-b200-000000001202', 'optimized', '> 92% close rate with < 5% CAR recurrence rate',                                                                   '00000000-0000-4000-b000-000000000012', 'leader_accepted'),

  -- ── Director Hayden Park: Deployment Frequency (b200-2100) ───────────────
  ('00000000-0000-4000-b200-000000002100', 'alarm',     '< 5 feature-bearing deploys/week; product pipeline blocked',                                                       '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002100', 'concern',   '5–15 deploys/week; CI/CD friction impacting team delivery rhythm',                                                 '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002100', 'content',   '15–30 deploys/week; consistent flow with planned maintenance windows',                                             '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002100', 'effective',  '30–55 deploys/week; automated pipeline, teams shipping independently',                                             '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002100', 'optimized', '> 55 deploys/week; continuous delivery with automated canary + rollback',                                         '00000000-0000-4000-b000-000000000021', 'committed'),

  -- ── Director Hayden: Feature Delivery Velocity (b200-2101) ───────────────
  ('00000000-0000-4000-b200-000000002101', 'alarm',     '< 1.5 features/sprint; roadmap commitments to stakeholders not being met',                                        '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002101', 'concern',   '1.5–2.5 features/sprint; velocity below plan, sprint goal completion < 70%',                                      '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002101', 'content',   '2.5–3.5 features/sprint; on-pace with product roadmap',                                                            '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002101', 'effective',  '3.5–4.5 features/sprint; roadmap ahead of schedule, quality maintained',                                          '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002101', 'optimized', '> 4.5 features/sprint with < 5% post-release revert rate',                                                        '00000000-0000-4000-b000-000000000021', 'committed'),

  -- ── Director Hayden: Product Defect Density (b200-2102) ──────────────────
  ('00000000-0000-4000-b200-000000002102', 'alarm',     '> 2.5 defects/1k LOC; escaped defects impacting customer NPS',                                                    '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002102', 'concern',   '1.5–2.5 defects/1k LOC; defect rate above team historical baseline',                                              '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002102', 'content',   '0.5–1.5 defects/1k LOC; within acceptable quality range for our velocity',                                        '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002102', 'effective',  '0.2–0.5 defects/1k LOC; high code quality, test coverage consistently > 80%',                                    '00000000-0000-4000-b000-000000000021', 'committed'),
  ('00000000-0000-4000-b200-000000002102', 'optimized', '< 0.2 defects/1k LOC with mutation testing score > 75%',                                                          '00000000-0000-4000-b000-000000000021', 'committed'),

  -- ── Platform Team: On-Call Incident Load (b200-2110) ─────────────────────
  ('00000000-0000-4000-b200-000000002110', 'alarm',     'Alarm: 3+ P1 incidents in a single sprint with no post-mortem completed within 72 hours',                         '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002110', 'concern',   '2–3 incidents/sprint; on-call load unsustainable, engineer rotation stress visible',                               '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002110', 'content',   '1–2 incidents/sprint; manageable with blameless post-mortems for all P1s',                                        '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002110', 'effective',  '0–1 incidents/sprint; on-call rotation sustainable',                                                               '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002110', 'optimized', 'Zero P1 incidents for 4+ consecutive sprints; proactive reliability work eliminating root causes',                 '00000000-0000-4000-b000-000000000211', 'committed'),

  -- ── Platform Team: Deployment Reliability (b200-2111) ────────────────────
  ('00000000-0000-4000-b200-000000002111', 'alarm',     '< 88% reliability; rollbacks disrupting downstream consumers weekly',                                              '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002111', 'concern',   '88–93% reliability; intermittent failures eroding team confidence in deploy process',                              '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002111', 'content',   '93–96% reliability; deploy process stable, failures isolated and root-caused',                                     '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002111', 'effective',  '96–99% reliability; automated smoke tests preventing bad deploys pre-production',                                  '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002111', 'optimized', '> 99% reliability with automated canary analysis and zero-downtime rollout standard',                              '00000000-0000-4000-b000-000000000211', 'committed'),

  -- ── Platform Team: Sprint Velocity (b200-2112) ───────────────────────────
  ('00000000-0000-4000-b200-000000002112', 'alarm',     '< 65% of planned points; sprint planning not grounded in team capacity',                                          '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002112', 'concern',   '65–78% completion; unplanned work or unclear acceptance criteria',                                                 '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002112', 'content',   '78–90% completion; minor variance acceptable given operational interruptions',                                     '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002112', 'effective',  '90–100% completion; sprint goals met, team forecast reliable',                                                     '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002112', 'optimized', '> 100% planned completion with stretch goals delivered in 3+ consecutive sprints',                                 '00000000-0000-4000-b000-000000000211', 'committed'),

  -- ── Platform Team: Team Satisfaction (b200-2113) ─────────────────────────
  ('00000000-0000-4000-b200-000000002113', 'alarm',     '< 2.5/5; team morale critical, risk of attrition or burnout',                                                     '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002113', 'concern',   '2.5–3.0/5; recurring themes suggest structural issues (process, tooling, or workload)',                            '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002113', 'content',   '3.0–3.6/5; team healthy, one or two open items being actively addressed',                                         '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002113', 'effective',  '3.6–4.2/5; high engagement, feedback loops functioning, retros actionable',                                       '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002113', 'optimized', '> 4.2/5 for 3+ consecutive surveys; team identifies as high-performing and psychologically safe',                  '00000000-0000-4000-b000-000000000211', 'committed'),

  -- ── Platform Team: PR Cycle Time (b200-2114) ─────────────────────────────
  ('00000000-0000-4000-b200-000000002114', 'alarm',     '> 48 hours median; PRs queue > 2 days, blocking downstream work',                                                 '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002114', 'concern',   '36–48 hours median; review availability bottleneck visible in cycle metrics',                                      '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002114', 'content',   '20–36 hours median; same-day or next-morning review norm emerging',                                                '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002114', 'effective',  '10–20 hours median; responsive review culture, PRs rarely sit overnight',                                         '00000000-0000-4000-b000-000000000211', 'committed'),
  ('00000000-0000-4000-b200-000000002114', 'optimized', '< 10 hours median with < 5% PRs requiring > 24h to first review',                                                 '00000000-0000-4000-b000-000000000211', 'committed'),

  -- ── Derek Solís: Code Review Turnaround (b200-2140) ──────────────────────
  ('00000000-0000-4000-b200-000000002140', 'alarm',     'Co-authored with manager: unreviewed PRs sitting > 3 days during a sprint with no acknowledged blocker',          '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002140', 'concern',   'Co-authored with manager: median turnaround > 24 hours; reviewees blocked from merging',                          '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002140', 'content',   'Co-authored with manager: median 12–24 hours; reviews substantive, comments addressed same day',                  '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002140', 'effective',  'Co-authored with manager: median 4–12 hours; high-quality reviews completed before end of business day',          '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002140', 'optimized', 'Co-authored with manager: median < 4 hours; proactively flags stale PRs in standups',                             '00000000-0000-4000-b000-000000000092', 'committed'),

  -- ── Derek Solís: Documentation Coverage (b200-2141) ──────────────────────
  ('00000000-0000-4000-b200-000000002141', 'alarm',     'Co-authored with manager: fewer than 50% of owned services have any runbook; on-call rotation cannot safely respond without Derek on-call', '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002141', 'concern',   'Co-authored with manager: 50–65% coverage; runbooks exist but are outdated (> 90 days since last edit)',          '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002141', 'content',   'Co-authored with manager: 65–80% coverage; most services have current runbooks, API docs incomplete',             '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002141', 'effective',  'Co-authored with manager: 80–95% coverage; runbooks and API docs current within 30 days, no prompts needed',     '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002141', 'optimized', 'Co-authored with manager: zero open P2s assigned for 3+ consecutive sprints, documentation maintained without prompts', '00000000-0000-4000-b000-000000000092', 'committed'),

  -- ── Derek Solís: On-Call Contribution (b200-2142) ────────────────────────
  ('00000000-0000-4000-b200-000000002142', 'alarm',     'Co-authored with manager: zero independent resolutions in a sprint; on-call escalation rate 100%',                '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002142', 'concern',   'Co-authored with manager: 1 independent resolution/sprint; most P2s require senior escalation',                  '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002142', 'content',   'Co-authored with manager: 2–3 resolutions/sprint; standard on-call incidents handled with runbook',               '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002142', 'effective',  'Co-authored with manager: 3–5 resolutions/sprint including at least one without runbook reference',               '00000000-0000-4000-b000-000000000092', 'committed'),
  ('00000000-0000-4000-b200-000000002142', 'optimized', 'Co-authored with manager: 5+ resolutions/sprint with post-mortems documenting root cause and prevention',         '00000000-0000-4000-b000-000000000092', 'committed'),

  -- ── Rory Langston: Audit Finding Rate (b200-3100) ────────────────────────
  ('00000000-0000-4000-b200-000000003100', 'alarm',     '> 5 material audit findings per cycle; compliance posture at risk',                                                '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003100', 'concern',   '3–5 findings; remediation plan required before next audit window',                                                 '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003100', 'content',   '1–2 findings; minor items, all low-severity with documented remediation timelines',                                '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003100', 'effective',  '0–1 findings with zero repeat findings from prior cycle',                                                          '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003100', 'optimized', 'Zero findings for 2+ consecutive audit cycles; proactive controls testing documented',                             '00000000-0000-4000-b000-000000000031', 'committed'),

  -- ── Rory Langston: Close Cycle Time (b200-3101) ───────────────────────────
  ('00000000-0000-4000-b200-000000003101', 'alarm',     '> 9 business days to close; late package causes board reporting delay',                                            '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003101', 'concern',   '7–9 business days; close process has avoidable manual bottlenecks',                                               '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003101', 'content',   '5–7 business days; within CFO reporting window, minor accrual delays',                                             '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003101', 'effective',  '3–5 business days; automated reconciliation and pre-close checklist in use',                                      '00000000-0000-4000-b000-000000000031', 'committed'),
  ('00000000-0000-4000-b200-000000003101', 'optimized', '< 3 business days; fully automated close pipeline with real-time accrual visibility',                              '00000000-0000-4000-b000-000000000031', 'committed');
