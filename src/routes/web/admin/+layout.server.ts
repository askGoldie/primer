/**
 * Admin Layout Server
 *
 * Protects all /admin routes - requires authentication and admin flag.
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.user) {
		redirect(302, '/auth/login?redirect=/admin');
	}

	// Require admin flag (isAdmin is set on locals directly, not on the User type)
	if (!locals.isAdmin) {
		redirect(302, '/');
	}

	return {
		admin: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email
		}
	};
};
