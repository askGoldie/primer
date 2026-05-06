// @ts-nocheck
/**
 * Peers Page Server
 *
 * Loads nodes at the same level as the current user under the same parent
 * authority. The CEO (root node) has no peers and cannot access this route.
 *
 * Peer visibility (name, title, composite tier) is always available.
 * Deeper stack detail is gated by the parent's `peer_visibility` setting,
 * which is enforced on the individual leader detail pages.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { sql, maybeOne, many } from '$lib/server/db.js';

interface PeerNode {
	id: string;
	name: string;
	title: string | null;
	nodeType: string;
}

interface NodeRow {
	id: string;
	name: string;
	title: string | null;
	node_type: string;
}

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
	const { organization, userNode } = await parent();

	if (!userNode) {
		redirect(302, '/app');
	}

	const currentNodeRecord = await maybeOne<{ parent_id: string | null }>(sql`
		select parent_id from org_hierarchy_nodes where id = ${userNode.id}
	`);

	if (!currentNodeRecord?.parent_id) {
		redirect(302, '/app');
	}

	const peerNodes = await many<NodeRow>(sql`
		select id, name, title, node_type
		from org_hierarchy_nodes
		where parent_id = ${currentNodeRecord.parent_id}
			and id <> ${userNode.id}
			and organization_id = ${organization.id}
	`);

	const peers: PeerNode[] = peerNodes.map((node) => ({
		id: node.id,
		name: node.name,
		title: node.title,
		nodeType: node.node_type
	}));

	const parentNode = await maybeOne<{ peer_visibility: string | null }>(sql`
		select peer_visibility from org_hierarchy_nodes where id = ${currentNodeRecord.parent_id}
	`);

	const peerVisibilityLevel = parentNode?.peer_visibility ?? null;

	return { peers, peerVisibilityLevel };
};
