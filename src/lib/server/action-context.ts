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
 *
 * It intentionally does not re-run demo seeding, perspective validation, or
 * onboarding redirects — those are the load layer's responsibility. By the
 * time an action runs, the page has already passed through the layout load,
 * so membership and node state are known to exist for any user who could
 * submit the form.
 */
import { db } from '$lib/server/db.js';
import { PERSPECTIVE_COOKIE, PLATFORM_ORG_ID } from '$lib/server/demo/constants.js';
import type { Cookies } from '@sveltejs/kit';
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
export async function loadActionContext(
	userId: string,
	cookies: Cookies
): Promise<ActionContext | null> {
	// Membership + organization
	const { data: memberRow } = await db
		.from('org_members')
		.select('role, organizations(id, name)')
		.eq('user_id', userId)
		.is('removed_at', null)
		.limit(1)
		.maybeSingle();

	if (!memberRow || !memberRow.organizations) return null;

	const organization = {
		id: memberRow.organizations.id,
		name: memberRow.organizations.name
	};
	const membership = { role: memberRow.role };

	// Resolve the acting node: perspective cookie on platform, else own node.
	const perspectiveNodeId = cookies.get(PERSPECTIVE_COOKIE);
	let userNode: ActionContext['userNode'];

	if (organization.id === PLATFORM_ORG_ID && perspectiveNodeId) {
		// Try node id first, then fall back to user id (admin-style perspectives)
		const { data: nodeById } = await db
			.from('org_hierarchy_nodes')
			.select('id, organization_id')
			.eq('id', perspectiveNodeId)
			.eq('organization_id', PLATFORM_ORG_ID)
			.maybeSingle();

		if (nodeById) {
			userNode = nodeById;
		} else {
			const { data: nodeByUser } = await db
				.from('org_hierarchy_nodes')
				.select('id, organization_id')
				.eq('user_id', perspectiveNodeId)
				.eq('organization_id', PLATFORM_ORG_ID)
				.maybeSingle();
			userNode = nodeByUser ?? null;
		}
	} else {
		const { data: ownNode } = await db
			.from('org_hierarchy_nodes')
			.select('id, organization_id')
			.eq('organization_id', organization.id)
			.eq('user_id', userId)
			.maybeSingle();
		userNode = ownNode ?? null;
	}

	// Direct reports check — only meaningful when there's a node
	let hasDirectReports = false;
	if (userNode) {
		const { data: directReports } = await db
			.from('org_hierarchy_nodes')
			.select('id')
			.eq('parent_id', userNode.id)
			.eq('organization_id', organization.id)
			.limit(1);
		hasDirectReports = (directReports?.length ?? 0) > 0;
	}

	return { organization, membership, userNode, hasDirectReports };
}
