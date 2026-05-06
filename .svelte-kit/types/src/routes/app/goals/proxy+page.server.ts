// @ts-nocheck
/**
 * Goals Page Server
 *
 * Combined handler for two related concepts on one page:
 *
 * 1. **Metric Stack** — Primer quintile framework: metric definitions, weights,
 *    threshold calibration, tier recording, and manager review workflow.
 *
 * 2. **Goals** — OKR-style goal management: create/track goals with type,
 *    priority, status, tier alignment, dependencies, and team rollup.
 *
 * Actions are namespaced to avoid collisions:
 *   Metric actions: createMetric, updateMetric, deleteMetric, updateWeights, submitMetric, recordTier
 *   Goal actions:   createGoal, updateGoal, deleteGoal, addDependency, cascade, removeDependency
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql, maybeOne, many, one } from '$lib/server/db.js';
import type { TierLevel, GoalType, GoalPriority, GoalStatus } from '$lib/types/index.js';
import type { GoalDependencyType } from '$lib/types/database.js';
import { getDirectChildNodeIds } from '$lib/server/hierarchy.js';
import { loadActionContext } from '$lib/server/action-context.js';

const TIER_LEVELS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];
const VALID_GOAL_TYPES: GoalType[] = ['strategic', 'operational', 'developmental', 'compliance'];
const VALID_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high'];
const VALID_STATUSES: GoalStatus[] = ['defined', 'in_progress', 'completed', 'deferred'];
const VALID_TIERS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];

/** Valid performance cadence values */
const VALID_CADENCES = ['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'] as const;

/**
 * Resolve the hierarchy node for performance write actions.
 */
async function resolveActionNode(
	userId: string
): Promise<{ id: string; organization_id: string } | null> {
	return await maybeOne<{ id: string; organization_id: string }>(sql`
		select id, organization_id from org_hierarchy_nodes where user_id = ${userId} limit 1
	`);
}

/** Shape of a goal returned to the client */
interface GoalRow {
	id: string;
	title: string;
	description: string | null;
	priority: string;
	status: string;
	goalType: string;
	goalOrigin: string;
	sourceGoalId: string | null;
	targetTier: string | null;
	actualTier: string | null;
	targetValue: Record<string, unknown> | null;
	actualValue: Record<string, unknown> | null;
	dueDate: string | null;
	assignedBy: string | null;
	snapshotId: string | null;
	createdAt: string;
	nodeName: string | null;
	nodeId: string | null;
}

/** One entry in the immutable goal adjustment log */
interface GoalAdjustmentRow {
	id: string;
	goalId: string;
	adjustedBy: string;
	adjustedByName: string | null;
	field: string;
	oldValue: string | null;
	newValue: string | null;
	reason: string | null;
	createdAt: string;
}

/** Shape of a dependency returned to the client */
interface DependencyRow {
	id: string;
	goalId: string;
	dependsOnGoalId: string;
	dependencyType: string;
	description: string | null;
	dependsOnTitle: string | null;
	dependsOnNodeName: string | null;
}

/**
 * Check whether a metric is locked by a snapshot.
 * Returns true if the metric has a locked_by_snapshot_id set.
 */
