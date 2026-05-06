/**
 * Centralized Permissions Helper
 *
 * Implements the role × hierarchy permissions matrix for the Primer system.
 * All authorization decisions flow through this module so that role checks
 * are consistent and auditable.
 *
 * Two authorization dimensions:
 * 1. **Role-based** — org_role (owner, system_admin, hr_admin, editor, participant, viewer)
 * 2. **Hierarchy-based** — position in the org tree (ancestor, peer, self)
 *
 * The system_admin role is the key delegation mechanism: it grants org-wide
 * management access (snapshots, metric assignment, approvals, cycle management)
 * without requiring a position above the target node in the hierarchy.
 *
 * The hr_admin role grants org-wide member management (invite, deactivate,
 * role assignment for editor/viewer/participant), compliance export, and
 * inquiry visibility — without metric/snapshot management powers.
 *
 * The participant role sits between viewer and editor: can create own goals,
 * record performance data, submit metrics for review, and file inquiries —
 * but cannot approve metrics, manage other nodes, or capture snapshots.
 *
 * @see /supabase/migrations/20260101000017_system_admin_role.sql
 * @see /supabase/migrations/20260101000019_role_expansion.sql
 */

import { sql, maybeOne } from '$lib/server/db.js';
import type { OrgRole } from '$lib/types/database.js';

// ============================================================================
// Role Checks
// ============================================================================

/**
 * Whether the role can manage organization-level settings
 * (name, industry, cycle cadence, inquiry toggle).
 *
 * hr_admin explicitly excluded — HR doesn't change org settings.
 */
export function canManageOrgSettings(role: OrgRole): boolean {
	return role === 'owner' || role === 'system_admin';
}

/**
 * Whether the role can assign/revoke member roles.
 * Only the owner can promote others to system_admin or hr_admin.
 *
 * @see canAssignMemberRoles for scoped role assignment (hr_admin).
 */
export function canAssignRoles(role: OrgRole): boolean {
	return role === 'owner';
}

/**
 * Whether the role can assign a specific target role to a member.
 *
 * - owner: can assign any role
 * - hr_admin: can assign editor, viewer, participant only
 * - all others: cannot assign roles
 *
 * @param assignerRole - The role of the user performing the assignment
 * @param targetRole - The role being assigned to the target user
 */
export function canAssignMemberRoles(assignerRole: OrgRole, targetRole: OrgRole): boolean {
	if (assignerRole === 'owner') return true;
	if (assignerRole === 'hr_admin') {
		return targetRole === 'editor' || targetRole === 'viewer' || targetRole === 'participant';
	}
	return false;
}

/**
 * Whether the role can manage members (invite, deactivate, place in hierarchy).
 */
export function canManageMembers(role: OrgRole): boolean {
	return role === 'owner' || role === 'hr_admin';
}

/**
 * Whether the role can manage visibility grants and peer visibility settings.
 *
 * Restricted to administrative roles — visibility configuration is an
 * executive-level decision, not a general management function.
 */
export function canManageVisibility(role: OrgRole): boolean {
	return role === 'owner' || role === 'system_admin' || role === 'hr_admin';
}

/**
 * Whether the role can view all inquiries (not just their own).
 *
 * hr_admin included — HR needs org-wide inquiry visibility.
 */
export function canViewAllInquiries(role: OrgRole): boolean {
	return role === 'owner' || role === 'system_admin' || role === 'hr_admin';
}

/**
 * Whether the role can resolve any inquiry (not just as authority).
 *
 * hr_admin explicitly excluded — HR views but doesn't resolve
 * operational disputes.
 */
export function canResolveAnyInquiry(role: OrgRole): boolean {
	return role === 'system_admin';
}

/**
 * Whether the role grants org-wide management powers,
 * bypassing hierarchy checks for management operations.
 *
 * hr_admin explicitly excluded — HR doesn't bypass hierarchy
 * for metric/snapshot operations.
 */
export function hasOrgWideManagement(role: OrgRole): boolean {
	return role === 'system_admin';
}

/**
 * Whether the role can adjust (modify) snapshots after capture.
 * Hierarchy-based users with editor role cannot adjust snapshots —
 * only system_admin and owners (who are also ancestors) can.
 */
