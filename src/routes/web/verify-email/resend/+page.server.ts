/**
 * Resend Verification Email Server
 *
 * Triggers Supabase Auth to resend the confirmation email.
 * Always returns success to prevent email enumeration.
 * Part of the /web Supabase-backed auth flow.
 */

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { env as pubEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ url }) => {
	return {
		email: url.searchParams.get('email') || '',
		redirectTo: url.searchParams.get('redirect') || '/app'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const redirectTo = formData.get('redirect')?.toString() || '/app';

		if (!email) {
			return fail(400, { error: 'validation.field_required', email });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'validation.email_invalid', email });
		}

		const supabase = createSupabaseServerClient(cookies);

		// Supabase silently ignores unknown emails - safe against enumeration.
		// `emailRedirectTo` is the final destination after the /auth/callback
		// endpoint verifies the token; the confirmation email template
		// (supabase/templates/confirmation.html) wraps this into the
		// callback URL's `next` query param.
		await supabase.auth.resend({
			type: 'signup',
			email,
			options: {
				emailRedirectTo: `${pubEnv.PUBLIC_APP_URL}${redirectTo}`
			}
		});

		return { success: true, email, redirectTo };
	}
};
