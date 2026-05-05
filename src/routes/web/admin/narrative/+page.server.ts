/**
 * Admin Narrative Events Page Server
 *
 * Shows detailed narrative event tracking.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	// Get events with pagination
	const { data: events } = await db
		.from('narrative_events')
		.select('*')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Get total count
	const { count: total } = await db
		.from('narrative_events')
		.select('*', { count: 'exact', head: true });

	// Get breakdown by event type
	// PostgREST doesn't support GROUP BY natively, so we fetch all and aggregate in JS
	const { data: allEvents } = await db
		.from('narrative_events')
		.select('event_type, locale, session_id');

	const eventBreakdown = new Map<string, number>();
	const localeBreakdown = new Map<string, number>();
	const uniqueSessionIds = new Set<string>();

	for (const e of allEvents ?? []) {
		eventBreakdown.set(e.event_type, (eventBreakdown.get(e.event_type) ?? 0) + 1);
		localeBreakdown.set(e.locale, (localeBreakdown.get(e.locale) ?? 0) + 1);
		uniqueSessionIds.add(e.session_id);
	}

	return {
		events: (events ?? []).map((e) => ({
			id: e.id,
			sessionId: e.session_id,
			eventType: e.event_type,
			eventValue: e.event_value,
			locale: e.locale,
			createdAt: e.created_at
		})),
		pagination: {
			page,
			totalPages: Math.ceil((total ?? 0) / limit),
			total: total ?? 0
		},
		stats: {
			uniqueSessions: uniqueSessionIds.size,
			eventBreakdown: Array.from(eventBreakdown.entries()).map(([type, count]) => ({
				type,
				count
			})),
			localeBreakdown: Array.from(localeBreakdown.entries()).map(([locale, count]) => ({
				locale,
				count
			}))
		}
	};
};
