# 02 — Remove Supabase

Phase 2. Replace `@supabase/supabase-js` PostgREST queries with raw SQL through `postgres-js`. Replace Supabase Auth with the existing scrypt-based session/cookie auth. Move SQL migrations from `supabase/migrations/` to `migrations/` and add a portable `npm run migrate` runner that doesn't depend on the Supabase CLI.

> **Pre-read:** [`00-overview.md`](./00-overview.md) and [`01-strip-public-site.md`](./01-strip-public-site.md). Phase 1 must be done before starting this phase.

---

## Why this is the hard phase

Supabase is two things glued together: a **Postgres database** and an **auth provider**, accessed through one SDK. Removing it requires unwinding both, in code that uses the SDK in two distinct ways:

1. **Database access via PostgREST** — `db.from('users').select(...).eq(...)`. ~24 files. Each call site needs to become a SQL query.
2. **Auth via Supabase Auth** — JWT cookies, `safeGetSession()`, `signInWithPassword()`, password reset emails sent via Supabase. Replaced by the existing scrypt-based code in `src/lib/server/auth/index.ts`, which already handles passwords, sessions, verification tokens, and reset tokens — it just needs to query the new postgres-js client and have its auth flows wired into the routes.

The good news: SQL migrations are already plain SQL (no RLS, no `auth.uid()`), and the auth helpers already exist. The work is mechanical, not architectural — but there's a lot of it.

---

