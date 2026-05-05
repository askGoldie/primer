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

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import type { TierLevel } from '$lib/types/index.js';

/** Shape of a node in the hierarchy tree */
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

/** Shape of a peer node (flat, no children) */
interface PeerNode {
	id: string;
	name: string;
	title: string | null;
	nodeType: string;
	userName: string | null;
	compositeScore: number | null;
	compositeTier: TierLevel | null;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { organization, userNode } = await parent();

	// Redirect if the user has no hierarchy node
	if (!userNode) {
		redirect(302, '/app');
	}

	// Fetch all nodes, all latest snapshots, and all metrics for the org in parallel.
	// Fan-out batching avoids per-node N+1 queries when building the tree below.
	const [allNodesRes, allSnapshotsRes, allMetricsRes] = await Promise.all([
		db
			.from('org_hierarchy_nodes')
			.select('*, users!org_hierarchy_nodes_user_id_fkey(name)')
			.eq('organization_id', organization.id),
		db
			.from('score_snapshots')
			.select('node_id, composite_score, composite_tier, created_at')
			.order('created_at', { ascending: false }),
		db.from('metrics').select('node_id, approved_at')
	]);

	const allNodes = allNodesRes.data ?? [];

	// Build a "latest snapshot per node" lookup. Results are already sorted
	// newest-first, so the first occurrence wins.
	const latestSnapshotByNode = new Map<
		string,
		{ composite_score: number | null; composite_tier: string | null }
	>();
	for (const snap of allSnapshotsRes.data ?? []) {
		if (!latestSnapshotByNode.has(snap.node_id)) {
			latestSnapshotByNode.set(snap.node_id, {
				composite_score: snap.composite_score,
				composite_tier: snap.composite_tier
			});
		}
	}

	// Aggregate metric counts per node in a single pass.
	const metricCountsByNode = new Map<string, { total: number; approved: number }>();
	for (const metric of allMetricsRes.data ?? []) {
		const entry = metricCountsByNode.get(metric.node_id) ?? { total: 0, approved: 0 };
		entry.total += 1;
		if (metric.approved_at) entry.approved += 1;
		metricCountsByNode.set(metric.node_id, entry);
	}

	/**
	 * Recursively build a tree starting from children of `parentId`.
	 */
	const buildTree = (parentId: string): HierarchyNode[] => {
		return allNodes
			.filter((n) => n.parent_id === parentId)
			.map((node) => {
				const latest = latestSnapshotByNode.get(node.id) ?? null;
				const userData = node.users as { name: string } | null;

				return {
					id: node.id,
					name: node.name,
					title: node.title,
					nodeType: node.node_type,
					userId: node.user_id,
					userName: userData?.name ?? null,
					compositeScore: latest?.composite_score ?? null,
					compositeTier: (latest?.composite_tier as TierLevel | null) ?? null,
					children: buildTree(node.id)
				};
			});
	};

	const subtree = buildTree(userNode.id);

	// ── Team Health Summary ─────────────────────────────────────────────────
	// For each direct report: name, current tier, metric completion status
	const directChildren = allNodes.filter((n) => n.parent_id === userNode.id);
	const teamHealth = directChildren.map((child) => {
		const userData = child.users as { name: string } | null;
		const latest = latestSnapshotByNode.get(child.id) ?? null;
		const counts = metricCountsByNode.get(child.id) ?? { total: 0, approved: 0 };

		return {
			id: child.id,
			name: child.name,
			title: child.title,
			userName: userData?.name ?? null,
			currentTier: (latest?.composite_tier as TierLevel) ?? null,
			currentScore: latest?.composite_score ?? null,
			totalMetrics: counts.total,
			approvedMetrics: counts.approved
		};
	});

	/** Flatten the tree for list-view rendering */
	const flattenHierarchy = (
		nodes: HierarchyNode[],
		depth = 0
	): (HierarchyNode & { depth: number })[] => {
		return nodes.flatMap((node) => [
			{ ...node, depth },
			...flattenHierarchy(node.children, depth + 1)
		]);
	};

	// ── Peers: same parent, excluding self ───────────────────────────────────
	const currentNodeRecord = allNodes.find((n) => n.id === userNode.id);
	let peers: PeerNode[] = [];

	if (currentNodeRecord?.parent_id) {
		const peerNodes = allNodes.filter(
			(n) => n.parent_id === currentNodeRecord.parent_id && n.id !== userNode.id
		);

		peers = peerNodes.map((node) => {
			const latest = latestSnapshotByNode.get(node.id) ?? null;
			const userData = node.users as { name: string } | null;

			return {
				id: node.id,
				name: node.name,
				title: node.title,
				nodeType: node.node_type,
				userName: userData?.name ?? null,
				compositeScore: latest?.composite_score ?? null,
				compositeTier: (latest?.composite_tier as TierLevel | null) ?? null
			};
		});
	}

	return {
		subtree,
		flatList: flattenHierarchy(subtree),
		peers,
		hasReports: subtree.length > 0,
		teamHealth
	};
};
