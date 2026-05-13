// @ts-nocheck
/**
 * My Team Page Server
 *
 * Loads the current user's direct reports and their descendant subtree,
 * along with a team health summary showing each direct report's current
 * tier, metric completion status, and latest snapshot data.
 *
 * Two view modes:
 * - **Subtree**: hierarchical tree of all descendants with depth tracking
 * - **Peers**: sibling nodes under the same parent (separate from /app/peers)
 *
 * Access: Only users with direct reports (managers) can view this page.
 * ICs (leaf nodes) are redirected to the dashboard.
 */

import { redirect, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import postgres from "postgres";
import { sql, many, maybeOne } from "$lib/server/db.js";
import { verifyManagementAccess } from "$lib/server/permissions.js";
import {
  calculateCompositeScore,
  getTierFromScore,
  calculateMetricDetails,
} from "$lib/utils/score.js";
import type { TierLevel } from "$lib/types/index.js";

interface TeamNode {
  id: string;
  name: string;
  title: string | null;
  nodeType: string;
  parentId: string | null;
  depth: number;
  compositeTier: TierLevel | null;
  compositeScore: number | null;
  snapshotDate: string | null;
  metricTotal: number;
  metricApproved: number;
}

interface DirectReportHealth {
  id: string;
  name: string;
  title: string | null;
  nodeType: string;
  currentTier: TierLevel | null;
  currentScore: number | null;
  metricTotal: number;
  metricApproved: number;
}

interface AllNode {
  id: string;
  name: string;
  title: string | null;
  node_type: string;
  parent_id: string | null;
}

interface SnapshotRow {
  node_id: string;
  composite_tier: string | null;
  composite_score: number | null;
  created_at: string;
}

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
  const { organization, userNode, hasDirectReports, isSystemAdmin } =
    await parent();

  if (!userNode || !hasDirectReports) {
    redirect(302, "/app");
  }

  const allNodes = await many<AllNode>(sql`
		select id, name, title, node_type, parent_id
		from org_hierarchy_nodes
		where organization_id = ${organization.id}
	`);

  if (allNodes.length === 0) {
    return { subtree: [], directReportHealth: [], peers: [] };
  }

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, AllNode[]>();
  for (const node of allNodes) {
    if (node.parent_id) {
      const siblings = childrenMap.get(node.parent_id) ?? [];
      siblings.push(node);
      childrenMap.set(node.parent_id, siblings);
    }
  }

  const descendantEntries: { id: string; depth: number }[] = [];
  const queue: { id: string; depth: number }[] = [
    { id: userNode.id, depth: 0 },
  ];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current.id) ?? [];
    for (const child of children) {
      descendantEntries.push({ id: child.id, depth: current.depth + 1 });
      queue.push({ id: child.id, depth: current.depth + 1 });
    }
  }

  const descendantIds = descendantEntries.map((e) => e.id);

  const snapshotByNode = new Map<
    string,
    {
      composite_tier: string | null;
      composite_score: number | null;
      created_at: string;
    }
  >();
  const metricCountByNode = new Map<
    string,
    { total: number; approved: number }
  >();

  if (descendantIds.length > 0) {
    const [snapshots, metrics] = await Promise.all([
      many<SnapshotRow>(sql`
				select node_id, composite_tier, composite_score, created_at
				from score_snapshots
				where node_id = any(${descendantIds}::uuid[])
				order by created_at desc
			`),
      many<{ node_id: string | null; approved_at: string | null }>(sql`
				select node_id, approved_at from metrics
				where node_id = any(${descendantIds}::uuid[])
			`),
    ]);

    for (const snap of snapshots) {
      if (!snapshotByNode.has(snap.node_id)) {
        snapshotByNode.set(snap.node_id, snap);
      }
    }

    for (const m of metrics) {
      if (!m.node_id) continue;
      const entry = metricCountByNode.get(m.node_id) ?? {
        total: 0,
        approved: 0,
      };
      entry.total++;
      if (m.approved_at) entry.approved++;
      metricCountByNode.set(m.node_id, entry);
    }
  }

  const subtree: TeamNode[] = descendantEntries.map((entry) => {
    const node = nodeMap.get(entry.id)!;
    const snap = snapshotByNode.get(entry.id);
    const metricCount = metricCountByNode.get(entry.id) ?? {
      total: 0,
      approved: 0,
    };

    return {
      id: node.id,
      name: node.name,
      title: node.title,
      nodeType: node.node_type,
      parentId: node.parent_id,
      depth: entry.depth,
      compositeTier: (snap?.composite_tier as TierLevel) ?? null,
      compositeScore: snap?.composite_score ?? null,
      snapshotDate: snap?.created_at ?? null,
      metricTotal: metricCount.total,
      metricApproved: metricCount.approved,
    };
  });

  const directReportHealth: DirectReportHealth[] = subtree
    .filter((n) => n.depth === 1)
    .map((n) => ({
      id: n.id,
      name: n.name,
      title: n.title,
      nodeType: n.nodeType,
      currentTier: n.compositeTier,
      currentScore: n.compositeScore,
      metricTotal: n.metricTotal,
      metricApproved: n.metricApproved,
    }));

  const currentNode = nodeMap.get(userNode.id);
  const peers =
    currentNode?.parent_id && !isSystemAdmin
      ? allNodes
          .filter(
            (n) =>
              n.parent_id === currentNode.parent_id && n.id !== userNode.id,
          )
          .map((n) => {
            const snap = snapshotByNode.get(n.id);
            return {
              id: n.id,
              name: n.name,
              title: n.title,
              nodeType: n.node_type,
              compositeTier: (snap?.composite_tier as TierLevel) ?? null,
            };
          })
      : [];

  return { subtree, directReportHealth, peers };
};

