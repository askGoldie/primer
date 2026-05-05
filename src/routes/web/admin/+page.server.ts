/**
 * Admin Dashboard Page Server
 *
 * Main admin overview with funnel metrics and recent activity.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

	// Funnel metrics - use count queries with filters
	const { count: narrativeStartCount } = await db
		.from('narrative_events')
		.select('session_id', { count: 'exact', head: true })
		.eq('event_type', 'start')
		.gte('created_at', last30d);

	const { count: narrativeCompleteCount } = await db
		.from('narrative_events')
		.select('session_id', { count: 'exact', head: true })
		.eq('event_type', 'complete')
		.gte('created_at', last30d);

	const { count: accountCreationCount } = await db
		.from('account_events')
		.select('*', { count: 'exact', head: true })
		.eq('event_type', 'created')
		.gte('created_at', last30d);

	const { count: purchaseCount } = await db
		.from('purchase_events')
		.select('*', { count: 'exact', head: true })
		.eq('event_type', 'inquiry_submitted')
		.gte('created_at', last30d);

	const { count: downloadCount } = await db
		.from('download_events')
		.select('*', { count: 'exact', head: true })
		.eq('event_type', 'download_initiated')
		.gte('created_at', last30d);

	// Totals
	const { count: totalUsers } = await db.from('users').select('*', { count: 'exact', head: true });

	const { count: totalLicenses } = await db
		.from('licenses')
		.select('*', { count: 'exact', head: true });

	// Recent activity
	const { data: recentNarrativeEvents } = await db
		.from('narrative_events')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(10);

	const { data: recentPurchaseEvents } = await db
		.from('purchase_events')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(10);

	const { data: recentErrors } = await db
		.from('purchase_events')
		.select('*')
		.not('error_detail', 'is', null)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		funnel: {
			narrativeStarts: narrativeStartCount ?? 0,
			narrativeCompletes: narrativeCompleteCount ?? 0,
			accountCreations: accountCreationCount ?? 0,
			purchases: purchaseCount ?? 0,
			downloads: downloadCount ?? 0
		},
		totals: {
			users: totalUsers ?? 0,
			licenses: totalLicenses ?? 0
		},
		recent: {
			narrativeEvents: (recentNarrativeEvents ?? []).map((e) => ({
				id: e.id,
				sessionId: e.session_id.substring(0, 8) + '...',
				eventType: e.event_type,
				eventValue: e.event_value,
				locale: e.locale,
				createdAt: e.created_at
			})),
			purchaseEvents: (recentPurchaseEvents ?? []).map((e) => ({
				id: e.id,
				eventType: e.event_type,
				email: e.customer_email,
				createdAt: e.created_at
			})),
			errors: (recentErrors ?? []).map((e) => ({
				id: e.id,
				eventType: e.event_type,
				errorDetail: e.error_detail,
				createdAt: e.created_at
			}))
		}
	};
};
