/**
 * Verify Email Page Server
 *
 * GET with `?token=...` consumes a verification token; on success the
 * user's `email_verified` flag is flipped to true and they are redirected
 * to /app (or the supplied redirect target).
 *
 * Without a token, the page is just a "check your email" placeholder —
 * Phase 4 will add a real UI; for now we send users to /auth/login.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { verifyEmailToken } from '$lib/server/auth/index.js';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const redirectTo = url.searchParams.get('redirect') || '/app';

	if (token) {
		const verification = await verifyEmailToken(token);
		if (verification) {
			redirect(302, redirectTo);
		}
		// Token invalid/expired — fall through to login with an error hint
		redirect(302, `/auth/login?verify=expired`);
	}

	redirect(302, `/auth/login${url.search}`);
};
