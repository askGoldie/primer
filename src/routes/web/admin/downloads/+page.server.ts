/**
 * Admin Downloads Page Server
 *
 * Shows download activity for licensed users.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	// Get download events with user join, paginated
	const { data: events } = await db
		.from('download_events')
		.select('*, users!download_events_account_id_fkey(id, name, email)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Get total count
	const { count: total } = await db
		.from('download_events')
		.select('*', { count: 'exact', head: true });

	// Get all events for aggregation (version breakdown + unique users)
	const { data: allEvents } = await db.from('download_events').select('version, account_id');

	const versionBreakdown = new Map<string, number>();
	const uniqueAccountIds = new Set<string>();

	for (const e of allEvents ?? []) {
		versionBreakdown.set(e.version, (versionBreakdown.get(e.version) ?? 0) + 1);
		uniqueAccountIds.add(e.account_id);
	}

	return {
		events: (events ?? []).map((e) => ({
			id: e.id,
			userId: e.users?.id ?? e.account_id,
			userName: e.users?.name ?? null,
			userEmail: e.users?.email ?? null,
			version: e.version,
			eventType: e.event_type,
			errorDetail: e.error_detail,
			createdAt: e.created_at
		})),
		pagination: {
			page,
			totalPages: Math.ceil((total ?? 0) / limit),
			total: total ?? 0
		},
		stats: {
			totalDownloads: total ?? 0,
			uniqueUsers: uniqueAccountIds.size,
			versionBreakdown: Array.from(versionBreakdown.entries()).map(([version, count]) => ({
				version,
				count
			}))
		}
	};
};
