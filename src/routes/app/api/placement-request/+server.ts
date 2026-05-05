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
 *
 * @see /supabase/migrations/20260101000020_onboarding.sql
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db.js';
import { t } from '$lib/i18n/index.js';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		error(401, t(locals.locale, 'error.unauthorized'));
	}

	// Get user's org membership
	const { data: membership } = await db
		.from('org_members')
		.select('organization_id')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.single();

	if (!membership) {
		error(400, t(locals.locale, 'error.no_membership'));
	}

	// Check for existing pending request (idempotent)
	const { data: existing } = await db
		.from('placement_requests')
		.select('id')
		.eq('organization_id', membership.organization_id)
		.eq('user_id', locals.user.id)
		.is('resolved_at', null)
		.single();

	if (existing) {
		return json({ id: existing.id, status: 'already_pending' });
	}

	// Create placement request
	const { data: request, error: insertErr } = await db
		.from('placement_requests')
		.insert({
			organization_id: membership.organization_id,
			user_id: locals.user.id
		})
		.select('id')
		.single();

	if (insertErr) {
		error(500, t(locals.locale, 'error.placement_request_failed'));
	}

	return json({ id: request.id, status: 'created' });
};
