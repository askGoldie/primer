/**
 * Migration Runner
 *
 * Applies SQL files from `migrations/` to the database at `DATABASE_URL`.
 * Tracked by a `schema_migrations` table — each filename is applied exactly
 * once, in lexical order. Re-running this script after migrations have been
 * applied is a no-op.
 *
 * Usage:
 *   npm run migrate                # apply pending migrations
 *
 * Required env: DATABASE_URL
 * Optional env: DATABASE_SSL=require (set for managed Postgres providers)
 */

import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolvePath(__dirname, "..", "migrations");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "error: DATABASE_URL is not set. Copy .env.example to .env and set it.",
  );
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  ssl: process.env.DATABASE_SSL === "require" ? "require" : false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

async function main() {
  await sql`
		create table if not exists schema_migrations (
			filename text primary key,
			applied_at timestamptz not null default now()
		)
	`;

  const appliedRows = await sql<
    { filename: string }[]
  >`select filename from schema_migrations`;
  const applied = new Set(appliedRows.map((r) => r.filename));

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("no migration files found in migrations/");
    return;
  }

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file}`);
      continue;
    }

    console.log(`apply ${file}`);
    const text = readFileSync(join(migrationsDir, file), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`insert into schema_migrations (filename) values (${file})`;
    });

    appliedCount += 1;
  }

  console.log(
    `done — ${appliedCount} migration(s) applied, ${files.length - appliedCount} already up to date`,
  );
}

main()
  .catch((err) => {
    console.error("migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
