/**
 * Root Route Redirect
 *
 * Visitors who land on / are sent to the app if authenticated, or to the
 * login screen otherwise.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) {
    redirect(302, "/app");
  }
  redirect(302, "/auth/login");
};
