/**
 * Leader Detail Page Server
 *
 * Shows a single org node's profile: their metrics and goals.
 *
 * Visibility rules (four access paths):
 *
 * 1. **Own node** — full access always.
 *
 * 2. **Ancestor** — full access. If the current user's node is an ancestor
 *    of the target node in the hierarchy tree, they see everything.
 *
 * 3. **Peer** — controlled by the **parent node's** `peer_visibility`
 *    setting. Each leader sets how much their direct reports can see of
 *    each other's stacks:
 *      'score_only'  — name, title, composite tier only
 *      'metrics'     — metric names and current tiers (no thresholds/goals)
 *      'full'        — complete stack including thresholds and goals
 *
 * 4. **Visibility grant** — a grant from a leader (typically CEO) gives
 *    the grantee ancestor-equivalent access to a subtree or the entire org.
 *    Checked via the `visibility_grants` table.
 *
 * Inquiry eligibility:
 * - Inquiries may only be filed between peers (same parent node).
 */

import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import {
	calculateCompositeScore,
	getTierFromScore,
	calculateMetricDetails
} from '$lib/utils/score.js';
import {
	verifyManagementAccess,
	verifySnapshotAdjustAccess,
	getAncestorIds
} from '$lib/server/permissions.js';
import type { TierLevel } from '$lib/types/index.js';

const TIER_LEVELS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];

/**
 * Check whether `nodeId` is within the subtree rooted at `scopeNodeId`.
 * Returns true if `nodeId` equals `scopeNodeId` or is a descendant of it.
 */
async function isInSubtree(nodeId: string, scopeNodeId: string): Promise<boolean> {
	if (nodeId === scopeNodeId) return true;
	const ancestors = await getAncestorIds(nodeId);
	return ancestors.includes(scopeNodeId);
}

