/**
 * Forgot Password Page Server
 *
 * Sends a password reset email via Supabase Auth.
 * Always shows a success response to prevent email enumeration.
 * Part of the /web Supabase-backed auth flow.
 */

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { env as pubEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return { redirectTo: '/' };
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase();

		if (!email) {
			return fail(400, { error: 'validation.field_required', email });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'validation.email_invalid', email });
		}

		const supabase = createSupabaseServerClient(cookies);

		// `redirectTo` is the final destination after the /auth/callback
		// endpoint has verified the token and established a session. The
		// recovery email template (supabase/templates/recovery.html) wraps
		// this value into the callback URL's `next` query param — do not
		// point it at `/auth/callback` directly, or the callback will try
		// to redirect the user to itself.
		await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${pubEnv.PUBLIC_APP_URL}/web/reset-password`
		});

		// Always return success - Supabase silently ignores unknown emails,
		// so we don't leak whether an account exists.
		return { success: true };
	}
};
