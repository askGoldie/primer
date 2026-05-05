// @ts-nocheck
/**
 * Legacy login redirect
 *
 * /auth/login is kept for compatibility with Supabase auth flows
 * (verify-email, reset-password callbacks) but the primary login
 * experience has moved to /web/login.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	const params = url.searchParams.toString();
	redirect(302, params ? `/web/login?${params}` : '/web/login');
};
