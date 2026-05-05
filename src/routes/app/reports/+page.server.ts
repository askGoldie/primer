/**
 * Reports Page Server
 *
 * Loads historical performance data for visualization.
 *
 * Three scope modes:
 * 1. **self** — employees see their own metrics (default)
 * 2. **subtree** — managers see aggregate data for their subtree
 * 3. **org** — system_admin/owner/hr_admin see org-wide data
 * 4. **node:{nodeId}** — specific subtree (requires ancestry or grant)
 *
 * Data is returned in chart-ready shapes so the client can render
 * SVG visualizations without additional transformation.
 */

import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import type { TierLevel } from '$lib/types/index.js';
import { TIER_VALUES } from '$lib/config/theme.js';
import { getSubtreeNodeIds } from '$lib/server/hierarchy.js';
import { canExportComplianceReports } from '$lib/server/permissions.js';
import { loadActionContext } from '$lib/server/action-context.js';
import { t } from '$lib/i18n/index.js';

/** Map tier to numeric value for charting */
function tierToValue(tier: string): number {
	return TIER_VALUES[tier as TierLevel] ?? 3;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { organization, userNode, membership, hasDirectReports } = await parent();

	const role = membership.role;
	const isAdminRole = role === 'system_admin' || role === 'owner' || role === 'hr_admin';

	// Parse scope from query parameter
	const scopeParam = url.searchParams.get('scope') ?? 'self';
	let scope: 'self' | 'subtree' | 'org' = 'self';
	let scopeNodeIds: string[] | null = null;

	if (scopeParam === 'org' && isAdminRole) {
		scope = 'org';
	} else if (scopeParam === 'subtree' && userNode && hasDirectReports) {
		scope = 'subtree';
		const childIds = await getSubtreeNodeIds(userNode.id, organization.id);
		scopeNodeIds = [userNode.id, ...childIds];
	} else if (scopeParam.startsWith('node:') && userNode) {
		const targetNodeId = scopeParam.slice(5);
		// Verify access: user must be ancestor, have grant, or be admin
		if (isAdminRole) {
			scope = 'subtree';
			const childIds = await getSubtreeNodeIds(targetNodeId, organization.id);
			scopeNodeIds = [targetNodeId, ...childIds];
		} else {
			// Check if user is ancestor of target node
			const subtree = await getSubtreeNodeIds(userNode.id, organization.id);
			if (subtree.includes(targetNodeId)) {
				scope = 'subtree';
				const childIds = await getSubtreeNodeIds(targetNodeId, organization.id);
				scopeNodeIds = [targetNodeId, ...childIds];
			} else {
				// Check visibility grants
				const { data: grants } = await db
					.from('visibility_grants')
					.select('scope_node_id, visibility')
					.eq('grantee_node_id', userNode.id)
					.eq('organization_id', organization.id)
					.is('revoked_at', null);

				const hasGrant = (grants ?? []).some(
					(g) => g.scope_node_id === targetNodeId || g.scope_node_id === null
				);
				if (hasGrant) {
					scope = 'subtree';
					const childIds = await getSubtreeNodeIds(targetNodeId, organization.id);
					scopeNodeIds = [targetNodeId, ...childIds];
				}
			}
		}
	} else if (scopeParam === 'self' && !userNode && isAdminRole) {
		// Admin without node defaults to org-wide
		scope = 'org';
	}

	if (!userNode && scope === 'self' && !isAdminRole) {
		redirect(302, '/app');
	}

	const isOrgWide = scope === 'org';

	// Determine node filter based on scope
	let nodeIds: string[] | null = null;
	if (scope === 'self' && userNode) {
		nodeIds = [userNode.id];
	} else if (scope === 'subtree' && scopeNodeIds) {
		nodeIds = scopeNodeIds;
	}
	// org scope: nodeIds stays null (no filter, entire org)

	// ── 1. Score Trend ──────────────────────────────────────────────────────
	let snapshotQuery = db
		.from('score_snapshots')
		.select('id, composite_score, composite_tier, cycle_label, created_at')
		.order('created_at', { ascending: true })
		.limit(50);

	if (nodeIds) {
		snapshotQuery = snapshotQuery.in('node_id', nodeIds);
	} else {
		snapshotQuery = snapshotQuery.eq('organization_id', organization.id);
	}

	const { data: snapshots } = await snapshotQuery;

	// For org-wide or subtree, aggregate snapshots by cycle_label
	let scoreTrend: Array<{ score: number; tier: TierLevel; label: string; date: string }>;

	if ((isOrgWide || scope === 'subtree') && snapshots && snapshots.length > 0) {
		const byCycle = new Map<string, { scores: number[]; date: string }>();
		for (const s of snapshots) {
			const key =
				s.cycle_label ??
				new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
			if (!byCycle.has(key)) {
				byCycle.set(key, { scores: [], date: s.created_at });
			}
			byCycle.get(key)!.scores.push(s.composite_score);
		}
		scoreTrend = Array.from(byCycle.entries()).map(([label, { scores, date }]) => {
			const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
			return {
				score: avg,
				tier: (avg <= 1.8
					? 'alarm'
					: avg <= 2.6
						? 'concern'
						: avg <= 3.4
							? 'content'
							: avg <= 4.2
								? 'effective'
								: 'optimized') as TierLevel,
				label,
				date
			};
		});
	} else {
		scoreTrend = (snapshots ?? []).map((s) => ({
			score: s.composite_score,
			tier: s.composite_tier as TierLevel,
			label:
				s.cycle_label ??
				new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
			date: s.created_at
		}));
	}

	// ── 2. Per-metric performance history ────────────────────────────────────
	let perfLogQuery = db
		.from('performance_logs')
		.select(
			'id, metric_id, period_start, period_end, cadence, measured_value, assessed_tier, data_source, created_at'
		)
		.order('period_start', { ascending: true })
		.limit(500);

	if (nodeIds) {
		perfLogQuery = perfLogQuery.in('node_id', nodeIds);
	} else {
		perfLogQuery = perfLogQuery.eq('organization_id', organization.id);
	}

	const { data: perfLogs } = await perfLogQuery;

	// Load metric names
	let metricQuery = db
		.from('metrics')
		.select('id, name, weight, current_tier')
		.order('sort_order', { ascending: true });

	if (nodeIds) {
		metricQuery = metricQuery.in('node_id', nodeIds);
	} else {
		metricQuery = metricQuery.eq('organization_id', organization.id);
	}

	const { data: nodeMetrics } = await metricQuery;
	const metricNameMap = new Map((nodeMetrics ?? []).map((m) => [m.id, m.name]));

	// Group logs by metric
	const metricGroups = new Map<
		string,
		Array<{
			periodStart: string;
			periodEnd: string;
			tier: TierLevel;
			tierValue: number;
			label: string;
		}>
	>();

	for (const log of perfLogs ?? []) {
		const metricId = log.metric_id;
		if (!metricGroups.has(metricId)) {
			metricGroups.set(metricId, []);
		}
		metricGroups.get(metricId)!.push({
			periodStart: log.period_start,
			periodEnd: log.period_end,
			tier: log.assessed_tier as TierLevel,
			tierValue: tierToValue(log.assessed_tier),
			label: new Date(log.period_start).toLocaleDateString('en-US', {
				month: 'short',
				year: '2-digit'
			})
		});
	}

	const metricHistory = Array.from(metricGroups.entries()).map(([metricId, entries]) => ({
		metricId,
		metricName: metricNameMap.get(metricId) ?? 'Unknown',
		entries
	}));

	// ── 3. Tier distribution ─────────────────────────────────────────────────
	const tierDistribution = { alarm: 0, concern: 0, content: 0, effective: 0, optimized: 0 };
	for (const log of perfLogs ?? []) {
		const tier = log.assessed_tier as TierLevel;
		if (tier in tierDistribution) {
			tierDistribution[tier]++;
		}
	}

	// ── 4. Direct report / scoped node scores ────────────────────────────────
	let reportNodes: Array<{ id: string; name: string; title: string | null }>;

	if (isOrgWide) {
		const { data: allNodes } = await db
			.from('org_hierarchy_nodes')
			.select('id, name, title')
			.eq('organization_id', organization.id);
		reportNodes = allNodes ?? [];
	} else if (scope === 'subtree' && scopeNodeIds) {
		const { data: scopedNodes } = await db
			.from('org_hierarchy_nodes')
			.select('id, name, title')
			.in('id', scopeNodeIds);
		reportNodes = scopedNodes ?? [];
	} else {
		const { data: childNodes } = await db
			.from('org_hierarchy_nodes')
			.select('id, name, title')
			.eq('parent_id', userNode!.id)
			.eq('organization_id', organization.id);
		reportNodes = childNodes ?? [];
	}

	// Bulk-fetch all snapshot and log data for report nodes in 3 queries
	// instead of 3 queries per node (avoids exhausting Supabase connection pool)
	const reportNodeIds = reportNodes.map((n) => n.id);

	const [{ data: allSnapshots }, { data: allLogCounts }] =
		reportNodeIds.length > 0
			? await Promise.all([
					db
						.from('score_snapshots')
						.select('node_id, composite_score, composite_tier, created_at')
						.in('node_id', reportNodeIds)
						.order('created_at', { ascending: false }),
					db.from('performance_logs').select('node_id').in('node_id', reportNodeIds)
				])
			: [{ data: [] }, { data: [] }];

	// Index snapshots by node_id
	const snapshotsByNode = new Map<
		string,
		Array<{ composite_score: number; composite_tier: string; created_at: string }>
	>();
	for (const snap of allSnapshots ?? []) {
		if (!snapshotsByNode.has(snap.node_id)) {
			snapshotsByNode.set(snap.node_id, []);
		}
		snapshotsByNode.get(snap.node_id)!.push(snap);
	}

	// Count log entries per node
	const logCountByNode = new Map<string, number>();
	for (const log of allLogCounts ?? []) {
		logCountByNode.set(log.node_id, (logCountByNode.get(log.node_id) ?? 0) + 1);
	}

	// Assemble per-node results from bulk data
	const directReportScores = reportNodes.map((child) => {
		const nodeSnaps = snapshotsByNode.get(child.id) ?? [];
		// nodeSnaps are ordered descending by created_at from the query
		const latest = nodeSnaps[0] ?? null;
		// Take last 6 in ascending order for trend sparkline
		const trendSnaps = nodeSnaps.slice(0, 6).reverse();

		return {
			id: child.id,
			name: child.name,
			title: child.title,
			currentScore: latest?.composite_score ?? null,
			currentTier: (latest?.composite_tier as TierLevel) ?? null,
			entryCount: logCountByNode.get(child.id) ?? 0,
			trend: trendSnaps.map((s) => ({
				score: s.composite_score,
				tier: s.composite_tier as TierLevel
			}))
		};
	});

	// ── 5. Subtree metric completion rate ────────────────────────────────────
	let completionRate: { total: number; approved: number } | null = null;
	if (scope === 'subtree' && scopeNodeIds) {
		const [{ count: totalMetrics }, { count: approvedMetrics }] = await Promise.all([
			db.from('metrics').select('id', { count: 'exact', head: true }).in('node_id', scopeNodeIds),
			db
				.from('metrics')
				.select('id', { count: 'exact', head: true })
				.in('node_id', scopeNodeIds)
				.not('approved_at', 'is', null)
		]);

		completionRate = {
			total: totalMetrics ?? 0,
			approved: approvedMetrics ?? 0
		};
	}

	const hasData = scoreTrend.length > 0 || (perfLogs ?? []).length > 0;

	return {
		scoreTrend,
		metricHistory,
		tierDistribution,
		directReportScores,
		hasData,
		needsNode: false,
		isOrgWide,
		scope,
		hasDirectReports,
		isAdminRole,
		completionRate,
		canExport: canExportComplianceReports(role)
	};
};

