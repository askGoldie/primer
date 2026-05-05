// @ts-nocheck
/**
 * Resend Verification Email
 *
 * Triggers Supabase Auth to resend the confirmation email.
 * Always returns success to prevent email enumeration.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { env as pubEnv } from '$env/dynamic/public';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	// Canonical resend page is now /web/verify-email/resend
	redirect(302, `/web/verify-email/resend${url.search}`);
};

export const actions = {
	default: async ({ request, cookies }: import('./$types').RequestEvent) => {
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
;null as any as Actions;