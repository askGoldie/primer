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
import { db } from '$lib/server/db.js';

/** Shape of a peer node — scores intentionally excluded (communicated vertically only) */
interface PeerNode {
	id: string;
	name: string;
	title: string | null;
	nodeType: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { organization, userNode } = await parent();

	if (!userNode) {
		redirect(302, '/app');
	}

	// Get the current node's parent_id
	const { data: currentNodeRecord } = await db
		.from('org_hierarchy_nodes')
		.select('parent_id')
		.eq('id', userNode.id)
		.single();

	if (!currentNodeRecord?.parent_id) {
		// Root node (CEO) — no peers
		redirect(302, '/app');
	}

	// Fetch sibling nodes under the same parent
	const { data: peerNodes } = await db
		.from('org_hierarchy_nodes')
		.select('*')
		.eq('parent_id', currentNodeRecord.parent_id)
		.neq('id', userNode.id)
		.eq('organization_id', organization.id);

	// Performance scores are intentionally excluded from peer data —
	// scoring is communicated vertically (manager ↔ report), not laterally.
	const peers: PeerNode[] = (peerNodes ?? []).map((node) => ({
		id: node.id,
		name: node.name,
		title: node.title,
		nodeType: node.node_type
	}));

	// ── Peer visibility level ────────────────────────────────────────────────
	// Check if the parent has configured peer_visibility for transparency
	let peerVisibilityLevel: string | null = null;
	const { data: parentNode } = await db
		.from('org_hierarchy_nodes')
		.select('peer_visibility')
		.eq('id', currentNodeRecord.parent_id)
		.single();

	if (parentNode?.peer_visibility) {
		peerVisibilityLevel = parentNode.peer_visibility;
	}

	return { peers, peerVisibilityLevel };
};