export const actions: Actions = {
	/**
	 * Export subtree snapshots as CSV.
	 */
	exportSubtree: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id, cookies);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const { organization, userNode, membership, hasDirectReports } = ctx;
		const role = membership.role;
		const isAdminRole = role === 'system_admin' || role === 'owner' || role === 'hr_admin';

		const formData = await request.formData();
		const exportScope = formData.get('scope')?.toString() ?? 'self';

		let nodeIds: string[] | null = null;

		if (exportScope === 'org' && isAdminRole) {
			// org-wide, no filter
		} else if (exportScope === 'subtree' && userNode && hasDirectReports) {
			const childIds = await getSubtreeNodeIds(userNode.id, organization.id);
			nodeIds = [userNode.id, ...childIds];
		} else if (userNode) {
			nodeIds = [userNode.id];
		} else {
			return fail(403, { error: 'error.generic' });
		}

		// Build CSV of snapshots
		let snapshotQuery = db
			.from('score_snapshots')
			.select(
				'id, node_id, composite_score, composite_tier, cycle_label, created_at, notes, recorded_by, adjusted_by, adjusted_at'
			)
			.eq('organization_id', organization.id)
			.order('created_at', { ascending: true });

		if (nodeIds) {
			snapshotQuery = snapshotQuery.in('node_id', nodeIds);
		}

		const { data: snapshots } = await snapshotQuery;

		// Get node names for the CSV
		const uniqueNodeIds = [...new Set((snapshots ?? []).map((s) => s.node_id))];
		let nodeNameMap: Record<string, string> = {};
		if (uniqueNodeIds.length > 0) {
			const { data: nodes } = await db
				.from('org_hierarchy_nodes')
				.select('id, name')
				.in('id', uniqueNodeIds);
			nodeNameMap = Object.fromEntries((nodes ?? []).map((n) => [n.id, n.name]));
		}

		const csvRows = [
			[
				t(locals.locale, 'export.csv.node'),
				t(locals.locale, 'export.csv.score'),
				t(locals.locale, 'export.csv.tier'),
				t(locals.locale, 'export.csv.cycle'),
				t(locals.locale, 'export.csv.date'),
				t(locals.locale, 'export.csv.notes')
			].join(','),
			...(snapshots ?? []).map((s) =>
				[
					`"${nodeNameMap[s.node_id] ?? s.node_id}"`,
					s.composite_score.toFixed(2),
					s.composite_tier,
					`"${s.cycle_label ?? ''}"`,
					s.created_at,
					`"${(s.notes ?? '').replace(/"/g, '""')}"`
				].join(',')
			)
		];

		return { exportCsv: csvRows.join('\n') };
	}
};
