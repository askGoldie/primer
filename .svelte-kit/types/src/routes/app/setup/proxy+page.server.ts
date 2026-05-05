// @ts-nocheck
/**
 * Organization Setup Page Server
 *
 * Initial setup for users without an organization.
 * Creates the organization and root hierarchy node.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import { t } from '$lib/i18n/index.js';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	// Check if user already has an organization
	const { data: memberships } = await db
		.from('org_members')
		.select('*')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.limit(1);

	if (memberships && memberships.length > 0) {
		redirect(302, '/app');
	}

	return {};
};

export const actions = {
	default: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const orgName = formData.get('orgName')?.toString().trim();
		const industry = formData.get('industry')?.toString();
		const cycleCadence = formData.get('cycleCadence')?.toString() as 'monthly' | 'quarterly';
		const userName = formData.get('userName')?.toString().trim();
		const userTitle = formData.get('userTitle')?.toString().trim();

		if (!orgName || !userName) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Create organization
		const { data: org, error } = await db
			.from('organizations')
			.insert({
				name: orgName,
				industry: industry || null,
				cycle_cadence: cycleCadence || 'quarterly',
				created_by: locals.user.id
			})
			.select()
			.single();

		if (error || !org) {
			return fail(500, { error: 'error.generic' });
		}

		// Add user as owner
		await db.from('org_members').insert({
			organization_id: org.id,
			user_id: locals.user.id,
			role: 'owner',
			assigned_by: locals.user.id
		});

		// Create root hierarchy node for the user
		await db.from('org_hierarchy_nodes').insert({
			organization_id: org.id,
			node_type: 'executive_leader',
			name: userName,
			title: userTitle || t(locals.locale, 'setup.default_title'),
			user_id: locals.user.id,
			created_by: locals.user.id
		});

		redirect(302, '/app');
	}
};
;null as any as Actions;