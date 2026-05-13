/**
 * Seed Runner
 *
 * Applies SQL files from `seeds/` to populate the database with the
 * Meridian Construction demo organization (Hans Ruber's team, metrics,
 * thresholds, scores, inquiries). Tracked by a `schema_seeds` table —
 * each filename is applied exactly once, in lexical order. Re-running
 * is a no-op once all seeds have been applied.
 *
 * After all SQL has been applied, sets a scrypt-hashed `password_hash`
 * on the five Meridian demo users so they can log in via the local
 * scrypt-based auth flow. The shared demo password is intentionally
 * weak and well-known; this is a demo dataset, not a production user
 * database.
 *
 * Usage:
 *   npm run seed                  # apply pending seeds + set demo passwords
 *
 * Required env: DATABASE_URL
 * Optional env: DATABASE_SSL=require (set for managed Postgres providers)
 */

import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scrypt } from "node:crypto";

// dotenv is a dev-only convenience for loading .env when iterating locally.
// It's pruned from the Docker runtime image (devDependencies), where env
// vars are injected by Compose — so tolerate its absence.
try {
  await import("dotenv/config");
} catch {
  // not installed — env is expected to come from the host
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = resolvePath(__dirname, "..", "seeds");

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

/**
 * Demo accounts created by `seeds/02_users.sql`. They share a single
 * password so anyone evaluating the demo can sign in as any of them.
 */
const DEMO_EMAILS = [
  "demo@primer.company",
  "marcus@demo.primer.company",
  "rachel@demo.primer.company",
  "james@demo.primer.company",
  "nina@demo.primer.company",
];
const DEMO_PASSWORD = "demo2025";

function scryptAsync(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt);
  return `${salt}:${hash}`;
}

async function applySeeds(): Promise<number> {
  await sql`
		create table if not exists schema_seeds (
			filename text primary key,
			applied_at timestamptz not null default now()
		)
	`;

  const appliedRows = await sql<
    { filename: string }[]
  >`select filename from schema_seeds`;
  const applied = new Set(appliedRows.map((r) => r.filename));

  const files = readdirSync(seedsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("no seed files found in seeds/");
    return 0;
  }

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file}`);
      continue;
    }

    console.log(`apply ${file}`);
    const text = readFileSync(join(seedsDir, file), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`insert into schema_seeds (filename) values (${file})`;
    });

    appliedCount += 1;
  }

  console.log(
    `seeds — ${appliedCount} applied, ${files.length - appliedCount} already up to date`,
  );
  return appliedCount;
}

/**
 * Set scrypt password_hash for the five Meridian demo accounts.
 *
 * Idempotent: only updates rows whose password_hash is currently NULL.
 * Won't overwrite a hash set by an earlier seed run, so re-seeding
 * never invalidates a session minted between runs.
 */
async function setDemoPasswords(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const result = await sql`
		update users
		set password_hash = ${passwordHash}
		where email in ${sql(DEMO_EMAILS)}
		  and password_hash is null
	`;
  if (result.count > 0) {
    console.log(
      `set demo password on ${result.count} user(s) — login: demo@primer.company / ${DEMO_PASSWORD}`,
    );
  }
}

async function main(): Promise<void> {
  await applySeeds();
  await setDemoPasswords();
  console.log("done");
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
