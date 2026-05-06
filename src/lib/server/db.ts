/**
 * Server-side Database Client
 *
 * Exposes two clients during the Phase 2 Supabase → postgres-js migration:
 *
 *   - `sql`  — the postgres-js tagged-template client. Use this for new code
 *              and as call sites are migrated. Returns plain row arrays.
 *
 *   - `db`   — the legacy typed Supabase admin client. Used by call sites
 *              that haven't been migrated yet. Will be removed at the end
 *              of Phase 2.
 *
 * In the final customer build, only `sql` (and the helpers below) remain;
 * `DATABASE_URL` is the sole DB env var.
 *
 * @example
 * ```ts
 * import { sql, maybeOne } from '$lib/server/db.js';
 *
 * const user = await maybeOne<UserRow>(sql`select * from users where id = ${userId}`);
 * ```
 */

import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import type { Database } from '$lib/types/database.js';

// ---------------------------------------------------------------------------
// postgres-js — the target client for the customer build
// ---------------------------------------------------------------------------

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL must be set.');
}

/**
 * Tagged-template SQL client. Parameters are interpolated as bind values
 * (no string concatenation, no SQL injection risk).
 *
 * @example
 * ```ts
 * const rows = await sql`select * from users where id = ${userId}`;
 * ```
 */
export const sql = postgres(env.DATABASE_URL, {
	max: Number(env.DATABASE_POOL_MAX ?? 10),
	idle_timeout: 30,
	connect_timeout: 10,
	ssl: env.DATABASE_SSL === 'require' ? 'require' : false,
	prepare: true
});

/**
 * Run a query expected to return exactly one row. Throws if zero rows.
 */
export async function one<T>(query: postgres.PendingQuery<postgres.Row[]>): Promise<T> {
	const rows = await query;
	if (rows.length === 0) throw new Error('Expected one row, got 0');
	return rows[0] as unknown as T;
}

/**
 * Run a query that may return zero or one row.
 */
export async function maybeOne<T>(query: postgres.PendingQuery<postgres.Row[]>): Promise<T | null> {
	const rows = await query;
	return (rows[0] as unknown as T) ?? null;
}

/**
 * Run a query that returns a list of rows (zero or more).
 */
export async function many<T>(query: postgres.PendingQuery<postgres.Row[]>): Promise<T[]> {
	const rows = await query;
	return rows as unknown as T[];
}

// ---------------------------------------------------------------------------
// Supabase admin client — legacy, removed at the end of Phase 2
// ---------------------------------------------------------------------------

if (!pubEnv.PUBLIC_SUPABASE_URL) {
	throw new Error('PUBLIC_SUPABASE_URL must be set (Phase 2 transitional).');
}
if (!env.SUPABASE_SECRET_KEY) {
	throw new Error('SUPABASE_SECRET_KEY must be set (Phase 2 transitional).');
}

/**
 * Legacy typed Supabase admin client. Used by call sites pending migration.
 * Removed at the end of Phase 2.
 */
export const db = createClient<Database>(pubEnv.PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});
