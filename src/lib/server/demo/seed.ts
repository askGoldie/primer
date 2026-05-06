/**
 * Demo Seed Data
 *
 * Populates the Supabase database with a fully operational demo organization.
 * The data matches the narrative walkthrough characters and scenarios:
 *
 * - Hans Ruber (CEO) - executive leader, composite 3.6 Effective
 * - Marcus (VP Ops) - incomplete stack, two metrics still in draft
 * - Rachel (CFO) - Effective, weight rebalanced from 50% budget variance
 * - James (VP Biz Dev) - Concern on win rate, peer inquiry resolved
 * - Nina (VP Safety) - self-inquiry resolved, moved from Concern to Content
 *
 * @see /src/lib/data/narrative.ts for character definitions
 */

import { db } from '$lib/server/db.js';
import { hashPassword } from '$lib/server/auth/index.js';
import * as C from './constants.js';
import type { TierLevel } from '$lib/types/database.js';

/**
 * Seed the complete demo dataset.
 *
 * This function is idempotent when used after {@link clearDemoData} -
 * it inserts rows with deterministic IDs so re-running produces
 * the same state every time.
 */
export async function seedDemoData(): Promise<void> {
	const pwHash = await hashPassword(C.DEMO_PASSWORD);

	// ================================================================
	// 1. Users
	// ================================================================
	await db.from('users').insert([
		{
			id: C.DEMO_USER_ID,
			email: C.DEMO_EMAIL,
			password_hash: pwHash,
			name: C.DEMO_USER_NAME,
			locale: 'en',
			email_verified: true,
			is_admin: false
		},
		{
			id: C.DEMO_USER_MARCUS,
			email: 'marcus@demo.primer.company',
			password_hash: pwHash,
			name: 'Marcus Chen',
			locale: 'en',
			email_verified: true,
			is_admin: false
		},
		{
			id: C.DEMO_USER_RACHEL,
			email: 'rachel@demo.primer.company',
			password_hash: pwHash,
			name: 'Rachel Torres',
			locale: 'en',
			email_verified: true,
			is_admin: false
		},
		{
			id: C.DEMO_USER_JAMES,
			email: 'james@demo.primer.company',
			password_hash: pwHash,
			name: 'James Park',
			locale: 'en',
			email_verified: true,
			is_admin: false
		},
		{
			id: C.DEMO_USER_NINA,
			email: 'nina@demo.primer.company',
			password_hash: pwHash,
			name: 'Nina Okafor',
			locale: 'en',
			email_verified: true,
			is_admin: false
		}
	]);

	// ================================================================
	// 2. Organization
	// ================================================================
	await db.from('organizations').insert({
		id: C.DEMO_ORG_ID,
		name: C.DEMO_ORG_NAME,
		industry: C.DEMO_ORG_INDUSTRY,
		cycle_cadence: 'quarterly',
		inquiry_enabled: true,
		created_by: C.DEMO_USER_ID
	});

	// ================================================================
	// 3. Org Members (Hans = owner, others = editor)
	// ================================================================
	await db.from('org_members').insert([
		{
			id: C.DEMO_MEMBER_HANS,
			organization_id: C.DEMO_ORG_ID,
			user_id: C.DEMO_USER_ID,
			role: 'owner',
			assigned_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_MEMBER_MARCUS,
			organization_id: C.DEMO_ORG_ID,
			user_id: C.DEMO_USER_MARCUS,
			role: 'editor',
			assigned_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_MEMBER_RACHEL,
			organization_id: C.DEMO_ORG_ID,
			user_id: C.DEMO_USER_RACHEL,
			role: 'editor',
			assigned_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_MEMBER_JAMES,
			organization_id: C.DEMO_ORG_ID,
			user_id: C.DEMO_USER_JAMES,
			role: 'editor',
			assigned_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_MEMBER_NINA,
			organization_id: C.DEMO_ORG_ID,
			user_id: C.DEMO_USER_NINA,
			role: 'editor',
			assigned_by: C.DEMO_USER_ID
		}
	]);

	// ================================================================
	// 4. Hierarchy Nodes
	// ================================================================
	await db.from('org_hierarchy_nodes').insert([
		{
			id: C.DEMO_NODE_HANS,
			organization_id: C.DEMO_ORG_ID,
			parent_id: null,
			node_type: 'executive_leader',
			name: 'Hans Ruber',
			title: 'CEO',
			user_id: C.DEMO_USER_ID,
			sort_order: 0,
			created_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_NODE_MARCUS,
			organization_id: C.DEMO_ORG_ID,
			parent_id: C.DEMO_NODE_HANS,
			node_type: 'department',
			name: 'Marcus Chen',
			title: 'VP of Operations',
			user_id: C.DEMO_USER_MARCUS,
			sort_order: 0,
			created_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_NODE_RACHEL,
			organization_id: C.DEMO_ORG_ID,
			parent_id: C.DEMO_NODE_HANS,
			node_type: 'department',
			name: 'Rachel Torres',
			title: 'CFO',
			user_id: C.DEMO_USER_RACHEL,
			sort_order: 1,
			created_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_NODE_JAMES,
			organization_id: C.DEMO_ORG_ID,
			parent_id: C.DEMO_NODE_HANS,
			node_type: 'department',
			name: 'James Park',
			title: 'VP of Business Development',
			user_id: C.DEMO_USER_JAMES,
			sort_order: 2,
			created_by: C.DEMO_USER_ID
		},
		{
			id: C.DEMO_NODE_NINA,
			organization_id: C.DEMO_ORG_ID,
			parent_id: C.DEMO_NODE_HANS,
			node_type: 'department',
			name: 'Nina Okafor',
			title: 'VP of Safety',
			user_id: C.DEMO_USER_NINA,
			sort_order: 3,
			created_by: C.DEMO_USER_ID
		}
	]);

	// ================================================================
	// 5. Metrics - Hans's Stack (construction industry)
	// ================================================================
	await db.from('metrics').insert([
		// --- Hans (CEO) ---
		{
			id: C.DEMO_METRIC_SCHEDULE,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			assigned_by: C.DEMO_USER_ID,
			name: 'Schedule Adherence',
			description: 'Percentage of projects meeting or beating schedule targets',
			measurement_type: 'percentage',
			indicator_type: 'health',
			weight: 30,
			current_tier: 'effective',
			current_value: { value: 96 },
			origin: 'board',
			sort_order: 0
		},
		{
			id: C.DEMO_METRIC_BUDGET,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			assigned_by: C.DEMO_USER_ID,
			name: 'Budget Variance',
			description: 'Cost variance across active projects as a percentage of total budget',
			measurement_type: 'percentage',
			indicator_type: 'health',
			weight: 25,
			current_tier: 'concern',
			current_value: { value: -7.2 },
			origin: 'board',
			sort_order: 1
		},
		{
			id: C.DEMO_METRIC_WINRATE,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			assigned_by: C.DEMO_USER_ID,
			name: 'Win Rate',
			description: 'Percentage of bids submitted that result in awarded contracts',
			measurement_type: 'percentage',
			indicator_type: 'leading',
			weight: 25,
			current_tier: 'effective',
			current_value: { value: 38 },
			origin: 'board',
			sort_order: 2
		},
		{
			id: C.DEMO_METRIC_CASH,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			assigned_by: C.DEMO_USER_ID,
			name: 'Cash Position',
			description: 'Days of operating capital available based on current burn rate',
			measurement_type: 'numeric',
			indicator_type: 'health',
			weight: 20,
			current_tier: 'concern',
			current_value: { value: 52 },
			origin: 'board',
			sort_order: 3
		},

		// --- Marcus (VP Ops) - incomplete stack (2 calibrated, 1 draft) ---
		{
			id: C.DEMO_METRIC_MARCUS_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_MARCUS,
			assigned_by: C.DEMO_USER_MARCUS,
			name: 'Crew Productivity',
			description: 'Average labour hours per unit of installed work',
			measurement_type: 'numeric',
			indicator_type: 'health',
			weight: 40,
			current_tier: 'content',
			current_value: { value: 82 },
			origin: 'co_authored',
			sort_order: 0
		},
		{
			id: C.DEMO_METRIC_MARCUS_2,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_MARCUS,
			assigned_by: C.DEMO_USER_MARCUS,
			name: 'Equipment Utilization',
			description: 'Percentage of fleet hours actively deployed vs available',
			measurement_type: 'percentage',
			indicator_type: 'lagging',
			weight: 35,
			current_tier: 'effective',
			current_value: { value: 87 },
			origin: 'co_authored',
			sort_order: 1
		},
		{
			id: C.DEMO_METRIC_MARCUS_3,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_MARCUS,
			assigned_by: C.DEMO_USER_MARCUS,
			name: 'Rework Rate',
			description: 'Percentage of completed work requiring correction',
			measurement_type: 'percentage',
			indicator_type: 'lagging',
			weight: 25,
			current_tier: null,
			current_value: null,
			origin: 'self_defined',
			sort_order: 2
		},

		// --- Rachel (CFO) - 4 metrics, rebalanced weights ---
		{
			id: C.DEMO_METRIC_RACHEL_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_RACHEL,
			assigned_by: C.DEMO_USER_RACHEL,
			name: 'Budget Variance',
			description: 'Aggregate cost overrun/underrun across all active projects',
			measurement_type: 'percentage',
			indicator_type: 'health',
			weight: 30,
			current_tier: 'effective',
			current_value: { value: -2.1 },
			origin: 'co_authored',
			sort_order: 0
		},
		{
			id: C.DEMO_METRIC_RACHEL_2,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_RACHEL,
			assigned_by: C.DEMO_USER_RACHEL,
			name: 'Margin Improvement',
			description: 'Quarter-over-quarter gross margin delta',
			measurement_type: 'percentage',
			indicator_type: 'leading',
			weight: 30,
			current_tier: 'effective',
			current_value: { value: 1.8 },
			origin: 'co_authored',
			sort_order: 1
		},
		{
			id: C.DEMO_METRIC_RACHEL_3,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_RACHEL,
			assigned_by: C.DEMO_USER_RACHEL,
			name: 'Receivables Aging',
			description: 'Percentage of receivables over 90 days',
			measurement_type: 'percentage',
			indicator_type: 'lagging',
			weight: 20,
			current_tier: 'content',
			current_value: { value: 12 },
			origin: 'self_defined',
			sort_order: 2
		},
		{
			id: C.DEMO_METRIC_RACHEL_4,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_RACHEL,
			assigned_by: C.DEMO_USER_RACHEL,
			name: 'Lead Quality Score',
			description: 'Qualified lead conversion readiness rating',
			measurement_type: 'scale',
			indicator_type: 'leading',
			weight: 20,
			current_tier: 'content',
			current_value: { value: 3 },
			origin: 'co_authored',
			sort_order: 3
		},

		// --- James (VP Biz Dev) - win rate at Concern ---
		{
			id: C.DEMO_METRIC_JAMES_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_JAMES,
			assigned_by: C.DEMO_USER_JAMES,
			name: 'Win Rate',
			description: 'Percentage of proposals resulting in signed contracts',
			measurement_type: 'percentage',
			indicator_type: 'health',
			weight: 40,
			current_tier: 'concern',
			current_value: { value: 23 },
			origin: 'co_authored',
			sort_order: 0
		},
		{
			id: C.DEMO_METRIC_JAMES_2,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_JAMES,
			assigned_by: C.DEMO_USER_JAMES,
			name: 'Pipeline Value',
			description: 'Total dollar value of active proposals and qualified opportunities',
			measurement_type: 'currency',
			indicator_type: 'leading',
			weight: 35,
			current_tier: 'effective',
			current_value: { value: 4200000 },
			origin: 'co_authored',
			sort_order: 1
		},
		{
			id: C.DEMO_METRIC_JAMES_3,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_JAMES,
			assigned_by: C.DEMO_USER_JAMES,
			name: 'Client Retention',
			description: 'Percentage of repeat clients from prior 12 months',
			measurement_type: 'percentage',
			indicator_type: 'lagging',
			weight: 25,
			current_tier: 'content',
			current_value: { value: 68 },
			origin: 'self_defined',
			sort_order: 2
		},

		// --- Nina (VP Safety) - recalibrated after self-inquiry ---
		{
			id: C.DEMO_METRIC_NINA_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_NINA,
			assigned_by: C.DEMO_USER_NINA,
			name: 'Incident Frequency Rate',
			description: 'OSHA recordable incidents per 200,000 labour hours',
			measurement_type: 'numeric',
			indicator_type: 'health',
			weight: 40,
			current_tier: 'content',
			current_value: { value: 2.1 },
			origin: 'regulatory',
			sort_order: 0
		},
		{
			id: C.DEMO_METRIC_NINA_2,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_NINA,
			assigned_by: C.DEMO_USER_NINA,
			name: 'Safety Training Completion',
			description: 'Percentage of required safety certifications current across all crews',
			measurement_type: 'percentage',
			indicator_type: 'leading',
			weight: 35,
			current_tier: 'effective',
			current_value: { value: 94 },
			origin: 'regulatory',
			sort_order: 1
		},
		{
			id: C.DEMO_METRIC_NINA_3,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_NINA,
			assigned_by: C.DEMO_USER_NINA,
			name: 'Near-Miss Reporting',
			description: 'Ratio of near-miss reports to recordable incidents',
			measurement_type: 'numeric',
			indicator_type: 'leading',
			weight: 25,
			current_tier: 'effective',
			current_value: { value: 8.5 },
			origin: 'self_defined',
			sort_order: 2
		}
	]);

	// ================================================================
	// 6. Metric Thresholds (Hans's stack - full five-tier calibration)
	// ================================================================
	const hansThresholds = [
		// Schedule Adherence
		{
			metric_id: C.DEMO_METRIC_SCHEDULE,
			tier: 'alarm' as const,
			description: 'Projects running 15%+ behind schedule',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_SCHEDULE,
			tier: 'concern' as const,
			description: 'Projects running 8-15% behind schedule',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_SCHEDULE,
			tier: 'content' as const,
			description: 'Projects within 5% of schedule',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_SCHEDULE,
			tier: 'effective' as const,
			description: 'Projects consistently meeting or beating schedule',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_SCHEDULE,
			tier: 'optimized' as const,
			description: 'Schedule buffer allows for scope additions without risk',
			resolution: 'committed' as const
		},

		// Budget Variance
		{
			metric_id: C.DEMO_METRIC_BUDGET,
			tier: 'alarm' as const,
			description: 'Cost overruns exceeding 10%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_BUDGET,
			tier: 'concern' as const,
			description: 'Cost overruns between 5-10%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_BUDGET,
			tier: 'content' as const,
			description: 'Costs within 3% of budget',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_BUDGET,
			tier: 'effective' as const,
			description: 'Consistent cost savings of 2-5%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_BUDGET,
			tier: 'optimized' as const,
			description: 'Systematic margin improvement quarter over quarter',
			resolution: 'committed' as const
		},

		// Win Rate
		{
			metric_id: C.DEMO_METRIC_WINRATE,
			tier: 'alarm' as const,
			description: 'Win rate below 15%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_WINRATE,
			tier: 'concern' as const,
			description: 'Win rate between 15-25%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_WINRATE,
			tier: 'content' as const,
			description: 'Win rate between 25-35%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_WINRATE,
			tier: 'effective' as const,
			description: 'Win rate between 35-45%',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_WINRATE,
			tier: 'optimized' as const,
			description: 'Win rate above 45% with selective bidding',
			resolution: 'committed' as const
		},

		// Cash Position
		{
			metric_id: C.DEMO_METRIC_CASH,
			tier: 'alarm' as const,
			description: 'Less than 30 days operating capital',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_CASH,
			tier: 'concern' as const,
			description: '30-60 days operating capital',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_CASH,
			tier: 'content' as const,
			description: '60-90 days operating capital',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_CASH,
			tier: 'effective' as const,
			description: '90-120 days operating capital',
			resolution: 'committed' as const
		},
		{
			metric_id: C.DEMO_METRIC_CASH,
			tier: 'optimized' as const,
			description: '120+ days with investment optionality',
			resolution: 'committed' as const
		}
	];

	await db.from('metric_thresholds').insert(
		hansThresholds.map((t) => ({
			...t,
			set_by: C.DEMO_USER_ID
		}))
	);

	// ================================================================
	// 7. Score Snapshots (history for trend charts)
	// ================================================================
	const now = new Date();
	const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

	await db.from('score_snapshots').insert([
		// Hans - 3 snapshots showing progression
		{
			id: C.DEMO_SNAPSHOT_HANS_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			composite_score: 3.2,
			composite_tier: 'content' as TierLevel,
			metric_details: {},
			cycle_label: 'Q3 2025',
			recorded_by: C.DEMO_USER_ID,
			created_at: twoMonthsAgo.toISOString()
		},
		{
			id: C.DEMO_SNAPSHOT_HANS_2,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			composite_score: 3.4,
			composite_tier: 'content' as TierLevel,
			metric_details: {},
			cycle_label: 'Q4 2025',
			recorded_by: C.DEMO_USER_ID,
			created_at: monthAgo.toISOString()
		},
		{
			id: C.DEMO_SNAPSHOT_HANS_3,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_HANS,
			composite_score: 3.6,
			composite_tier: 'effective' as TierLevel,
			metric_details: {},
			cycle_label: 'Q1 2026',
			recorded_by: C.DEMO_USER_ID,
			created_at: now.toISOString()
		},

		// Marcus - 1 snapshot (incomplete stack)
		{
			id: C.DEMO_SNAPSHOT_MARCUS_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_MARCUS,
			composite_score: 3.3,
			composite_tier: 'content' as TierLevel,
			metric_details: {},
			cycle_label: 'Q1 2026',
			recorded_by: C.DEMO_USER_MARCUS,
			created_at: now.toISOString()
		},

		// Rachel - Effective
		{
			id: C.DEMO_SNAPSHOT_RACHEL_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_RACHEL,
			composite_score: 3.8,
			composite_tier: 'effective' as TierLevel,
			metric_details: {},
			cycle_label: 'Q1 2026',
			recorded_by: C.DEMO_USER_RACHEL,
			created_at: now.toISOString()
		},

		// James - Concern (win rate dragging score)
		{
			id: C.DEMO_SNAPSHOT_JAMES_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_JAMES,
			composite_score: 3.1,
			composite_tier: 'content' as TierLevel,
			metric_details: {},
			cycle_label: 'Q1 2026',
			recorded_by: C.DEMO_USER_JAMES,
			created_at: now.toISOString()
		},

		// Nina - two snapshots: Concern → Content (after self-inquiry)
		{
			id: C.DEMO_SNAPSHOT_NINA_1,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_NINA,
			composite_score: 2.8,
			composite_tier: 'concern' as TierLevel,
			metric_details: {},
			cycle_label: 'Q4 2025',
			recorded_by: C.DEMO_USER_NINA,
			created_at: monthAgo.toISOString()
		},
		{
			id: C.DEMO_SNAPSHOT_NINA_2,
			organization_id: C.DEMO_ORG_ID,
			node_id: C.DEMO_NODE_NINA,
			composite_score: 3.6,
			composite_tier: 'effective' as TierLevel,
			metric_details: {},
			cycle_label: 'Q1 2026',
			recorded_by: C.DEMO_USER_NINA,
			created_at: now.toISOString()
		}
	]);

	// ================================================================
	// 8. Inquiries
	// ================================================================

	// Nina's self-inquiry - resolved (threshold recalibration)
	await db.from('inquiries').insert([
		{
			id: C.DEMO_INQUIRY_NINA_SELF,
			organization_id: C.DEMO_ORG_ID,
			inquiry_type: 'self',
			status: 'resolved',
			filed_by: C.DEMO_USER_NINA,
			filed_by_node_id: C.DEMO_NODE_NINA,
			target_metric_id: C.DEMO_METRIC_NINA_1,
			affected_metric_id: C.DEMO_METRIC_NINA_1,
			authority_id: C.DEMO_USER_ID,
			authority_node_id: C.DEMO_NODE_HANS,
			challenge_type: 'threshold',
			rationale:
				'The incident frequency rate threshold was calibrated against an industry benchmark from 2020 that assumes a crew mix and project type no longer representative of our current operations. Our projects have shifted toward renovation and retrofit work with inherently different risk profiles. Requesting recalibration against updated OSHA data for our current project categories.',
			resolution_summary:
				'Threshold recalibrated using current OSHA benchmarks for renovation/retrofit work. The updated threshold reflects actual operational risk profile. Score moved from Concern to Content based on accurate measurement.',
			resolution_action: 'adjusted',
			resolved_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
			resolved_by: C.DEMO_USER_ID,
			filed_at: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString()
		},

		// James's peer inquiry - resolved (lead quality → win rate)
		{
			id: C.DEMO_INQUIRY_JAMES_PEER,
			organization_id: C.DEMO_ORG_ID,
			inquiry_type: 'peer',
			status: 'resolved',
			filed_by: C.DEMO_USER_JAMES,
			filed_by_node_id: C.DEMO_NODE_JAMES,
			target_metric_id: C.DEMO_METRIC_RACHEL_4,
			affected_metric_id: C.DEMO_METRIC_JAMES_1,
			authority_id: C.DEMO_USER_ID,
			authority_node_id: C.DEMO_NODE_HANS,
			challenge_type: 'threshold',
			rationale:
				'Win rate has been at Concern for six weeks. Analysis shows leads meeting Rachel\'s current qualified-lead definition are converting at 23%, while my win rate threshold was set assuming 40% conversion of qualified leads. The gap is caused by the definition of "qualified" being too broad, not by sales execution. Requesting review of the lead quality threshold definition and corresponding adjustment to my win rate target.',
			resolution_summary:
				"Both metrics adjusted. Rachel's lead quality threshold tightened to require budget confirmation and timeline commitment before marking as qualified. James's win rate threshold recalibrated to 30% conversion baseline, reflecting the improved but still selective lead pipeline. Both changes documented and approved.",
			resolution_action: 'adjusted',
			resolved_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			resolved_by: C.DEMO_USER_ID,
			filed_at: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString()
		}
	]);

	// Inquiry comments
	await db.from('inquiry_comments').insert([
		{
			inquiry_id: C.DEMO_INQUIRY_NINA_SELF,
			author_id: C.DEMO_USER_NINA,
			body: 'Attached updated OSHA benchmark data for renovation/retrofit category. Our current IFR of 2.1 places us 35% below the updated industry average for our project type.',
			created_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
		},
		{
			inquiry_id: C.DEMO_INQUIRY_NINA_SELF,
			author_id: C.DEMO_USER_ID,
			body: 'Reviewed the data. The 2020 benchmarks were clearly mismatched for our current project mix. Approving the recalibration. Updated thresholds will take effect this cycle.',
			created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
		},
		{
			inquiry_id: C.DEMO_INQUIRY_JAMES_PEER,
			author_id: C.DEMO_USER_JAMES,
			body: 'Conversion analysis attached. Of 47 leads marked as qualified in Q4, only 11 converted to signed contracts. The definition of qualified needs to include budget confirmation at minimum.',
			created_at: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString()
		},
		{
			inquiry_id: C.DEMO_INQUIRY_JAMES_PEER,
			author_id: C.DEMO_USER_RACHEL,
			body: 'Fair point. The current definition was set before we tightened our bid criteria. I agree that budget confirmation and timeline commitment should be required before a lead is marked qualified.',
			created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
		},
		{
			inquiry_id: C.DEMO_INQUIRY_JAMES_PEER,
			author_id: C.DEMO_USER_ID,
			body: "Both adjustments approved. Rachel updates lead quality definition this week. James's win rate threshold recalibrated to 30% conversion baseline. This is exactly how the system is supposed to surface cross-functional dependencies.",
			created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
		}
	]);

}
