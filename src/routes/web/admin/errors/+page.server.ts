/**
 * Admin Errors Page Server
 *
 * Shows all error events across the system.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async () => {
	const limit = 50;

	// Fetch errors from all three event tables in parallel
	const [purchaseResult, downloadResult, accountResult] = await Promise.all([
		db
			.from('purchase_events')
			.select('*')
			.not('error_detail', 'is', null)
			.order('created_at', { ascending: false })
			.limit(limit),
		db
			.from('download_events')
			.select('*')
			.not('error_detail', 'is', null)
			.order('created_at', { ascending: false })
			.limit(limit),
		db
			.from('account_events')
			.select('*')
			.not('error_detail', 'is', null)
			.order('created_at', { ascending: false })
			.limit(limit)
	]);

	// Combine and sort all errors
	const allErrors = [
		...(purchaseResult.data ?? []).map((e) => ({
			id: e.id,
			source: 'purchase' as const,
			eventType: e.event_type,
			errorDetail: e.error_detail!,
			createdAt: e.created_at
		})),
		...(downloadResult.data ?? []).map((e) => ({
			id: e.id,
			source: 'download' as const,
			eventType: e.event_type,
			errorDetail: e.error_detail!,
			createdAt: e.created_at
		})),
		...(accountResult.data ?? []).map((e) => ({
			id: e.id,
			source: 'account' as const,
			eventType: e.event_type,
			errorDetail: e.error_detail!,
			createdAt: e.created_at
		}))
	]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, limit);

	// Count errors by source in parallel
	const [purchaseCount, downloadCount, accountCount] = await Promise.all([
		db
			.from('purchase_events')
			.select('*', { count: 'exact', head: true })
			.not('error_detail', 'is', null),
		db
			.from('download_events')
			.select('*', { count: 'exact', head: true })
			.not('error_detail', 'is', null),
		db
			.from('account_events')
			.select('*', { count: 'exact', head: true })
			.not('error_detail', 'is', null)
	]);

	return {
		errors: allErrors.map((e) => ({
			id: e.id,
			source: e.source,
			eventType: e.eventType,
			errorDetail: e.errorDetail,
			createdAt: e.createdAt
		})),
		stats: {
			total: (purchaseCount.count ?? 0) + (downloadCount.count ?? 0) + (accountCount.count ?? 0),
			bySource: {
				purchase: purchaseCount.count ?? 0,
				download: downloadCount.count ?? 0,
				account: accountCount.count ?? 0
			}
		}
	};
};
