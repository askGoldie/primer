/**
 * Hierarchy Query Helpers
 *
 * Utilities for traversing the organizational hierarchy tree.
 * Used by reports (subtree scoping), admin bulk actions, and
 * goal cascading.
 *
 * @see /src/lib/server/permissions.ts for authorization checks
 */

import { db } from '$lib/server/db.js';

/**
 * Collect all descendant node IDs of a given root node using
 * an in-memory tree walk (fetches all org nodes once, then
 * filters in application code).
 *
 * This approach avoids recursive CTEs that may not be supported
 * by all Postgres providers and works well for org trees of
 * typical size (< 10,000 nodes).
 *
 * @param rootNodeId - The hierarchy node to start from
 * @param organizationId - The organization to scope the query to
 * @returns Array of descendant node IDs (excludes the root itself)
 */
export async function getSubtreeNodeIds(
	rootNodeId: string,
	organizationId: string
): Promise<string[]> {
	const { data: allNodes } = await db
		.from('org_hierarchy_nodes')
		.select('id, parent_id')
		.eq('organization_id', organizationId);

	if (!allNodes) return [];

	const nodes = allNodes;
	const descendants: string[] = [];

	function collect(parentId: string) {
		for (const node of nodes) {
			if (node.parent_id === parentId) {
				descendants.push(node.id);
				collect(node.id);
			}
		}
	}

	collect(rootNodeId);
	return descendants;
}

/**
 * Get the direct children node IDs for a given parent node.
 *
 * @param parentNodeId - The parent hierarchy node
 * @param organizationId - The organization to scope the query to
 * @returns Array of direct child node IDs
 */
export async function getDirectChildNodeIds(
	parentNodeId: string,
	organizationId: string
): Promise<string[]> {
	const { data: children } = await db
		.from('org_hierarchy_nodes')
		.select('id')
		.eq('parent_id', parentNodeId)
		.eq('organization_id', organizationId);

	return (children ?? []).map((c) => c.id);
}

/**
 * Check whether a user's node is an ancestor of a target node.
 *
 * @param userNodeId - The user's hierarchy node
 * @param targetNodeId - The node to check ancestry for
 * @param organizationId - The organization to scope the query to
 * @returns true if userNodeId is an ancestor of targetNodeId
 */
export async function isAncestorOf(
	userNodeId: string,
	targetNodeId: string,
	organizationId: string
): Promise<boolean> {
	const { data: allNodes } = await db
		.from('org_hierarchy_nodes')
		.select('id, parent_id')
		.eq('organization_id', organizationId);

	if (!allNodes) return false;

	let currentId: string | null = targetNodeId;
	while (currentId) {
		const node = allNodes.find((n) => n.id === currentId);
		if (!node?.parent_id) return false;
		if (node.parent_id === userNodeId) return true;
		currentId = node.parent_id;
	}

	return false;
}
