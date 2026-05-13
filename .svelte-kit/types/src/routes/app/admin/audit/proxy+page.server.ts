// @ts-nocheck
/**
 * Legacy audit-log route — redirects to the new Settings › Audit Log sub-route.
 *
 * The audit log viewer was moved from `/app/admin/audit` to
 * `/app/settings/audit-log` as part of the settings reorg. Query params
 * (filters, pagination) are forwarded so deep links keep working.
 */

import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  const qs = url.searchParams.toString();
  redirect(
    302,
    qs ? `/app/settings/audit-log?${qs}` : "/app/settings/audit-log",
  );
};
