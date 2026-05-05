/**
 * Verify Email Page Server
 *
 * With Supabase Auth, verification happens via the /auth/callback route
 * (Supabase sends the user a magic link that hits that endpoint).
 * This page only ever shows the "check your email" pending state.
 *
 * Part of the /web Supabase-backed auth flow.
 */

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const pending = url.searchParams.get('pending');
	const email = url.searchParams.get('email');
	const redirectTo = url.searchParams.get('redirect') || '/app';

	return {
		pending: pending === 'true',
		email,
		redirectTo
	};
};
