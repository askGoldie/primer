/**
 * Server-side Database Client
 *
 * Provides a typed Supabase client for all server-side data queries.
 * Uses the service-role key (admin client) to bypass RLS, since this
 * project enforces access control at the application layer rather than
 * via Postgres Row Level Security.
 *
 * This replaces the previous Drizzle ORM client. All queries now use
 * the Supabase PostgREST query builder.
 *
 * @example
 * ```ts
 * import { db } from '$lib/server/db.js';
 *
 * const { data: users } = await db.from('users').select('*').eq('id', userId);
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import type { Database } from '$lib/types/database.js';

if (!pubEnv.PUBLIC_SUPABASE_URL) {
	throw new Error('PUBLIC_SUPABASE_URL must be set.');
}

if (!env.SUPABASE_SECRET_KEY) {
	throw new Error('SUPABASE_SECRET_KEY is not set. Required for server-side data access.');
}

/**
 * Typed Supabase admin client for server-side data queries.
 *
 * Uses the service-role key - never expose to the browser.
 * Stateless: no session persistence or token refresh.
 */
export const db = createClient<Database>(pubEnv.PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});
