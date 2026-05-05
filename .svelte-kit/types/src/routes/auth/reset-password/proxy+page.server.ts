// @ts-nocheck
/**
 * Reset Password Page Server
 *
 * The user arrives here after clicking the password reset link in their
 * email. The `/auth/callback` handler already exchanged the token for a
 * session - this page just presents the new-password form and calls
 * `updateUser` to apply it.
 *
 * Because the Supabase session is already active at this point (set by
 * /auth/callback), `locals.user` is populated and we can call `updateUser`
 * directly without a separate token parameter.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';

const MIN_PASSWORD_LENGTH = 8;

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	// Canonical reset-password page is now /web/reset-password
	redirect(302, `/web/reset-password${url.search}`);
};

export const actions = {
	default: async ({ request, cookies, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(400, { error: 'auth.verification_expired' });
		}

		const formData = await request.formData();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!password) {
			return fail(400, { error: 'validation.field_required' });
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { error: 'validation.password_min' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'validation.password_match' });
		}

		const supabase = createSupabaseServerClient(cookies);
		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { error: 'auth.verification_expired' });
		}

		redirect(302, '/auth/login?reset=success');
	}
};
;null as any as Actions;