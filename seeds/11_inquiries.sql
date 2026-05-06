-- =============================================================================
-- Seed 11: Inquiries and Comments — Tier Internal
-- Depends on: seeds 02–10
--
-- Five inquiries supporting demo scenarios for VP Ops, CFO, Director Eng,
-- Engineering Manager, HR Director, and Chief of Staff personas.
--
-- Inquiry status enum: 'filed' | 'under_review' | 'resolved' | 'dismissed'
-- Challenge type enum: 'threshold' | 'weight' | 'definition' | 'measurement'
--
-- Narrative:
--   b500-1001  Jordan (VP Ops) → Casey (VP Sales)          filed / open
--              Delivery Fulfillment Rate ← Client Commitment Accuracy
--   b500-1002  Morgan (CFO) → Casey (VP Sales)             resolved
--              Revenue Forecast Accuracy ← Pipeline Commit Accuracy
--   b500-1003  Hayden (Dir Eng) self-inquiry               filed / open
--              Deployment Frequency — K8s migration broke threshold meaning
--   b500-1004  Cameron (Platform) → Drew (Infrastructure)  under_review / stalled
--              On-Call Incident Load ← Deployment Stability; 16 days open (overdue)
--   b500-1005  Hayden (Dir Eng) → Drew (Infrastructure)    resolved
--              Deployment Frequency ← Deployment Stability; resolved 21 days ago
--              Same target node as b500-1004 — visible to HR as inquiry pattern
-- =============================================================================

INSERT INTO inquiries
  (id, organization_id, inquiry_type, status,
   filed_by, filed_by_node_id,
   target_metric_id, affected_metric_id,
   authority_id, authority_node_id,
   challenge_type, rationale,
   resolution_summary, resolution_action,
   resolved_at, resolved_by, filed_at)
