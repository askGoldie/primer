/**
 * Server-side Database Client
 *
 * Exposes the postgres-js tagged-template client and three small helpers for
 * the most common query shapes (single row, optional row, list). All
 * server-side code should query through `sql` — the codebase intentionally
 * does not wrap this in an ORM or query builder.
 *
 * Configured from `DATABASE_URL` (required). Optional env:
 *   - `DATABASE_POOL_MAX` — pool size, default 10
 *   - `DATABASE_SSL`      — set to "require" for managed Postgres providers
 *
 * @example
 * ```ts
 * import { sql, maybeOne } from '$lib/server/db.js';
 *
 * const user = await maybeOne<UserRow>(sql`select * from users where id = ${userId}`);
 * ```
 */

import postgres from 'postgres';
import { env } from '$env/dynamic/private';

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
