/**
 * Performance Logs CSV Export
 *
 * Exports performance log entries as CSV. Scoped to:
 * - Personal node (regular users)
 * - Entire org (system_admin/owner)
 *
 * Query params:
 * - scope=org — force org-wide export (requires admin role)
 */

import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { toCsv, csvResponse } from '$lib/server/csv.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401);

	// Get membership and node
	const { data: membership } = await db
		.from('org_members')
		.select('organization_id, role')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.single();

	if (!membership) error(403);

	const { data: userNode } = await db
		.from('org_hierarchy_nodes')
		.select('id')
		.eq('user_id', locals.user.id)
		.eq('organization_id', membership.organization_id)
		.single();

	const isAdmin = membership.role === 'owner' || membership.role === 'system_admin';
	const wantsOrg = url.searchParams.get('scope') === 'org';

	// Build query
	let query = db
		.from('performance_logs')
		.select(
			'*, metrics!performance_logs_metric_id_fkey(name), org_hierarchy_nodes!performance_logs_node_id_fkey(name)'
		)
		.eq('organization_id', membership.organization_id)
		.order('period_start', { ascending: false })
		.limit(10000);

	if (!wantsOrg || !isAdmin) {
		if (!userNode) error(403);
		query = query.eq('node_id', userNode.id);
	}

	const { data: logs } = await query;

	const headers = [
		'Employee',
		'Metric',
		'Period Start',
		'Period End',
		'Cadence',
		'Assessed Tier',
		'Measured Value',
		'Data Source',
		'Notes',
		'Recorded At'
	];

	const rows = (logs ?? []).map((l) => [
		(l.org_hierarchy_nodes as { name: string } | null)?.name ?? '',
		(l.metrics as { name: string } | null)?.name ?? '',
		l.period_start,
		l.period_end,
		l.cadence,
		l.assessed_tier,
		JSON.stringify(l.measured_value),
		l.data_source ?? '',
		l.notes ?? '',
		l.created_at
	]);

	return csvResponse('performance-logs.csv', toCsv(headers, rows));
};