/** Visibility levels matching the peer_visibility enum */
type PeerVisibility = 'score_only' | 'metrics' | 'full';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { organization, userNode, isSystemAdmin: parentIsSystemAdmin } = await parent();

	// Load the requested node (must belong to same org)
	const { data: targetNode } = await db
		.from('org_hierarchy_nodes')
		.select('*, users!org_hierarchy_nodes_user_id_fkey(name, email)')
		.eq('id', params.id)
		.eq('organization_id', organization.id)
		.single();

	if (!targetNode) {
		error(404, { message: 'Person not found in this organization.' });
	}

	const userData = targetNode.users as { name: string; email: string } | null;

	// ── Visibility check ─────────────────────────────────────────────────────
	let canView = false; // full ancestor-like access
	let isPeer = false;
	let grantVisibility: PeerVisibility | null = null; // from visibility_grants

	if (!userNode) {
		canView = false;
	} else if (userNode.id === targetNode.id) {
		// Path 1: own node
		canView = true;
	} else {
		// Path 2: check if user is an ancestor of the target
		const ancestors = await getAncestorIds(targetNode.id);
		if (ancestors.includes(userNode.id)) {
			canView = true;
		} else {
			// Path 3: check if they are peers (share the same parent)
			const { data: userNodeRecord } = await db
				.from('org_hierarchy_nodes')
				.select('parent_id')
				.eq('id', userNode.id)
				.single();

			if (
				targetNode.parent_id &&
				userNodeRecord?.parent_id &&
				targetNode.parent_id === userNodeRecord.parent_id
			) {
				isPeer = true;
			}

			// Path 4: check for visibility grants
			if (!canView && !isPeer) {
				const { data: grants } = await db
					.from('visibility_grants')
					.select('*')
					.eq('grantee_node_id', userNode.id)
					.eq('organization_id', organization.id)
					.is('revoked_at', null);

				if (grants?.length) {
					for (const grant of grants) {
						if (!grant.scope_node_id) {
							// Org-wide grant — covers everything
							grantVisibility = grant.visibility as PeerVisibility;
							break;
						}
						// Scoped grant — check if target is in the subtree
						if (await isInSubtree(targetNode.id, grant.scope_node_id)) {
							grantVisibility = grant.visibility as PeerVisibility;
							break;
						}
					}
				}
			}
		}
	}

	// ── Determine effective peer visibility from the parent node ─────────────
	// When the user is a peer, the parent node's peer_visibility setting
	// controls what they can see. Fetch the parent node to read it.
	let peerVisibility: PeerVisibility = 'score_only';

	if (isPeer && targetNode.parent_id) {
		const { data: parentNode } = await db
			.from('org_hierarchy_nodes')
			.select('peer_visibility')
			.eq('id', targetNode.parent_id)
			.single();

		peerVisibility = (parentNode?.peer_visibility as PeerVisibility) ?? 'score_only';
	}

	// ── Compute effective access flags ───────────────────────────────────────
	// A visibility grant with 'full' gives the same access as canView.
	// A grant with 'metrics' is like peer with metrics visibility.
	const hasFullGrant = grantVisibility === 'full';
	const hasMetricsGrant = grantVisibility === 'metrics' || grantVisibility === 'full';

	const effectiveCanView = canView || hasFullGrant;
	const canSeeMetrics =
		effectiveCanView ||
		hasMetricsGrant ||
		(isPeer && (peerVisibility === 'metrics' || peerVisibility === 'full'));
	const canSeeThresholds =
		effectiveCanView || hasFullGrant || (isPeer && peerVisibility === 'full');
	// Peers can always see goals — goals show what someone is working toward.
	const canSeeGoals = effectiveCanView || hasFullGrant || isPeer;
	// Scoring data (composite tier, metric tiers) is communicated vertically
	// (manager ↔ report) only — peers must not see evaluative data that could
	// influence hiring, promotion, or firing decisions.
	const canSeeScores = effectiveCanView || hasFullGrant;

	// ── Management access check ─────────────────────────────────────────────
	// True when the current user is an ancestor OR has system_admin role.
	// Direct parent = immediate parent in hierarchy.
	// canManageNode = can perform management actions (assign, edit, snapshot, etc.)
	const isDirectParent =
		userNode !== null && targetNode.parent_id !== null && userNode.id === targetNode.parent_id;

	// Org-wide management comes from the layout's role check; no extra query needed.
	const isSystemAdmin = userNode ? parentIsSystemAdmin : false;

	// System admins can manage any node + get full visibility
	const canManageNode = isDirectParent || canView || isSystemAdmin;
	if (isSystemAdmin && !canView) {
		canView = true; // system_admin always has full view access
	}

	// Recompute effective access with system_admin included
	const _effectiveCanViewFinal = canView || hasFullGrant;

	let metrics: {
		id: string;
		name: string;
		description: string | null;
		weight: number | null;
		currentTier: TierLevel | null;
		indicatorType: string;
		measurementType: string;
		origin: string;
		submittedAt: string | null;
		approvedAt: string | null;
		lockedBySnapshotId: string | null;
		thresholds: { tier: TierLevel; description: string }[];
	}[] = [];

	if (canSeeMetrics) {
		const { data: nodeMetrics } = await db
			.from('metrics')
			.select('*')
			.eq('node_id', targetNode.id)
			.order('sort_order', { ascending: true });

		// Fetch thresholds for all metrics in a single query, then group by metric_id.
		const thresholdsByMetric = new Map<string, { tier: string; description: string | null }[]>();
		if (canSeeThresholds && (nodeMetrics ?? []).length > 0) {
			const metricIds = (nodeMetrics ?? []).map((m) => m.id);
			const { data: allThresholds } = await db
				.from('metric_thresholds')
				.select('metric_id, tier, description')
				.in('metric_id', metricIds);

			for (const t of allThresholds ?? []) {
				const list = thresholdsByMetric.get(t.metric_id) ?? [];
				list.push({ tier: t.tier, description: t.description });
				thresholdsByMetric.set(t.metric_id, list);
			}
		}

		metrics = (nodeMetrics ?? []).map((metric) => {
			const thresholds = canSeeThresholds
				? TIER_LEVELS.map((tier) => {
						const t = (thresholdsByMetric.get(metric.id) ?? []).find((th) => th.tier === tier);
						return { tier, description: t?.description || '' };
					})
				: [];

			return {
				id: metric.id,
				name: metric.name,
				description: effectiveCanView ? metric.description : null,
				weight: metric.weight,
				currentTier: canSeeScores ? metric.current_tier : null,
				indicatorType: metric.indicator_type,
				measurementType: metric.measurement_type,
				origin: metric.origin,
				submittedAt: metric.submitted_at || null,
				approvedAt: metric.approved_at || null,
				lockedBySnapshotId: metric.locked_by_snapshot_id || null,
				thresholds
			};
		});
	}

	// ── Goals ─────────────────────────────────────────────────────────────────
	let goals: {
		id: string;
		title: string;
		description: string | null;
		priority: string;
		status: string;
		goalType: string;
		targetTier: string | null;
		actualTier: string | null;
		dueDate: string | null;
	}[] = [];

	if (canSeeGoals) {
		const { data: nodeGoals } = await db
			.from('org_goals')
			.select('*')
			.eq('hierarchy_node_id', targetNode.id)
			.order('created_at', { ascending: true });

		goals = (nodeGoals ?? []).map((g) => ({
			id: g.id,
			title: g.title,
			description: g.description,
			priority: g.priority,
			status: g.status,
			goalType: g.goal_type,
			targetTier: g.target_tier,
			actualTier: canSeeScores ? g.actual_tier : null,
			dueDate: g.due_date
		}));
	}

	// ── Snapshot history ─────────────────────────────────────────────────────
	// Fetch all snapshots newest-first. For managers, include the adjuster's
	// name so the UI can show who adjusted a snapshot and when.
	const { data: snapshotRows } = await db
		.from('score_snapshots')
		.select(
			'id, composite_score, composite_tier, cycle_label, created_at, notes, adjusted_at, recorded_by, adjusted_by, users!score_snapshots_adjusted_by_fkey(name)'
		)
		.eq('node_id', targetNode.id)
		.order('created_at', { ascending: false });

	const latestSnapshot = snapshotRows?.[0] ?? null;

	// Only expose full snapshot history (with IDs for adjustment) to managers.
	const snapshotHistory = canManageNode
		? (snapshotRows ?? []).map((s) => {
				// supabase-js infers the FK join as an array even though it resolves
				// to at most one row; normalise to a single object or null.
				const adjusterRaw = s.users as unknown as { name: string } | { name: string }[] | null;
				const adjusterData = Array.isArray(adjusterRaw) ? (adjusterRaw[0] ?? null) : adjusterRaw;
				return {
					id: s.id,
					compositeScore: s.composite_score,
					compositeTier: s.composite_tier as TierLevel,
					cycleLabel: s.cycle_label,
					createdAt: s.created_at,
					notes: s.notes ?? null,
					adjustedAt: s.adjusted_at ?? null,
					adjustedByName: adjusterData?.name ?? null
				};
			})
		: [];

	// ── Inquiry eligibility ───────────────────────────────────────────────────
	const canFileInquiry = isPeer;

	return {
		targetNode: {
			id: targetNode.id,
			name: targetNode.name,
			title: targetNode.title,
			nodeType: targetNode.node_type,
			userName: userData?.name ?? null,
			userEmail: userData?.email ?? null
		},
		canView: effectiveCanView,
		isPeer,
		peerVisibility: isPeer ? peerVisibility : null,
		hasGrant: !!grantVisibility,
		metrics,
		goals,
		latestScore:
			latestSnapshot && canSeeScores
				? {
						score: latestSnapshot.composite_score,
						tier: latestSnapshot.composite_tier as TierLevel,
						cycleLabel: latestSnapshot.cycle_label
					}
				: null,
		snapshotHistory,
		canFileInquiry,
		isDirectParent,
		canManageNode,
		isSystemAdmin
	};
};

