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
import { db } from '$lib/server/db.js';
import type { TierLevel, GoalType, GoalPriority, GoalStatus } from '$lib/types/index.js';
import type { GoalDependencyType } from '$lib/types/database.js';
import { getDirectChildNodeIds } from '$lib/server/hierarchy.js';
import { PERSPECTIVE_COOKIE } from '$lib/server/demo/constants.js';
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
 * Supports both platform (demo) and customer deployment modes.
 */
async function resolveActionNode(
	cookies: import('@sveltejs/kit').Cookies,
	userId: string
): Promise<{ id: string; organization_id: string } | null> {
	const perspectiveNodeId = cookies.get(PERSPECTIVE_COOKIE);

	if (perspectiveNodeId) {
		const { data } = await db
			.from('org_hierarchy_nodes')
			.select('id, organization_id')
			.eq('id', perspectiveNodeId)
			.single();
		return data ?? null;
	}

	const { data } = await db
		.from('org_hierarchy_nodes')
		.select('id, organization_id')
		.eq('user_id', userId)
		.single();
	return data ?? null;
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
	const { data } = await db
		.from('metrics')
		.select('locked_by_snapshot_id')
		.eq('id', metricId)
		.single();
	return !!data?.locked_by_snapshot_id;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { organization, userNode, hasDirectReports, membership } = await parent();

	if (!userNode) {
		redirect(302, '/app');
	}

	// ── Metrics (Primer quintile stack) ───────────────────────────────────────
	const { data: nodeMetrics } = await db
		.from('metrics')
		.select('*')
		.eq('node_id', userNode.id)
		.order('sort_order', { ascending: true });

	// Fetch thresholds for all metrics in a single query, then group by metric_id.
	const metricIds = (nodeMetrics ?? []).map((m) => m.id);
	const thresholdsByMetric = new Map<string, { tier: string; description: string | null }[]>();
	if (metricIds.length > 0) {
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

	const metricsWithThresholds = (nodeMetrics ?? []).map((metric) => {
		const thresholds = thresholdsByMetric.get(metric.id) ?? [];
		return {
			id: metric.id,
			name: metric.name,
			description: metric.description,
			measurementType: metric.measurement_type,
			indicatorType: metric.indicator_type,
			origin: metric.origin,
			weight: metric.weight,
			currentTier: metric.current_tier,
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

	const totalWeight = (nodeMetrics ?? []).reduce((sum, m) => sum + (m.weight || 0), 0);

	// ── My Goals ─────────────────────────────────────────────────────────────
	const { data: myGoals } = await db
		.from('org_goals')
		.select('*')
		.eq('hierarchy_node_id', userNode.id)
		.order('created_at', { ascending: true });

	const goals: GoalRow[] = (myGoals ?? []).map((g) => ({
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
		const { data: deps } = await db
			.from('goal_dependencies')
			.select(
				'*, depends_on:org_goals!goal_dependencies_depends_on_goal_id_fkey(title, hierarchy_node_id)'
			)
			.in('goal_id', goalIds);

		if (deps) {
			const depNodeIds = deps
				.map((d) => {
					const target = d.depends_on as {
						title: string;
						hierarchy_node_id: string | null;
					} | null;
					return target?.hierarchy_node_id;
				})
				.filter((id): id is string => !!id);

			let nodeNameMap: Record<string, string> = {};
			if (depNodeIds.length > 0) {
				const { data: nodes } = await db
					.from('org_hierarchy_nodes')
					.select('id, name')
					.in('id', depNodeIds);
				nodeNameMap = Object.fromEntries((nodes ?? []).map((n) => [n.id, n.name]));
			}

			dependencies = deps.map((d) => {
				const target = d.depends_on as {
					title: string;
					hierarchy_node_id: string | null;
				} | null;
				return {
					id: d.id,
					goalId: d.goal_id,
					dependsOnGoalId: d.depends_on_goal_id,
					dependencyType: d.dependency_type,
					description: d.description,
					dependsOnTitle: target?.title ?? null,
					dependsOnNodeName: target?.hierarchy_node_id
						? (nodeNameMap[target.hierarchy_node_id] ?? null)
						: null
				};
			});
		}
	}

	// ── Parent Goals (upward visibility for ICs) ────────────────────────────
	let parentGoals: GoalRow[] = [];

	if (!hasDirectReports && userNode) {
		// Fetch the current node and its parent (via join) in one round-trip.
		const { data: currentNodeData } = await db
			.from('org_hierarchy_nodes')
			.select('parent_id, parent:org_hierarchy_nodes!parent_id(id, name)')
			.eq('id', userNode.id)
			.single();

		if (currentNodeData?.parent_id) {
			const parentNodeData = currentNodeData.parent as { id: string; name: string } | null;

			if (parentNodeData) {
				const { data: pGoals } = await db
					.from('org_goals')
					.select(
						'id, title, priority, status, goal_type, target_tier, actual_tier, due_date, created_at'
					)
					.eq('hierarchy_node_id', parentNodeData.id)
					.order('created_at', { ascending: true });

				parentGoals = (pGoals ?? []).map((g) => ({
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
		const { data: allNodes } = await db
			.from('org_hierarchy_nodes')
			.select('id, name, parent_id')
			.eq('organization_id', organization.id);

		const descendantIds: string[] = [];
		function collectDescendants(parentId: string) {
			for (const node of allNodes ?? []) {
				if (node.parent_id === parentId) {
					descendantIds.push(node.id);
					collectDescendants(node.id);
				}
			}
		}
		collectDescendants(userNode.id);

		if (descendantIds.length > 0) {
			const { data: descGoals } = await db
				.from('org_goals')
				.select('*, org_hierarchy_nodes!org_goals_hierarchy_node_id_fkey(name)')
				.in('hierarchy_node_id', descendantIds)
				.order('created_at', { ascending: true });

			teamGoals = (descGoals ?? []).map((g) => {
				const nodeData = g.org_hierarchy_nodes as { name: string } | null;
				return {
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
					nodeName: nodeData?.name ?? null,
					nodeId: g.hierarchy_node_id
				};
			});
		}
	}

	// ── Cascade tracking ────────────────────────────────────────────────────
	const cascadeStatus: Record<
		string,
		{ total: number; accepted: number; deferred: number; pending: number }
	> = {};

	if (hasDirectReports && goals.length > 0) {
		const myGoalIds = goals.map((g) => g.id);
		const { data: cascadedGoals } = await db
			.from('org_goals')
			.select('source_goal_id, status')
			.in('source_goal_id', myGoalIds);

		if (cascadedGoals) {
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
	}

	// ── Available goals for dependency selection ─────────────────────────────
	const { data: allOrgGoals } = await db
		.from('org_goals')
		.select(
			'id, title, hierarchy_node_id, org_hierarchy_nodes!org_goals_hierarchy_node_id_fkey(name)'
		)
		.eq('organization_id', organization.id)
		.order('title', { ascending: true });

	const availableGoals = (allOrgGoals ?? []).map((g) => {
		const nodeData = g.org_hierarchy_nodes as { name: string } | null;
		return { id: g.id, title: g.title, nodeName: nodeData?.name ?? null };
	});

	// ── Goal adjustment log ──────────────────────────────────────────────────
	let goalAdjustments: GoalAdjustmentRow[] = [];

	if (goalIds.length > 0) {
		const { data: adjustments } = await db
			.from('goal_adjustments')
			.select('*, users!goal_adjustments_adjusted_by_fkey(name)')
			.in('goal_id', goalIds)
			.order('created_at', { ascending: false });

		goalAdjustments = (adjustments ?? []).map((a) => {
			const user = a.users as { name: string } | null;
			return {
				id: a.id,
				goalId: a.goal_id,
				adjustedBy: a.adjusted_by,
				adjustedByName: user?.name ?? null,
				field: a.field,
				oldValue: a.old_value,
				newValue: a.new_value,
				reason: a.reason,
				createdAt: a.created_at
			};
		});
	}

	// ── Performance log entries ──────────────────────────────────────────
	const { data: logEntries } = await db
		.from('performance_logs')
		.select('*')
		.eq('node_id', userNode.id)
		.order('period_start', { ascending: false })
		.limit(100);

	const performanceEntries = (logEntries ?? []).map((e) => ({
		id: e.id,
		metricId: e.metric_id,
		periodStart: e.period_start,
		periodEnd: e.period_end,
		cadence: e.cadence,
		measuredValue: e.measured_value,
		assessedTier: e.assessed_tier,
		dataSource: e.data_source,
		notes: e.notes,
		recordedBy: e.recorded_by,
		createdAt: e.created_at
	}));

	// ── Metrics with performance cadence (for performance tab) ────────────
	const performanceMetrics = (nodeMetrics ?? []).map((m) => ({
		id: m.id,
		name: m.name,
		measurementType: m.measurement_type,
		weight: m.weight,
		currentTier: m.current_tier,
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

export const actions: Actions = {
	// ── Metric Actions ────────────────────────────────────────────────────────

	/**
	 * Create a new metric.
	 * Allowed even when other metrics are locked — employees can always
	 * propose new metrics for the next cycle.
	 */
	createMetric: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
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

		const { data: existingMetrics } = await db
			.from('metrics')
			.select('sort_order')
			.eq('node_id', userNode.id);

		const maxSortOrder = Math.max(0, ...(existingMetrics ?? []).map((m) => m.sort_order));

		const { data: newMetric, error } = await db
			.from('metrics')
			.insert({
				organization_id: organization.id,
				node_id: userNode.id,
				assigned_by: locals.user.id,
				name,
				description,
				measurement_type: (measurementType || 'qualitative') as 'qualitative',
				indicator_type: (indicatorType || 'health') as 'health',
				origin: (origin || 'self_defined') as 'self_defined',
				weight: weight || null,
				sort_order: maxSortOrder + 1
			})
			.select()
			.single();

		if (error || !newMetric) return fail(500, { error: 'error.generic' });

		for (const tier of TIER_LEVELS) {
			const thresholdDesc = formData.get(`threshold_${tier}`)?.toString().trim();
			if (thresholdDesc) {
				await db.from('metric_thresholds').insert({
					metric_id: newMetric.id,
					tier,
					description: thresholdDesc,
					set_by: locals.user.id
				});
			}
		}

		return { success: true, metricId: newMetric.id };
	},

	/**
	 * Update a metric and its thresholds.
	 * Blocked when the metric is locked by a snapshot capture.
	 */
	updateMetric: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString().trim();
		const weight = parseInt(formData.get('weight')?.toString() || '0', 10);
		const currentTier = formData.get('currentTier')?.toString() as TierLevel | undefined;

		if (!metricId || !name) return fail(400, { error: 'validation.field_required' });
		if (await isMetricLocked(metricId)) return fail(403, { error: 'metric.locked' });

		await db
			.from('metrics')
			.update({
				name,
				description,
				weight: weight || null,
				current_tier: currentTier || null,
				approved_at: null,
				approved_by: null,
				updated_at: new Date().toISOString()
			})
			.eq('id', metricId);

		for (const tier of TIER_LEVELS) {
			const thresholdDesc = formData.get(`threshold_${tier}`)?.toString().trim();

			const { data: existing } = await db
				.from('metric_thresholds')
				.select('id')
				.eq('metric_id', metricId)
				.eq('tier', tier)
				.limit(1);

			const existingThreshold = existing?.[0];

			if (existingThreshold) {
				await db
					.from('metric_thresholds')
					.update({ description: thresholdDesc || '', updated_at: new Date().toISOString() })
					.eq('id', existingThreshold.id);
			} else if (thresholdDesc) {
				await db.from('metric_thresholds').insert({
					metric_id: metricId,
					tier,
					description: thresholdDesc,
					set_by: locals.user.id
				});
			}
		}

		return { success: true };
	},

	/**
	 * Delete a metric. Blocked when locked by a snapshot.
	 */
	deleteMetric: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		if (!metricId) return fail(400, { error: 'validation.field_required' });
		if (await isMetricLocked(metricId)) return fail(403, { error: 'metric.locked' });

		await db.from('metrics').delete().eq('id', metricId);
		return { success: true };
	},

	/**
	 * Update weights for all metrics. Total must equal 100.
	 */
	updateWeights: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const weights = JSON.parse(formData.get('weights')?.toString() || '{}') as Record<
			string,
			number
		>;

		const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
		if (total !== 100) return fail(400, { error: 'validation.weights_must_total' });

		for (const [metricId, weight] of Object.entries(weights)) {
			await db
				.from('metrics')
				.update({ weight, updated_at: new Date().toISOString() })
				.eq('id', metricId);
		}

		return { success: true };
	},

	/**
	 * Submit a metric for manager review.
	 * Sets submitted_at + submitted_by and clears any prior approval.
	 * Blocked when locked by a snapshot.
	 */
	submitMetric: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		if (!metricId) return fail(400, { error: 'validation.field_required' });
		if (await isMetricLocked(metricId)) return fail(403, { error: 'metric.locked' });

		await db
			.from('metrics')
			.update({
				submitted_at: new Date().toISOString(),
				submitted_by: locals.user.id,
				approved_at: null,
				approved_by: null,
				updated_at: new Date().toISOString()
			})
			.eq('id', metricId);

		return { success: true };
	},

	/**
	 * Record current tier for a metric.
	 */
	recordTier: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || ctx.membership.role === 'viewer') return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const metricId = formData.get('metricId')?.toString();
		const tier = formData.get('tier')?.toString() as TierLevel;
		if (!metricId || !tier) return fail(400, { error: 'validation.field_required' });

		await db
			.from('metrics')
			.update({ current_tier: tier, updated_at: new Date().toISOString() })
			.eq('id', metricId);

		return { success: true };
	},

	// ── Goal Actions ──────────────────────────────────────────────────────────

	/**
	 * Create a new goal on the current user's node.
	 */
	createGoal: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
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

		const { error: insertErr } = await db.from('org_goals').insert({
			organization_id: organization.id,
			hierarchy_node_id: userNode.id,
			title,
			description,
			goal_type: goalType,
			priority,
			status: VALID_STATUSES.includes(status) ? status : 'defined',
			target_tier: targetTier && VALID_TIERS.includes(targetTier) ? targetTier : null,
			due_date: dueDate || null,
			created_by: locals.user.id,
			assigned_by: locals.user.id
		});

		if (insertErr) return fail(500, { error: 'error.generic' });
		return { createSuccess: true };
	},

	/**
	 * Update an existing goal.
	 *
	 * Every changed field is recorded in goal_adjustments as an immutable
	 * audit entry.
	 */
	updateGoal: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
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

		const { data: current } = await db
			.from('org_goals')
			.select(
				'id, title, description, goal_type, priority, status, target_tier, actual_tier, due_date'
			)
			.eq('id', goalId)
			.eq('hierarchy_node_id', userNode.id)
			.single();

		if (!current) return fail(404, { error: 'error.generic' });

		const validatedType = VALID_GOAL_TYPES.includes(goalType) ? goalType : current.goal_type;
		const validatedPriority = VALID_PRIORITIES.includes(priority) ? priority : current.priority;
		const validatedStatus = VALID_STATUSES.includes(status) ? status : current.status;
		const validatedTargetTier = targetTier && VALID_TIERS.includes(targetTier) ? targetTier : null;
		const validatedActualTier = actualTier && VALID_TIERS.includes(actualTier) ? actualTier : null;

		await db
			.from('org_goals')
			.update({
				title,
				description,
				goal_type: validatedType,
				priority: validatedPriority,
				status: validatedStatus,
				target_tier: validatedTargetTier,
				actual_tier: validatedActualTier,
				due_date: dueDate || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', goalId);

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
				await db.from('goal_adjustments').insert({
					goal_id: goalId,
					adjusted_by: locals.user.id,
					field,
					old_value: oldVal,
					new_value: newVal,
					reason
				});
			}
		}

		return { updateSuccess: true };
	},

	/**
	 * Delete a goal.
	 */
	deleteGoal: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || !ctx.userNode) return fail(400, { error: 'error.generic' });
		const { userNode } = ctx;

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		if (!goalId) return fail(400, { error: 'validation.field_required' });

		const { data: goal } = await db
			.from('org_goals')
			.select('id')
			.eq('id', goalId)
			.eq('hierarchy_node_id', userNode.id)
			.single();

		if (!goal) return fail(404, { error: 'error.generic' });

		await db.from('org_goals').delete().eq('id', goalId);
		return { deleteSuccess: true };
	},

	/**
	 * Add a dependency between two goals.
	 */
	addDependency: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		const dependsOnGoalId = formData.get('dependsOnGoalId')?.toString();
		const dependencyType = formData.get('dependencyType')?.toString();
		const description = formData.get('description')?.toString().trim() || null;

		if (!goalId || !dependsOnGoalId || !dependencyType)
			return fail(400, { error: 'validation.field_required' });
		if (goalId === dependsOnGoalId) return fail(400, { error: 'validation.field_required' });

		const { error: insertErr } = await db.from('goal_dependencies').insert({
			goal_id: goalId,
			depends_on_goal_id: dependsOnGoalId,
			dependency_type: dependencyType as GoalDependencyType,
			description,
			created_by: locals.user.id
		});

		if (insertErr) return fail(500, { error: 'error.generic' });
		return { dependencySuccess: true };
	},

	/**
	 * Cascade a goal to all direct child nodes.
	 *
	 * Creates a copy on each direct report's node with goal_origin = 'cascaded'
	 * and source_goal_id referencing the parent goal. Status starts as 'defined'.
	 */
	cascade: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx || !ctx.userNode || !ctx.hasDirectReports)
			return fail(400, { error: 'error.generic' });
		const { organization, userNode } = ctx;

		const formData = await request.formData();
		const goalId = formData.get('goalId')?.toString();
		if (!goalId) return fail(400, { error: 'validation.field_required' });

		const { data: goal } = await db
			.from('org_goals')
			.select('*')
			.eq('id', goalId)
			.eq('hierarchy_node_id', userNode.id)
			.single();

		if (!goal) return fail(404, { error: 'error.generic' });

		const childNodeIds = await getDirectChildNodeIds(userNode.id, organization.id);
		if (childNodeIds.length === 0) return fail(400, { error: 'error.generic' });

		let cascaded = 0;
		for (const childNodeId of childNodeIds) {
			const { data: existing } = await db
				.from('org_goals')
				.select('id')
				.eq('source_goal_id', goalId)
				.eq('hierarchy_node_id', childNodeId)
				.single();

			if (existing) continue;

			await db.from('org_goals').insert({
				organization_id: organization.id,
				hierarchy_node_id: childNodeId,
				title: goal.title,
				description: goal.description,
				goal_type: goal.goal_type,
				priority: goal.priority,
				status: 'defined',
				target_tier: goal.target_tier,
				due_date: goal.due_date,
				goal_origin: 'cascaded',
				source_goal_id: goalId,
				created_by: locals.user.id,
				assigned_by: locals.user.id
			});
			cascaded++;
		}

		return { cascadeSuccess: true, cascaded };
	},

	/**
	 * Remove a dependency.
	 */
	removeDependency: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const dependencyId = formData.get('dependencyId')?.toString();
		if (!dependencyId) return fail(400, { error: 'validation.field_required' });

		await db.from('goal_dependencies').delete().eq('id', dependencyId);
		return { removeDependencySuccess: true };
	},

	// ── Performance Actions ───────────────────────────────────────────────

	/**
	 * Record a new performance log entry.
	 * Validates metric ownership, cadence, tier, and date ordering.
	 * Prevents duplicate entries via unique constraint on (metric_id, period_start, period_end).
	 */
	record: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401);

		const { data: mem } = await db
			.from('org_members')
			.select('role')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.single();
		if (mem?.role === 'viewer') return fail(403, { error: 'error.generic' });

		const userNode = await resolveActionNode(cookies, locals.user.id);
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

		const { data: metric } = await db
			.from('metrics')
			.select('id')
			.eq('id', metricId)
			.eq('node_id', userNode.id)
			.single();

		if (!metric) {
			return fail(400, { error: 'metric_not_found' });
		}

		const { error } = await db.from('performance_logs').insert({
			organization_id: userNode.organization_id,
			node_id: userNode.id,
			metric_id: metricId,
			period_start: periodStart,
			period_end: periodEnd,
			cadence: cadence as (typeof VALID_CADENCES)[number],
			measured_value: measuredValue,
			assessed_tier: assessedTier as TierLevel,
			data_source: dataSource,
			notes,
			recorded_by: locals.user.id
		});

		if (error) {
			if (error.code === '23505') {
				return fail(409, { error: 'duplicate_entry' });
			}
			return fail(500, { error: 'save_failed' });
		}

		return { recordSuccess: true };
	},

	/**
	 * Update the measurement cadence for a specific metric.
	 */
	setCadence: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401);

		const { data: mem } = await db
			.from('org_members')
			.select('role')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.single();
		if (mem?.role === 'viewer') return fail(403, { error: 'error.generic' });

		const userNode = await resolveActionNode(cookies, locals.user.id);
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

		const { data: metric } = await db
			.from('metrics')
			.select('id')
			.eq('id', metricId)
			.eq('node_id', userNode.id)
			.single();

		if (!metric) {
			return fail(400, { error: 'metric_not_found' });
		}

		await db
			.from('metrics')
			.update({
				performance_cadence: cadence as (typeof VALID_CADENCES)[number],
				updated_at: new Date().toISOString()
			})
			.eq('id', metricId);

		return { cadenceSuccess: true };
	}
};
