/**
 * Server Hooks for Primer
 *
 * Three sequential hooks (run in order via sequence()):
 *
 * 1. handleSupabase  — Creates a per-request Supabase client stored on
 *    event.locals.supabase, following the official @supabase/ssr pattern.
 *    Adds filterSerializedResponseHeaders so token refresh works correctly.
 *    Exposes safeGetSession() which validates the JWT via getUser() (not
 *    just getSession(), which can be forged).
 *
 * 2. handleAuth      — Populates event.locals.user and event.locals.isAdmin
 *    from our application database. Two paths:
 *    A. Supabase session → load profile row from users table.
 *    B. No Supabase session → check primer_perspective cookie (demo mode).
 *    Sets isSupabaseAuthenticated = true only on path A.
 *
 * 3. handleGuards    — Centralised route protection. More reliable than
 *    per-page guards because it runs before any load function.
 *    - /platform requires Supabase authentication (not just any session).
 *    - /web/admin requires isAdmin.
 */

import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env as pubEnv } from '$env/dynamic/public';

// Fail fast at module load if the required Supabase env vars are missing
// — `$env/dynamic/public` types them as `string | undefined`, and the rest
// of this module depends on them being strings. Extracting + guarding here
// also lets TypeScript narrow once for the whole file.
const SUPABASE_URL = pubEnv.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = pubEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error(
		'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in the environment.'
	);
}
import { db } from '$lib/server/db.js';
import { parseAcceptLanguage, getLocaleFromCookie, LOCALE_COOKIE_NAME } from '$lib/i18n/index.js';
import type { Locale } from '$lib/types/index.js';
import { PERSPECTIVE_COOKIE, PLATFORM_ORG_ID } from '$lib/server/demo/constants.js';

// ---------------------------------------------------------------------------
// Locale detection
// ---------------------------------------------------------------------------

const handleLocale: Handle = async ({ event, resolve }) => {
	const cookieLocale = getLocaleFromCookie(event.cookies.get(LOCALE_COOKIE_NAME));

	if (cookieLocale) {
		event.locals.locale = cookieLocale;
	} else {
		const acceptLanguage = event.request.headers.get('accept-language');
		event.locals.locale = parseAcceptLanguage(acceptLanguage);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const isRTL = event.locals.locale === 'ar';
			return html.replace('%lang%', event.locals.locale).replace('%dir%', isRTL ? 'rtl' : 'ltr');
		}
	});
};

// ---------------------------------------------------------------------------
// Supabase client + safeGetSession (official @supabase/ssr pattern)
// ---------------------------------------------------------------------------

const handleSupabase: Handle = async ({ event, resolve }) => {
	/**
	 * Create a per-request server client backed by SvelteKit cookies.
	 * Storing it on event.locals lets load functions reuse it without
	 * creating a second client.
	 */
	// The return type of createServerClient<any> triggers a pathological
	// "excessively deep" inference when assigned to the generic SupabaseClient
	// type declared on locals, so we cast through unknown here. The runtime
	// shape is identical — only the compile-time generics differ.
	event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	}) as unknown as App.Locals['supabase'];

	/**
	 * safeGetSession — always validates the JWT against Supabase's Auth server.
	 *
	 * NEVER use getSession() alone for server-side auth decisions. getSession()
	 * only decodes the JWT locally without verifying it, so a tampered cookie
	 * can pass. getUser() makes a network call and confirms the token is real.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		/**
		 * Required by @supabase/ssr: forward these headers so the browser
		 * client can process token refreshes and API responses correctly.
		 */
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

// ---------------------------------------------------------------------------
// Auth — populate locals.user from DB profile or perspective cookie
// ---------------------------------------------------------------------------

/**
 * Resolve a perspective cookie value to the persona's user profile.
 *
 * The cookie contract is "whatever identifier downstream can use to find
 * a user row." Two shapes are supported:
 *
 *   1. Hierarchy node UUID → look up the node, follow its user_id.
 *      This covers every tree-placed persona (CEO, VPs, directors, ICs).
 *
 *   2. User UUID → look up the users table directly.
 *      This covers intentionally unplaced personas like Aisha Torres
 *      (new hire awaiting placement), Linda Reyes (HR Director, cross-
 *      cutting role with no tree node), and Carlos Mendez (Chief of
 *      Staff, owner-level admin without a tree position).
 *
 * Shape 1 is tried first because it's the common case and also the only
 * path that checks `organization_id`. If the cookie value is not a node
 * id in the platform org, we fall through to shape 2.
 */
