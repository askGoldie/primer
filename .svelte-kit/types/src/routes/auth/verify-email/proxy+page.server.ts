// @ts-nocheck
/**
 * Verify Email Page Server
 *
 * With Supabase Auth, verification happens via the /auth/callback route
 * (Supabase sends the user a magic link that hits that endpoint).
 * This page only ever shows the "check your email" pending state.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	// Canonical verify-email page is now /web/verify-email
	redirect(302, `/web/verify-email${url.search}`);
};
