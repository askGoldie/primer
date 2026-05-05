// @ts-nocheck
/**
 * Root Layout Client Load
 *
 * Creates the browser-side Supabase client (or a server-side one during SSR)
 * following the official @supabase/ssr pattern. Declaring depends('supabase:auth')
 * tells SvelteKit to re-run this load function whenever auth state changes,
 * keeping the session reactive across sign-in, sign-out, and token refresh.
 */

import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env as pubEnv } from '$env/dynamic/public';
import type { LayoutLoad } from './$types.js';

// `$env/dynamic/public` types these as `string | undefined`. Guarding once
// at module load lets TypeScript narrow to `string` below. Matches the
// runtime expectation that these envs are always present — absent env is
// already a fatal boot error via hooks.server.ts.
const SUPABASE_URL = pubEnv.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = pubEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error(
		'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in the environment.'
	);
}

export const load = async ({ data, depends, fetch }: Parameters<LayoutLoad>[0]) => {
	// Re-run this load whenever 'supabase:auth' is invalidated
	// (triggered by onAuthStateChange in +layout.svelte)
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
				global: { fetch }
			})
		: createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
				cookies: {
					// During SSR we read from the cookies forwarded by +layout.server.ts
					getAll: () => data.cookies ?? []
				},
				global: { fetch }
			});

	// data.session is already validated by safeGetSession in +layout.server.ts —
	// safe to use directly here without another getUser() call.
	const {
		data: { session }
	} = await supabase.auth.getSession();

	return { ...data, supabase, session };
};
