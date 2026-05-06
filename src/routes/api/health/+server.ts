/**
 * Healthcheck Endpoint
 *
 * Liveness probe consumed by Docker Compose, load balancers, and
 * uptime monitoring. Returns 200 when the database is reachable,
 * 503 otherwise. The response body is intentionally minimal — just
 * enough for an oncall dashboard to display "ok" / "degraded" and
 * the underlying error string when something is wrong.
 *
 * Public — no authentication required, since the request comes from
 * infrastructure components that don't have credentials.
 */

import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
	try {
		await sql`select 1`;
		return json({ status: 'ok', db: 'ok' });
	} catch (err) {
		return json(
			{ status: 'degraded', db: 'unreachable', error: String(err) },
			{ status: 503 }
		);
	}
};
