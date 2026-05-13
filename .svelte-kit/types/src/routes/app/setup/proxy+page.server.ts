// @ts-nocheck
/**
 * Organization Setup Page Server
 *
 * Initial setup for users without an organization.
 * Creates the organization and root hierarchy node.
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne } from "$lib/server/db.js";
import { t } from "$lib/i18n/index.js";

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  if (!locals.user) {
    redirect(302, "/auth/login");
  }

  const existingMembership = await maybeOne<{ id: string }>(sql`
		select id from org_members
		where user_id = ${locals.user.id} and removed_at is null
		limit 1
	`);

  if (existingMembership) {
    redirect(302, "/app");
  }

  return {};
};

export const actions = {
  default: async ({ request, locals }: import('./$types').RequestEvent) => {
    if (!locals.user) return fail(403, { error: "error.generic" });

    const formData = await request.formData();
    const orgName = formData.get("orgName")?.toString().trim();
    const industry = formData.get("industry")?.toString() || null;
    const cycleCadence = (formData.get("cycleCadence")?.toString() ||
      "quarterly") as "monthly" | "quarterly";
    const userName = formData.get("userName")?.toString().trim();
    const userTitle = formData.get("userTitle")?.toString().trim();

    if (!orgName || !userName) {
      return fail(400, { error: "validation.field_required" });
    }

    const org = await maybeOne<{ id: string }>(sql`
			insert into organizations (name, industry, cycle_cadence, created_by)
			values (${orgName}, ${industry}, ${cycleCadence}, ${locals.user.id})
			returning id
		`);

    if (!org) {
      return fail(500, { error: "error.generic" });
    }

    await sql`
			insert into org_members (organization_id, user_id, role, assigned_by)
			values (${org.id}, ${locals.user.id}, 'owner', ${locals.user.id})
		`;

    await sql`
			insert into org_hierarchy_nodes
				(organization_id, node_type, name, title, user_id, created_by)
			values (
				${org.id},
				'executive_leader',
				${userName},
				${userTitle || t(locals.locale, "setup.default_title")},
				${locals.user.id},
				${locals.user.id}
			)
		`;

    redirect(302, "/app");
  },
};
;null as any as Actions;