/**
 * Demo Environment Constants
 *
 * Fixed identifiers and credentials for the pre-populated demo instance.
 * All demo visitors share the same user session, viewing the system as
 * Hans Ruber (CEO) with viewer-level permissions.
 *
 * These UUIDs are deterministic so the seed and reset functions always
 * target the same rows. They are v4-format but hand-chosen for clarity.
 */

// ============================================================================
// Demo User (shared visitor identity)
// ============================================================================

/** The single demo user account all visitors share */
export const DEMO_USER_ID = '00000000-0000-4000-a000-000000000001';

/** Demo login credentials (public - visitors use these) */
export const DEMO_EMAIL = 'demo@primer.company';
export const DEMO_PASSWORD = 'demo2025';

/** Display name shown in the app shell */
export const DEMO_USER_NAME = 'Hans Ruber';

// ============================================================================
// Demo Organization
// ============================================================================

export const DEMO_ORG_ID = '00000000-0000-4000-a000-000000000010';
export const DEMO_ORG_NAME = 'Meridian Construction';
export const DEMO_ORG_INDUSTRY = 'construction';

// ============================================================================
// Hierarchy Node IDs
// ============================================================================

/** Hans Ruber - CEO / Executive Leader */
export const DEMO_NODE_HANS = '00000000-0000-4000-a000-000000000100';

/** Marcus - VP of Operations */
export const DEMO_NODE_MARCUS = '00000000-0000-4000-a000-000000000101';

/** Rachel - CFO */
export const DEMO_NODE_RACHEL = '00000000-0000-4000-a000-000000000102';

/** James - VP of Business Development */
export const DEMO_NODE_JAMES = '00000000-0000-4000-a000-000000000103';

/** Nina - VP of Safety */
export const DEMO_NODE_NINA = '00000000-0000-4000-a000-000000000104';

// ============================================================================
// Leader User IDs (non-login, used as assignedBy / references)
// ============================================================================

export const DEMO_USER_MARCUS = '00000000-0000-4000-a000-000000000002';
export const DEMO_USER_RACHEL = '00000000-0000-4000-a000-000000000003';
export const DEMO_USER_JAMES = '00000000-0000-4000-a000-000000000004';
export const DEMO_USER_NINA = '00000000-0000-4000-a000-000000000005';

// ============================================================================
// Metric IDs (Hans's stack)
// ============================================================================

export const DEMO_METRIC_SCHEDULE = '00000000-0000-4000-a000-000000001001';
export const DEMO_METRIC_BUDGET = '00000000-0000-4000-a000-000000001002';
export const DEMO_METRIC_WINRATE = '00000000-0000-4000-a000-000000001003';
export const DEMO_METRIC_CASH = '00000000-0000-4000-a000-000000001004';

// Marcus's metrics
export const DEMO_METRIC_MARCUS_1 = '00000000-0000-4000-a000-000000001011';
export const DEMO_METRIC_MARCUS_2 = '00000000-0000-4000-a000-000000001012';
export const DEMO_METRIC_MARCUS_3 = '00000000-0000-4000-a000-000000001013';

// Rachel's metrics
export const DEMO_METRIC_RACHEL_1 = '00000000-0000-4000-a000-000000001021';
export const DEMO_METRIC_RACHEL_2 = '00000000-0000-4000-a000-000000001022';
export const DEMO_METRIC_RACHEL_3 = '00000000-0000-4000-a000-000000001023';
export const DEMO_METRIC_RACHEL_4 = '00000000-0000-4000-a000-000000001024';

// James's metrics
export const DEMO_METRIC_JAMES_1 = '00000000-0000-4000-a000-000000001031';
export const DEMO_METRIC_JAMES_2 = '00000000-0000-4000-a000-000000001032';
export const DEMO_METRIC_JAMES_3 = '00000000-0000-4000-a000-000000001033';

// Nina's metrics
export const DEMO_METRIC_NINA_1 = '00000000-0000-4000-a000-000000001041';
export const DEMO_METRIC_NINA_2 = '00000000-0000-4000-a000-000000001042';
export const DEMO_METRIC_NINA_3 = '00000000-0000-4000-a000-000000001043';

// ============================================================================
// Inquiry IDs
// ============================================================================

/** Nina's self-inquiry (threshold recalibration) */
export const DEMO_INQUIRY_NINA_SELF = '00000000-0000-4000-a000-000000002001';

/** James's peer inquiry (lead quality → win rate) */
export const DEMO_INQUIRY_JAMES_PEER = '00000000-0000-4000-a000-000000002002';

// ============================================================================
// Score Snapshot IDs
// ============================================================================

export const DEMO_SNAPSHOT_HANS_1 = '00000000-0000-4000-a000-000000003001';
export const DEMO_SNAPSHOT_HANS_2 = '00000000-0000-4000-a000-000000003002';
export const DEMO_SNAPSHOT_HANS_3 = '00000000-0000-4000-a000-000000003003';
export const DEMO_SNAPSHOT_MARCUS_1 = '00000000-0000-4000-a000-000000003011';
export const DEMO_SNAPSHOT_RACHEL_1 = '00000000-0000-4000-a000-000000003021';
export const DEMO_SNAPSHOT_JAMES_1 = '00000000-0000-4000-a000-000000003031';
export const DEMO_SNAPSHOT_NINA_1 = '00000000-0000-4000-a000-000000003041';
export const DEMO_SNAPSHOT_NINA_2 = '00000000-0000-4000-a000-000000003042';

// ============================================================================
// Org Member IDs
// ============================================================================

export const DEMO_MEMBER_HANS = '00000000-0000-4000-a000-000000004001';
export const DEMO_MEMBER_MARCUS = '00000000-0000-4000-a000-000000004002';
export const DEMO_MEMBER_RACHEL = '00000000-0000-4000-a000-000000004003';
export const DEMO_MEMBER_JAMES = '00000000-0000-4000-a000-000000004004';
export const DEMO_MEMBER_NINA = '00000000-0000-4000-a000-000000004005';