## Target architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│   │                                                         │
│   │  primer_session cookie  (httpOnly, scrypt-signed)       │
│   ▼                                                         │
│ SvelteKit server (Node)                                     │
│   ├─ hooks.server.ts                                        │
│   │    └─ validateSession(cookie) → locals.user             │
│   ├─ src/lib/server/auth/*       (scrypt + sessions)        │
│   ├─ src/lib/server/db.ts        (postgres-js client)       │
│   └─ src/routes/auth/*           (login/register/reset)     │
│           │                                                 │
│           ▼                                                 │
│ Postgres (any 15+ instance — local, RDS, Neon, Railway, …)  │
└─────────────────────────────────────────────────────────────┘
```

No Supabase. No PostgREST. No external auth service.

---

## The data layer: `postgres-js` query helper

`postgres` (postgres-js by Rasmus Porsager) is already a `devDependency`. Promote it to `dependencies` and use it for all server-side queries.

### `src/lib/server/db.ts` (new shape)

```ts
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set.');
}

export const sql = postgres(env.DATABASE_URL, {
  max: Number(env.DATABASE_POOL_MAX ?? 10),
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: env.DATABASE_SSL === 'require' ? 'require' : false,
  prepare: true,
});
```

Export the tagged-template `sql` directly. **Do not** wrap it in a builder/ORM. Per `CLAUDE.md`, customers will read this code; raw SQL is more legible than a query-builder DSL they have to learn.

For convenience, ship a **typed query helper** for the most common patterns (single row, optional row, list):

```ts
export async function one<T>(query: postgres.PendingQuery<postgres.Row[]>): Promise<T> {
  const rows = await query;
  if (rows.length === 0) throw new Error('Expected one row, got 0');
  return rows[0] as T;
}

export async function maybeOne<T>(query: postgres.PendingQuery<postgres.Row[]>): Promise<T | null> {
  const rows = await query;
  return (rows[0] as T) ?? null;
}

export async function many<T>(query: postgres.PendingQuery<postgres.Row[]>): Promise<T[]> {
  return (await query) as T[];
}
```

(Final shape can be refined during implementation — the point is "raw SQL plus three helpers," not an ORM.)

---

## Call-site migration: pattern catalogue

Every existing `db.from(...)` call falls into one of these patterns. Follow the pattern; don't invent new ones.

### Pattern: simple select, single row

```ts
// Before
const { data: user } = await db.from('users').select('*').eq('id', userId).single();

// After
const user = await maybeOne<UserRow>(sql`
  select * from users where id = ${userId}
`);
```

### Pattern: select with multiple `.eq()` filters

```ts
// Before
const { data } = await db
  .from('org_hierarchy_nodes')
  .select('id, user_id, organization_id')
  .eq('id', perspectiveId)
  .eq('organization_id', PLATFORM_ORG_ID)
  .single();

// After
const node = await maybeOne<NodeRow>(sql`
  select id, user_id, organization_id
  from org_hierarchy_nodes
  where id = ${perspectiveId} and organization_id = ${PLATFORM_ORG_ID}
`);
```

### Pattern: select list with ordering

```ts
// Before
const { data } = await db.from('metrics').select('*').eq('org_id', orgId).order('created_at', { ascending: false });

// After
const metrics = await many<MetricRow>(sql`
  select * from metrics where org_id = ${orgId} order by created_at desc
`);
```

### Pattern: insert and return the inserted row

```ts
// Before
const { data: session } = await db.from('sessions').insert({ id, user_id, expires_at }).select().single();

// After
const session = await one<SessionRow>(sql`
  insert into sessions (id, user_id, expires_at)
  values (${id}, ${userId}, ${expiresAt})
  returning *
`);
```

### Pattern: update

```ts
// Before
await db.from('users').update({ password_hash: passwordHash }).eq('id', userId);

// After
await sql`update users set password_hash = ${passwordHash} where id = ${userId}`;
```

### Pattern: delete

```ts
// Before
await db.from('sessions').delete().eq('user_id', userId);

// After
await sql`delete from sessions where user_id = ${userId}`;
```

### Pattern: filters with `is null` / `is not null`

```ts
// Before
.is('deactivated_at', null)

// After
sql` and deactivated_at is null`
```

### Pattern: greater-than on timestamps

```ts
// Before
.gt('expires_at', new Date().toISOString())

// After
sql` and expires_at > now()`
```

(Use `now()` server-side rather than passing a JS-side timestamp where you can — slightly cleaner and avoids timezone foot-guns.)

---

## Files that need migration

These files import `@supabase/*` or use `db.from(...)`. Each must be touched in Phase 2. The list is the inventory measured against `src/` after Phase 1 — re-run the greps before starting to be sure.

### Core data/server modules (must migrate first)

```
src/lib/server/db.ts                — replace Supabase client with postgres-js (see above)
src/lib/server/supabase.ts          — DELETE the file; nothing should import it after this phase
src/lib/server/auth/index.ts        — already auth-provider-agnostic; just swap db.from → sql
src/lib/server/permissions.ts       — convert all role/permission queries
src/lib/server/hierarchy.ts         — convert org tree queries
src/lib/server/csv.ts               — convert any data fetches; CSV formatting itself is unrelated
src/lib/server/action-context.ts    — convert; perspective logic should already be removed in Phase 1
src/lib/server/postmark/index.ts    — likely fetches user records; convert
```

### Hooks

```
src/hooks.server.ts                 — see "Hooks rewrite" below
src/app.d.ts                        — remove App.Locals types: supabase, safeGetSession, isSupabaseAuthenticated
```

### Auth flow routes

These currently call Supabase Auth (`signInWithPassword`, `signUp`, etc.). Rewire to `src/lib/server/auth/index.ts`:

```
src/routes/auth/login/+page.server.ts
src/routes/auth/register/+page.server.ts
src/routes/auth/logout/+page.server.ts
src/routes/auth/forgot-password/+page.server.ts
src/routes/auth/reset-password/+page.server.ts
src/routes/auth/verify-email/+page.server.ts (and resend/)
src/routes/auth/callback/+server.ts          — DELETE; OAuth callback only relevant to Supabase Auth
```

(The `web/login` etc. duplicates were removed in Phase 1.)

### Product routes that call `db.from`

```
src/routes/app/api/placement-request/+server.ts
src/routes/app/leaders/[id]/+page.server.ts
src/routes/app/settings/+page.server.ts
src/routes/app/settings/audit-log/+page.server.ts
```

Plus any others surfaced by:

```bash
grep -rln "db\.from\|\.rpc(" src/routes/
```

### Layout and public client side

```
src/routes/+layout.svelte           — remove vercel/analytics import (already in Phase 1) and any locals.supabase usage
src/routes/+layout.ts               — remove session/Supabase client passthrough
src/lib/components/layout/Header.svelte  — remove locals.supabase usages
src/lib/types/database.ts           — DELETE; types were generated for Supabase. Replace with hand-written row types in src/lib/types/db.ts (or co-locate per domain).
src/lib/types/index.ts              — clean up Supabase re-exports
```

---

## Hooks rewrite

Today `src/hooks.server.ts` chains `handleLocale → handleSupabase → handleAuth → handleGuards`. After Phase 2 it should be `handleLocale → handleAuth → handleGuards`.

```ts
// New handleAuth (sketch)
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth/index.js';

const handleAuth: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.isAdmin = false;

  const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      event.locals.user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        locale: (result.user.locale as Locale) ?? 'en',
        deactivatedAt: result.user.deactivated_at ? new Date(result.user.deactivated_at) : null,
        createdAt: new Date(result.user.created_at),
        updatedAt: new Date(result.user.updated_at),
      };
      event.locals.isAdmin = result.user.is_admin ?? false;
    }
  }

  return resolve(event);
};
```

`handleGuards` simplifies to:

```ts
const handleGuards: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/app') && !event.locals.user) {
    redirect(302, `/auth/login?redirect=${encodeURIComponent(event.url.pathname)}`);
  }
  return resolve(event);
};
```

Note that `/platform` is gone (removed in Phase 1), so no platform-specific guard is needed.

---

## Auth flow rewiring

The flows under `src/routes/auth/*` currently call Supabase Auth methods. After Phase 2 they call the existing helpers in `src/lib/server/auth/index.ts`. The helpers already exist and already have the right shape — this is wiring, not new logic.

| Route                                  | Today (Supabase)                                         | After Phase 2                                                                                  |
| -------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/auth/login`                          | `supabase.auth.signInWithPassword({email, password})`    | Look up user by email; `verifyPassword(input, user.password_hash)`; `createSession(user.id)`; set cookie |
| `/auth/register`                       | `supabase.auth.signUp(...)`                              | Insert user with `hashPassword(input)`; `createVerificationToken(user.id)`; send email         |
| `/auth/logout`                         | `supabase.auth.signOut()`                                | `deleteSession(sessionId)`; `clearSessionCookie(cookies)`                                      |
| `/auth/forgot-password`                | `supabase.auth.resetPasswordForEmail(...)`               | Look up user by email; `createPasswordResetToken(user.id)`; send email                         |
| `/auth/reset-password`                 | Supabase magic-link flow                                 | `verifyPasswordResetToken(token)` → `completePasswordReset(token, newPassword)`                |
| `/auth/verify-email`                   | Supabase magic-link flow                                 | `verifyEmailToken(token)`                                                                      |
| `/auth/callback`                       | OAuth callback                                           | DELETE                                                                                         |

Email sending: the existing `src/lib/server/postmark/*` module sends transactional emails. Use it for verification and password-reset emails. (Postmark itself is fine — it's a transactional email provider, not Supabase. The `Primer-Delivery.md` "no external service requirements" rule applies to Primer's runtime — customers configure their own SMTP/Postmark in `.env`. Make `POSTMARK_API_TOKEN` optional and document an SMTP fallback in `.env.example`.)

---

## Migrations: from `supabase/migrations/` to `migrations/`

The migrations are already portable plain SQL. The Supabase CLI is just a runner. Replace it with a tiny Node script.

### Move

```
supabase/migrations/*.sql            →  migrations/*.sql
supabase/seed.sql                    →  seeds/baseline.sql      (if it exists and has content)
```

Delete `supabase/config.toml` and `supabase/templates/` — Supabase-CLI-specific.

### `scripts/migrate.ts` (new)

```ts
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!, { ssl: process.env.DATABASE_SSL === 'require' ? 'require' : false });

await sql`create table if not exists schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
)`;

const applied = new Set((await sql<{ filename: string }[]>`select filename from schema_migrations`).map(r => r.filename));
const dir = join(process.cwd(), 'migrations');
const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip ${file}`);
    continue;
  }
  console.log(`apply ${file}`);
  const text = readFileSync(join(dir, file), 'utf8');
  await sql.begin(async tx => {
    await tx.unsafe(text);
    await tx`insert into schema_migrations (filename) values (${file})`;
  });
}

await sql.end();
console.log('migrations complete');
```

Wire into `package.json`:

```json
"scripts": {
  "migrate": "tsx scripts/migrate.ts",
  "seed": "tsx scripts/seed.ts"
}
```

Remove the old `supabase:migrate` and `supabase:seed` scripts.

---

## Seed script rewrite

Today `scripts/seed-demo.ts` creates demo data via the Supabase JS client and `scripts/seed-supabase.ts` creates Supabase Auth accounts via the Admin API. After Phase 2:

- One unified `scripts/seed.ts` that uses `postgres-js`
- Inserts demo organizations, users (with **hashed passwords using `hashPassword()`**, not Supabase Auth), hierarchy nodes, metrics, scores, inquiries
- Idempotent: `on conflict do nothing` on inserts, or a `--reset` flag that truncates first
- Documents the seeded login credentials in the script header (and the customer quickstart references them)

The five named demo users (Hans, Marcus, Rachel, James, Nina from the existing seed) keep working but as plain rows in the `users` table with scrypt-hashed passwords. The 69 platform-org personas (the `primer_perspective` cookie consumers) **do not survive** — they were demo-site-specific and the perspective cookie is gone.

---

## Environment variables

After Phase 2, `.env.example` lists exactly:

```bash
# Required
DATABASE_URL=postgres://user:password@host:5432/primer

# Optional (defaults shown)
PORT=3000
DATABASE_POOL_MAX=10
DATABASE_SSL=disable                    # set to "require" for managed Postgres providers

# Optional — email (verification + password reset). If unset, those flows are disabled.
POSTMARK_API_TOKEN=
POSTMARK_FROM_EMAIL=
SMTP_URL=                                # alternative to Postmark

# Optional — public-facing app URL (used in email links)
PUBLIC_APP_URL=http://localhost:3000
```

**Removed:** `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Anything that used `$env/dynamic/public` for Supabase keys must be gone.

---

## Adapter swap

`svelte.config.js` currently imports `@sveltejs/adapter-vercel`. For Option A (direct install) and Option B (Docker), the build needs to produce a runnable Node server — `@sveltejs/adapter-node`.

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
```

```json
// package.json
"@sveltejs/adapter-node": "^5.x.x"   // replace adapter-vercel
```

This goes in Phase 2 because Phase 3 depends on `node build` working.

---

## Verification before declaring Phase 2 done

```bash
# 1. No surviving Supabase imports
grep -rln "@supabase" src/ scripts/
# should return zero hits

# 2. No surviving PostgREST builder calls
grep -rn "db\.from\|\.rpc(" src/
# should return zero hits

# 3. No Supabase env var references
grep -rn "PUBLIC_SUPABASE_URL\|SUPABASE_SECRET_KEY\|SUPABASE_PUBLISHABLE_KEY" src/ scripts/ package.json
# should return zero hits

# 4. Build succeeds without Supabase env vars
unset PUBLIC_SUPABASE_URL PUBLIC_SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY
DATABASE_URL=postgres://... npm run build

# 5. Type check
npm run check

# 6. End-to-end on a fresh DB
createdb primer_test
DATABASE_URL=postgres://localhost/primer_test npm run migrate
DATABASE_URL=postgres://localhost/primer_test npm run seed
DATABASE_URL=postgres://localhost/primer_test node build &
# manually: visit /auth/login, log in as a seeded user, navigate /app, log out
```

Phase 2 is **complete** when all six checks pass.

---

## Estimated scope

- `src/lib/server/db.ts` rewrite + helpers: 2 hours
- Call-site migration (~24 files, mostly mechanical): 1–2 days, depending on how many distinct query patterns appear
- Hooks rewrite: 1 hour
- Auth flow rewiring (6 routes): 4 hours
- Migration runner + script wiring: 2 hours
- Seed rewrite: half a day
- `package.json` + `svelte.config.js` adapter swap + dep cleanup: 1 hour
- End-to-end verification on fresh DB: half a day

Realistically **3–4 focused days**. The risk is missed call sites — the verification greps catch them, but every miss means a runtime error.

---

## What this enables

After Phase 2:

- The repo runs against any Postgres 15+ database with no Supabase
- The build artifact is a vanilla Node server (`node build`)
- Phase 3 can write a Dockerfile and docker-compose.yml against a known, stable runtime
