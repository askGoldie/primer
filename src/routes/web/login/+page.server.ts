/**
 * Web Login (Team / Admin)
 *
 * Supabase-backed email/password login for team members and administrators.
 * This is NOT the stub login that customers integrate - for that see /login.
 *
 * After a successful sign-in, the user is sent to /web/dashboard
 * (or to whatever ?redirect= target they came from).
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Already Supabase-authenticated - send them on.
	// Checking isSupabaseAuthenticated (not locals.user) is important: a visitor
	// with only a primer_perspective cookie also has locals.user set but has NOT
	// been through the real Supabase login gate and should not bypass this page.
	if (locals.isSupabaseAuthenticated) {
		const redirectTo = url.searchParams.get('redirect') || '/web/dashboard';
		redirect(302, redirectTo);
	}

	return {
		redirectTo: url.searchParams.get('redirect') || '/web/dashboard',
		resetSuccess: url.searchParams.get('reset') === 'success'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const password = formData.get('password')?.toString();
		const redirectTo =
			formData.get('redirect')?.toString() || url.searchParams.get('redirect') || '/web/dashboard';

		if (!email || !password) {
			return fail(400, {
				error: 'validation.field_required',
				email,
				needsVerification: false
			});
		}

		const supabase = createSupabaseServerClient(cookies);
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			const needsVerification = error.message.toLowerCase().includes('email not confirmed');
			return fail(400, {
				error: needsVerification ? 'error.account_not_verified' : 'error.login_failed',
				email,
				needsVerification
			});
		}

		redirect(302, redirectTo);
	}
};
