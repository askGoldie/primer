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

import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import { verifyManagementAccess } from '$lib/server/permissions.js';
import {
	calculateCompositeScore,
	getTierFromScore,
	calculateMetricDetails
} from '$lib/utils/score.js';
import type { TierLevel } from '$lib/types/index.js';

/** Shape of a team member node in the subtree */
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

/** Health summary for a direct report */
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

export const load: PageServerLoad = async ({ parent }) => {
	const { organization, userNode, hasDirectReports, isSystemAdmin } = await parent();

	if (!userNode || !hasDirectReports) {
		redirect(302, '/app');
	}

	// ── Fetch all nodes in the org for tree-building ──────────────────────
	const { data: allNodes } = await db
		.from('org_hierarchy_nodes')
		.select('*')
		.eq('organization_id', organization.id);

	if (!allNodes) {
		return { subtree: [], directReportHealth: [], peers: [] };
	}

	// ── Build subtree by walking descendants ─────────────────────────────
	const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
	const childrenMap = new Map<string, typeof allNodes>();
	for (const node of allNodes) {
		if (node.parent_id) {
			const siblings = childrenMap.get(node.parent_id) ?? [];
			siblings.push(node);
			childrenMap.set(node.parent_id, siblings);
		}
	}

	/** Collect descendant node IDs with depth */
	const descendantEntries: { id: string; depth: number }[] = [];
	const queue: { id: string; depth: number }[] = [{ id: userNode.id, depth: 0 }];
	while (queue.length > 0) {
		const current = queue.shift()!;
		const children = childrenMap.get(current.id) ?? [];
		for (const child of children) {
			descendantEntries.push({ id: child.id, depth: current.depth + 1 });
			queue.push({ id: child.id, depth: current.depth + 1 });
		}
	}

	// ── Fetch snapshots and metric counts for all descendants in parallel ─
	const descendantIds = descendantEntries.map((e) => e.id);

	const snapshotByNode = new Map<
		string,
		{ composite_tier: string | null; composite_score: number | null; created_at: string }
	>();
	const metricCountByNode = new Map<string, { total: number; approved: number }>();

	if (descendantIds.length > 0) {
		const [{ data: snapshots }, { data: metrics }] = await Promise.all([
			db
				.from('score_snapshots')
				.select('node_id, composite_tier, composite_score, created_at')
				.in('node_id', descendantIds)
				.order('created_at', { ascending: false }),
			db.from('metrics').select('node_id, approved_at').in('node_id', descendantIds)
		]);

		for (const snap of snapshots ?? []) {
			// Keep only the latest per node
			if (!snapshotByNode.has(snap.node_id)) {
				snapshotByNode.set(snap.node_id, snap);
			}
		}

		for (const m of metrics ?? []) {
			if (!m.node_id) continue;
			const entry = metricCountByNode.get(m.node_id) ?? { total: 0, approved: 0 };
			entry.total++;
			if (m.approved_at) entry.approved++;
			metricCountByNode.set(m.node_id, entry);
		}
	}

	// ── Build subtree array ─────────────────────────────────────────────
	const subtree: TeamNode[] = descendantEntries.map((entry) => {
		const node = nodeMap.get(entry.id)!;
		const snap = snapshotByNode.get(entry.id);
		const metricCount = metricCountByNode.get(entry.id) ?? { total: 0, approved: 0 };

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
			metricApproved: metricCount.approved
		};
	});

	// ── Direct report health summary (depth-1 children only) ────────────
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
			metricApproved: n.metricApproved
		}));

	// ── Peers (siblings under same parent) ──────────────────────────────
	const currentNode = nodeMap.get(userNode.id);
	const peers =
		currentNode?.parent_id && !isSystemAdmin
			? allNodes
					.filter((n) => n.parent_id === currentNode.parent_id && n.id !== userNode.id)
					.map((n) => {
						const snap = snapshotByNode.get(n.id);
						return {
							id: n.id,
							name: n.name,
							title: n.title,
							nodeType: n.node_type,
							compositeTier: (snap?.composite_tier as TierLevel) ?? null
						};
					})
			: [];

	return { subtree, directReportHealth, peers };
};

export const actions: Actions = {
	/**
	 * Capture a snapshot for a specific direct report node.
	 *
	 * Allows directors and other leaders to capture individual node snapshots
	 * from the team overview page without navigating to each leader detail page.
	 * Uses the same ancestry-based permission check as the leaders detail page.
	 */
	captureSnapshot: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const nodeId = formData.get('nodeId')?.toString();
		const cycleLabel = formData.get('cycleLabel')?.toString().trim();
		const notes = formData.get('notes')?.toString().trim() || null;

		if (!nodeId || !cycleLabel) return fail(400, { error: 'validation.field_required' });

		const mgr = await verifyManagementAccess(locals.user.id, nodeId);
		if (!mgr) return fail(403, { error: 'error.generic' });

		// Load all metrics for the target node
		const { data: nodeMetrics } = await db
			.from('metrics')
			.select('id, name, measurement_type, origin, current_value, current_tier, weight')
			.eq('node_id', nodeId);

		const scoreable = (nodeMetrics ?? []).filter((m) => m.current_tier && m.weight);

		if (scoreable.length === 0) {
			return fail(400, { error: 'snapshot.no_scoreable_metrics' });
		}

		const compositeScore = calculateCompositeScore(
			scoreable.map((m) => ({
				tier: m.current_tier as TierLevel,
				weight: m.weight as number
			}))
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
				weight: m.weight as number
			}))
		);

		const { data: snapshot, error: snapErr } = await db
			.from('score_snapshots')
			.insert({
				organization_id: mgr.organizationId,
				node_id: nodeId,
				composite_score: compositeScore,
				composite_tier: compositeTier,
				metric_details: metricDetails as unknown as Record<string, unknown>,
				cycle_label: cycleLabel,
				notes,
				recorded_by: locals.user.id
			})
			.select()
			.single();

		if (snapErr || !snapshot) return fail(500, { error: 'error.generic' });

		// Lock all metrics on this node
		await db
			.from('metrics')
			.update({
				locked_by_snapshot_id: snapshot.id,
				updated_at: new Date().toISOString()
			})
			.eq('node_id', nodeId);

		return { snapshotSuccess: true, snapshotId: snapshot.id };
	}
};
