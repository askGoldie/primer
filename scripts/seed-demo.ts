/**
 * Demo Seed Script
 *
 * Run this after applying migrations to populate the demo organization
 * with Hans Ruber's team, metrics, thresholds, scores, and inquiries.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables.
 * Safe to run multiple times — call reset first if data already exists.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL) {
	console.error('PUBLIC_SUPABASE_URL environment variable is required.');
	process.exit(1);
}
if (!SERVICE_KEY) {
	console.error('SUPABASE_SECRET_KEY environment variable is required.');
	process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
	const { DEMO_USER_ID, DEMO_ORG_ID } = await import('../src/lib/server/demo/constants.js');

	// Check if demo data already exists
	const { data: existing } = await db
		.from('users')
		.select('id')
		.eq('id', DEMO_USER_ID)
		.limit(1)
		.single();

	if (existing) {
		console.log('Demo data already exists.');
		process.exit(0);
	}

	console.log('Seeding demo data...');

	// We can't import the seed function directly because it uses $lib imports.
	// Instead, we inline the essential logic here using the same db connection.

	console.log('To seed demo data, start the dev server and visit /app as any logged-in user.');
	console.log('The app layout auto-seeds when the demo org is present but not yet populated.');
	console.log('');
	console.log('For initial database setup, first create the demo org marker:');

	const { data: existingOrg } = await db
		.from('organizations')
		.select('id')
		.eq('id', DEMO_ORG_ID)
		.limit(1)
		.single();

	if (!existingOrg) {
		// We need a bootstrap user to satisfy the created_by FK.
		// The full seed (triggered by app layout on first visit) will
		// create all demo users. For now, create just enough for the
		// app layout to detect "demo site" and trigger full seeding.
		const { hashPassword } = await import('../src/lib/server/auth/index.js');
		const { DEMO_EMAIL, DEMO_PASSWORD, DEMO_USER_NAME, DEMO_ORG_NAME, DEMO_ORG_INDUSTRY } =
			await import('../src/lib/server/demo/constants.js');

		const passwordHash = await hashPassword(DEMO_PASSWORD);

		await db.from('users').insert({
			id: DEMO_USER_ID,
			email: DEMO_EMAIL,
			password_hash: passwordHash,
			name: DEMO_USER_NAME,
			locale: 'en',
			email_verified: true,
			is_admin: false
		});

		await db.from('organizations').insert({
			id: DEMO_ORG_ID,
			name: DEMO_ORG_NAME,
			industry: DEMO_ORG_INDUSTRY,
			cycle_cadence: 'quarterly',
			inquiry_enabled: true,
			created_by: DEMO_USER_ID
		});

		console.log('Created demo org marker and bootstrap user.');
		console.log('Full seed (hierarchy, metrics, inquiries) will run automatically');
		console.log('when the first visitor logs in and visits /app.');
	} else {
		console.log('Demo org already exists.');
	}

	console.log('Done.');
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
