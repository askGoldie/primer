/**
 * App Dashboard Page Server
 *
 * Main dashboard showing composite scores and recent activity.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { sql, many, maybeOne } from "$lib/server/db.js";
import { calculateCompositeScore, getTierFromScore } from "$lib/utils/score.js";
import { TIER_VALUES } from "$lib/config/theme.js";
import type { TierLevel } from "$lib/types/index.js";

const TIER_VALUES_MAP: Record<TierLevel, number> = TIER_VALUES;

interface DashboardGoal {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  goalType: string | null;
  targetTier: TierLevel | null;
  dueDate: string | null;
}

interface MetricRow {
  id: string;
  name: string;
  weight: number | null;
  current_tier: TierLevel | null;
  current_value: unknown;
  measurement_type: string | null;
}

interface SnapshotRow {
  id: string;
  composite_score: number;
  composite_tier: string;
  cycle_label: string | null;
  created_at: string;
}

interface ChildNode {
  id: string;
  name: string;
  title: string | null;
}

export const load: PageServerLoad = async ({ parent }) => {
  const { userNode, isSystemAdmin, isHrAdmin } = await parent();

  if (!userNode && (isSystemAdmin || isHrAdmin)) {
    redirect(302, "/app/admin");
  }

  if (!userNode) {
    return {
      needsPlacement: true,
      metrics: [],
      compositeScore: 0,
      compositeTier: "content" as TierLevel,
      recentSnapshots: [],
      directReports: [],
      activeGoals: [] as DashboardGoal[],
      pendingReviewCount: 0,
    };
  }

  const nodeId = userNode.id;

  const userMetrics = await many<MetricRow>(sql`
		select id, name, weight, current_tier, current_value, measurement_type
		from metrics
		where node_id = ${nodeId}
		order by weight desc nulls last
	`);

  const metricSparklines: Record<string, number[]> = {};
  if (userMetrics.length > 0) {
    await Promise.all(
      userMetrics.map(async (m) => {
        const logs = await many<{ assessed_tier: string }>(sql`
					select assessed_tier from performance_logs
					where metric_id = ${m.id}
					order by period_end desc
					limit 6
				`);
        if (logs.length > 0) {
          metricSparklines[m.id] = logs
            .map((l) => TIER_VALUES_MAP[l.assessed_tier as TierLevel] ?? 3)
            .reverse();
        }
      }),
    );
  }

  let compositeScore = 0;
  let compositeTier: TierLevel = "content";

  if (
    userMetrics.length > 0 &&
    userMetrics.some((m) => m.current_tier && m.weight)
  ) {
    const metricsWithScores = userMetrics
      .filter((m) => m.current_tier && m.weight)
      .map((m) => ({
        tier: m.current_tier as TierLevel,
        weight: m.weight as number,
      }));

    if (metricsWithScores.length > 0) {
      compositeScore = calculateCompositeScore(metricsWithScores);
      compositeTier = getTierFromScore(compositeScore);
    }
  }

  const recentSnapshots = await many<SnapshotRow>(sql`
		select id, composite_score, composite_tier, cycle_label, created_at
		from score_snapshots
		where node_id = ${nodeId}
		order by created_at desc
		limit 6
	`);

  const goalRows = await many<{
    id: string;
    title: string;
    status: string;
    priority: string | null;
    goal_type: string | null;
    target_tier: TierLevel | null;
    due_date: string | null;
  }>(sql`
		select id, title, status, priority, goal_type, target_tier, due_date
		from org_goals
		where hierarchy_node_id = ${nodeId}
			and status in ('in_progress', 'defined')
		order by created_at desc
		limit 5
	`);
  const activeGoals: DashboardGoal[] = goalRows.map((g) => ({
    id: g.id,
    title: g.title,
    status: g.status,
    priority: g.priority,
    goalType: g.goal_type,
    targetTier: g.target_tier,
    dueDate: g.due_date,
  }));

  let pendingReviewCount = 0;
  let directReports: {
    id: string;
    name: string;
    title: string | null;
    compositeScore: number | null;
    compositeTier: TierLevel | null;
    recentScores: number[];
  }[] = [];

  const childNodes = await many<ChildNode>(sql`
		select id, name, title from org_hierarchy_nodes where parent_id = ${nodeId}
	`);

  if (childNodes.length > 0) {
    const childIds = childNodes.map((n) => n.id);

    const [pendingRow, reports] = await Promise.all([
      maybeOne<{ count: string }>(sql`
				select count(*)::text as count from metrics
				where node_id = any(${childIds}::uuid[])
					and submitted_at is not null
					and approved_at is null
			`),
      Promise.all(
        childNodes.map(async (child) => {
          const snapshots = await many<{
            composite_score: number;
            composite_tier: TierLevel;
          }>(sql`
						select composite_score, composite_tier
						from score_snapshots
						where node_id = ${child.id}
						order by created_at desc
						limit 4
					`);

          const latest = snapshots[0];
          const recentScores = snapshots
            .map((s) => s.composite_score)
            .reverse();
          return {
            id: child.id,
            name: child.name,
            title: child.title,
            compositeScore: latest?.composite_score ?? null,
            compositeTier: latest?.composite_tier ?? null,
            recentScores,
          };
        }),
      ),
    ]);

    pendingReviewCount = Number(pendingRow?.count ?? 0);
    directReports = reports;
  }

  return {
    metrics: userMetrics.map((m) => ({
      id: m.id,
      name: m.name,
      weight: m.weight,
      currentTier: m.current_tier,
      currentValue: m.current_value as string | number | null,
      measurementType: m.measurement_type,
      sparkline: metricSparklines[m.id] ?? [],
    })),
    compositeScore,
    compositeTier,
    recentSnapshots: recentSnapshots.map((s) => ({
      id: s.id,
      score: s.composite_score,
      tier: s.composite_tier,
      cycleLabel: s.cycle_label,
      createdAt: s.created_at,
    })),
    directReports,
    activeGoals,
    pendingReviewCount,
  };
};
