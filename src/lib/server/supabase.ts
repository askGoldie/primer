/**
 * Supabase Client Factory
 *
 * Creates Supabase clients for use within the demo/web instance.
 * All auth for the web instance flows through these clients.
 *
 * Two contexts:
 *
 * 1. `createSupabaseServerClient(cookies)` - used inside SvelteKit hooks and
 *    +page.server.ts / +server.ts files. Reads and writes auth cookies via the
 *    SvelteKit Cookies interface. Always call this fresh per-request - never
 *    share one client across requests.
 *
 * 2. `createSupabaseAdminClient()` - uses the service role key for privileged
 *    operations (seed scripts, admin user management). NEVER use this in code
 *    that runs in response to a browser request.
 *
 * Customer deployments do not import this file - they use the custom auth
 * system in `src/lib/server/auth/index.ts` instead.
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';

/**
 * Create a per-request Supabase client for SvelteKit server contexts.
 *
 * Reads session from cookies and refreshes tokens transparently.
 * The `setAll` callback ensures refreshed tokens are written back to the
 * response cookies by SvelteKit.
 *
 * @example
 * ```ts
 * // In a +page.server.ts action:
 * const supabase = createSupabaseServerClient(cookies);
 * const { error } = await supabase.auth.signInWithPassword({ email, password });
 * ```
 */
export function createSupabaseServerClient(cookies: Cookies) {
	if (!pubEnv.PUBLIC_SUPABASE_URL || !pubEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		throw new Error('PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.');
	}
	return createServerClient(pubEnv.PUBLIC_SUPABASE_URL, pubEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			/** Return all cookies for Supabase to read its session tokens */
			getAll() {
				return cookies.getAll();
			},
			/** Write refreshed auth tokens back to the response */
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) =>
					cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});
}

/**
 * Create a Supabase admin client using the service role key.
 *
 * Bypasses Row Level Security (RLS). Use only in privileged server contexts
 * such as seed scripts, admin endpoints, and user provisioning.
 * NEVER expose to the browser or use in response to untrusted input.
 */
export function createSupabaseAdminClient() {
	if (!env.SUPABASE_SECRET_KEY) {
		throw new Error('SUPABASE_SECRET_KEY is not set. Required for admin operations.');
	}
	if (!pubEnv.PUBLIC_SUPABASE_URL) {
		throw new Error('PUBLIC_SUPABASE_URL must be set.');
	}
	return createClient(pubEnv.PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
		auth: {
			/** Admin client never persists a session - each call is stateless */
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
