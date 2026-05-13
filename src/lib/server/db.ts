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

import postgres from "postgres";
import { env } from "$env/dynamic/private";

type Sql = ReturnType<typeof postgres>;

/**
 * Lazily constructed postgres-js client. Initialization is deferred until the
 * first query so that importing this module has no side effects — necessary
 * because SvelteKit's build step imports every server module for static
 * analysis, long before `DATABASE_URL` is available (e.g. during the Docker
 * image build).
 */
let _client: Sql | null = null;

function getClient(): Sql {
  if (_client) return _client;
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set.");
  }
  _client = postgres(env.DATABASE_URL, {
    max: Number(env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: env.DATABASE_SSL === "require" ? "require" : false,
    prepare: true,
  });
  return _client;
}

/**
 * Tagged-template SQL client. Parameters are interpolated as bind values
 * (no string concatenation, no SQL injection risk). The underlying connection
 * pool is created on first use, not on import — see `getClient` above.
 *
 * @example
 * ```ts
 * const rows = await sql`select * from users where id = ${userId}`;
 * ```
 */
export const sql: Sql = new Proxy(function () {} as unknown as Sql, {
  apply(_target, thisArg, args) {
    const fn = getClient() as unknown as (
      this: unknown,
      ...a: unknown[]
    ) => unknown;
    return Reflect.apply(fn, thisArg, args);
  },
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    if (typeof value === "function") {
      return (value as (...a: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

/**
 * Run a query expected to return exactly one row. Throws if zero rows.
 */
export async function one<T>(
  query: postgres.PendingQuery<postgres.Row[]>,
): Promise<T> {
  const rows = await query;
  if (rows.length === 0) throw new Error("Expected one row, got 0");
  return rows[0] as unknown as T;
}

/**
 * Run a query that may return zero or one row.
 */
export async function maybeOne<T>(
  query: postgres.PendingQuery<postgres.Row[]>,
): Promise<T | null> {
  const rows = await query;
  return (rows[0] as unknown as T) ?? null;
}

/**
 * Run a query that returns a list of rows (zero or more).
 */
export async function many<T>(
  query: postgres.PendingQuery<postgres.Row[]>,
): Promise<T[]> {
  const rows = await query;
  return rows as unknown as T[];
}
