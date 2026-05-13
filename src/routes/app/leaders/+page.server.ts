/**
 * My Team Page Server
 *
 * Shows two scoped views of the organizational hierarchy:
 *
 * 1. **Subtree** — the current user's direct reports and everything below
 *    them. This is the primary "My Team" view.
 *
 * 2. **Peers** — nodes at the same level under the same parent (e.g. all
 *    VPs under the CEO, or all Directors under a VP). Peers see each
 *    other's name, title, and composite tier by default. The parent node's
 *    `peer_visibility` setting controls how much detail is exposed.
 *
 * ICs with no direct reports see only the peers section.
 * The CEO (root node) has no peers section since there is no parent.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import { sql, many } from "$lib/server/db.js";
import type { TierLevel } from "$lib/types/index.js";

interface HierarchyNode {
  id: string;
  name: string;
  title: string | null;
  nodeType: string;
  userId: string | null;
  userName: string | null;
  compositeScore: number | null;
  compositeTier: TierLevel | null;
  children: HierarchyNode[];
}

interface PeerNode {
  id: string;
  name: string;
  title: string | null;
  nodeType: string;
  userName: string | null;
  compositeScore: number | null;
  compositeTier: TierLevel | null;
}

interface OrgNodeRow {
  id: string;
  name: string;
  title: string | null;
  node_type: string;
  parent_id: string | null;
  user_id: string | null;
  user_name: string | null;
}

export const load: PageServerLoad = async ({ parent }) => {
  const { organization, userNode } = await parent();

  if (!userNode) {
    redirect(302, "/app");
  }

  const [allNodes, allSnapshots, allMetrics] = await Promise.all([
    many<OrgNodeRow>(sql`
			select
				n.id, n.name, n.title, n.node_type, n.parent_id, n.user_id,
				u.name as user_name
			from org_hierarchy_nodes n
			left join users u on u.id = n.user_id
			where n.organization_id = ${organization.id}
		`),
    many<{
      node_id: string;
      composite_score: number | null;
      composite_tier: string | null;
      created_at: string;
    }>(sql`
			select node_id, composite_score, composite_tier, created_at
			from score_snapshots
			order by created_at desc
		`),
    many<{ node_id: string | null; approved_at: string | null }>(sql`
			select node_id, approved_at from metrics
		`),
  ]);

  const latestSnapshotByNode = new Map<
    string,
    { composite_score: number | null; composite_tier: string | null }
  >();
  for (const snap of allSnapshots) {
    if (!latestSnapshotByNode.has(snap.node_id)) {
      latestSnapshotByNode.set(snap.node_id, {
        composite_score: snap.composite_score,
        composite_tier: snap.composite_tier,
      });
    }
  }

  const metricCountsByNode = new Map<
    string,
    { total: number; approved: number }
  >();
  for (const metric of allMetrics) {
    if (!metric.node_id) continue;
    const entry = metricCountsByNode.get(metric.node_id) ?? {
      total: 0,
      approved: 0,
    };
    entry.total += 1;
    if (metric.approved_at) entry.approved += 1;
    metricCountsByNode.set(metric.node_id, entry);
  }

  const buildTree = (parentId: string): HierarchyNode[] => {
    return allNodes
      .filter((n) => n.parent_id === parentId)
      .map((node) => {
        const latest = latestSnapshotByNode.get(node.id) ?? null;

        return {
          id: node.id,
          name: node.name,
          title: node.title,
          nodeType: node.node_type,
          userId: node.user_id,
          userName: node.user_name,
          compositeScore: latest?.composite_score ?? null,
          compositeTier: (latest?.composite_tier as TierLevel | null) ?? null,
          children: buildTree(node.id),
        };
      });
  };

  const subtree = buildTree(userNode.id);

  const directChildren = allNodes.filter((n) => n.parent_id === userNode.id);
  const teamHealth = directChildren.map((child) => {
    const latest = latestSnapshotByNode.get(child.id) ?? null;
    const counts = metricCountsByNode.get(child.id) ?? {
      total: 0,
      approved: 0,
    };

    return {
      id: child.id,
      name: child.name,
      title: child.title,
      userName: child.user_name,
      currentTier: (latest?.composite_tier as TierLevel) ?? null,
      currentScore: latest?.composite_score ?? null,
      totalMetrics: counts.total,
      approvedMetrics: counts.approved,
    };
  });

  const flattenHierarchy = (
    nodes: HierarchyNode[],
    depth = 0,
  ): (HierarchyNode & { depth: number })[] => {
    return nodes.flatMap((node) => [
      { ...node, depth },
      ...flattenHierarchy(node.children, depth + 1),
    ]);
  };

  const currentNodeRecord = allNodes.find((n) => n.id === userNode.id);
  let peers: PeerNode[] = [];

  if (currentNodeRecord?.parent_id) {
    const peerNodes = allNodes.filter(
      (n) =>
        n.parent_id === currentNodeRecord.parent_id && n.id !== userNode.id,
    );

    peers = peerNodes.map((node) => {
      const latest = latestSnapshotByNode.get(node.id) ?? null;
      return {
        id: node.id,
        name: node.name,
        title: node.title,
        nodeType: node.node_type,
        userName: node.user_name,
        compositeScore: latest?.composite_score ?? null,
        compositeTier: (latest?.composite_tier as TierLevel | null) ?? null,
      };
    });
  }

  return {
    subtree,
    flatList: flattenHierarchy(subtree),
    peers,
    hasReports: subtree.length > 0,
    teamHealth,
  };
};
