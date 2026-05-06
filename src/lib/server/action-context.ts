/**
 * Action Context Helper
 *
 * SvelteKit form actions do not receive a `parent()` function — that API is
 * only available inside `load`. Actions that need the same org/user/node
 * context as the page load must fetch it themselves.
 *
 * `loadActionContext` mirrors the relevant subset of what `/app/+layout.server.ts`
 * produces for `parent()`, returning the membership, organization, userNode,
 * and `hasDirectReports` flag that action handlers commonly branch on.
 */
import { sql, maybeOne } from '$lib/server/db.js';
import type { OrgRole } from '$lib/types/database.js';

export interface ActionContext {
	organization: { id: string; name: string };
	membership: { role: OrgRole };
	userNode: { id: string; organization_id: string } | null;
	hasDirectReports: boolean;
}

/**
 * Fetch the org/node/membership context needed by form actions under /app.
 *
 * Returns null when the acting user has no membership — callers should
 * reject the request with `fail(403, ...)` in that case.
 */
export async function loadActionContext(userId: string): Promise<ActionContext | null> {
	const memberRow = await maybeOne<{
		role: OrgRole;
		org_id: string;
		org_name: string;
	}>(sql`
		select m.role, o.id as org_id, o.name as org_name
		from org_members m
		join organizations o on o.id = m.organization_id
		where m.user_id = ${userId} and m.removed_at is null
		limit 1
	`);

	if (!memberRow) return null;

	const organization = { id: memberRow.org_id, name: memberRow.org_name };
	const membership = { role: memberRow.role };

	const userNode = await maybeOne<{ id: string; organization_id: string }>(sql`
		select id, organization_id
		from org_hierarchy_nodes
		where organization_id = ${organization.id} and user_id = ${userId}
		limit 1
	`);

	let hasDirectReports = false;
	if (userNode) {
		const directReport = await maybeOne<{ id: string }>(sql`
			select id from org_hierarchy_nodes
			where parent_id = ${userNode.id} and organization_id = ${organization.id}
			limit 1
		`);
		hasDirectReports = directReport !== null;
	}

	return { organization, membership, userNode, hasDirectReports };
}
