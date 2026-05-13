// @ts-nocheck
/**
 * Logout Handler
 *
 * Deletes the local session and clears the cookie.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";
import {
  deleteSession,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "$lib/server/auth/index.js";

export const load = async ({ cookies }: Parameters<PageServerLoad>[0]) => {
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    await deleteSession(sessionId);
  }
  clearSessionCookie(cookies);

  redirect(302, "/auth/login");
};
