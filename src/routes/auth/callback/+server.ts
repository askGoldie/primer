/**
 * Supabase Auth Callback Handler
 *
 * GET /auth/callback
 *
 * Every Supabase Auth email (signup confirmation, password reset, magic link,
 * email-change) redirects the user here. The endpoint verifies the token,
 * establishes a session cookie, and forwards the user to their destination
 * (the `next` query parameter).
 *
 * Two token formats are accepted:
 *
 *   1. OTP flow (preferred — works in any browser)
 *        /auth/callback?token_hash=<hash>&type=<type>&next=<url>
 *      This is the shape produced by our custom email templates in
 *      `supabase/templates/*.html`. Verified via `verifyOtp()`, which is
 *      stateless on the client — no cookies required from the originating
 *      browser. This is what all new emails use.
 *
 *   2. PKCE flow (legacy / same-browser only)
 *        /auth/callback?code=<code>
 *      Produced by the default Supabase email templates. Requires the
 *      code-verifier cookie set by `createServerClient` when the reset was
 *      requested, so it fails with HTTP 400 when opened in a different
 *      browser than the one that initiated the flow. Still accepted here so
 *      that any already-in-flight emails continue to work for users who
 *      open them in the originating browser, and to surface a clearer error
 *      otherwise.
 *
 * After session establishment the handler also flips `email_verified = true`
 * on the application `users` row so our profile data tracks Supabase's auth
 * state.
 *
 * Query params:
 *   token_hash, type  — OTP flow token and kind (email / recovery / magiclink / email_change)
 *   code              — PKCE flow authorization code
 *   next (or redirect) — destination after success; must be same-origin.
 *                        Falls back to `/app` for missing or cross-origin values.
 */

import { redirect, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createSupabaseServerClient } from '$lib/server/supabase.js';
import { db } from '$lib/server/db.js';

/**
 * Resolve the post-verification destination from a `next` query param.
 *
 * Accepts either a relative path (`/web/reset-password`) or a same-origin
 * absolute URL. Any cross-origin or malformed value falls back to `fallback`
 * — this prevents the callback from being abused as an open redirect.
 */
function resolveNext(raw: string | null, origin: string, fallback = '/app'): string {
	if (!raw) return fallback;
	try {
		const parsed = new URL(raw, origin);
		if (parsed.origin !== origin) return fallback;
		return parsed.pathname + parsed.search + parsed.hash;
	} catch {
		return fallback;
	}
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as
		| 'email'
		| 'recovery'
		| 'magiclink'
		| 'email_change'
		| null;
	const next = resolveNext(
		url.searchParams.get('next') ?? url.searchParams.get('redirect'),
		url.origin
	);

	const supabase = createSupabaseServerClient(cookies);

	let userId: string | null = null;

	try {
		if (tokenHash && type) {
			// OTP flow — stateless, works from any browser.
			const { data, error: otpError } = await supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type
			});
			if (otpError || !data.user) {
				console.error('[callback] verifyOtp error:', otpError?.message);
				error(400, { message: 'This confirmation link is invalid or has expired.' });
			}
			userId = data.user.id;
		} else if (code) {
			// PKCE flow — requires the code-verifier cookie from the originating
			// browser. If that cookie is missing (user opened the link in a
			// different browser / incognito / on another device), the exchange
			// fails with a characteristic "code verifier" error.
			const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
			if (exchangeError || !data.user) {
				const msg = exchangeError?.message ?? '';
				console.error('[callback] exchangeCodeForSession error:', msg);

				// Surface a specific hint for the cross-browser case so users
				// understand why retrying in the same browser — or requesting a
				// new link — is the path forward.
				if (/code verifier|pkce/i.test(msg)) {
					error(400, {
						message:
							'This confirmation link must be opened in the same browser you used to request it. Please request a new one and open it from this browser.'
					});
				}
				error(400, { message: 'This confirmation link is invalid or has expired.' });
			}
			userId = data.user.id;
		} else {
			error(400, { message: 'Missing auth callback parameters.' });
		}
	} catch (err) {
		// Re-throw SvelteKit HTTP errors (from the `error()` calls above).
		// isHttpError() is required because HttpError is not instanceof Error in SvelteKit v2.
		if (isHttpError(err)) throw err;
		console.error('[callback] unexpected error:', err);
		error(500, { message: 'Authentication failed. Please try again.' });
	}

	// Sync email_verified flag on the application profile row.
	if (userId) {
		await db.from('users').update({ email_verified: true }).eq('id', userId);
	}

	redirect(302, next);
};