VALUES

  -- ── 1. Jordan (VP Ops) → Casey (VP Sales) — open ─────────────────────────
  (
    '00000000-0000-4000-b500-000000001001',
    '00000000-0000-4000-a000-000000000020',
    'peer', 'filed',

    '00000000-0000-4000-b000-000000000010',   -- filed_by: Jordan Lee
    '00000000-0000-4000-b100-000000000010',   -- filed_by_node_id: VP Ops

    '00000000-0000-4000-b200-000000000043',   -- target: Casey's Client Commitment Accuracy
    '00000000-0000-4000-b200-000000000013',   -- affected: Jordan's Delivery Fulfillment Rate

    '00000000-0000-4000-b000-000000000001',   -- authority: Alex Rivera (CEO)
    '00000000-0000-4000-b100-000000000001',   -- authority_node_id: CEO node

    'definition',
    'Over the past three quarters, our Delivery Fulfillment Rate has remained below target at 81.3%. Root cause analysis consistently traces shortfalls to sales commitments made without confirmed operations capacity at time of signing. Client Commitment Accuracy has averaged 71.2% for three consecutive quarters, materially below the 90% target. The current definition of a committed delivery date does not require capacity verification from Operations. Until the definition includes an operational sign-off requirement, my team will continue absorbing misses that originate upstream.',

    NULL, NULL,
    NULL, NULL,
    NOW() - INTERVAL '21 days'
  ),

  -- ── 2. Morgan (CFO) → Casey (VP Sales) — resolved ────────────────────────
  (
    '00000000-0000-4000-b500-000000001002',
    '00000000-0000-4000-a000-000000000020',
    'peer', 'resolved',

    '00000000-0000-4000-b000-000000000030',   -- filed_by: Morgan Kim (CFO)
    '00000000-0000-4000-b100-000000000030',   -- filed_by_node_id: CFO node

    '00000000-0000-4000-b200-000000000044',   -- target: Casey's Pipeline Commit Accuracy
    '00000000-0000-4000-b200-000000000034',   -- affected: Morgan's Revenue Forecast Accuracy

    '00000000-0000-4000-b000-000000000001',   -- authority: Alex Rivera (CEO)
    '00000000-0000-4000-b100-000000000001',

    'definition',
    'Finance builds monthly revenue forecasts from committed pipeline value in Salesforce. For the past two quarters, pipeline commit accuracy has averaged 69.4%, resulting in forecast variance of 16.9% — materially above our 5% tolerance. The core issue is that deals marked as committed in CRM by Sales often carry non-standard payment terms that shift recognized revenue across quarters without Finance verification. A deal can move to committed status without any Finance review of deal structure.',
    'New process agreed: all deals above $50K marked committed in Salesforce require payment terms entered in a mandatory field before status change, with Finance review within 24 hours. Pipeline Commit Accuracy metric definition updated to require Finance-verified payment terms as a precondition for committed status. Revenue Forecast Accuracy threshold recalibrated to reflect improved data quality baseline.',
    'adjusted',

    NOW() - INTERVAL '14 days',
    '00000000-0000-4000-b000-000000000001',   -- resolved_by: CEO
    NOW() - INTERVAL '35 days'
  ),

  -- ── 3. Hayden self-inquiry — Deployment Frequency / K8s migration ─────────
  (
    '00000000-0000-4000-b500-000000001003',
    '00000000-0000-4000-a000-000000000020',
    'self', 'filed',

    '00000000-0000-4000-b000-000000000021',   -- filed_by: Hayden Park
    '00000000-0000-4000-b100-000000000021',   -- filed_by_node_id: Dir Product Eng

    '00000000-0000-4000-b200-000000002100',   -- target: Deployment Frequency (own metric)
    '00000000-0000-4000-b200-000000002100',   -- affected: same (self-inquiry)

    '00000000-0000-4000-b000-000000000020',   -- authority: Sam Patel (VP Engineering)
    '00000000-0000-4000-b100-000000000020',   -- authority_node_id: VP Eng node

    'definition',
    'Migration to Kubernetes has changed the deployment unit definition. Previous threshold of 10 deploys per week assumed monolith releases. Current microservice architecture produces 40–80 micro-deploys per week. The threshold is no longer meaningful: an Effective designation under the old model requires 35 deploys per week, but last week we shipped 42 deployments and are flagged Effective even though individual service reliability is inconsistent. Comparing weekly deploy count across the architectural boundary produces misleading trend data. Requesting a threshold review and metric definition update that accounts for the shift from monolith to microservice deployment units.',

    NULL, NULL,
    NULL, NULL,
    NOW() - INTERVAL '8 days'
  ),

  -- ── 4. Cameron (Platform) → Drew (Infrastructure) — stalled / overdue ────
  (
    '00000000-0000-4000-b500-000000001004',
    '00000000-0000-4000-a000-000000000020',
    'peer', 'under_review',

    '00000000-0000-4000-b000-000000000211',   -- filed_by: Cameron Vega (Platform Lead)
    '00000000-0000-4000-b100-000000000211',   -- filed_by_node_id: Platform Team node

    '00000000-0000-4000-b200-000000002200',   -- target: Drew's Deployment Stability
    '00000000-0000-4000-b200-000000002110',   -- affected: Cameron's On-Call Incident Load

    '00000000-0000-4000-b000-000000000021',   -- authority: Hayden Park
    '00000000-0000-4000-b100-000000000021',   -- authority_node_id: Dir Product Eng node

    'measurement',
    'Platform team on-call incident load has spiked over the last three sprints. Root cause analysis on two specific P1 incidents — the API gateway outage on March 9 and the auth service degradation on March 17 — traced both events to infrastructure deployment failures that rolled back mid-sprint and left downstream services in inconsistent states. Infrastructure Deployment Stability is measured at 84.2%, but this figure does not capture the cascade effect on product services. My team is absorbing on-call load generated by infrastructure instability that falls outside the current measurement boundary. Requesting a review of how cross-team deployment failures are attributed and whether the current stability metric definition adequately reflects downstream impact.',

    NULL, NULL,
    NULL, NULL,
    NOW() - INTERVAL '16 days'
  ),

  -- ── 5. Hayden → Drew — resolved (second inquiry on same target for HR demo) ─
  (
    '00000000-0000-4000-b500-000000001005',
    '00000000-0000-4000-a000-000000000020',
    'peer', 'resolved',

    '00000000-0000-4000-b000-000000000021',   -- filed_by: Hayden Park
    '00000000-0000-4000-b100-000000000021',   -- filed_by_node_id: Dir Product Eng

    '00000000-0000-4000-b200-000000002200',   -- target: Drew's Deployment Stability
    '00000000-0000-4000-b200-000000002100',   -- affected: Hayden's Deployment Frequency

    '00000000-0000-4000-b000-000000000020',   -- authority: Sam Patel (VP Engineering)
    '00000000-0000-4000-b100-000000000020',

    'definition',
    'Product deployment frequency is measured as total deploys per week, but 12–15% of deployment attempts abort due to upstream infrastructure failures. These aborted deploys are not counted in the metric but still consume team capacity and distort sprint velocity. Infrastructure Deployment Stability at 84.2% represents a reliability floor below which our own frequency metric becomes unreliable. A week where we attempt 50 deploys and 8 abort looks identical to a week where all 42 succeed.',
    'Deployment Frequency metric definition updated to count only successful deployments completing without immediate rollback. Infrastructure committed to a 90% Deployment Stability floor by end of Q2. Monthly cross-team reliability review established between Platform and Infrastructure leads.',
    'adjusted',

    NOW() - INTERVAL '21 days',
    '00000000-0000-4000-b000-000000000020',   -- resolved_by: Sam Patel (VP Eng)
    NOW() - INTERVAL '42 days'
  );


