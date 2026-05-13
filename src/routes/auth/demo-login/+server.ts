/**
 * Demo CEO one-click login.
 *
 * EVALUATION MODE — delete this file (and the parent `demo-login/` folder)
 * before going to production, along with
 * `src/routes/auth/login/EvaluationModePanel.svelte` and the
 * `seeds/14_demo_admin.sql` seed.
 *
 * POSTs from EvaluationModePanel land here. We look up the seeded demo
 * user (`demo@primer.company`, Hans Ruber), mint a session, set the
 * standard `primer_session` cookie, and redirect into the app — no
 * password entry required so an executive evaluator can confirm receipt
 * in a single click.
 */

import { error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { sql, maybeOne } from "$lib/server/db.js";
import { createSession, setSessionCookie } from "$lib/server/auth/index.js";

const DEMO_EMAIL = "demo@primer.company";

export const POST: RequestHandler = async ({ cookies }) => {
  const user = await maybeOne<{
    id: string;
    deactivated_at: string | null;
  }>(sql`
		select id, deactivated_at
		from users
		where email = ${DEMO_EMAIL}
	`);

  if (!user || user.deactivated_at) {
    error(404, "Demo user not seeded");
  }

  const sessionId = await createSession(user.id);
  setSessionCookie(cookies, sessionId);

  redirect(302, "/app");
};