async function isMetricLocked(metricId: string): Promise<boolean> {
	const row = await maybeOne<{ locked_by_snapshot_id: string | null }>(sql`
		select locked_by_snapshot_id from metrics where id = ${metricId}
	`);
	return !!row?.locked_by_snapshot_id;
}

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
	const { organization, userNode, hasDirectReports, membership } = await parent();

	if (!userNode) {
		redirect(302, '/app');
	}

	// ── Metrics (Primer quintile stack) ───────────────────────────────────────
	const nodeMetrics = await many<{
		id: string;
		name: string;
		description: string | null;
		measurement_type: string;
		indicator_type: string;
		origin: string;
		weight: number | null;
		current_tier: string | null;
		sort_order: number;
		submitted_at: string | null;
		approved_at: string | null;
		locked_by_snapshot_id: string | null;
		performance_cadence: string | null;
	}>(sql`
		select * from metrics where node_id = ${userNode.id} order by sort_order asc
	`);

	// Fetch thresholds for all metrics in a single query, then group by metric_id.
	const metricIds = nodeMetrics.map((m) => m.id);
	const thresholdsByMetric = new Map<string, { tier: string; description: string | null }[]>();
	if (metricIds.length > 0) {
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

	const metricsWithThresholds = nodeMetrics.map((metric) => {
		const thresholds = thresholdsByMetric.get(metric.id) ?? [];
		return {
			id: metric.id,
			name: metric.name,
			description: metric.description,
			measurementType: metric.measurement_type,
			indicatorType: metric.indicator_type,
			origin: metric.origin,
			weight: metric.weight,
			currentTier: metric.current_tier as TierLevel | null,
			sortOrder: metric.sort_order,
			submittedAt: metric.submitted_at || null,
			approvedAt: metric.approved_at || null,
			lockedBySnapshotId: metric.locked_by_snapshot_id || null,
			thresholds: TIER_LEVELS.map((tier) => {
				const threshold = thresholds.find((t) => t.tier === tier);
				return { tier, description: threshold?.description || '' };
			})
		};
	});

	const totalWeight = nodeMetrics.reduce((sum, m) => sum + (m.weight || 0), 0);

	// ── My Goals ─────────────────────────────────────────────────────────────
	const myGoals = await many<{
		id: string;
		title: string;
		description: string | null;
		priority: string;
		status: string;
		goal_type: string;
		goal_origin: string | null;
		source_goal_id: string | null;
		target_tier: string | null;
		actual_tier: string | null;
		target_value: Record<string, unknown> | null;
		actual_value: Record<string, unknown> | null;
		due_date: string | null;
		assigned_by: string | null;
		snapshot_id: string | null;
		created_at: string;
	}>(sql`
		select * from org_goals
		where hierarchy_node_id = ${userNode.id}
		order by created_at asc
	`);

	const goals: GoalRow[] = myGoals.map((g) => ({
		id: g.id,
		title: g.title,
		description: g.description,
		priority: g.priority,
		status: g.status,
		goalType: g.goal_type,
		goalOrigin: g.goal_origin ?? 'self_created',
		sourceGoalId: g.source_goal_id ?? null,
		targetTier: g.target_tier,
		actualTier: g.actual_tier,
		targetValue: g.target_value,
		actualValue: g.actual_value,
		dueDate: g.due_date,
		assignedBy: g.assigned_by,
		snapshotId: g.snapshot_id,
		createdAt: g.created_at,
		nodeName: userNode.name,
		nodeId: userNode.id
	}));

	// ── Dependencies for my goals ────────────────────────────────────────────
	const goalIds = goals.map((g) => g.id);
	let dependencies: DependencyRow[] = [];

	if (goalIds.length > 0) {
		const deps = await many<{
			id: string;
			goal_id: string;
			depends_on_goal_id: string;
			dependency_type: string;
			description: string | null;
			depends_on_title: string | null;
			depends_on_node_id: string | null;
		}>(sql`
			select
				d.id, d.goal_id, d.depends_on_goal_id, d.dependency_type, d.description,
				g.title              as depends_on_title,
				g.hierarchy_node_id  as depends_on_node_id
			from goal_dependencies d
			left join org_goals g on g.id = d.depends_on_goal_id
			where d.goal_id in ${sql(goalIds)}
		`);

		if (deps.length > 0) {
			const depNodeIds = deps
				.map((d) => d.depends_on_node_id)
				.filter((id): id is string => !!id);

			let nodeNameMap: Record<string, string> = {};
			if (depNodeIds.length > 0) {
				const nodes = await many<{ id: string; name: string }>(sql`
					select id, name from org_hierarchy_nodes where id in ${sql(depNodeIds)}
				`);
				nodeNameMap = Object.fromEntries(nodes.map((n) => [n.id, n.name]));
			}

			dependencies = deps.map((d) => ({
				id: d.id,
				goalId: d.goal_id,
				dependsOnGoalId: d.depends_on_goal_id,
				dependencyType: d.dependency_type,
				description: d.description,
				dependsOnTitle: d.depends_on_title ?? null,
				dependsOnNodeName: d.depends_on_node_id
					? (nodeNameMap[d.depends_on_node_id] ?? null)
					: null
			}));
		}
	}

	// ── Parent Goals (upward visibility for ICs) ────────────────────────────
	let parentGoals: GoalRow[] = [];

	if (!hasDirectReports && userNode) {
		// Fetch the current node and its parent (via join) in one round-trip.
		const currentNodeData = await maybeOne<{
			parent_id: string | null;
			parent_node_id: string | null;
			parent_node_name: string | null;
		}>(sql`
			select
				n.parent_id,
				p.id   as parent_node_id,
				p.name as parent_node_name
			from org_hierarchy_nodes n
			left join org_hierarchy_nodes p on p.id = n.parent_id
			where n.id = ${userNode.id}
		`);

		if (currentNodeData?.parent_id && currentNodeData.parent_node_id) {
			const parentNodeData = {
				id: currentNodeData.parent_node_id,
				name: currentNodeData.parent_node_name ?? ''
			};

			{
				const pGoals = await many<{
					id: string;
					title: string;
					priority: string;
					status: string;
					goal_type: string;
					target_tier: string | null;
					actual_tier: string | null;
					due_date: string | null;
					created_at: string;
				}>(sql`
					select id, title, priority, status, goal_type, target_tier, actual_tier, due_date, created_at
					from org_goals
					where hierarchy_node_id = ${parentNodeData.id}
					order by created_at asc
				`);

				parentGoals = pGoals.map((g) => ({
					id: g.id,
					title: g.title,
					description: null, // title-only visibility
					priority: g.priority,
					status: g.status,
					goalType: g.goal_type,
					goalOrigin: 'self_created',
					sourceGoalId: null,
					targetTier: g.target_tier,
					actualTier: g.actual_tier,
					targetValue: null,
					actualValue: null,
					dueDate: g.due_date,
					assignedBy: null,
					snapshotId: null,
					createdAt: g.created_at,
					nodeName: parentNodeData.name,
					nodeId: parentNodeData.id
				}));
			}
		}
	}

	// ── Team Goals Rollup ────────────────────────────────────────────────────
	let teamGoals: GoalRow[] = [];

	if (hasDirectReports) {
		const allNodes = await many<{ id: string; name: string; parent_id: string | null }>(sql`
			select id, name, parent_id
			from org_hierarchy_nodes
			where organization_id = ${organization.id}
		`);

		const descendantIds: string[] = [];
		function collectDescendants(parentId: string) {
			for (const node of allNodes) {
				if (node.parent_id === parentId) {
					descendantIds.push(node.id);
					collectDescendants(node.id);
				}
			}
		}
		collectDescendants(userNode.id);

		if (descendantIds.length > 0) {
			const descGoals = await many<{
				id: string;
				title: string;
				description: string | null;
				priority: string;
				status: string;
				goal_type: string;
				goal_origin: string | null;
				source_goal_id: string | null;
				target_tier: string | null;
				actual_tier: string | null;
				target_value: Record<string, unknown> | null;
				actual_value: Record<string, unknown> | null;
				due_date: string | null;
				assigned_by: string | null;
				snapshot_id: string | null;
				created_at: string;
				hierarchy_node_id: string;
				node_name: string | null;
			}>(sql`
				select g.*, n.name as node_name
				from org_goals g
				left join org_hierarchy_nodes n on n.id = g.hierarchy_node_id
				where g.hierarchy_node_id in ${sql(descendantIds)}
				order by g.created_at asc
			`);

			teamGoals = descGoals.map((g) => ({
				id: g.id,
				title: g.title,
				description: g.description,
				priority: g.priority,
				status: g.status,
				goalType: g.goal_type,
				goalOrigin: g.goal_origin ?? 'self_created',
				sourceGoalId: g.source_goal_id ?? null,
				targetTier: g.target_tier,
				actualTier: g.actual_tier,
				targetValue: g.target_value,
				actualValue: g.actual_value,
				dueDate: g.due_date,
				assignedBy: g.assigned_by,
				snapshotId: g.snapshot_id,
				createdAt: g.created_at,
				nodeName: g.node_name ?? null,
				nodeId: g.hierarchy_node_id
			}));
		}
	}

	// ── Cascade tracking ────────────────────────────────────────────────────
	const cascadeStatus: Record<
		string,
		{ total: number; accepted: number; deferred: number; pending: number }
	> = {};

	if (hasDirectReports && goals.length > 0) {
		const myGoalIds = goals.map((g) => g.id);
		const cascadedGoals = await many<{ source_goal_id: string | null; status: string }>(sql`
			select source_goal_id, status
			from org_goals
			where source_goal_id in ${sql(myGoalIds)}
		`);

		for (const cg of cascadedGoals) {
			if (!cg.source_goal_id) continue;
			if (!cascadeStatus[cg.source_goal_id]) {
				cascadeStatus[cg.source_goal_id] = { total: 0, accepted: 0, deferred: 0, pending: 0 };
			}
			const entry = cascadeStatus[cg.source_goal_id];
			entry.total++;
			if (cg.status === 'in_progress' || cg.status === 'completed') {
				entry.accepted++;
			} else if (cg.status === 'deferred') {
				entry.deferred++;
			} else {
				entry.pending++;
			}
		}
	}

	// ── Available goals for dependency selection ─────────────────────────────
	const allOrgGoals = await many<{
		id: string;
		title: string;
		node_name: string | null;
	}>(sql`
		select g.id, g.title, n.name as node_name
		from org_goals g
		left join org_hierarchy_nodes n on n.id = g.hierarchy_node_id
		where g.organization_id = ${organization.id}
		order by g.title asc
	`);

	const availableGoals = allOrgGoals.map((g) => ({
		id: g.id,
		title: g.title,
		nodeName: g.node_name ?? null
	}));

	// ── Goal adjustment log ──────────────────────────────────────────────────
	let goalAdjustments: GoalAdjustmentRow[] = [];

	if (goalIds.length > 0) {
		const adjustments = await many<{
			id: string;
			goal_id: string;
			adjusted_by: string;
			field: string;
			old_value: string | null;
			new_value: string | null;
			reason: string | null;
			created_at: string;
			adjuster_name: string | null;
		}>(sql`
			select a.*, u.name as adjuster_name
			from goal_adjustments a
			left join users u on u.id = a.adjusted_by
			where a.goal_id in ${sql(goalIds)}
			order by a.created_at desc
		`);

		goalAdjustments = adjustments.map((a) => ({
			id: a.id,
			goalId: a.goal_id,
			adjustedBy: a.adjusted_by,
			adjustedByName: a.adjuster_name ?? null,
			field: a.field,
			oldValue: a.old_value,
			newValue: a.new_value,
			reason: a.reason,
			createdAt: a.created_at
		}));
	}

	// ── Performance log entries ──────────────────────────────────────────
	const logEntries = await many<{
		id: string;
		metric_id: string;
		period_start: string;
		period_end: string;
		cadence: string;
		measured_value: Record<string, unknown> | null;
		assessed_tier: string;
		data_source: string | null;
		notes: string | null;
		recorded_by: string;
		created_at: string;
	}>(sql`
		select * from performance_logs
		where node_id = ${userNode.id}
		order by period_start desc
		limit 100
	`);

	const performanceEntries = logEntries.map((e) => ({
		id: e.id,
		metricId: e.metric_id,
		periodStart: e.period_start,
		periodEnd: e.period_end,
		cadence: e.cadence,
		measuredValue: e.measured_value,
		assessedTier: e.assessed_tier as TierLevel,
		dataSource: e.data_source,
		notes: e.notes,
		recordedBy: e.recorded_by,
		createdAt: e.created_at
	}));

	// ── Metrics with performance cadence (for performance tab) ────────────
	const performanceMetrics = nodeMetrics.map((m) => ({
		id: m.id,
		name: m.name,
		measurementType: m.measurement_type,
		weight: m.weight,
		currentTier: m.current_tier as TierLevel | null,
		performanceCadence: m.performance_cadence
	}));

	return {
		metrics: metricsWithThresholds,
		totalWeight,
		goals,
		dependencies,
		teamGoals,
		parentGoals,
		hasDirectReports,
		availableGoals,
		cascadeStatus,
		goalAdjustments,
		canWrite: membership.role !== 'viewer',
		performanceEntries,
		performanceMetrics,
		orgCadence: organization.cycleCadence
	};
};

