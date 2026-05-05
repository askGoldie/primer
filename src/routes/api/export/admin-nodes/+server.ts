/**
 * Admin Nodes CSV Export
 *
 * Exports all hierarchy nodes with metric counts and snapshot status.
 * Restricted to system_admin and owner roles.
 */

import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { toCsv, csvResponse } from '$lib/server/csv.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401);

	const { data: membership } = await db
		.from('org_members')
		.select('organization_id, role')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.single();

	if (!membership || (membership.role !== 'owner' && membership.role !== 'system_admin')) {
		error(403);
	}

	// Load all nodes
	const { data: nodes } = await db
		.from('org_hierarchy_nodes')
		.select('*, users!org_hierarchy_nodes_user_id_fkey(name, email)')
		.eq('organization_id', membership.organization_id)
		.order('sort_order', { ascending: true });

	// For each node, get counts and latest snapshot
	const rows = await Promise.all(
		(nodes ?? []).map(async (node) => {
			const userData = node.users as { name: string; email: string } | null;

			const { count: metricCount } = await db
				.from('metrics')
				.select('id', { count: 'exact', head: true })
				.eq('node_id', node.id);

			const { count: lockedCount } = await db
				.from('metrics')
				.select('id', { count: 'exact', head: true })
				.eq('node_id', node.id)
				.not('locked_by_snapshot_id', 'is', null);

			const { data: snap } = await db
				.from('score_snapshots')
				.select('composite_score, composite_tier, cycle_label, created_at')
				.eq('node_id', node.id)
				.order('created_at', { ascending: false })
				.limit(1);

			const latest = snap?.[0];

			return [
				node.name,
				node.title ?? '',
				node.node_type,
				userData?.name ?? '',
				userData?.email ?? '',
				metricCount ?? 0,
				lockedCount ?? 0,
				(lockedCount ?? 0) > 0 ? 'Locked' : 'Active',
				latest?.composite_score ?? '',
				latest?.composite_tier ?? '',
				latest?.cycle_label ?? '',
				latest?.created_at ?? ''
			];
		})
	);

	const headers = [
		'Position',
		'Title',
		'Node Type',
		'User Name',
		'User Email',
		'Metric Count',
		'Locked Metrics',
		'Status',
		'Latest Score',
		'Latest Tier',
		'Cycle Label',
		'Snapshot Date'
	];

	return csvResponse('org-nodes.csv', toCsv(headers, rows));
};