export const actions: Actions = {
	/**
	 * Approve a submitted metric proposal.
	 *
	 * Only the direct parent node's user (the manager) may approve.
	 * Sets approved_at + approved_by on the metric.
	 */
	approve: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();

		if (!metricId) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Use centralized management access check (hierarchy OR system_admin)
		const mgr = await verifyManagementAccess(locals.user.id, params.id);
		if (!mgr) {
			return fail(403, { error: 'error.generic' });
		}

		const { data: metric } = await db
			.from('metrics')
			.select('id, node_id')
			.eq('id', metricId)
			.eq('node_id', params.id)
			.single();

		if (!metric) {
			return fail(404, { error: 'error.generic' });
		}

		await db
			.from('metrics')
			.update({
				approved_at: new Date().toISOString(),
				approved_by: locals.user.id,
				updated_at: new Date().toISOString()
			})
			.eq('id', metricId);

		return { approveSuccess: true };
	},

	/**
	 * Step 1: CEO/leader assigns a required metric to a subordinate's stack.
	 *
	 * Creates a new metric on the target node with origin = 'superior_assigned'.
	 * The subordinate will see this metric on their own stack and can review,
	 * fill thresholds, then submit for the two-party agreement flow.
	 */
	assignMetric: async ({ request, params, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const mgr = await verifyManagementAccess(locals.user.id, params.id);
		if (!mgr) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString().trim();
		const weight = parseInt(formData.get('weight')?.toString() || '0', 10);

		if (!name) return fail(400, { error: 'validation.metric_name_required' });

		// Get max sort order for this node
		const { data: existing } = await db
			.from('metrics')
			.select('sort_order')
			.eq('node_id', params.id);
		const maxSort = Math.max(0, ...(existing ?? []).map((m) => m.sort_order));

		// Co-authorship flag: marks metrics developed collaboratively with the employee.
		// co_authored = metric was defined together (employee had meaningful input);
		// superior_assigned = metric was handed down unilaterally.
		const isCoAuthored = formData.get('isCoAuthored') === 'true';

		// Create the metric assigned to the subordinate
		const { data: newMetric, error: insertErr } = await db
			.from('metrics')
			.insert({
				organization_id: mgr.organizationId,
				node_id: params.id,
				assigned_by: locals.user.id,
				name,
				description,
				measurement_type: 'qualitative',
				indicator_type: 'health',
				origin: isCoAuthored ? 'co_authored' : 'superior_assigned',
				weight: weight || null,
				sort_order: maxSort + 1
			})
			.select()
			.single();

		if (insertErr || !newMetric) return fail(500, { error: 'error.generic' });

		// Create threshold stubs from the leader's input
		for (const tier of TIER_LEVELS) {
			const desc = formData.get(`threshold_${tier}`)?.toString().trim();
			if (desc) {
				await db.from('metric_thresholds').insert({
					metric_id: newMetric.id,
					tier,
					description: desc,
					set_by: locals.user.id
				});
			}
		}

		return { assignSuccess: true };
	},

	/**
	 * Step 4: Leader edits a subordinate's metric during review meeting.
	 *
	 * Only ancestors (direct parent or higher) can use this action.
	 * Unlike the employee's own edit, this does NOT clear approval —
	 * the leader IS the approving party.
	 */
	editMetric: async ({ request, params, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const mgr = await verifyManagementAccess(locals.user.id, params.id);
		if (!mgr) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString().trim();
		const weight = parseInt(formData.get('weight')?.toString() || '0', 10);
		const currentTier = formData.get('currentTier')?.toString() as TierLevel | undefined;

		if (!metricId || !name) return fail(400, { error: 'validation.field_required' });

		// Verify the metric belongs to the target node
		const { data: metric } = await db
			.from('metrics')
			.select('id, node_id')
			.eq('id', metricId)
			.eq('node_id', params.id)
			.single();

		if (!metric) return fail(404, { error: 'error.generic' });

		await db
			.from('metrics')
			.update({
				name,
				description,
				weight: weight || null,
				current_tier: currentTier || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', metricId);

		// Update thresholds
		for (const tier of TIER_LEVELS) {
			const desc = formData.get(`threshold_${tier}`)?.toString().trim();
			const { data: existing } = await db
				.from('metric_thresholds')
				.select('id')
				.eq('metric_id', metricId)
				.eq('tier', tier)
				.limit(1);

			if (existing?.[0]) {
				await db
					.from('metric_thresholds')
					.update({ description: desc || '', updated_at: new Date().toISOString() })
					.eq('id', existing[0].id);
			} else if (desc) {
				await db.from('metric_thresholds').insert({
					metric_id: metricId,
					tier,
					description: desc,
					set_by: locals.user.id
				});
			}
		}

		return { editSuccess: true };
	},

	/**
	 * Step 7: CEO/leader triggers an interval snapshot capture.
	 *
	 * Calculates the composite score from current metrics, creates an
	 * immutable snapshot, and locks all metrics on that node so the
	 * employee cannot modify them until the next cycle.
	 */
	captureSnapshot: async ({ request, params, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const mgr = await verifyManagementAccess(locals.user.id, params.id);
		if (!mgr) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const cycleLabel = formData.get('cycleLabel')?.toString().trim();
		const notes = formData.get('notes')?.toString().trim() || null;

		if (!cycleLabel) return fail(400, { error: 'validation.field_required' });

		// Load all metrics for the target node
		const { data: nodeMetrics } = await db
			.from('metrics')
			.select('id, name, measurement_type, origin, current_value, current_tier, weight')
			.eq('node_id', params.id);

		const scoreable = (nodeMetrics ?? []).filter((m) => m.current_tier && m.weight);

		if (scoreable.length === 0) {
			return fail(400, { error: 'snapshot.no_scoreable_metrics' });
		}

		// Calculate composite score
		const compositeScore = calculateCompositeScore(
			scoreable.map((m) => ({
				tier: m.current_tier as TierLevel,
				weight: m.weight as number
			}))
		);
		const compositeTier = getTierFromScore(compositeScore);

		// Build metric details
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

		// Create the snapshot
		const { data: snapshot, error: snapErr } = await db
			.from('score_snapshots')
			.insert({
				organization_id: mgr.organizationId,
				node_id: params.id,
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

		// Lock all metrics on this node — prevents employee edits
		await db
			.from('metrics')
			.update({
				locked_by_snapshot_id: snapshot.id,
				updated_at: new Date().toISOString()
			})
			.eq('node_id', params.id);

		return { snapshotSuccess: true, snapshotId: snapshot.id };
	},

	/**
	 * Step 8: CEO/leader adjusts a snapshot after capture.
	 *
	 * Allows modifying the composite score, tier, and notes.
	 * Records who made the adjustment and when.
	 */
	adjustSnapshot: async ({ request, params, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const mgr = await verifySnapshotAdjustAccess(locals.user.id, params.id);
		if (!mgr) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const snapshotId = formData.get('snapshotId')?.toString();
		const compositeScore = parseFloat(formData.get('compositeScore')?.toString() || '0');
		const compositeTier = formData.get('compositeTier')?.toString() as TierLevel;
		const notes = formData.get('notes')?.toString().trim() || null;

		if (!snapshotId || !compositeTier) return fail(400, { error: 'validation.field_required' });

		// Verify snapshot belongs to target node
		const { data: snapshot } = await db
			.from('score_snapshots')
			.select('id')
			.eq('id', snapshotId)
			.eq('node_id', params.id)
			.single();

		if (!snapshot) return fail(404, { error: 'error.generic' });

		await db
			.from('score_snapshots')
			.update({
				composite_score: compositeScore,
				composite_tier: compositeTier,
				notes,
				adjusted_by: locals.user.id,
				adjusted_at: new Date().toISOString()
			})
			.eq('id', snapshotId);

		return { adjustSuccess: true };
	},

	/**
	 * Step 9: CEO/leader starts a new cycle by unlocking metrics.
	 *
	 * Clears the locked_by_snapshot_id on all metrics for the target node,
	 * allowing the employee to edit, add, and re-submit metrics again.
	 */
	startNewCycle: async ({ params, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const mgr = await verifyManagementAccess(locals.user.id, params.id);
		if (!mgr) return fail(403, { error: 'error.generic' });

		// Unlock all metrics for this node
		await db
			.from('metrics')
			.update({
				locked_by_snapshot_id: null,
				// Clear submission/approval so the next cycle starts fresh
				submitted_at: null,
				submitted_by: null,
				approved_at: null,
				approved_by: null,
				updated_at: new Date().toISOString()
			})
			.eq('node_id', params.id);

		return { newCycleSuccess: true };
	}
};
