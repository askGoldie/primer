/**
 * App Dashboard Page Server
 *
 * Main dashboard showing composite scores and recent activity.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import { calculateCompositeScore, getTierFromScore } from '$lib/utils/score.js';
import { TIER_VALUES } from '$lib/config/theme.js';
import type { TierLevel } from '$lib/types/index.js';

/** Tier-to-number map for sparkline values */
const TIER_VALUES_MAP: Record<TierLevel, number> = TIER_VALUES;

/** Shape of an active goal shown on the dashboard */
interface DashboardGoal {
	id: string;
	title: string;
	status: string;
	priority: string | null;
	goalType: string | null;
	targetTier: TierLevel | null;
	dueDate: string | null;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { userNode, isSystemAdmin, isHrAdmin } = await parent();

	// System admins and HR admins without a node get redirected to admin
	if (!userNode && (isSystemAdmin || isHrAdmin)) {
		redirect(302, '/app/admin');
	}

	// Unplaced users get the onboarding dashboard (handled in +page.svelte)
	if (!userNode) {
		return {
			needsPlacement: true,
			metrics: [],
			compositeScore: 0,
			compositeTier: 'content' as TierLevel,
			recentSnapshots: [],
			directReports: [],
			activeGoals: [] as DashboardGoal[],
			pendingReviewCount: 0
		};
	}

	// Get metrics for the user's node (or all if no node)
	const nodeId = userNode?.id;

	let userMetrics: {
		id: string;
		name: string;
		weight: number | null;
		current_tier: TierLevel | null;
		current_value: unknown;
		measurement_type: string | null;
	}[] = [];
	if (nodeId) {
		const { data } = await db
			.from('metrics')
			.select('*')
			.eq('node_id', nodeId)
			.order('weight', { ascending: false, nullsFirst: false });
		userMetrics = data ?? [];
	}

	// Fetch recent performance_log values per metric for sparklines
	const metricSparklines: Record<string, number[]> = {};
	if (userMetrics.length > 0) {
		await Promise.all(
			userMetrics.map(async (m) => {
				const { data: logs } = await db
					.from('performance_logs')
					.select('assessed_tier')
					.eq('metric_id', m.id)
					.order('period_end', { ascending: false })
					.limit(6);
				if (logs?.length) {
					metricSparklines[m.id] = logs
						.map((l) => TIER_VALUES_MAP[l.assessed_tier as TierLevel] ?? 3)
						.reverse();
				}
			})
		);
	}

	// Calculate composite score if metrics exist
	let compositeScore = 0;
	let compositeTier: TierLevel = 'content';

	if (userMetrics.length > 0 && userMetrics.some((m) => m.current_tier && m.weight)) {
		const metricsWithScores = userMetrics
			.filter((m) => m.current_tier && m.weight)
			.map((m) => ({
				tier: m.current_tier as TierLevel,
				weight: m.weight as number
			}));

		if (metricsWithScores.length > 0) {
			compositeScore = calculateCompositeScore(metricsWithScores);
			compositeTier = getTierFromScore(compositeScore);
		}
	}

	// Get recent score snapshots
	let recentSnapshots: {
		id: string;
		composite_score: number;
		composite_tier: string;
		cycle_label: string | null;
		created_at: string;
	}[] = [];
	if (nodeId) {
		const { data } = await db
			.from('score_snapshots')
			.select('*')
			.eq('node_id', nodeId)
			.order('created_at', { ascending: false })
			.limit(6);
		recentSnapshots = data ?? [];
	}

	// Load active goals for the dashboard panel (in-progress and defined, newest first)
	let activeGoals: DashboardGoal[] = [];
	if (nodeId) {
		const { data: goalRows } = await db
			.from('org_goals')
			.select('id, title, status, priority, goal_type, target_tier, due_date')
			.eq('hierarchy_node_id', nodeId)
			.in('status', ['in_progress', 'defined'])
			.order('created_at', { ascending: false })
			.limit(5);
		activeGoals = (goalRows ?? []).map((g) => ({
			id: g.id,
			title: g.title,
			status: g.status,
			priority: g.priority,
			goalType: g.goal_type,
			targetTier: g.target_tier as TierLevel | null,
			dueDate: g.due_date
		}));
	}

	// Get direct reports with recent score history for sparklines, and count
	// metrics awaiting manager review across those same reports in one pass.
	let pendingReviewCount = 0;
	let directReports: {
		id: string;
		name: string;
		title: string | null;
		compositeScore: number | null;
		compositeTier: TierLevel | null;
		recentScores: number[];
	}[] = [];

	if (nodeId) {
		const { data: childNodes } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('parent_id', nodeId);

		if (childNodes?.length) {
			const childIds = childNodes.map((n) => n.id);

			const [{ count }, reports] = await Promise.all([
				db
					.from('metrics')
					.select('id', { count: 'exact', head: true })
					.in('node_id', childIds)
					.not('submitted_at', 'is', null)
					.is('approved_at', null),
				Promise.all(
					childNodes.map(async (child) => {
						const { data: snapshots } = await db
							.from('score_snapshots')
							.select('*')
							.eq('node_id', child.id)
							.order('created_at', { ascending: false })
							.limit(4);

						const latestSnapshot = snapshots?.[0] ?? null;
						const recentScores = (snapshots ?? []).map((s) => s.composite_score).reverse();
						return {
							id: child.id,
							name: child.name,
							title: child.title,
							compositeScore: latestSnapshot?.composite_score ?? null,
							compositeTier: latestSnapshot?.composite_tier ?? null,
							recentScores
						};
					})
				)
			]);

			pendingReviewCount = count ?? 0;
			directReports = reports;
		}
	}

	return {
		metrics: userMetrics.map((m) => ({
			id: m.id,
			name: m.name,
			weight: m.weight,
			currentTier: m.current_tier,
			currentValue: m.current_value as string | number | null,
			measurementType: m.measurement_type,
			sparkline: metricSparklines[m.id] ?? []
		})),
		compositeScore,
		compositeTier,
		recentSnapshots: recentSnapshots.map((s) => ({
			id: s.id,
			score: s.composite_score,
			tier: s.composite_tier,
			cycleLabel: s.cycle_label,
			createdAt: s.created_at
		})),
		directReports,
		activeGoals,
		pendingReviewCount
	};
};