export const actions = {
	// ── Metric Actions ────────────────────────────────────────────────────────

	/**
	 * Create a new metric.
	 * Allowed even when other metrics are locked — employees can always
	 * propose new metrics for the next cycle.
	 */
	createMetric: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || !ctx.userNode || ctx.membership.role === 'viewer')
			return fail(403, { error: 'error.generic' });
		const { userNode, organization } = ctx;

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString().trim();
		const measurementType = formData.get('measurementType')?.toString();
		const indicatorType = formData.get('indicatorType')?.toString();
		const origin = formData.get('origin')?.toString();
		const weight = parseInt(formData.get('weight')?.toString() || '0', 10);

		if (!name) return fail(400, { error: 'validation.metric_name_required' });

		const existingMetrics = await many<{ sort_order: number }>(sql`
			select sort_order from metrics where node_id = ${userNode.id}
		`);

		const maxSortOrder = Math.max(0, ...existingMetrics.map((m) => m.sort_order));
		const measurement = measurementType || 'qualitative';
		const indicator = indicatorType || 'health';
		const originVal = origin || 'self_defined';
		const weightOrNull = weight || null;
		const descriptionOrNull = description || null;
		const sortOrder = maxSortOrder + 1;

		const newMetric = await one<{ id: string }>(sql`
			insert into metrics (
				organization_id, node_id, assigned_by, name, description,
				measurement_type, indicator_type, origin, weight, sort_order
			) values (
				${organization.id}, ${userNode.id}, ${locals.user.id}, ${name}, ${descriptionOrNull},
				${measurement}, ${indicator}, ${originVal}, ${weightOrNull}, ${sortOrder}
			)
			returning id
		`);

		for (const tier of TIER_LEVELS) {
			const thresholdDesc = formData.get(`threshold_${tier}`)?.toString().trim();
			if (thresholdDesc) {
				await sql`
					insert into metric_thresholds (metric_id, tier, description, set_by)
					values (${newMetric.id}, ${tier}, ${thresholdDesc}, ${locals.user.id})
				`;
			}
		}

		return { success: true, metricId: newMetric.id };
	},

	/**
	 * Update a metric and its thresholds.
	 * Blocked when the metric is locked by a snapshot capture.
	 */
	updateMetric: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString().trim();
		const weight = parseInt(formData.get('weight')?.toString() || '0', 10);
		const currentTier = formData.get('currentTier')?.toString() as TierLevel | undefined;

		if (!metricId || !name) return fail(400, { error: 'validation.field_required' });
		if (await isMetricLocked(metricId)) return fail(403, { error: 'metric.locked' });

		const weightOrNull = weight || null;
		const tierOrNull = currentTier || null;
		const descriptionOrNull = description || null;

		await sql`
			update metrics
			set name = ${name},
			    description = ${descriptionOrNull},
			    weight = ${weightOrNull},
			    current_tier = ${tierOrNull},
			    approved_at = null,
			    approved_by = null,
			    updated_at = now()
			where id = ${metricId}
		`;

		for (const tier of TIER_LEVELS) {
			const thresholdDesc = formData.get(`threshold_${tier}`)?.toString().trim();

			const existingThreshold = await maybeOne<{ id: string }>(sql`
				select id from metric_thresholds
				where metric_id = ${metricId} and tier = ${tier}
				limit 1
			`);

			if (existingThreshold) {
				await sql`
					update metric_thresholds
					set description = ${thresholdDesc || ''}, updated_at = now()
					where id = ${existingThreshold.id}
				`;
			} else if (thresholdDesc) {
				await sql`
					insert into metric_thresholds (metric_id, tier, description, set_by)
					values (${metricId}, ${tier}, ${thresholdDesc}, ${locals.user.id})
				`;
			}
		}

		return { success: true };
	},

	/**
	 * Delete a metric. Blocked when locked by a snapshot.
	 */
	deleteMetric: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		if (!metricId) return fail(400, { error: 'validation.field_required' });
		if (await isMetricLocked(metricId)) return fail(403, { error: 'metric.locked' });

		await sql`delete from metrics where id = ${metricId}`;
		return { success: true };
	},

	/**
	 * Update weights for all metrics. Total must equal 100.
	 */
	updateWeights: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const weights = JSON.parse(formData.get('weights')?.toString() || '{}') as Record<
			string,
			number
		>;

		const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
		if (total !== 100) return fail(400, { error: 'validation.weights_must_total' });

		for (const [metricId, weight] of Object.entries(weights)) {
			await sql`
				update metrics set weight = ${weight}, updated_at = now() where id = ${metricId}
			`;
		}

		return { success: true };
	},

	/**
	 * Submit a metric for manager review.
	 * Sets submitted_at + submitted_by and clears any prior approval.
	 * Blocked when locked by a snapshot.
	 */
	submitMetric: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		if (!metricId) return fail(400, { error: 'validation.field_required' });
		if (await isMetricLocked(metricId)) return fail(403, { error: 'metric.locked' });

		await sql`
			update metrics
			set submitted_at = now(),
			    submitted_by = ${locals.user.id},
			    approved_at = null,
			    approved_by = null,
			    updated_at = now()
			where id = ${metricId}
		`;

		return { success: true };
	},

	/**
	 * Record current tier for a metric.
	 */
	recordTier: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		const tier = formData.get('tier')?.toString() as TierLevel;
		if (!metricId || !tier) return fail(400, { error: 'validation.field_required' });

		await sql`
			update metrics
			set current_tier = ${tier}, updated_at = now()
			where id = ${metricId}
		`;

		return { success: true };
	},

	// ── Goal Actions ──────────────────────────────────────────────────────────

	/**
	 * Create a new goal on the current user's node.
	 */
	createGoal: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || !ctx.userNode) return fail(400, { error: 'error.generic' });
		const { organization, userNode } = ctx;

		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const description = formData.get('description')?.toString().trim() || null;
		const goalType = formData.get('goalType')?.toString() as GoalType;
		const priority = formData.get('priority')?.toString() as GoalPriority;
		const status = formData.get('status')?.toString() as GoalStatus;
		const targetTier = formData.get('targetTier')?.toString() as TierLevel | undefined;
		const dueDate = formData.get('dueDate')?.toString() || null;

		if (!title) return fail(400, { error: 'validation.field_required' });
		if (!VALID_GOAL_TYPES.includes(goalType))
			return fail(400, { error: 'validation.field_required' });
		if (!VALID_PRIORITIES.includes(priority))
			return fail(400, { error: 'validation.field_required' });

		const validatedStatus = VALID_STATUSES.includes(status) ? status : 'defined';
		const validatedTargetTier =
			targetTier && VALID_TIERS.includes(targetTier) ? targetTier : null;
		const dueDateOrNull = dueDate || null;

		try {
			await sql`
				insert into org_goals (
					organization_id, hierarchy_node_id, title, description,
					goal_type, priority, status, target_tier, due_date,
					created_by, assigned_by
				) values (
					${organization.id}, ${userNode.id}, ${title}, ${description},
					${goalType}, ${priority}, ${validatedStatus}, ${validatedTargetTier}, ${dueDateOrNull},
					${locals.user.id}, ${locals.user.id}
				)
			`;
		} catch {
			return fail(500, { error: 'error.generic' });
		}

		return { createSuccess: true };
	},

	/**
	 * Update an existing goal.
	 *
	 * Every changed field is recorded in goal_adjustments as an immutable
	 * audit entry.
	 */
	updateGoal: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || !ctx.userNode) return fail(400, { error: 'error.generic' });
		const { userNode } = ctx;

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		const title = formData.get('title')?.toString().trim();
		const description = formData.get('description')?.toString().trim() || null;
		const goalType = formData.get('goalType')?.toString() as GoalType;
		const priority = formData.get('priority')?.toString() as GoalPriority;
		const status = formData.get('status')?.toString() as GoalStatus;
		const targetTier = formData.get('targetTier')?.toString() as TierLevel | undefined;
		const actualTier = formData.get('actualTier')?.toString() as TierLevel | undefined;
		const dueDate = formData.get('dueDate')?.toString() || null;
		const reason = formData.get('reason')?.toString().trim() || null;

		if (!goalId || !title) return fail(400, { error: 'validation.field_required' });

		const current = await maybeOne<{
			id: string;
			title: string;
			description: string | null;
			goal_type: string;
			priority: string;
			status: string;
			target_tier: string | null;
			actual_tier: string | null;
			due_date: string | null;
		}>(sql`
			select id, title, description, goal_type, priority, status, target_tier, actual_tier, due_date
			from org_goals
			where id = ${goalId} and hierarchy_node_id = ${userNode.id}
		`);

		if (!current) return fail(404, { error: 'error.generic' });

		const validatedType = VALID_GOAL_TYPES.includes(goalType) ? goalType : current.goal_type;
		const validatedPriority = VALID_PRIORITIES.includes(priority) ? priority : current.priority;
		const validatedStatus = VALID_STATUSES.includes(status) ? status : current.status;
		const validatedTargetTier = targetTier && VALID_TIERS.includes(targetTier) ? targetTier : null;
		const validatedActualTier = actualTier && VALID_TIERS.includes(actualTier) ? actualTier : null;

		const dueDateOrNull = dueDate || null;
		await sql`
			update org_goals
			set title = ${title},
			    description = ${description},
			    goal_type = ${validatedType},
			    priority = ${validatedPriority},
			    status = ${validatedStatus},
			    target_tier = ${validatedTargetTier},
			    actual_tier = ${validatedActualTier},
			    due_date = ${dueDateOrNull},
			    updated_at = now()
			where id = ${goalId}
		`;

		const fieldComparisons: { field: string; oldVal: string | null; newVal: string | null }[] = [
			{ field: 'title', oldVal: current.title, newVal: title },
			{ field: 'description', oldVal: current.description, newVal: description },
			{ field: 'goal_type', oldVal: current.goal_type, newVal: validatedType },
			{ field: 'priority', oldVal: current.priority, newVal: validatedPriority },
			{ field: 'status', oldVal: current.status, newVal: validatedStatus },
			{ field: 'target_tier', oldVal: current.target_tier, newVal: validatedTargetTier },
			{ field: 'actual_tier', oldVal: current.actual_tier, newVal: validatedActualTier },
			{ field: 'due_date', oldVal: current.due_date, newVal: dueDate }
		];

		for (const { field, oldVal, newVal } of fieldComparisons) {
			if (oldVal !== newVal) {
				await sql`
					insert into goal_adjustments (goal_id, adjusted_by, field, old_value, new_value, reason)
					values (${goalId}, ${locals.user.id}, ${field}, ${oldVal}, ${newVal}, ${reason})
				`;
			}
		}

		return { updateSuccess: true };
	},

	/**
	 * Delete a goal.
	 */
	deleteGoal: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || !ctx.userNode) return fail(400, { error: 'error.generic' });
		const { userNode } = ctx;

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		if (!goalId) return fail(400, { error: 'validation.field_required' });

		const goal = await maybeOne<{ id: string }>(sql`
			select id from org_goals
			where id = ${goalId} and hierarchy_node_id = ${userNode.id}
		`);

		if (!goal) return fail(404, { error: 'error.generic' });

		await sql`delete from org_goals where id = ${goalId}`;
		return { deleteSuccess: true };
	},

	/**
	 * Add a dependency between two goals.
	 */
	addDependency: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		const dependsOnGoalId = formData.get('dependsOnGoalId')?.toString();
		const dependencyType = formData.get('dependencyType')?.toString();
		const description = formData.get('description')?.toString().trim() || null;

		if (!goalId || !dependsOnGoalId || !dependencyType)
			return fail(400, { error: 'validation.field_required' });
		if (goalId === dependsOnGoalId) return fail(400, { error: 'validation.field_required' });

		try {
			await sql`
				insert into goal_dependencies (goal_id, depends_on_goal_id, dependency_type, description, created_by)
				values (${goalId}, ${dependsOnGoalId}, ${dependencyType as GoalDependencyType}, ${description}, ${locals.user.id})
			`;
		} catch {
			return fail(500, { error: 'error.generic' });
		}

		return { dependencySuccess: true };
	},

	/**
	 * Cascade a goal to all direct child nodes.
	 *
	 * Creates a copy on each direct report's node with goal_origin = 'cascaded'
	 * and source_goal_id referencing the parent goal. Status starts as 'defined'.
	 */
	cascade: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
		if (!ctx || !ctx.userNode || !ctx.hasDirectReports)
			return fail(400, { error: 'error.generic' });
		const { organization, userNode } = ctx;

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		if (!goalId) return fail(400, { error: 'validation.field_required' });

		const goal = await maybeOne<{
			title: string;
			description: string | null;
			goal_type: string;
			priority: string;
			target_tier: string | null;
			due_date: string | null;
		}>(sql`
			select title, description, goal_type, priority, target_tier, due_date
			from org_goals
			where id = ${goalId} and hierarchy_node_id = ${userNode.id}
		`);

		if (!goal) return fail(404, { error: 'error.generic' });

		const childNodeIds = await getDirectChildNodeIds(userNode.id, organization.id);
		if (childNodeIds.length === 0) return fail(400, { error: 'error.generic' });

		let cascaded = 0;
		for (const childNodeId of childNodeIds) {
			const existing = await maybeOne<{ id: string }>(sql`
				select id from org_goals
				where source_goal_id = ${goalId} and hierarchy_node_id = ${childNodeId}
			`);

			if (existing) continue;

			await sql`
				insert into org_goals (
					organization_id, hierarchy_node_id, title, description,
					goal_type, priority, status, target_tier, due_date,
					goal_origin, source_goal_id, created_by, assigned_by
				) values (
					${organization.id}, ${childNodeId}, ${goal.title}, ${goal.description},
					${goal.goal_type}, ${goal.priority}, 'defined', ${goal.target_tier}, ${goal.due_date},
					'cascaded', ${goalId}, ${locals.user.id}, ${locals.user.id}
				)
			`;
			cascaded++;
		}

		return { cascadeSuccess: true, cascaded };
	},

	/**
	 * Remove a dependency.
	 */
	removeDependency: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const dependencyId = formData.get('dependencyId')?.toString();
		if (!dependencyId) return fail(400, { error: 'validation.field_required' });

		await sql`delete from goal_dependencies where id = ${dependencyId}`;
		return { removeDependencySuccess: true };
	},

	// ── Performance Actions ───────────────────────────────────────────────

	/**
	 * Record a new performance log entry.
	 * Validates metric ownership, cadence, tier, and date ordering.
	 * Prevents duplicate entries via unique constraint on (metric_id, period_start, period_end).
	 */
	record: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(401);

		const mem = await maybeOne<{ role: string }>(sql`
			select role from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);
		if (mem?.role === 'viewer') return fail(403, { error: 'error.generic' });

		const userNode = await resolveActionNode(locals.user.id);
		if (!userNode) return fail(400, { error: 'no_node' });

		const formData = await request.formData();
		const metricId = formData.get('metric_id') as string;
		const periodStart = formData.get('period_start') as string;
		const periodEnd = formData.get('period_end') as string;
		const cadence = formData.get('cadence') as string;
		const assessedTier = formData.get('assessed_tier') as string;
		const dataSource = (formData.get('data_source') as string) || null;
		const notes = (formData.get('notes') as string) || null;
		const measuredValueRaw = formData.get('measured_value') as string;

		if (!metricId || !periodStart || !periodEnd || !cadence || !assessedTier || !measuredValueRaw) {
			return fail(400, { error: 'missing_fields' });
		}

		if (!VALID_CADENCES.includes(cadence as (typeof VALID_CADENCES)[number])) {
			return fail(400, { error: 'invalid_cadence' });
		}

		if (!TIER_LEVELS.includes(assessedTier as TierLevel)) {
			return fail(400, { error: 'invalid_tier' });
		}

		let measuredValue: Record<string, unknown>;
		try {
			measuredValue = JSON.parse(measuredValueRaw);
		} catch {
			return fail(400, { error: 'invalid_value' });
		}

		if (new Date(periodStart) > new Date(periodEnd)) {
			return fail(400, { error: 'invalid_dates' });
		}

		const metric = await maybeOne<{ id: string }>(sql`
			select id from metrics
			where id = ${metricId} and node_id = ${userNode.id}
		`);

		if (!metric) {
			return fail(400, { error: 'metric_not_found' });
		}

		try {
			await sql`
				insert into performance_logs (
					organization_id, node_id, metric_id, period_start, period_end,
					cadence, measured_value, assessed_tier, data_source, notes, recorded_by
				) values (
					${userNode.organization_id}, ${userNode.id}, ${metricId}, ${periodStart}, ${periodEnd},
					${cadence}, ${sql.json(measuredValue as never)}, ${assessedTier},
					${dataSource}, ${notes}, ${locals.user.id}
				)
			`;
		} catch (err) {
			if ((err as { code?: string }).code === '23505') {
				return fail(409, { error: 'duplicate_entry' });
			}
			return fail(500, { error: 'save_failed' });
		}

		return { recordSuccess: true };
	},

	/**
	 * Update the measurement cadence for a specific metric.
	 */
	setCadence: async ({ request, locals, cookies }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(401);

		const mem = await maybeOne<{ role: string }>(sql`
			select role from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);
		if (mem?.role === 'viewer') return fail(403, { error: 'error.generic' });

		const userNode = await resolveActionNode(locals.user.id);
		if (!userNode) return fail(400, { error: 'no_node' });

		const formData = await request.formData();
		const metricId = formData.get('metric_id') as string;
		const cadence = formData.get('cadence') as string;

		if (!metricId || !cadence) {
			return fail(400, { error: 'missing_fields' });
		}

		if (!VALID_CADENCES.includes(cadence as (typeof VALID_CADENCES)[number])) {
			return fail(400, { error: 'invalid_cadence' });
		}

		const metric = await maybeOne<{ id: string }>(sql`
			select id from metrics
			where id = ${metricId} and node_id = ${userNode.id}
		`);

		if (!metric) {
			return fail(400, { error: 'metric_not_found' });
		}

		await sql`
			update metrics
			set performance_cadence = ${cadence}, updated_at = now()
			where id = ${metricId}
		`;

		return { cadenceSuccess: true };
	}
};
;null as any as Actions;