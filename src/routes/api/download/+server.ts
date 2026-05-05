/**
 * Download API Endpoint
 *
 * Serves the source code download to license holders.
 * Tracks downloads for analytics.
 */

import type { RequestHandler } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { getUserLicense } from '$lib/server/license/index.js';
import { db } from '$lib/server/db.js';

/**
 * Available versions for download
 * In production, this would be dynamically generated from releases
 */
const AVAILABLE_VERSIONS = ['1.0.0'];

/**
 * Download URL template
 * In production, this would point to actual release artifacts
 */
const getDownloadUrl = (version: string) =>
	`https://github.com/tier-org/tier/releases/download/v${version}/tier-source-v${version}.zip`;

export const GET: RequestHandler = async ({ url, locals }) => {
	// Require authentication
	if (!locals.user) {
		redirect(302, '/auth/login?redirect=/web/dashboard');
	}

	// Get version parameter
	const version = url.searchParams.get('version');

	if (!version || !AVAILABLE_VERSIONS.includes(version)) {
		throw error(400, 'Invalid version');
	}

	// Verify user has a license
	const license = await getUserLicense(locals.user.id);

	if (!license || license.status !== 'active') {
		throw error(403, 'Valid license required');
	}

	// Track download
	await db.from('download_events').insert({
		account_id: locals.user.id,
		license_id: license.id,
		version,
		event_type: 'download_initiated'
	});

	// In production, this would:
	// 1. Generate a signed URL to the release artifact
	// 2. Or stream the file directly
	// For now, redirect to the release URL
	redirect(302, getDownloadUrl(version));
};
