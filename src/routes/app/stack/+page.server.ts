/**
 * Metric Stack — redirects to the combined Goals page.
 *
 * The metric stack is now part of /app/goals (Metrics tab).
 * This redirect preserves any existing bookmarks or direct links.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
  redirect(302, "/app/goals");
};
