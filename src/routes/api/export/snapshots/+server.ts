/**
 * Score Snapshots CSV Export
 *
 * Exports score snapshot history as CSV. Scoped to:
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

	let query = db
		.from('score_snapshots')
		.select('*, org_hierarchy_nodes!score_snapshots_node_id_fkey(name)')
		.eq('organization_id', membership.organization_id)
		.order('created_at', { ascending: false })
		.limit(10000);

	if (!wantsOrg || !isAdmin) {
		if (!userNode) error(403);
		query = query.eq('node_id', userNode.id);
	}

	const { data: snapshots } = await query;

	const headers = [
		'Employee',
		'Composite Score',
		'Composite Tier',
		'Cycle Label',
		'Notes',
		'Recorded At',
		'Adjusted At'
	];

	const rows = (snapshots ?? []).map((s) => [
		(s.org_hierarchy_nodes as { name: string } | null)?.name ?? '',
		s.composite_score,
		s.composite_tier,
		s.cycle_label ?? '',
		s.notes ?? '',
		s.created_at,
		s.adjusted_at ?? ''
	]);

	return csvResponse('snapshots.csv', toCsv(headers, rows));
};
