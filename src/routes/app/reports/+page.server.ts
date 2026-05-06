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
import { sql, many, maybeOne } from '$lib/server/db.js';
import type { TierLevel } from '$lib/types/index.js';
import { TIER_VALUES } from '$lib/config/theme.js';
import { getSubtreeNodeIds } from '$lib/server/hierarchy.js';
import { canExportComplianceReports } from '$lib/server/permissions.js';
import { loadActionContext } from '$lib/server/action-context.js';
import { t } from '$lib/i18n/index.js';

interface SnapshotRow {
	id: string;
	node_id: string;
	composite_score: number;
	composite_tier: string;
	cycle_label: string | null;
	created_at: string;
}

interface PerfLogRow {
	id: string;
	metric_id: string;
	period_start: string;
	period_end: string;
	cadence: string;
	measured_value: unknown;
	assessed_tier: string;
	data_source: string | null;
	created_at: string;
	node_id: string | null;
}

interface MetricNameRow {
	id: string;
	name: string;
}

interface NodeNameRow {
	id: string;
	name: string;
	title: string | null;
}

function tierToValue(tier: string): number {
	return TIER_VALUES[tier as TierLevel] ?? 3;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { organization, userNode, membership, hasDirectReports } = await parent();

	const role = membership.role;
	const isAdminRole = role === 'system_admin' || role === 'owner' || role === 'hr_admin';

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
		if (isAdminRole) {
			scope = 'subtree';
			const childIds = await getSubtreeNodeIds(targetNodeId, organization.id);
			scopeNodeIds = [targetNodeId, ...childIds];
		} else {
			const subtree = await getSubtreeNodeIds(userNode.id, organization.id);
			if (subtree.includes(targetNodeId)) {
				scope = 'subtree';
				const childIds = await getSubtreeNodeIds(targetNodeId, organization.id);
				scopeNodeIds = [targetNodeId, ...childIds];
			} else {
				const grants = await many<{ scope_node_id: string | null; visibility: string }>(sql`
					select scope_node_id, visibility
					from visibility_grants
					where grantee_node_id = ${userNode.id}
						and organization_id = ${organization.id}
						and revoked_at is null
				`);

				const hasGrant = grants.some(
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
		scope = 'org';
	}

	if (!userNode && scope === 'self' && !isAdminRole) {
		redirect(302, '/app');
	}

	const isOrgWide = scope === 'org';

	let nodeIds: string[] | null = null;
	if (scope === 'self' && userNode) {
		nodeIds = [userNode.id];
	} else if (scope === 'subtree' && scopeNodeIds) {
		nodeIds = scopeNodeIds;
	}

	// ── 1. Score Trend ──────────────────────────────────────────────────────
	const snapshots = nodeIds
		? await many<SnapshotRow>(sql`
			select id, node_id, composite_score, composite_tier, cycle_label, created_at
			from score_snapshots
			where node_id = any(${nodeIds}::uuid[])
			order by created_at asc
			limit 50
		`)
		: await many<SnapshotRow>(sql`
			select id, node_id, composite_score, composite_tier, cycle_label, created_at
			from score_snapshots
			where organization_id = ${organization.id}
			order by created_at asc
			limit 50
		`);

	let scoreTrend: Array<{ score: number; tier: TierLevel; label: string; date: string }>;

	if ((isOrgWide || scope === 'subtree') && snapshots.length > 0) {
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
		scoreTrend = snapshots.map((s) => ({
			score: s.composite_score,
			tier: s.composite_tier as TierLevel,
			label:
				s.cycle_label ??
				new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
			date: s.created_at
		}));
	}

	// ── 2. Per-metric performance history ────────────────────────────────────
	const perfLogs = nodeIds
		? await many<PerfLogRow>(sql`
			select id, metric_id, period_start, period_end, cadence, measured_value,
				assessed_tier, data_source, created_at, node_id
			from performance_logs
			where node_id = any(${nodeIds}::uuid[])
			order by period_start asc
			limit 500
		`)
		: await many<PerfLogRow>(sql`
			select id, metric_id, period_start, period_end, cadence, measured_value,
				assessed_tier, data_source, created_at, node_id
			from performance_logs
			where organization_id = ${organization.id}
			order by period_start asc
			limit 500
		`);

	const nodeMetrics = nodeIds
		? await many<MetricNameRow>(sql`
			select id, name from metrics
			where node_id = any(${nodeIds}::uuid[])
			order by sort_order asc
		`)
		: await many<MetricNameRow>(sql`
			select id, name from metrics
			where organization_id = ${organization.id}
			order by sort_order asc
		`);
	const metricNameMap = new Map(nodeMetrics.map((m) => [m.id, m.name]));

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

	for (const log of perfLogs) {
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
	for (const log of perfLogs) {
		const tier = log.assessed_tier as TierLevel;
		if (tier in tierDistribution) {
			tierDistribution[tier]++;
		}
	}

	// ── 4. Direct report / scoped node scores ────────────────────────────────
	let reportNodes: NodeNameRow[];

	if (isOrgWide) {
		reportNodes = await many<NodeNameRow>(sql`
			select id, name, title from org_hierarchy_nodes
			where organization_id = ${organization.id}
		`);
	} else if (scope === 'subtree' && scopeNodeIds) {
		reportNodes = await many<NodeNameRow>(sql`
			select id, name, title from org_hierarchy_nodes
			where id = any(${scopeNodeIds}::uuid[])
		`);
	} else {
		reportNodes = await many<NodeNameRow>(sql`
			select id, name, title from org_hierarchy_nodes
			where parent_id = ${userNode!.id} and organization_id = ${organization.id}
		`);
	}

	const reportNodeIds = reportNodes.map((n) => n.id);

	const [allSnapshots, allLogCounts] =
		reportNodeIds.length > 0
			? await Promise.all([
					many<{
						node_id: string;
						composite_score: number;
						composite_tier: string;
						created_at: string;
					}>(sql`
						select node_id, composite_score, composite_tier, created_at
						from score_snapshots
						where node_id = any(${reportNodeIds}::uuid[])
						order by created_at desc
					`),
					many<{ node_id: string }>(sql`
						select node_id from performance_logs
						where node_id = any(${reportNodeIds}::uuid[])
					`)
				])
			: [[], []];

	const snapshotsByNode = new Map<
		string,
		Array<{ composite_score: number; composite_tier: string; created_at: string }>
	>();
	for (const snap of allSnapshots) {
		if (!snapshotsByNode.has(snap.node_id)) {
			snapshotsByNode.set(snap.node_id, []);
		}
		snapshotsByNode.get(snap.node_id)!.push(snap);
	}

	const logCountByNode = new Map<string, number>();
	for (const log of allLogCounts) {
		logCountByNode.set(log.node_id, (logCountByNode.get(log.node_id) ?? 0) + 1);
	}

	const directReportScores = reportNodes.map((child) => {
		const nodeSnaps = snapshotsByNode.get(child.id) ?? [];
		const latest = nodeSnaps[0] ?? null;
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
		const [totalRow, approvedRow] = await Promise.all([
			maybeOne<{ count: string }>(sql`
				select count(*)::text as count from metrics
				where node_id = any(${scopeNodeIds}::uuid[])
			`),
			maybeOne<{ count: string }>(sql`
				select count(*)::text as count from metrics
				where node_id = any(${scopeNodeIds}::uuid[]) and approved_at is not null
			`)
		]);

		completionRate = {
			total: Number(totalRow?.count ?? 0),
			approved: Number(approvedRow?.count ?? 0)
		};
	}

	const hasData = scoreTrend.length > 0 || perfLogs.length > 0;

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
	exportSubtree: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadActionContext(locals.user.id);
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

		const snapshots = nodeIds
			? await many<{
					id: string;
					node_id: string;
					composite_score: number;
					composite_tier: string;
					cycle_label: string | null;
					created_at: string;
					notes: string | null;
				}>(sql`
					select id, node_id, composite_score, composite_tier, cycle_label,
						created_at, notes
					from score_snapshots
					where organization_id = ${organization.id}
						and node_id = any(${nodeIds}::uuid[])
					order by created_at asc
				`)
			: await many<{
					id: string;
					node_id: string;
					composite_score: number;
					composite_tier: string;
					cycle_label: string | null;
					created_at: string;
					notes: string | null;
				}>(sql`
					select id, node_id, composite_score, composite_tier, cycle_label,
						created_at, notes
					from score_snapshots
					where organization_id = ${organization.id}
					order by created_at asc
				`);

		const uniqueNodeIds = [...new Set(snapshots.map((s) => s.node_id))];
		let nodeNameMap: Record<string, string> = {};
		if (uniqueNodeIds.length > 0) {
			const nodes = await many<{ id: string; name: string }>(sql`
				select id, name from org_hierarchy_nodes where id = any(${uniqueNodeIds}::uuid[])
			`);
			nodeNameMap = Object.fromEntries(nodes.map((n) => [n.id, n.name]));
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
			...snapshots.map((s) =>
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
