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

import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne, many, one } from "$lib/server/db.js";
import {
  calculateCompositeScore,
  getTierFromScore,
  calculateMetricDetails,
} from "$lib/utils/score.js";
import {
  verifyManagementAccess,
  verifySnapshotAdjustAccess,
  getAncestorIds,
} from "$lib/server/permissions.js";
import type { TierLevel } from "$lib/types/index.js";

const TIER_LEVELS: TierLevel[] = [
  "alarm",
  "concern",
  "content",
  "effective",
  "optimized",
];

/**
 * Check whether `nodeId` is within the subtree rooted at `scopeNodeId`.
 * Returns true if `nodeId` equals `scopeNodeId` or is a descendant of it.
 */
async function isInSubtree(
  nodeId: string,
  scopeNodeId: string,
): Promise<boolean> {
  if (nodeId === scopeNodeId) return true;
  const ancestors = await getAncestorIds(nodeId);
  return ancestors.includes(scopeNodeId);
}

/** Visibility levels matching the peer_visibility enum */
type PeerVisibility = "score_only" | "metrics" | "full";

export const load: PageServerLoad = async ({ params, parent }) => {
  const {
    organization,
    userNode,
    isSystemAdmin: parentIsSystemAdmin,
  } = await parent();

  // Load the requested node (must belong to same org)
  const targetNode = await maybeOne<{
    id: string;
    name: string;
    title: string | null;
    node_type: string;
    parent_id: string | null;
    organization_id: string;
    user_id: string | null;
    peer_visibility: string;
    user_name: string | null;
    user_email: string | null;
  }>(sql`
		select
			n.*,
			u.name  as user_name,
			u.email as user_email
		from org_hierarchy_nodes n
		left join users u on u.id = n.user_id
		where n.id = ${params.id}
		  and n.organization_id = ${organization.id}
	`);

  if (!targetNode) {
    error(404, { message: "Person not found in this organization." });
  }

  const userData = targetNode.user_name
    ? { name: targetNode.user_name, email: targetNode.user_email ?? "" }
    : null;

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
      const userNodeRecord = await maybeOne<{ parent_id: string | null }>(sql`
				select parent_id from org_hierarchy_nodes where id = ${userNode.id}
			`);

      if (
        targetNode.parent_id &&
        userNodeRecord?.parent_id &&
        targetNode.parent_id === userNodeRecord.parent_id
      ) {
        isPeer = true;
      }

      // Path 4: check for visibility grants
      if (!canView && !isPeer) {
        const grants = await many<{
          scope_node_id: string | null;
          visibility: string;
        }>(sql`
					select scope_node_id, visibility
					from visibility_grants
					where grantee_node_id = ${userNode.id}
					  and organization_id = ${organization.id}
					  and revoked_at is null
				`);

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

  // ── Determine effective peer visibility from the parent node ─────────────
  // When the user is a peer, the parent node's peer_visibility setting
  // controls what they can see. Fetch the parent node to read it.
  let peerVisibility: PeerVisibility = "score_only";

  if (isPeer && targetNode.parent_id) {
    const parentNode = await maybeOne<{ peer_visibility: string | null }>(sql`
			select peer_visibility from org_hierarchy_nodes where id = ${targetNode.parent_id}
		`);

    peerVisibility =
      (parentNode?.peer_visibility as PeerVisibility) ?? "score_only";
  }

  // ── Compute effective access flags ───────────────────────────────────────
  // A visibility grant with 'full' gives the same access as canView.
  // A grant with 'metrics' is like peer with metrics visibility.
  const hasFullGrant = grantVisibility === "full";
  const hasMetricsGrant =
    grantVisibility === "metrics" || grantVisibility === "full";

  const effectiveCanView = canView || hasFullGrant;
  const canSeeMetrics =
    effectiveCanView ||
    hasMetricsGrant ||
    (isPeer && (peerVisibility === "metrics" || peerVisibility === "full"));
  const canSeeThresholds =
    effectiveCanView || hasFullGrant || (isPeer && peerVisibility === "full");
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
    userNode !== null &&
    targetNode.parent_id !== null &&
    userNode.id === targetNode.parent_id;

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
    const nodeMetrics = await many<{
      id: string;
      name: string;
      description: string | null;
      weight: number | null;
      current_tier: string | null;
      indicator_type: string;
      measurement_type: string;
      origin: string;
      submitted_at: string | null;
      approved_at: string | null;
      locked_by_snapshot_id: string | null;
    }>(sql`
			select * from metrics
			where node_id = ${targetNode.id}
			order by sort_order asc
		`);

    // Fetch thresholds for all metrics in a single query, then group by metric_id.
    const thresholdsByMetric = new Map<
      string,
      { tier: string; description: string | null }[]
    >();
    if (canSeeThresholds && nodeMetrics.length > 0) {
      const metricIds = nodeMetrics.map((m) => m.id);
      const allThresholds = await many<{
        metric_id: string;
        tier: string;
        description: string | null;
      }>(sql`
				select metric_id, tier, description
				from metric_thresholds
				where metric_id in ${sql(metricIds)}
			`);

      for (const t of allThresholds) {
        const list = thresholdsByMetric.get(t.metric_id) ?? [];
        list.push({ tier: t.tier, description: t.description });
        thresholdsByMetric.set(t.metric_id, list);
      }
    }

    metrics = nodeMetrics.map((metric) => {
      const thresholds = canSeeThresholds
        ? TIER_LEVELS.map((tier) => {
            const t = (thresholdsByMetric.get(metric.id) ?? []).find(
              (th) => th.tier === tier,
            );
            return { tier, description: t?.description || "" };
          })
        : [];

      return {
        id: metric.id,
        name: metric.name,
        description: effectiveCanView ? metric.description : null,
        weight: metric.weight,
        currentTier: canSeeScores
          ? (metric.current_tier as TierLevel | null)
          : null,
        indicatorType: metric.indicator_type,
        measurementType: metric.measurement_type,
        origin: metric.origin,
        submittedAt: metric.submitted_at || null,
        approvedAt: metric.approved_at || null,
        lockedBySnapshotId: metric.locked_by_snapshot_id || null,
        thresholds,
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
    const nodeGoals = await many<{
      id: string;
      title: string;
      description: string | null;
      priority: string;
      status: string;
      goal_type: string;
      target_tier: string | null;
      actual_tier: string | null;
      due_date: string | null;
    }>(sql`
			select * from org_goals
			where hierarchy_node_id = ${targetNode.id}
			order by created_at asc
		`);

    goals = nodeGoals.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: g.status,
      goalType: g.goal_type,
      targetTier: g.target_tier,
      actualTier: canSeeScores ? g.actual_tier : null,
      dueDate: g.due_date,
    }));
  }

  // ── Snapshot history ─────────────────────────────────────────────────────
  // Fetch all snapshots newest-first. For managers, include the adjuster's
  // name so the UI can show who adjusted a snapshot and when.
  const snapshotRows = await many<{
    id: string;
    composite_score: number;
    composite_tier: string;
    cycle_label: string;
    created_at: string;
    notes: string | null;
    adjusted_at: string | null;
    recorded_by: string;
    adjusted_by: string | null;
    adjuster_name: string | null;
  }>(sql`
		select
			s.id, s.composite_score, s.composite_tier, s.cycle_label,
			s.created_at, s.notes, s.adjusted_at, s.recorded_by, s.adjusted_by,
			u.name as adjuster_name
		from score_snapshots s
		left join users u on u.id = s.adjusted_by
		where s.node_id = ${targetNode.id}
		order by s.created_at desc
	`);

  const latestSnapshot = snapshotRows[0] ?? null;

  // Only expose full snapshot history (with IDs for adjustment) to managers.
  const snapshotHistory = canManageNode
    ? snapshotRows.map((s) => ({
        id: s.id,
        compositeScore: s.composite_score,
        compositeTier: s.composite_tier as TierLevel,
        cycleLabel: s.cycle_label,
        createdAt: s.created_at,
        notes: s.notes ?? null,
        adjustedAt: s.adjusted_at ?? null,
        adjustedByName: s.adjuster_name ?? null,
      }))
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
      userEmail: userData?.email ?? null,
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
            cycleLabel: latestSnapshot.cycle_label,
          }
        : null,
    snapshotHistory,
    canFileInquiry,
    isDirectParent,
    canManageNode,
    isSystemAdmin,
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
      return fail(403, { error: "error.generic" });
    }

    const formData = await request.formData();
    const metricId = formData.get("metricId")?.toString();

    if (!metricId) {
      return fail(400, { error: "validation.field_required" });
    }

    // Use centralized management access check (hierarchy OR system_admin)
    const mgr = await verifyManagementAccess(locals.user.id, params.id);
    if (!mgr) {
      return fail(403, { error: "error.generic" });
    }

    const metric = await maybeOne<{ id: string }>(sql`
			select id from metrics where id = ${metricId} and node_id = ${params.id}
		`);

    if (!metric) {
      return fail(404, { error: "error.generic" });
    }

    await sql`
			update metrics
			set approved_at = now(),
			    approved_by = ${locals.user.id},
			    updated_at = now()
			where id = ${metricId}
		`;

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
    if (!locals.user) return fail(403, { error: "error.generic" });

    const mgr = await verifyManagementAccess(locals.user.id, params.id);
    if (!mgr) return fail(403, { error: "error.generic" });

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const weight = parseInt(formData.get("weight")?.toString() || "0", 10);

    if (!name) return fail(400, { error: "validation.metric_name_required" });

    // Get max sort order for this node
    const existing = await many<{ sort_order: number }>(sql`
			select sort_order from metrics where node_id = ${params.id}
		`);
    const maxSort = Math.max(0, ...existing.map((m) => m.sort_order));

    // Co-authorship flag: marks metrics developed collaboratively with the employee.
    // co_authored = metric was defined together (employee had meaningful input);
    // superior_assigned = metric was handed down unilaterally.
    const isCoAuthored = formData.get("isCoAuthored") === "true";
    const origin = isCoAuthored ? "co_authored" : "superior_assigned";
    const sortOrder = maxSort + 1;
    const weightOrNull = weight || null;
    const descriptionOrNull = description || null;

    // Create the metric assigned to the subordinate
    const newMetric = await one<{ id: string }>(sql`
			insert into metrics (
				organization_id, node_id, assigned_by, name, description,
				measurement_type, indicator_type, origin, weight, sort_order
			) values (
				${mgr.organizationId}, ${params.id}, ${locals.user.id}, ${name}, ${descriptionOrNull},
				'qualitative', 'health', ${origin}, ${weightOrNull}, ${sortOrder}
			)
			returning id
		`);

    // Create threshold stubs from the leader's input
    for (const tier of TIER_LEVELS) {
      const desc = formData.get(`threshold_${tier}`)?.toString().trim();
      if (desc) {
        await sql`
					insert into metric_thresholds (metric_id, tier, description, set_by)
					values (${newMetric.id}, ${tier}, ${desc}, ${locals.user.id})
				`;
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
    if (!locals.user) return fail(403, { error: "error.generic" });

    const mgr = await verifyManagementAccess(locals.user.id, params.id);
    if (!mgr) return fail(403, { error: "error.generic" });

    const formData = await request.formData();
    const metricId = formData.get("metricId")?.toString();
    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const weight = parseInt(formData.get("weight")?.toString() || "0", 10);
    const currentTier = formData.get("currentTier")?.toString() as
      | TierLevel
      | undefined;

    if (!metricId || !name)
      return fail(400, { error: "validation.field_required" });

    // Verify the metric belongs to the target node
    const metric = await maybeOne<{ id: string }>(sql`
			select id from metrics where id = ${metricId} and node_id = ${params.id}
		`);

    if (!metric) return fail(404, { error: "error.generic" });

    const weightOrNull = weight || null;
    const tierOrNull = currentTier || null;
    const descriptionOrNull = description || null;

    await sql`
			update metrics
			set name = ${name},
			    description = ${descriptionOrNull},
			    weight = ${weightOrNull},
			    current_tier = ${tierOrNull},
			    updated_at = now()
			where id = ${metricId}
		`;

    // Update thresholds
    for (const tier of TIER_LEVELS) {
      const desc = formData.get(`threshold_${tier}`)?.toString().trim();
      const existing = await maybeOne<{ id: string }>(sql`
				select id from metric_thresholds
				where metric_id = ${metricId} and tier = ${tier}
				limit 1
			`);

      if (existing) {
        await sql`
					update metric_thresholds
					set description = ${desc || ""}, updated_at = now()
					where id = ${existing.id}
				`;
      } else if (desc) {
        await sql`
					insert into metric_thresholds (metric_id, tier, description, set_by)
					values (${metricId}, ${tier}, ${desc}, ${locals.user.id})
				`;
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
    if (!locals.user) return fail(403, { error: "error.generic" });

    const mgr = await verifyManagementAccess(locals.user.id, params.id);
    if (!mgr) return fail(403, { error: "error.generic" });

    const formData = await request.formData();
    const cycleLabel = formData.get("cycleLabel")?.toString().trim();
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!cycleLabel) return fail(400, { error: "validation.field_required" });

    // Load all metrics for the target node
    const nodeMetrics = await many<{
      id: string;
      name: string;
      measurement_type: string;
      origin: string;
      current_value: string | number | null;
      current_tier: string | null;
      weight: number | null;
    }>(sql`
			select id, name, measurement_type, origin, current_value, current_tier, weight
			from metrics
			where node_id = ${params.id}
		`);

    const scoreable = nodeMetrics.filter((m) => m.current_tier && m.weight);

    if (scoreable.length === 0) {
      return fail(400, { error: "snapshot.no_scoreable_metrics" });
    }

    // Calculate composite score
    const compositeScore = calculateCompositeScore(
      scoreable.map((m) => ({
        tier: m.current_tier as TierLevel,
        weight: m.weight as number,
      })),
    );
    const compositeTier = getTierFromScore(compositeScore);

    // Build metric details
    const metricDetails = calculateMetricDetails(
      scoreable.map((m) => ({
        id: m.id,
        name: m.name,
        measurementType: m.measurement_type,
        origin: m.origin,
        currentValue: m.current_value as string | number | null,
        currentTier: m.current_tier as TierLevel,
        weight: m.weight as number,
      })),
    );

    // Create the snapshot
    const snapshot = await one<{ id: string }>(sql`
			insert into score_snapshots (
				organization_id, node_id, composite_score, composite_tier,
				metric_details, cycle_label, notes, recorded_by
			) values (
				${mgr.organizationId}, ${params.id}, ${compositeScore}, ${compositeTier},
				${sql.json(metricDetails as never)},
				${cycleLabel}, ${notes}, ${locals.user.id}
			)
			returning id
		`);

    // Lock all metrics on this node — prevents employee edits
    await sql`
			update metrics
			set locked_by_snapshot_id = ${snapshot.id},
			    updated_at = now()
			where node_id = ${params.id}
		`;

    return { snapshotSuccess: true, snapshotId: snapshot.id };
  },

  /**
   * Step 8: CEO/leader adjusts a snapshot after capture.
   *
   * Allows modifying the composite score, tier, and notes.
   * Records who made the adjustment and when.
   */
  adjustSnapshot: async ({ request, params, locals }) => {
    if (!locals.user) return fail(403, { error: "error.generic" });

    const mgr = await verifySnapshotAdjustAccess(locals.user.id, params.id);
    if (!mgr) return fail(403, { error: "error.generic" });

    const formData = await request.formData();
    const snapshotId = formData.get("snapshotId")?.toString();
    const compositeScore = parseFloat(
      formData.get("compositeScore")?.toString() || "0",
    );
    const compositeTier = formData
      .get("compositeTier")
      ?.toString() as TierLevel;
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!snapshotId || !compositeTier)
      return fail(400, { error: "validation.field_required" });

    // Verify snapshot belongs to target node
    const snapshot = await maybeOne<{ id: string }>(sql`
			select id from score_snapshots
			where id = ${snapshotId} and node_id = ${params.id}
		`);

    if (!snapshot) return fail(404, { error: "error.generic" });

    await sql`
			update score_snapshots
			set composite_score = ${compositeScore},
			    composite_tier = ${compositeTier},
			    notes = ${notes},
			    adjusted_by = ${locals.user.id},
			    adjusted_at = now()
			where id = ${snapshotId}
		`;

    return { adjustSuccess: true };
  },

  /**
   * Step 9: CEO/leader starts a new cycle by unlocking metrics.
   *
   * Clears the locked_by_snapshot_id on all metrics for the target node,
   * allowing the employee to edit, add, and re-submit metrics again.
   */
  startNewCycle: async ({ params, locals }) => {
    if (!locals.user) return fail(403, { error: "error.generic" });

    const mgr = await verifyManagementAccess(locals.user.id, params.id);
    if (!mgr) return fail(403, { error: "error.generic" });

    // Unlock all metrics for this node
    await sql`
			update metrics
			set locked_by_snapshot_id = null,
			    submitted_at = null,
			    submitted_by = null,
			    approved_at = null,
			    approved_by = null,
			    updated_at = now()
			where node_id = ${params.id}
		`;

    return { newCycleSuccess: true };
  },
};
