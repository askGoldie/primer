// @ts-nocheck
/**
 * Registration Page Server
 *
 * Creates a Supabase Auth account and an application profile row.
 *
 * Two-step process:
 *   1. `supabase.auth.signUp()` - creates the auth identity and sends a
 *      confirmation email to the user.
 *   2. Insert a profile row into our `users` table keyed by the auth user ID.
 *      This row stores the display name, locale preference, and isAdmin flag.
 *
 * The profile is created immediately (before email confirmation) so that
 * once the user clicks the confirmation link and lands in /app, their
 * profile is already in place.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { db } from '$lib/server/db.js';
import { env as pubEnv } from '$env/dynamic/public';

/** Minimum password length enforced client-side and here */
const MIN_PASSWORD_LENGTH = 8;

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	// Canonical registration page is now /web/register
	redirect(302, `/web/register${url.search}`);
};

export const actions = {
	default: async ({ request, cookies, url }: import('./$types').RequestEvent) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();
		const name = formData.get('name')?.toString().trim();
		const redirectTo =
			formData.get('redirect')?.toString() || url.searchParams.get('redirect') || '/app';

		// ---- Basic validation ----
		if (!email || !password || !name) {
			return fail(400, { error: 'validation.field_required', email, name });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'validation.email_invalid', email, name });
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { error: 'validation.password_min', email, name });
		}

		const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/;
		if (!complexityRegex.test(password)) {
			return fail(400, { error: 'validation.password_complexity', email, name });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'validation.password_match', email, name });
		}

		// ---- Create Supabase auth account ----
		const supabase = createSupabaseServerClient(cookies);
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				// Final destination after the /auth/callback endpoint verifies
				// the confirmation token. The confirmation email template
				// (supabase/templates/confirmation.html) wraps this value into
				// the callback URL's `next` query param.
				emailRedirectTo: `${pubEnv.PUBLIC_APP_URL}${redirectTo}`,
				data: { name }
			}
		});

		if (error) {
			// Log the real error for debugging; return generic message to prevent email enumeration
			console.error('[register] supabase.auth.signUp error:', error.message, error.status);
			return fail(400, { error: 'error.generic', email, name });
		}

		if (!data.user) {
			console.error('[register] supabase.auth.signUp returned no user and no error');
			return fail(500, { error: 'error.generic', email, name });
		}

		// ---- Create application profile ----
		// Check if a profile already exists (edge case: user re-registers)
		try {
			const { data: existing } = await db
				.from('users')
				.select('id')
				.eq('id', data.user.id)
				.single();

			if (!existing) {
				await db.from('users').insert({
					id: data.user.id,
					email,
					password_hash: null, // Supabase manages the password
					name,
					locale: 'en',
					email_verified: false,
					is_admin: false
				});
			}
		} catch (dbErr) {
			// Auth account was created - profile creation failed. Log for ops visibility.
			// User can still verify email; profile can be reconciled via admin if needed.
			console.error('[register] profile creation error:', dbErr);
		}

		// Redirect to the "check your email" page
		redirect(
			302,
			`/auth/verify-email?pending=true&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`
		);
	}
};
;null as any as Actions;