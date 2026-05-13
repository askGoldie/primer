// @ts-nocheck
/**
 * Legacy admin route — redirects to the new consolidated Settings › Audit tab.
 *
 * The former `/app/admin` surface was really an audit/operations dashboard.
 * In the settings reorg it was folded into `/app/settings?tab=audit`, with the
 * detailed audit log viewer living at `/app/settings/audit-log`.
 *
 * This server load exists only to preserve old bookmarks and internal links.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load = async () => {
  redirect(302, "/app/settings?tab=audit");
};
;null as any as PageServerLoad;