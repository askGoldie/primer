/**
 * Admin Purchases Page Server
 *
 * Shows purchase events and license history.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	// Get purchase events with pagination
	const { data: events } = await db
		.from('purchase_events')
		.select('*, users:users!purchase_events_account_id_fkey(id, email)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Get total count
	const { count: total } = await db
		.from('purchase_events')
		.select('*', { count: 'exact', head: true });

	// Get completed purchases
	const { count: completed } = await db
		.from('purchase_events')
		.select('*', { count: 'exact', head: true })
		.in('event_type', ['inquiry_submitted', 'license_granted']);

	// Get all licenses for summary
	const { data: allLicenses } = await db
		.from('licenses')
		.select('*, users!licenses_user_id_fkey(id, name, email)')
		.order('purchased_at', { ascending: false });

	return {
		events: (events ?? []).map((row) => {
			const user = row.users as { id: string; email: string } | null;
			return {
				id: row.id,
				eventType: row.event_type,
				email: row.customer_email || user?.email || null,
				errorDetail: row.error_detail,
				locale: row.locale,
				createdAt: row.created_at
			};
		}),
		pagination: {
			page,
			totalPages: Math.ceil((total ?? 0) / limit),
			total: total ?? 0
		},
		stats: {
			totalEvents: total ?? 0,
			completed: completed ?? 0,
			totalRevenue: (allLicenses ?? []).length * 5000
		},
		licenses: (allLicenses ?? []).map((row) => {
			const user = row.users as { id: string; name: string; email: string } | null;
			return {
				id: row.id,
				userId: user?.id ?? '',
				userName: user?.name ?? '',
				userEmail: user?.email ?? '',
				status: row.status,
				purchasedAt: row.purchased_at
			};
		})
	};
};
