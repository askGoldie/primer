// @ts-nocheck
/**
 * Root Layout Server Load
 *
 * Runs on every request. Passes locale, user, and the validated Supabase
 * session to all pages via PageData. The session is needed by +layout.ts
 * to initialise the browser-side Supabase client correctly.
 */

import type { LayoutServerLoad } from './$types.js';

export const load = async ({ locals, cookies }: Parameters<LayoutServerLoad>[0]) => {
	const { session } = await locals.safeGetSession();

	return {
		locale: locals.locale,
		user: locals.user,
		session,
		// Raw cookies forwarded to +layout.ts so the server-side render of the
		// browser client can read the same session without an extra round-trip.
		cookies: cookies.getAll()
	};
};