async function resolvePerspective(perspectiveId: string) {
	// Shape 1: node UUID in the platform org → follow to user.
	const { data: node } = await db
		.from('org_hierarchy_nodes')
		.select('id, user_id, organization_id')
		.eq('id', perspectiveId)
		.eq('organization_id', PLATFORM_ORG_ID)
		.single();

	const userId = node?.user_id ?? perspectiveId;

	// Shape 2: look up the user record directly. This covers both the
	// follow-through from shape 1 and the "no node at all" personas.
	const { data: profile } = await db.from('users').select('*').eq('id', userId).single();

	if (!profile || profile.deactivated_at) return null;

	return {
		id: profile.id as string,
		email: profile.email as string,
		name: profile.name as string,
		locale: ((profile.locale as Locale) ?? 'en') as Locale,
		deactivatedAt: null as Date | null,
		createdAt: new Date(profile.created_at as string),
		updatedAt: new Date(profile.updated_at as string)
	};
}

const handleAuth: Handle = async ({ event, resolve }) => {
	event.locals.session = null;
	event.locals.user = null;
	event.locals.isAdmin = false;
	event.locals.isSupabaseAuthenticated = false;

	try {
		const { session, user: authUser } = await event.locals.safeGetSession();

		if (session && authUser) {
			// Path A: valid Supabase session — load application profile
			const { data: profile } = await db.from('users').select('*').eq('id', authUser.id).single();

			if (profile && !profile.deactivated_at) {
				event.locals.session = session;
				event.locals.user = {
					id: profile.id,
					email: profile.email,
					name: profile.name,
					locale: (profile.locale as Locale) ?? 'en',
					deactivatedAt: profile.deactivated_at ? new Date(profile.deactivated_at) : null,
					createdAt: new Date(profile.created_at),
					updatedAt: new Date(profile.updated_at)
				};
				event.locals.isAdmin = profile.is_admin ?? false;
				event.locals.isSupabaseAuthenticated = true;
			}

			// Path A+: Supabase-authenticated user on the demo site who has also
			// picked a platform persona. The perspective cookie determines which
			// seeded employee they are "playing as". Override locals.user with the
			// persona's identity so that load functions AND form actions both see
			// the same user — the persona, not the real Supabase account.
			// isSupabaseAuthenticated stays true so /platform access still works.
			const perspectiveId = event.cookies.get(PERSPECTIVE_COOKIE);
			if (perspectiveId) {
				const personaProfile = await resolvePerspective(perspectiveId);
				if (personaProfile) {
					event.locals.user = personaProfile;
					// Persona override — not a site admin
					event.locals.isAdmin = false;
				}
			}
		} else {
			// Path B: no Supabase session — check for platform perspective cookie.
			// On the demo site, /login sets this cookie after the user picks a persona.
			// On customer deployments, their auth provider sets it.
			// We resolve it to the seeded user record so all downstream DB queries
			// (org membership, metrics, etc.) work identically to path A.
			const perspectiveId = event.cookies.get(PERSPECTIVE_COOKIE);
			if (perspectiveId) {
				const profile = await resolvePerspective(perspectiveId);
				if (profile) {
					event.locals.user = profile;
					// Platform personas are never site admins
					event.locals.isAdmin = false;
				}
			}
		}
	} catch (err) {
		// Auth failure must never cause a 500 — continue unauthenticated
		console.error('[auth hook] error:', err);
	}

	return resolve(event);
};

// ---------------------------------------------------------------------------
// Route guards — centralised, run before any load function
// ---------------------------------------------------------------------------

const handleGuards: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Legacy URL redirects. Both `/web/for-consultants` and
	// `/web/problem/personas` were consolidated into `/web/for-partners`,
	// which uses a persona toggle to show only the audience-specific
	// narrative a visitor cares about. Permanent (301) redirects preserve
	// any inbound links and search-engine equity the old URLs accumulated.
	if (path === '/web/for-consultants' || path === '/web/problem/personas') {
		redirect(301, '/web/for-partners');
	}

	// /platform requires a real Supabase login — not just any locals.user.
	// A primer_perspective cookie sets locals.user too, but isSupabaseAuthenticated
	// is only true when the Supabase JWT was validated.
	if (path.startsWith('/platform')) {
		if (!event.locals.isSupabaseAuthenticated) {
			redirect(302, `/web/login?redirect=${encodeURIComponent(path)}`);
		}
	}

	// /web/admin requires the isAdmin flag
	if (path.startsWith('/web/admin')) {
		if (!event.locals.isAdmin) {
			redirect(302, '/');
		}
	}

	return resolve(event);
};

// ---------------------------------------------------------------------------
// Export — order: locale → supabase → auth → guards
// ---------------------------------------------------------------------------

export const handle = sequence(handleLocale, handleSupabase, handleAuth, handleGuards);
