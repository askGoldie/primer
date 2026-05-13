// @ts-nocheck
/**
 * App Layout Server
 *
 * Loads organization context for all /app routes.
 * Requires an authenticated user; redirects to /auth/login otherwise.
 */

import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types.js";
import { sql, maybeOne, many } from "$lib/server/db.js";
import type { OrgRole } from "$lib/types/index.js";

interface MembershipRow {
  role: OrgRole;
  org_id: string;
  org_name: string;
  org_industry: string | null;
  org_cycle_cadence: "monthly" | "quarterly";
  org_inquiry_enabled: boolean;
}

interface NodeRow {
  id: string;
  name: string;
  title: string | null;
  node_type: string;
  parent_id: string | null;
}

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
  if (!locals.user) {
    redirect(302, "/auth/login");
  }

  const membership = await maybeOne<MembershipRow>(sql`
		select
			m.role,
			o.id as org_id,
			o.name as org_name,
			o.industry as org_industry,
			o.cycle_cadence as org_cycle_cadence,
			o.inquiry_enabled as org_inquiry_enabled
		from org_members m
		join organizations o on o.id = m.organization_id
		where m.user_id = ${locals.user.id} and m.removed_at is null
		limit 1
	`);

  if (!membership) {
    redirect(302, "/app/setup");
  }

  const orgId = membership.org_id;

  const ownNode = await maybeOne<NodeRow>(sql`
		select id, name, title, node_type, parent_id
		from org_hierarchy_nodes
		where organization_id = ${orgId} and user_id = ${locals.user.id}
		limit 1
	`);

  const userNode = ownNode
    ? {
        id: ownNode.id,
        name: ownNode.name,
        title: ownNode.title,
        nodeType: ownNode.node_type,
      }
    : null;

  // Peers check — siblings under the same parent
  let hasPeers = false;
  if (ownNode?.parent_id) {
    const peer = await maybeOne<{ id: string }>(sql`
			select id from org_hierarchy_nodes
			where parent_id = ${ownNode.parent_id}
				and id <> ${ownNode.id}
				and organization_id = ${orgId}
			limit 1
		`);
    hasPeers = peer !== null;
  }

  // Direct reports + manager-of-managers checks
  let hasDirectReports = false;
  let isManagerOfManagers = false;

  if (ownNode) {
    const directReports = await many<{ id: string }>(sql`
			select id from org_hierarchy_nodes
			where parent_id = ${ownNode.id} and organization_id = ${orgId}
		`);

    if (directReports.length > 0) {
      hasDirectReports = true;
      const directReportIds = directReports.map((n) => n.id);
      const grandReport = await maybeOne<{ id: string }>(sql`
				select id from org_hierarchy_nodes
				where parent_id = any(${directReportIds}::uuid[])
					and organization_id = ${orgId}
				limit 1
			`);
      isManagerOfManagers = grandReport !== null;
    }
  }

  const isSystemAdmin =
    membership.role === "system_admin" || membership.role === "owner";
  const isHrAdmin = membership.role === "hr_admin";
  const isParticipant = membership.role === "participant";

  const needsPlacement = !userNode && !isSystemAdmin && !isHrAdmin;

  const showVisibilityTab = hasDirectReports || isSystemAdmin || isHrAdmin;

  // System admins/HR admins without a node still get full nav
  if ((isSystemAdmin || isHrAdmin) && !userNode) {
    isManagerOfManagers = true;
  }

  return {
    user: {
      id: locals.user.id,
      name: locals.user.name,
      email: locals.user.email,
    },
    organization: {
      id: membership.org_id,
      name: membership.org_name,
      industry: membership.org_industry,
      cycleCadence: membership.org_cycle_cadence,
      inquiryEnabled: membership.org_inquiry_enabled,
    },
    membership: {
      role: membership.role,
    },
    userNode,
    hasDirectReports,
    isManagerOfManagers,
    hasPeers,
    isSystemAdmin,
    isHrAdmin,
    isParticipant,
    needsPlacement,
    showVisibilityTab,
  };
};
