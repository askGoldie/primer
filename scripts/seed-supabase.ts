/**
 * Supabase Seed Script
 *
 * Usage:
 *   npm run supabase:seed
 *
 * What it does:
 *   1. Applies supabase/seed.sql to the connected Supabase Postgres database
 *      via the DATABASE_URL connection string.
 *   2. Creates real Supabase Auth accounts for the five named demo characters
 *      (Hans, Marcus, Rachel, James, Nina) using the Admin API so that the
 *      narrative walkthrough's "demo@primer.company / demo2025" login works.
 *
 * Prerequisites:
 *   - DATABASE_URL must point to the Supabase Postgres instance
 *   - PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set
 *   - Run supabase/migrations/20260101000000_initial_schema.sql first
 *
 * The 69 platform org personas (primer.internal addresses) are NOT created as
 * Supabase Auth users — they exist only in public.users and are accessed
 * exclusively through the primer_perspective cookie mechanism.
 *
 * NOTE: This script still uses the 'postgres' npm package for applying raw SQL
 * because Supabase JS client doesn't support executing arbitrary SQL statements.
 * The postgres package is retained as a devDependency for this script only.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- Validate env ----
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!SUPABASE_URL) throw new Error('PUBLIC_SUPABASE_URL is not set');
if (!SERVICE_KEY) throw new Error('SUPABASE_SECRET_KEY is not set');

// ---- Clients ----
const sql = postgres(DATABASE_URL, { max: 1 });
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false }
});

/** Demo characters who need real Supabase Auth logins */
const DEMO_AUTH_USERS = [
	{
		id: '00000000-0000-4000-a000-000000000001',
		email: 'demo@primer.company',
		password: 'demo2025',
		name: 'Hans Ruber'
	},
	{
		id: '00000000-0000-4000-a000-000000000002',
		email: 'marcus@demo.primer.company',
		password: 'demo2025',
		name: 'Marcus Chen'
	},
	{
		id: '00000000-0000-4000-a000-000000000003',
		email: 'rachel@demo.primer.company',
		password: 'demo2025',
		name: 'Rachel Torres'
	},
	{
		id: '00000000-0000-4000-a000-000000000004',
		email: 'james@demo.primer.company',
		password: 'demo2025',
		name: 'James Park'
	},
	{
		id: '00000000-0000-4000-a000-000000000005',
		email: 'nina@demo.primer.company',
		password: 'demo2025',
		name: 'Nina Okafor'
	}
];

async function applySeedSQL(): Promise<void> {
	const seedPath = resolve(__dirname, '../supabase/seed.sql');
	const seedSQL = readFileSync(seedPath, 'utf-8');

	// Skip if the file is still the placeholder
	if (seedSQL.includes('TODO: This file will be populated')) {
		console.warn('⚠️  supabase/seed.sql is still a placeholder — skipping SQL seed step.');
		return;
	}

	console.log('Applying supabase/seed.sql …');
	await sql.unsafe(seedSQL);
	console.log('✓ seed.sql applied');
}

async function createDemoAuthUsers(): Promise<void> {
	console.log('Creating Supabase Auth accounts for demo characters …');

	for (const u of DEMO_AUTH_USERS) {
		// Check if user already exists in auth
		const { data: existing } = await supabaseAdmin.auth.admin.getUserById(u.id);
		if (existing.user) {
			console.log(`  · ${u.email} — already exists, skipping`);
			continue;
		}

		const { error } = await supabaseAdmin.auth.admin.createUser({
			user_id: u.id,
			email: u.email,
			password: u.password,
			email_confirm: true, // skip confirmation email for seed accounts
			user_metadata: { name: u.name }
		});

		if (error) {
			console.error(`  ✗ ${u.email}: ${error.message}`);
		} else {
			console.log(`  ✓ ${u.email}`);
		}
	}
}

async function main(): Promise<void> {
	try {
		await applySeedSQL();
		await createDemoAuthUsers();
		console.log('\n✅ Supabase seed complete.');
	} catch (err) {
		console.error('Seed failed:', err);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

main();