export const actions = {
  captureSnapshot: async ({ request, locals }: import('./$types').RequestEvent) => {
    if (!locals.user) return fail(403, { error: "error.generic" });

    const formData = await request.formData();
    const nodeId = formData.get("nodeId")?.toString();
    const cycleLabel = formData.get("cycleLabel")?.toString().trim();
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!nodeId || !cycleLabel)
      return fail(400, { error: "validation.field_required" });

    const mgr = await verifyManagementAccess(locals.user.id, nodeId);
    if (!mgr) return fail(403, { error: "error.generic" });

    const nodeMetrics = await many<{
      id: string;
      name: string;
      measurement_type: string;
      origin: string;
      current_value: unknown;
      current_tier: TierLevel | null;
      weight: number | null;
    }>(sql`
			select id, name, measurement_type, origin, current_value, current_tier, weight
			from metrics
			where node_id = ${nodeId}
		`);

    const scoreable = nodeMetrics.filter((m) => m.current_tier && m.weight);

    if (scoreable.length === 0) {
      return fail(400, { error: "snapshot.no_scoreable_metrics" });
    }

    const compositeScore = calculateCompositeScore(
      scoreable.map((m) => ({
        tier: m.current_tier as TierLevel,
        weight: m.weight as number,
      })),
    );
    const compositeTier = getTierFromScore(compositeScore);

    const metricDetails = calculateMetricDetails(
      scoreable.map((m) => ({
        id: m.id,
        name: m.name,
        measurementType: m.measurement_type,
        origin: m.origin,
        currentValue: m.current_value,
        currentTier: m.current_tier as TierLevel,
        weight: m.weight as number,
      })),
    );

    const snapshot = await maybeOne<{ id: string }>(sql`
			insert into score_snapshots
				(organization_id, node_id, composite_score, composite_tier,
				 metric_details, cycle_label, notes, recorded_by)
			values (
				${mgr.organizationId},
				${nodeId},
				${compositeScore},
				${compositeTier},
				${sql.json(metricDetails as unknown as postgres.JSONValue)},
				${cycleLabel},
				${notes},
				${locals.user.id}
			)
			returning id
		`);

    if (!snapshot) return fail(500, { error: "error.generic" });

    await sql`
			update metrics
			set locked_by_snapshot_id = ${snapshot.id}, updated_at = now()
			where node_id = ${nodeId}
		`;

    return { snapshotSuccess: true, snapshotId: snapshot.id };
  },
};
;null as any as Actions;