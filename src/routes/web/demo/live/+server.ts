/**
 * Demo Live Entry Point
 *
 * GET /demo/live
 *
 * Convenience redirect into the live demo. If the visitor is
 * authenticated, sends them to /platform to pick a role.
 * If not, sends them to register first (with redirect back to /platform).
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/register?redirect=/platform');
	}

	redirect(302, '/platform');
};
