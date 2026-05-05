// @ts-nocheck
/**
 * Logout Handler
 *
 * Signs the user out of Supabase Auth (clears session cookies) and
 * redirects to the home page.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { PERSPECTIVE_COOKIE } from '$lib/server/demo/constants.js';

export const load = async ({ cookies }: Parameters<PageServerLoad>[0]) => {
	// Clear the platform perspective so the next visitor starts fresh
	cookies.delete(PERSPECTIVE_COOKIE, { path: '/' });

	const supabase = createSupabaseServerClient(cookies);
	await supabase.auth.signOut();

	redirect(302, '/');
};
