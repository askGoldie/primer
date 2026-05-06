/**
 * Placement Request API
 *
 * Allows unplaced users to notify administrators that they need
 * to be added to the organizational hierarchy.
 *
 * POST — Creates a new placement request for the current user.
 *        Idempotent: if a pending request already exists, returns
 *        the existing one rather than creating a duplicate.
 *
 * Visible to system_admin, hr_admin, and owner in the admin panel
 * as a "Pending Placements" section.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { sql, maybeOne } from '$lib/server/db.js';
import { t } from '$lib/i18n/index.js';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		error(401, t(locals.locale, 'error.unauthorized'));
	}

	const membership = await maybeOne<{ organization_id: string }>(sql`
		select organization_id from org_members
		where user_id = ${locals.user.id} and removed_at is null
		limit 1
	`);

	if (!membership) {
		error(400, t(locals.locale, 'error.no_membership'));
	}

	const existing = await maybeOne<{ id: string }>(sql`
		select id from placement_requests
		where organization_id = ${membership.organization_id}
			and user_id = ${locals.user.id}
			and resolved_at is null
		limit 1
	`);

	if (existing) {
		return json({ id: existing.id, status: 'already_pending' });
	}

	const inserted = await maybeOne<{ id: string }>(sql`
		insert into placement_requests (organization_id, user_id)
		values (${membership.organization_id}, ${locals.user.id})
		returning id
	`);

	if (!inserted) {
		error(500, t(locals.locale, 'error.placement_request_failed'));
	}

	return json({ id: inserted.id, status: 'created' });
};
