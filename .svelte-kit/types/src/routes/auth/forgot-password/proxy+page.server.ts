// @ts-nocheck
/**
 * Forgot Password Page Server
 *
 * Sends a password reset email via Supabase Auth.
 * Always shows a success response to prevent email enumeration.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { env as pubEnv } from '$env/dynamic/public';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	// Canonical forgot-password page is now /web/forgot-password
	redirect(302, `/web/forgot-password${url.search}`);
};

export const actions = {
	default: async ({ request, cookies }: import('./$types').RequestEvent) => {
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
			redirectTo: `${pubEnv.PUBLIC_APP_URL}/auth/reset-password`
		});

		// Always return success - Supabase silently ignores unknown emails,
		// so we don't leak whether an account exists.
		return { success: true };
	}
};
;null as any as Actions;