export function canAdjustSnapshots(role: OrgRole): boolean {
	return role === 'owner' || role === 'system_admin';
}

/**
 * Whether the role can perform self-service actions:
 * goal creation, metric submission, performance recording.
 *
 * Participant and above can self-serve. Viewers cannot.
 */
export function canSelfServe(role: OrgRole): boolean {
	return (
		role === 'owner' ||
		role === 'system_admin' ||
		role === 'hr_admin' ||
		role === 'editor' ||
		role === 'participant'
	);
}

/**
 * Whether the role can export compliance reports (audit log, bulk cross-node data).
 */
export function canExportComplianceReports(role: OrgRole): boolean {
	return role === 'owner' || role === 'system_admin' || role === 'hr_admin';
}

// ============================================================================
// Hierarchy Checks
// ============================================================================

/**
 * Walk the parent_id chain upward from `nodeId` until the root.
 * Returns all ancestor IDs in order from immediate parent → root.
 */
export async function getAncestorIds(nodeId: string): Promise<string[]> {
	const ancestors: string[] = [];
	let currentId: string | null = nodeId;

	while (currentId) {
		const row: { parent_id: string | null } | null = await maybeOne(sql`
			select parent_id from org_hierarchy_nodes where id = ${currentId}
		`);

		if (!row?.parent_id) break;
		ancestors.push(row.parent_id);
		currentId = row.parent_id;
	}

	return ancestors;
}

/**
 * Get the user's hierarchy node and org membership.
 * Returns null if the user has no node or no membership.
 */
export async function getUserContext(userId: string): Promise<{
	nodeId: string;
	organizationId: string;
	role: OrgRole;
} | null> {
	const node = await maybeOne<{ id: string; organization_id: string }>(sql`
		select id, organization_id from org_hierarchy_nodes where user_id = ${userId} limit 1
	`);

	if (!node) return null;

	const membership = await maybeOne<{ role: OrgRole }>(sql`
		select role from org_members
		where user_id = ${userId}
			and organization_id = ${node.organization_id}
			and removed_at is null
		limit 1
	`);

	if (!membership) return null;

	return {
		nodeId: node.id,
		organizationId: node.organization_id,
		role: membership.role
	};
}

/**
 * Verify that the user can manage a target node.
 *
 * Management = assign metrics, edit metrics, capture snapshots,
 * start new cycles, approve metrics.
 *
 * Access is granted if:
 * - The user is a system_admin (org-wide management), OR
 * - The user is an ancestor of the target node in the hierarchy
 *
 * @returns The user's context (nodeId, orgId, role) or null if denied
 */
export async function verifyManagementAccess(
	userId: string,
	targetNodeId: string
): Promise<{
	nodeId: string;
	organizationId: string;
	role: OrgRole;
} | null> {
	const ctx = await getUserContext(userId);
	if (!ctx) return null;

	// System admins bypass hierarchy checks
	if (hasOrgWideManagement(ctx.role)) {
		return ctx;
	}

	// Otherwise, must be an ancestor in the hierarchy
	const ancestors = await getAncestorIds(targetNodeId);
	if (!ancestors.includes(ctx.nodeId)) return null;

	return ctx;
}

/**
 * Verify that the user can adjust (modify) snapshots for a target node.
 *
 * Stricter than general management — requires either:
 * - system_admin role (org-wide), OR
 * - owner role AND ancestor in hierarchy, OR
 * - ancestor in hierarchy (any role that is not viewer)
 *
 * This ensures that editors with hierarchy access can capture but the
 * adjustment power is reserved for owner/system_admin per the matrix.
 */
export async function verifySnapshotAdjustAccess(
	userId: string,
	targetNodeId: string
): Promise<{
	nodeId: string;
	organizationId: string;
	role: OrgRole;
} | null> {
	const ctx = await getUserContext(userId);
	if (!ctx) return null;

	// System admins can adjust any snapshot
	if (hasOrgWideManagement(ctx.role)) {
		return ctx;
	}

	// Must be an ancestor AND have owner role
	if (!canAdjustSnapshots(ctx.role)) return null;

	const ancestors = await getAncestorIds(targetNodeId);
	if (!ancestors.includes(ctx.nodeId)) return null;

	return ctx;
}