-- =============================================================================
-- INQUIRY COMMENTS
-- =============================================================================

INSERT INTO inquiry_comments (inquiry_id, author_id, body, created_at)
VALUES

  -- ── Inquiry 1: Jordan → Casey — Casey's response ─────────────────────────

  ('00000000-0000-4000-b500-000000001001',
   '00000000-0000-4000-b000-000000000040',
   'I have reviewed the flagged commitments. Three of the six delivery misses in Q3 involved under-72-hour turnaround requests from enterprise accounts where Operations confirmed availability verbally in a call but the confirmation was not logged in the system. The metric is not measuring commitment accuracy — it is measuring documentation compliance. I am willing to work on a shared tracking protocol that captures verbal confirmations, but the definition needs to reflect that distinction before we treat the 71.2% as a root cause.',
   NOW() - INTERVAL '18 days'),

  -- ── Inquiry 2: Morgan → Casey — 2 comments ───────────────────────────────

  ('00000000-0000-4000-b500-000000001002',
   '00000000-0000-4000-b000-000000000040',
   'I understand the forecast impact. To be clear, the CRM committed status represents our internal confidence level, not a Finance-verified revenue recognition event. We have been using committed to mean "we expect this to close," not "Finance has reviewed the deal structure." If Finance needs a separate verification step before committed deals are included in forecasts, we can add that field, but it will add friction to deals that are near close and time-sensitive.',
   NOW() - INTERVAL '31 days'),

  ('00000000-0000-4000-b500-000000001002',
   '00000000-0000-4000-b000-000000000030',
   'The friction point is understood. The proposal is not to require Finance approval on all committed deals — only those above $50K with non-standard payment terms. Standard net-30 deals would auto-clear without review. The friction is proportionate to the revenue recognition risk. I am proposing we pilot this for one quarter and measure the impact on forecast variance before making it permanent.',
   NOW() - INTERVAL '28 days'),

  -- ── Inquiry 3: Hayden self-inquiry — Sam acknowledges ────────────────────

  ('00000000-0000-4000-b500-000000001003',
   '00000000-0000-4000-b000-000000000020',
   'This is a valid architectural context change. I am supporting a threshold review. Please provide a proposed new definition and suggested tier boundaries for the microservice deployment model so we can evaluate and document the change. Target to resolve before Q2 cycle opens.',
   NOW() - INTERVAL '6 days'),

  -- ── Inquiry 4: Cameron → Drew — Drew responds ────────────────────────────

  ('00000000-0000-4000-b500-000000001004',
   '00000000-0000-4000-b000-000000000022',
   'The March 9 API gateway rollback was caused by a configuration drift in the new Kubernetes deployment pipeline, not a failure in our core infrastructure. The March 17 auth service issue was downstream of a certificate rotation that was supposed to be zero-downtime. Both incidents were addressed within 2 hours of detection. Our Deployment Stability figure of 84.2% includes these events. I agree the cross-team attribution model needs review, but I want to distinguish between infrastructure-originated failures and failures that originate in the platform layer but surface as infrastructure events.',
   NOW() - INTERVAL '13 days'),

  -- ── Inquiry 5: Hayden → Drew — 2 comments ────────────────────────────────

  ('00000000-0000-4000-b500-000000001005',
   '00000000-0000-4000-b000-000000000022',
   'Understood on the deployment frequency definition gap. We can commit to tracking and reporting our rollback rate separately from general deployment counts starting Q2. The 90% stability floor is achievable if we implement the pre-deploy smoke test suite that is currently in our backlog. That requires two sprints of infrastructure work.',
   NOW() - INTERVAL '38 days'),

  ('00000000-0000-4000-b500-000000001005',
   '00000000-0000-4000-b000-000000000021',
   'Agreed on the smoke test path. I have flagged this as a dependency in our Q2 planning. If the pre-deploy suite slips, the stability floor commitment needs to be revisited. I will track this in the Q2 cross-team review.',
   NOW() - INTERVAL '35 days');
