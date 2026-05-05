// @ts-nocheck
/**
 * Settings Page Server
 *
 * Unified settings surface for the app. Tabs (conditional on role):
 *
 * 1. **Organization** (owner / system_admin)
 *    - Organization name + inquiry system toggle
 *    - Peer visibility default (moved from old Access tab)
 *    - Elevated access grants (moved from old Access tab)
 *
 * 2. **Hierarchy** (owner / system_admin / hr_admin)
 *    - Placeholder in Pass A. The tree-view builder lands in Pass B —
 *      see docs/settings-reorg-plan.md and docs/hierarchy-system-reference.md.
 *
 * 3. **Team** (owner only — role assignment)
 *    - Member role management (unchanged).
 *
 * 4. **Audit** (owner / system_admin / hr_admin)
 *    - Org-wide stats, pending placements, department overview,
 *      bulk snapshot, bulk unlock, all-nodes status table, CSV exports,
 *      cycle cadence control, link to filterable audit log viewer.
 *    - Ported from the old `/app/admin` page; that route now 302s here.
 *
 * Deleted in Pass A:
 *   - Account tab (Sign out duplicated in nav footer)
 *   - Profile tab (name/email/locale — language selector is in nav footer)
 *   - Industry dropdown on Organization tab
 *
 * @see docs/settings-reorg-plan.md
 */

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

/**
 * Fire-and-forget audit-log writer for hierarchy mutations.
 *
 * The audit_log table (migration 007) was designed to hold change history
 * for all mutation-bearing entities, including `node`. This helper is the
 * single write-site for hierarchy mutations, keyed by audit_action. It
 * swallows its own errors so a failure to write audit state never causes
 * the parent mutation to roll back — audit is observational, not
 * transactional.
 *
 * @param orgId       Scoping organization (FK to organizations.id)
 * @param entityId    The node id this event is about (FK-lax: we don't
 *                    join, we just record)
 * @param action      One of the audit_action enum values
 * @param userId      Who performed the action (auth.uid)
 * @param prev        JSON snapshot of the row BEFORE the mutation (null on create)
 * @param next        JSON snapshot of the row AFTER the mutation (null on delete)
 * @param context     Human-readable reason string ("dissolve", "bulk_reparent", etc.)
 */
async function writeHierarchyAudit(
	orgId: string,
	entityId: string,
	action: 'created' | 'updated' | 'deleted' | 'bound' | 'unbound',
	userId: string,
	prev: unknown | null,
	next: unknown | null,
	context: string | null = null
): Promise<void> {
	try {
		await db.from('audit_log').insert({
			organization_id: orgId,
			entity_type: 'node',
			entity_id: entityId,
			action,
			changed_by: userId,
			previous_value: prev as never,
			new_value: next as never,
			context
		});
	} catch (err) {
		// Audit writes are advisory — log and continue so real user-visible
		// mutations aren't blocked by audit failures (e.g. schema drift,
		// audit table full, RLS quirks).
		console.warn('writeHierarchyAudit failed:', err);
	}
}
import {
	canManageOrgSettings,
	canAssignRoles,
	canManageVisibility,
	canManageMembers,
	canExportComplianceReports
} from '$lib/server/permissions.js';
import {
	calculateCompositeScore,
	getTierFromScore,
	calculateMetricDetails
} from '$lib/utils/score.js';
import type { TierLevel, HierarchyNodeType } from '$lib/types/index.js';
import type { OrgRole } from '$lib/types/database.js';
import { validateContainment } from '$lib/hierarchy/containment.js';
import { getHierarchyTemplate, type HierarchyTemplateNode } from '$lib/hierarchy/templates.js';

/** Shape of an active visibility grant (unchanged from previous settings page) */
interface VisibilityGrant {
	id: string;
	granteeName: string;
	granteeTitle: string | null;
	granteeNodeId: string;
	scopeNodeId: string | null;
	scopeName: string | null;
	visibility: string;
	createdAt: string;
}

/**
 * Shape of a row in the Audit tab's all-nodes status table.
 * Identical to what the old `/app/admin` page shipped; kept so the
 * ported template renders without changes.
 */
interface AuditNodeRow {
	id: string;
	name: string;
	title: string | null;
	nodeType: string;
	parentId: string | null;
	userName: string | null;
	userEmail: string | null;
	latestSnapshot: {
		id: string;
		score: number;
		tier: TierLevel;
		cycleLabel: string | null;
		createdAt: string;
	} | null;
	metricCount: number;
	lockedCount: number;
	pendingCount: number;
	perfLogCount: number;
	isLocked: boolean;
}

/** Row in the Audit tab's pending-placements list */
interface PendingPlacement {
	id: string;
	userId: string;
	userName: string | null;
	userEmail: string | null;
	requestedAt: string;
}

/** Row in the Audit tab's department overview */
interface DepartmentOverviewRow {
	name: string;
	nodeCount: number;
	avgScore: number | null;
	snapshotCount: number;
	pendingReviews: number;
}

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
	const { membership, organization, userNode } = await parent();

	const role = membership.role as OrgRole;
	const canEditOrg = canManageOrgSettings(role);
	const isOwner = canAssignRoles(role);
	const showVisibility = canManageVisibility(role);
	const canViewAudit = role === 'owner' || role === 'system_admin' || role === 'hr_admin';
	// Hierarchy tab gate — same role set as Audit. Kept as its own flag so the
	// Svelte template can document intent ("can this user CRUD the org chart?")
	// separately from "can this user view audit data?".
	const canEditHierarchy = canViewAudit;
	const isHrAdmin = role === 'hr_admin';
	const isSystemAdmin = role === 'system_admin' || role === 'owner';

	// ── Role management (owner only) ────────────────────────────────────────
	// Unchanged from previous settings page.
	let members: {
		id: string;
		userId: string;
		userName: string;
		userEmail: string;
		role: string;
	}[] = [];

	if (isOwner) {
		const { data: memberRows } = await db
			.from('org_members')
			.select('id, user_id, role, users!org_members_user_id_fkey(name, email)')
			.eq('organization_id', organization.id)
			.is('removed_at', null)
			.order('assigned_at', { ascending: true });

		members = (memberRows ?? []).map((m) => {
			const user = m.users as { name: string; email: string } | null;
			return {
				id: m.id,
				userId: m.user_id,
				userName: user?.name ?? '',
				userEmail: user?.email ?? '',
				role: m.role
			};
		});
	}

	// ── Visibility / access control ─────────────────────────────────────────
	// Shown on the Organization tab (was its own tab previously). Admin-only.
	let peerVisibilitySetting: 'score_only' | 'metrics' | 'full' = 'score_only';
	let grants: VisibilityGrant[] = [];
	let allNodesList: { id: string; name: string; title: string | null }[] = [];
	let hasNode = false;

	if (showVisibility) {
		// Fetch all nodes in org (for dropdowns and grant lookups)
		const { data: allNodesRaw } = await db
			.from('org_hierarchy_nodes')
			.select('*, users!org_hierarchy_nodes_user_id_fkey(name)')
			.eq('organization_id', organization.id);

		const allNodes = allNodesRaw ?? [];

		// Current node's peer_visibility setting (only if user has a node)
		if (userNode) {
			hasNode = true;
			const currentNodeRecord = allNodes.find((n) => n.id === userNode.id);
			peerVisibilitySetting =
				(currentNodeRecord?.peer_visibility as 'score_only' | 'metrics' | 'full') ?? 'score_only';
		}

		// Active visibility grants — scope depends on whether the caller has a node
		let grantsRaw;
		if (userNode) {
			const { data } = await db
				.from('visibility_grants')
				.select('*')
				.eq('organization_id', organization.id)
				.eq(
					'granted_by',
					await db
						.from('org_hierarchy_nodes')
						.select('user_id')
						.eq('id', userNode.id)
						.single()
						.then((r) => r.data?.user_id ?? '')
				)
				.is('revoked_at', null);
			grantsRaw = data;
		} else {
			const { data } = await db
				.from('visibility_grants')
				.select('*')
				.eq('organization_id', organization.id)
				.is('revoked_at', null);
			grantsRaw = data;
		}

		grants = (grantsRaw ?? []).map((g) => {
			const granteeNode = allNodes.find((n) => n.id === g.grantee_node_id);
			const scopeNode = g.scope_node_id ? allNodes.find((n) => n.id === g.scope_node_id) : null;
			return {
				id: g.id,
				granteeName: granteeNode?.name ?? 'Unknown',
				granteeTitle: granteeNode?.title ?? null,
				granteeNodeId: g.grantee_node_id,
				scopeNodeId: g.scope_node_id,
				scopeName: scopeNode?.name ?? null,
				visibility: g.visibility,
				createdAt: g.created_at
			};
		});

		allNodesList = allNodes.map((n) => ({
			id: n.id,
			name: n.name,
			title: n.title
		}));
	}

	// ── Hierarchy tab data (Pass B) ─────────────────────────────────────────
	// Full node list with everything the tree-view builder needs to render,
	// plus a list of org members that can be assigned to a node. A single
	// query populates both the "tree" and the "parent picker" on the client.
	interface HierarchyTreeNode {
		id: string;
		parentId: string | null;
		nodeType: 'executive_leader' | 'department' | 'team' | 'individual';
		name: string;
		title: string | null;
		description: string | null;
		sortOrder: number;
		userId: string | null;
		userName: string | null;
	}
	interface AssignableMember {
		userId: string;
		name: string;
		email: string;
	}
	let hierarchyNodes: HierarchyTreeNode[] = [];
	let assignableMembers: AssignableMember[] = [];

	if (canEditHierarchy) {
		const { data: hNodes } = await db
			.from('org_hierarchy_nodes')
			.select(
				'id, parent_id, node_type, name, title, description, sort_order, user_id, users!org_hierarchy_nodes_user_id_fkey(name)'
			)
			.eq('organization_id', organization.id)
			.order('sort_order', { ascending: true });

		hierarchyNodes = (hNodes ?? []).map((n) => {
			const userRel = n.users as { name: string } | null;
			return {
				id: n.id,
				parentId: n.parent_id,
				nodeType: n.node_type,
				name: n.name,
				title: n.title,
				description: n.description,
				sortOrder: n.sort_order ?? 0,
				userId: n.user_id,
				userName: userRel?.name ?? null
			};
		});

		// Active org members — used by the user-assignment dropdown on the
		// create/edit form. Offboarded members (removed_at IS NOT NULL) are
		// excluded because assigning them makes no sense.
		const { data: assignRows } = await db
			.from('org_members')
			.select('user_id, users!org_members_user_id_fkey(name, email)')
			.eq('organization_id', organization.id)
			.is('removed_at', null);

		assignableMembers = (assignRows ?? [])
			.map((r) => {
				const u = r.users as { name: string; email: string } | null;
				return {
					userId: r.user_id,
					name: u?.name ?? '',
					email: u?.email ?? ''
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	// ── Audit tab data (ported from old /app/admin page) ────────────────────
	// Same role gate as the old admin page. Empty defaults let the Svelte
	// template reference these fields unconditionally without null checks.
	let auditNodes: AuditNodeRow[] = [];
	let auditStats = {
		totalNodes: 0,
		nodesWithMetrics: 0,
		nodesLocked: 0,
		nodesPending: 0
	};
	let pendingPlacements: PendingPlacement[] = [];
	const departmentOverview: DepartmentOverviewRow[] = [];

	if (canViewAudit) {
		// Load all hierarchy nodes with their user bindings
		const { data: allNodes } = await db
			.from('org_hierarchy_nodes')
			.select('*, users!org_hierarchy_nodes_user_id_fkey(name, email)')
			.eq('organization_id', organization.id)
			.order('sort_order', { ascending: true });

		// For each node, get latest snapshot + metric counts + lock state.
		// This is N+1 on purpose — the admin surface gets rare traffic and
		// the per-node detail is the whole point of the view.
		auditNodes = await Promise.all(
			(allNodes ?? []).map(async (node) => {
				const userData = node.users as { name: string; email: string } | null;

				const { data: snapshots } = await db
					.from('score_snapshots')
					.select('id, composite_score, composite_tier, cycle_label, created_at')
					.eq('node_id', node.id)
					.order('created_at', { ascending: false })
					.limit(1);

				const latestSnapshot = snapshots?.[0] ?? null;

				const { count: metricCount } = await db
					.from('metrics')
					.select('id', { count: 'exact', head: true })
					.eq('node_id', node.id);

				const { count: lockedCount } = await db
					.from('metrics')
					.select('id', { count: 'exact', head: true })
					.eq('node_id', node.id)
					.not('locked_by_snapshot_id', 'is', null);

				const { count: pendingCount } = await db
					.from('metrics')
					.select('id', { count: 'exact', head: true })
					.eq('node_id', node.id)
					.not('submitted_at', 'is', null)
					.is('approved_at', null);

				const { count: perfLogCount } = await db
					.from('performance_logs')
					.select('id', { count: 'exact', head: true })
					.eq('node_id', node.id);

				return {
					id: node.id,
					name: node.name,
					title: node.title,
					nodeType: node.node_type,
					parentId: node.parent_id,
					userName: userData?.name ?? null,
					userEmail: userData?.email ?? null,
					latestSnapshot: latestSnapshot
						? {
								id: latestSnapshot.id,
								score: latestSnapshot.composite_score,
								tier: latestSnapshot.composite_tier as TierLevel,
								cycleLabel: latestSnapshot.cycle_label,
								createdAt: latestSnapshot.created_at
							}
						: null,
					metricCount: metricCount ?? 0,
					lockedCount: lockedCount ?? 0,
					pendingCount: pendingCount ?? 0,
					perfLogCount: perfLogCount ?? 0,
					isLocked: (lockedCount ?? 0) > 0
				};
			})
		);

		// Org-wide stats
		auditStats = {
			totalNodes: auditNodes.length,
			nodesWithMetrics: auditNodes.filter((n) => n.metricCount > 0).length,
			nodesLocked: auditNodes.filter((n) => n.isLocked).length,
			nodesPending: auditNodes.filter((n) => n.pendingCount > 0).length
		};

		// ── Pending placement requests (owner / hr_admin) ───────────────────
		if (canManageMembers(role)) {
			const { data: placements } = await db
				.from('placement_requests')
				.select('*, users!placement_requests_user_id_fkey(name, email)')
				.eq('organization_id', organization.id)
				.is('resolved_at', null)
				.order('requested_at', { ascending: false });

			pendingPlacements = (placements ?? []).map((p) => {
				const userData = p.users as { name: string; email: string } | null;
				return {
					id: p.id,
					userId: p.user_id,
					userName: userData?.name ?? null,
					userEmail: userData?.email ?? null,
					requestedAt: p.requested_at
				};
			});
		}

		// ── Department overview (system_admin / owner only) ─────────────────
		if (isSystemAdmin) {
			const rootNodes = (allNodes ?? []).filter((n) => n.parent_id === null);
			const topLevelDepts =
				rootNodes.length > 0
					? (allNodes ?? []).filter((n) => rootNodes.some((r) => r.id === n.parent_id))
					: [];

			const deptNodes = topLevelDepts.length > 0 ? topLevelDepts : rootNodes;

			for (const dept of deptNodes) {
				const descendants = auditNodes.filter((n) => {
					let current: AuditNodeRow | undefined = n;
					while (current) {
						if (current.parentId === dept.id) return true;
						if (current.id === dept.id) return true;
						current = auditNodes.find((nn) => nn.id === current!.parentId);
						if (!current) break;
					}
					return false;
				});

				const deptNodeSet = [auditNodes.find((n) => n.id === dept.id), ...descendants].filter(
					Boolean
				) as AuditNodeRow[];

				const scores = deptNodeSet
					.filter((n) => n.latestSnapshot)
					.map((n) => n.latestSnapshot!.score);

				departmentOverview.push({
					name: dept.name,
					nodeCount: deptNodeSet.length,
					avgScore:
						scores.length > 0
							? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
							: null,
					snapshotCount: deptNodeSet.filter((n) => n.latestSnapshot).length,
					pendingReviews: deptNodeSet.reduce((sum, n) => sum + n.pendingCount, 0)
				});
			}
		}
	}

	return {
		// Tab visibility flags
		canEditOrg,
		canAssignRoles: isOwner,
		canViewAudit,
		canEditHierarchy,
		showVisibility,
		isHrAdmin,
		isSystemAdmin,
		canManageMembers: canManageMembers(role),
		canExport: canExportComplianceReports(role),

		// Organization tab data
		members,
		peerVisibilitySetting,
		grants,
		allNodes: allNodesList,
		hasNode,

		// Hierarchy tab data
		hierarchyNodes,
		assignableMembers,

		// Audit tab data
		auditNodes,
		auditStats,
		pendingPlacements,
		departmentOverview
	};
};

export const actions = {
	/**
	 * Update organization settings (name + inquiry toggle).
	 *
	 * Industry dropdown was removed in Pass A — it didn't fit the source-code
	 * license model and was never read by any downstream code.
	 *
	 * Cycle cadence lives on the Audit tab now; see `updateCycleCadence`.
	 *
	 * Allowed for: owner, system_admin
	 */
	updateOrg: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipResult = memberships?.[0];
		if (!membershipResult?.organizations) {
			return fail(403, { error: 'error.generic' });
		}

		const organization = membershipResult.organizations;
		if (!canManageOrgSettings(membershipResult.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const inquiryEnabled = formData.get('inquiryEnabled') === 'on';

		if (!name) {
			return fail(400, { error: 'validation.field_required' });
		}

		await db
			.from('organizations')
			.update({
				name,
				inquiry_enabled: inquiryEnabled,
				updated_at: new Date().toISOString()
			})
			.eq('id', organization.id);

		return { success: true };
	},

	/**
	 * Update the cycle cadence (monthly / quarterly).
	 *
	 * Moved to the Audit tab in Pass A because cadence selection is an
	 * operational decision (when do snapshots roll) rather than an
	 * organizational identity setting.
	 *
	 * Allowed for: owner, system_admin
	 */
	updateCycleCadence: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipResult = memberships?.[0];
		if (!membershipResult?.organizations) {
			return fail(403, { error: 'error.generic' });
		}

		if (!canManageOrgSettings(membershipResult.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const cycleCadence = formData.get('cycleCadence')?.toString() as 'monthly' | 'quarterly';

		if (cycleCadence !== 'monthly' && cycleCadence !== 'quarterly') {
			return fail(400, { error: 'validation.field_required' });
		}

		await db
			.from('organizations')
			.update({
				cycle_cadence: cycleCadence,
				updated_at: new Date().toISOString()
			})
			.eq('id', membershipResult.organizations.id);

		return { cadenceSuccess: true };
	},

	/**
	 * Update a member's role. Owner only; owners can't change their own role.
	 */
	updateRole: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const { data: callerMembership } = await db
			.from('org_members')
			.select('role, organization_id')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.single();

		if (!callerMembership || !canAssignRoles(callerMembership.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const membershipId = formData.get('membershipId')?.toString();
		const newRole = formData.get('role')?.toString() as OrgRole;

		if (!membershipId || !newRole) {
			return fail(400, { error: 'validation.field_required' });
		}

		const validRoles: OrgRole[] = [
			'owner',
			'system_admin',
			'hr_admin',
			'editor',
			'participant',
			'viewer'
		];
		if (!validRoles.includes(newRole)) {
			return fail(400, { error: 'validation.field_required' });
		}

		const { data: targetMember } = await db
			.from('org_members')
			.select('user_id, role')
			.eq('id', membershipId)
			.eq('organization_id', callerMembership.organization_id)
			.single();

		if (!targetMember) {
			return fail(404, { error: 'error.generic' });
		}

		if (targetMember.user_id === locals.user.id) {
			return fail(400, { error: 'settings.cannot_change_own_role' });
		}

		await db.from('org_members').update({ role: newRole }).eq('id', membershipId);

		return { roleSuccess: true };
	},

	/**
	 * Update the current node's peer_visibility setting.
	 * (Unchanged from old settings page. Lives under Organization tab now.)
	 */
	updatePeerVisibility: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const peerVisibility = formData.get('peerVisibility')?.toString() as
			| 'score_only'
			| 'metrics'
			| 'full';

		if (!peerVisibility || !['score_only', 'metrics', 'full'].includes(peerVisibility)) {
			return fail(400, { error: 'validation.field_required' });
		}

		const { data: memberships } = await db
			.from('org_members')
			.select('organization_id, role')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipData = memberships?.[0];
		if (!membershipData || !canManageVisibility(membershipData.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const orgId = membershipData.organization_id;
		if (!orgId) return fail(403, { error: 'error.generic' });

		const { data: ownNode } = await db
			.from('org_hierarchy_nodes')
			.select('id')
			.eq('organization_id', orgId)
			.eq('user_id', locals.user.id)
			.single();

		if (!ownNode) return fail(403, { error: 'error.generic' });

		const { error: updateError } = await db
			.from('org_hierarchy_nodes')
			.update({ peer_visibility: peerVisibility })
			.eq('id', ownNode.id);

		if (updateError) {
			console.error('updatePeerVisibility error:', updateError);
			return fail(500, { error: 'error.generic' });
		}

		return { peerVisibilitySuccess: true };
	},

	/**
	 * Grant elevated visibility to a specific person.
	 * (Unchanged from old settings page. Lives under Organization tab now.)
	 */
	createGrant: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const granteeNodeId = formData.get('granteeNodeId')?.toString();
		const scopeNodeId = formData.get('scopeNodeId')?.toString() || null;
		const visibility = (formData.get('visibility')?.toString() ?? 'full') as
			| 'score_only'
			| 'metrics'
			| 'full';

		if (!granteeNodeId) {
			return fail(400, { error: 'validation.field_required' });
		}

		const { data: memberships } = await db
			.from('org_members')
			.select('organization_id, role')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipData = memberships?.[0];
		if (!membershipData || !canManageVisibility(membershipData.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const { error: insertError } = await db.from('visibility_grants').insert({
			organization_id: membershipData.organization_id,
			grantee_node_id: granteeNodeId,
			scope_node_id: scopeNodeId,
			visibility,
			granted_by: locals.user.id
		});

		if (insertError) {
			console.error('createGrant error:', insertError);
			return fail(500, { error: 'error.generic' });
		}

		return { grantSuccess: true };
	},

	/**
	 * Revoke an existing visibility grant.
	 * (Unchanged from old settings page. Lives under Organization tab now.)
	 */
	revokeGrant: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const grantId = formData.get('grantId')?.toString();

		if (!grantId) return fail(400, { error: 'validation.field_required' });

		const { data: mem } = await db
			.from('org_members')
			.select('role, organization_id')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.single();

		let revokeQuery = db
			.from('visibility_grants')
			.update({ revoked_at: new Date().toISOString() })
			.eq('id', grantId);

		if (mem?.role === 'system_admin' || mem?.role === 'owner') {
			revokeQuery = revokeQuery.eq('organization_id', mem.organization_id);
		} else {
			revokeQuery = revokeQuery.eq('granted_by', locals.user.id);
		}

		const { error: revokeError } = await revokeQuery;

		if (revokeError) {
			console.error('revokeGrant error:', revokeError);
			return fail(500, { error: 'error.generic' });
		}

		return { revokeSuccess: true };
	},

	/**
	 * Resolve a pending placement request.
	 *
	 * Ported verbatim from the old /app/admin page. Allowed for owner /
	 * hr_admin (anyone with `canManageMembers`). Used on the Audit tab.
	 */
	resolvePlacement: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403);

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipResult = memberships?.[0];
		if (!membershipResult?.organizations) {
			return fail(403, { error: 'error.generic' });
		}
		const organization = membershipResult.organizations;
		const role = membershipResult.role as OrgRole;
		if (!canManageMembers(role)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const placementId = formData.get('placementId')?.toString();
		if (!placementId) return fail(400, { error: 'validation.field_required' });

		await db
			.from('placement_requests')
			.update({
				resolved_at: new Date().toISOString(),
				resolved_by: locals.user.id
			})
			.eq('id', placementId)
			.eq('organization_id', organization.id);

		return { resolvePlacementSuccess: true };
	},

	/**
	 * Bulk snapshot capture across many nodes.
	 *
	 * Ported verbatim from the old /app/admin page. Owner / system_admin only.
	 */
	bulkSnapshot: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403);

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipResult = memberships?.[0];
		if (!membershipResult?.organizations) {
			return fail(403, { error: 'error.generic' });
		}
		const organization = membershipResult.organizations;
		if (membershipResult.role !== 'owner' && membershipResult.role !== 'system_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const cycleLabel = formData.get('cycleLabel')?.toString().trim();
		const notes = formData.get('notes')?.toString().trim() || null;
		const scope = formData.get('scope')?.toString(); // 'all' or comma-separated IDs

		if (!cycleLabel) return fail(400, { error: 'validation.field_required' });

		let targetNodeIds: string[];
		if (scope === 'all') {
			const { data: allNodes } = await db
				.from('org_hierarchy_nodes')
				.select('id')
				.eq('organization_id', organization.id);
			targetNodeIds = (allNodes ?? []).map((n) => n.id);
		} else {
			targetNodeIds = (scope ?? '').split(',').filter(Boolean);
		}

		let captured = 0;
		let skipped = 0;

		for (const nodeId of targetNodeIds) {
			const { data: nodeMetrics } = await db
				.from('metrics')
				.select('id, name, measurement_type, origin, current_value, current_tier, weight')
				.eq('node_id', nodeId);

			const scoreable = (nodeMetrics ?? []).filter((m) => m.current_tier && m.weight);

			if (scoreable.length === 0) {
				skipped++;
				continue;
			}

			const compositeScore = calculateCompositeScore(
				scoreable.map((m) => ({
					tier: m.current_tier as TierLevel,
					weight: m.weight as number
				}))
			);
			const compositeTier = getTierFromScore(compositeScore);

			const metricDetails = calculateMetricDetails(
				scoreable.map((m) => ({
					id: m.id,
					name: m.name,
					measurementType: m.measurement_type,
					origin: m.origin,
					currentValue: m.current_value,
					currentTier: m.current_tier as TierLevel,
					weight: m.weight as number
				}))
			);

			const { data: snapshot } = await db
				.from('score_snapshots')
				.insert({
					organization_id: organization.id,
					node_id: nodeId,
					composite_score: compositeScore,
					composite_tier: compositeTier,
					metric_details: metricDetails as unknown as Record<string, unknown>,
					cycle_label: cycleLabel,
					notes,
					recorded_by: locals.user.id
				})
				.select()
				.single();

			if (snapshot) {
				await db
					.from('metrics')
					.update({
						locked_by_snapshot_id: snapshot.id,
						updated_at: new Date().toISOString()
					})
					.eq('node_id', nodeId);

				captured++;
			}
		}

		return { bulkSnapshotSuccess: true, captured, skipped };
	},

	/**
	 * Bulk unlock — starts a new cycle for multiple nodes.
	 *
	 * Ported verbatim from the old /app/admin page. Owner / system_admin only.
	 */
	bulkUnlock: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403);

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membershipResult = memberships?.[0];
		if (!membershipResult?.organizations) {
			return fail(403, { error: 'error.generic' });
		}
		const organization = membershipResult.organizations;
		if (membershipResult.role !== 'owner' && membershipResult.role !== 'system_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const scope = formData.get('scope')?.toString();

		let targetNodeIds: string[];
		if (scope === 'all') {
			const { data: allNodes } = await db
				.from('org_hierarchy_nodes')
				.select('id')
				.eq('organization_id', organization.id);
			targetNodeIds = (allNodes ?? []).map((n) => n.id);
		} else {
			targetNodeIds = (scope ?? '').split(',').filter(Boolean);
		}

		for (const nodeId of targetNodeIds) {
			await db
				.from('metrics')
				.update({
					locked_by_snapshot_id: null,
					submitted_at: null,
					submitted_by: null,
					approved_at: null,
					approved_by: null,
					updated_at: new Date().toISOString()
				})
				.eq('node_id', nodeId);
		}

		return { bulkUnlockSuccess: true, unlocked: targetNodeIds.length };
	},

	// ── Hierarchy builder actions (Pass B) ──────────────────────────────────
	// CRUD over `org_hierarchy_nodes` driven by forms in the Hierarchy tab.
	// All of these validate containment against VALID_PARENTS and check the
	// caller's role via canViewAudit (owner / system_admin / hr_admin). None
	// of them need a DB migration — the schema has supported this since
	// initial setup.

	/**
	 * Create a new hierarchy node.
	 *
	 * Form fields:
	 *  - `nodeType`   — one of the four HierarchyNodeType values
	 *  - `name`       — required, 1-200 chars
	 *  - `title`      — optional job title
	 *  - `description`— optional
	 *  - `parentId`   — empty string for root; must validate containment
	 *  - `userId`     — optional org_members.user_id to bind to the node
	 */
	createHierarchyNode: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const nodeType = fd.get('nodeType')?.toString() as HierarchyNodeType | undefined;
		const name = fd.get('name')?.toString().trim();
		const title = fd.get('title')?.toString().trim() || null;
		const description = fd.get('description')?.toString().trim() || null;
		const parentIdRaw = fd.get('parentId')?.toString() || '';
		const parentId = parentIdRaw === '' ? null : parentIdRaw;
		const userIdRaw = fd.get('userId')?.toString() || '';
		const userId = userIdRaw === '' ? null : userIdRaw;

		if (!nodeType || !['executive_leader', 'department', 'team', 'individual'].includes(nodeType)) {
			return fail(400, { error: 'validation.field_required' });
		}
		if (!name || name.length < 1 || name.length > 200) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Containment validation — look up the parent's node_type if present.
		let parentType: HierarchyNodeType | null = null;
		if (parentId) {
			const { data: parent } = await db
				.from('org_hierarchy_nodes')
				.select('node_type, organization_id')
				.eq('id', parentId)
				.single();
			if (!parent || parent.organization_id !== organization.id) {
				return fail(400, { error: 'hierarchy.parent_not_found' });
			}
			parentType = parent.node_type as HierarchyNodeType;
		}
		if (!validateContainment(nodeType, parentType)) {
			return fail(400, { error: 'hierarchy.invalid_containment' });
		}

		// Next sort_order among siblings.
		const { data: siblings } = await db
			.from('org_hierarchy_nodes')
			.select('sort_order')
			.eq('organization_id', organization.id)
			.eq('parent_id', parentId as string);
		const nextSort =
			((siblings ?? []).reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) as number) + 1;

		const { data: inserted, error: insertError } = await db
			.from('org_hierarchy_nodes')
			.insert({
				organization_id: organization.id,
				parent_id: parentId,
				node_type: nodeType,
				name,
				title,
				description,
				user_id: userId,
				sort_order: nextSort,
				created_by: locals.user.id
			})
			.select('*')
			.single();
		if (insertError || !inserted) {
			console.error('createHierarchyNode error:', insertError);
			return fail(500, { error: 'error.generic' });
		}

		await writeHierarchyAudit(
			organization.id,
			inserted.id,
			'created',
			locals.user.id,
			null,
			inserted,
			'create'
		);

		// Return the new id so the client can build an inverse-delete command
		// for undo/redo without having to diff the pre/post node list.
		return { hierarchyCreateSuccess: true, nodeId: inserted.id };
	},

	/**
	 * Update non-structural fields on an existing node.
	 * Reparenting is handled by {@link reparentHierarchyNode} so that path
	 * gets its own containment check.
	 */
	updateHierarchyNode: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		const name = fd.get('name')?.toString().trim();
		const title = fd.get('title')?.toString().trim() || null;
		const description = fd.get('description')?.toString().trim() || null;
		const userIdRaw = fd.get('userId')?.toString() ?? '';
		const userId = userIdRaw === '' ? null : userIdRaw;

		if (!nodeId || !name) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Snapshot the pre-state so audit_log can carry the previous values
		// for client-side undo (shown in the undo pill as the inverse).
		const { data: prev } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('id', nodeId)
			.eq('organization_id', organization.id)
			.single();

		const { data: updated, error: updateError } = await db
			.from('org_hierarchy_nodes')
			.update({
				name,
				title,
				description,
				user_id: userId,
				updated_at: new Date().toISOString()
			})
			.eq('id', nodeId)
			.eq('organization_id', organization.id)
			.select('*')
			.single();

		if (updateError || !updated) {
			console.error('updateHierarchyNode error:', updateError);
			return fail(500, { error: 'error.generic' });
		}

		await writeHierarchyAudit(
			organization.id,
			nodeId,
			'updated',
			locals.user.id,
			prev ?? null,
			updated,
			'update'
		);

		return { hierarchyUpdateSuccess: true };
	},

	/**
	 * Delete a node. FK CASCADE on `parent_id` takes the whole subtree with it.
	 * The UI confirms the cascade before submitting.
	 */
	deleteHierarchyNode: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		if (!nodeId) return fail(400, { error: 'validation.field_required' });

		// Snapshot for audit — delete is intentionally NOT reversible in
		// the UI's undo stack, but audit still wants the pre-state on record
		// for compliance and for the "restore from trash" feature we may
		// add later (see Tier 2 soft-delete migration in the follow-up plan).
		const { data: prev } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('id', nodeId)
			.eq('organization_id', organization.id)
			.single();

		const { error: deleteError } = await db
			.from('org_hierarchy_nodes')
			.delete()
			.eq('id', nodeId)
			.eq('organization_id', organization.id);

		if (deleteError) {
			console.error('deleteHierarchyNode error:', deleteError);
			return fail(500, { error: 'error.generic' });
		}

		await writeHierarchyAudit(
			organization.id,
			nodeId,
			'deleted',
			locals.user.id,
			prev ?? null,
			null,
			'delete'
		);

		return { hierarchyDeleteSuccess: true };
	},

	/**
	 * Reparent a node. Re-validates containment against the new parent's
	 * node_type and refuses to create a cycle (new parent cannot be the node
	 * itself or one of its descendants).
	 */
	reparentHierarchyNode: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		const newParentRaw = fd.get('parentId')?.toString() ?? '';
		const newParentId = newParentRaw === '' ? null : newParentRaw;

		if (!nodeId) return fail(400, { error: 'validation.field_required' });

		// Load all nodes once so we can both resolve the child's node_type
		// and walk descendants to guard against cycles.
		const { data: allNodes } = await db
			.from('org_hierarchy_nodes')
			.select('id, parent_id, node_type')
			.eq('organization_id', organization.id);

		const nodes = allNodes ?? [];
		const self = nodes.find((n) => n.id === nodeId);
		if (!self) return fail(404, { error: 'error.generic' });

		let parentType: HierarchyNodeType | null = null;
		if (newParentId) {
			const parent = nodes.find((n) => n.id === newParentId);
			if (!parent) return fail(400, { error: 'hierarchy.parent_not_found' });
			parentType = parent.node_type as HierarchyNodeType;

			// Cycle check — walk parents from newParentId up; if we hit nodeId
			// we'd be creating a cycle.
			let cursor: string | null = newParentId;
			while (cursor) {
				if (cursor === nodeId) {
					return fail(400, { error: 'hierarchy.reparent_cycle' });
				}
				cursor = nodes.find((n) => n.id === cursor)?.parent_id ?? null;
			}
		}

		if (!validateContainment(self.node_type as HierarchyNodeType, parentType)) {
			return fail(400, { error: 'hierarchy.invalid_containment' });
		}

		const previousParentId = self.parent_id;

		const { error: reparentError } = await db
			.from('org_hierarchy_nodes')
			.update({ parent_id: newParentId, updated_at: new Date().toISOString() })
			.eq('id', nodeId)
			.eq('organization_id', organization.id);

		if (reparentError) {
			console.error('reparentHierarchyNode error:', reparentError);
			return fail(500, { error: 'error.generic' });
		}

		await writeHierarchyAudit(
			organization.id,
			nodeId,
			'updated',
			locals.user.id,
			{ parent_id: previousParentId },
			{ parent_id: newParentId },
			'reparent'
		);

		// Return previous parent id so the client can build an inverse
		// reparent command without having to query history.
		return {
			hierarchyReparentSuccess: true,
			previousParentId
		};
	},

	/**
	 * Populate an empty organization from a quick-start template.
	 *
	 * Fails (without writing anything) if the org already has any hierarchy
	 * nodes — template population is a one-time jump-start, not a reset.
	 */
	populateHierarchyTemplate: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const executiveCount = parseInt(fd.get('executiveCount')?.toString() ?? '3', 10);
		if (isNaN(executiveCount) || executiveCount < 3 || executiveCount > 8) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Guard: only allowed for empty orgs.
		const { data: existing } = await db
			.from('org_hierarchy_nodes')
			.select('id')
			.eq('organization_id', organization.id)
			.limit(1);
		if ((existing ?? []).length > 0) {
			return fail(400, { error: 'hierarchy.template_nonempty' });
		}

		const template = getHierarchyTemplate(executiveCount);

		// Walk the template depth-first, inserting each node and recursing
		// into its children with the freshly-created id as the new parent.
		const createdBy = locals.user.id;
		const orgId = organization.id;
		async function createSubtree(
			tpl: HierarchyTemplateNode[],
			parentId: string | null
		): Promise<void> {
			let sort = 0;
			for (const node of tpl) {
				const { data: inserted, error: insertErr } = await db
					.from('org_hierarchy_nodes')
					.insert({
						organization_id: orgId,
						parent_id: parentId,
						node_type: node.nodeType,
						name: node.name,
						title: node.title ?? null,
						sort_order: sort++,
						created_by: createdBy
					})
					.select('id')
					.single();
				if (insertErr || !inserted) {
					throw insertErr ?? new Error('populateHierarchyTemplate insert failed');
				}
				if (node.children?.length) {
					await createSubtree(node.children, inserted.id);
				}
			}
		}

		try {
			await createSubtree(template, null);
		} catch (err) {
			console.error('populateHierarchyTemplate error:', err);
			return fail(500, { error: 'error.generic' });
		}

		return { hierarchyTemplateSuccess: true };
	},

	/**
	 * Dissolve a hierarchy node — remove it while promoting its direct
	 * children to its former parent. Preserves all subtrees below the
	 * promoted children. This is the non-destructive counterpart to
	 * {@link deleteHierarchyNode}, which cascades.
	 *
	 * Guardrails:
	 *   - Cannot dissolve a root node (its children would become roots,
	 *     and only `executive_leader` may sit at root).
	 *   - Every direct child must be a valid child of the new parent per
	 *     CONTAINMENT_RULES. If any isn't, we refuse the entire operation
	 *     so the user never ends up with a partial reorg.
	 *
	 * We do promotion + delete sequentially (no DB tx — supabase-js doesn't
	 * expose one) and delete LAST, so a mid-flight failure leaves the node
	 * intact and the user can retry safely.
	 */
	dissolveHierarchyNode: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		if (!nodeId) return fail(400, { error: 'validation.field_required' });

		const { data: node } = await db
			.from('org_hierarchy_nodes')
			.select('id, parent_id, node_type, organization_id')
			.eq('id', nodeId)
			.eq('organization_id', organization.id)
			.single();
		if (!node) return fail(404, { error: 'error.generic' });

		if (node.parent_id === null) {
			return fail(400, { error: 'hierarchy.dissolve_root_disallowed' });
		}

		const { data: parent } = await db
			.from('org_hierarchy_nodes')
			.select('id, node_type')
			.eq('id', node.parent_id)
			.eq('organization_id', organization.id)
			.single();
		if (!parent) return fail(400, { error: 'hierarchy.parent_not_found' });

		const { data: children } = await db
			.from('org_hierarchy_nodes')
			.select('id, node_type')
			.eq('parent_id', nodeId)
			.eq('organization_id', organization.id);

		const kids = children ?? [];

		for (const c of kids) {
			if (
				!validateContainment(
					c.node_type as HierarchyNodeType,
					parent.node_type as HierarchyNodeType
				)
			) {
				return fail(400, { error: 'hierarchy.dissolve_invalid_child' });
			}
		}

		// Capture the full pre-dissolve shape of the node so the client can
		// build an inverse command (restore node + reparent children back).
		const { data: fullNode } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('id', nodeId)
			.eq('organization_id', organization.id)
			.single();

		for (const c of kids) {
			const { error: moveErr } = await db
				.from('org_hierarchy_nodes')
				.update({ parent_id: parent.id, updated_at: new Date().toISOString() })
				.eq('id', c.id)
				.eq('organization_id', organization.id);
			if (moveErr) {
				console.error('dissolveHierarchyNode promotion error:', moveErr);
				return fail(500, { error: 'error.generic' });
			}
		}

		const { error: deleteErr } = await db
			.from('org_hierarchy_nodes')
			.delete()
			.eq('id', nodeId)
			.eq('organization_id', organization.id);
		if (deleteErr) {
			console.error('dissolveHierarchyNode delete error:', deleteErr);
			return fail(500, { error: 'error.generic' });
		}

		await writeHierarchyAudit(
			organization.id,
			nodeId,
			'deleted',
			locals.user.id,
			{ node: fullNode, promotedChildren: kids.map((c) => c.id) },
			null,
			'dissolve'
		);

		// Return the full pre-state so the undo command can re-create the
		// node and pull its children back under it in one shot.
		return {
			hierarchyDissolveSuccess: true,
			dissolvedNode: fullNode ?? null,
			promotedChildIds: kids.map((c) => c.id)
		};
	},

	/**
	 * Restore a previously dissolved node. Used by the client's undo
	 * command for dissolve: re-creates the node with its original id,
	 * then reparents the specified children back under it.
	 *
	 * Safety:
	 *   - Id must not already exist (otherwise the original dissolve
	 *     was followed by an unrelated create — refuse rather than
	 *     clobber).
	 *   - Containment is re-validated against the target parent (may
	 *     have moved between dissolve and undo).
	 *   - Each child-to-reparent is validated against the restored
	 *     node's type; if any fails, the whole restore is refused.
	 */
	restoreHierarchyNode: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const rawNode = fd.get('node')?.toString();
		const rawChildIds = fd.get('childIds')?.toString() ?? '[]';
		if (!rawNode) return fail(400, { error: 'validation.field_required' });

		let node: {
			id: string;
			parent_id: string | null;
			node_type: HierarchyNodeType;
			name: string;
			title: string | null;
			description: string | null;
			user_id: string | null;
			position_x: number;
			position_y: number;
			sort_order: number;
		};
		let childIds: string[];
		try {
			node = JSON.parse(rawNode);
			childIds = JSON.parse(rawChildIds);
		} catch {
			return fail(400, { error: 'validation.field_required' });
		}

		if (!node?.id || !node?.node_type || !node?.name) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Don't clobber an existing row.
		const { data: existing } = await db
			.from('org_hierarchy_nodes')
			.select('id')
			.eq('id', node.id)
			.eq('organization_id', organization.id)
			.maybeSingle();
		if (existing) return fail(400, { error: 'hierarchy.restore_id_exists' });

		// Parent containment re-validation.
		let parentType: HierarchyNodeType | null = null;
		if (node.parent_id) {
			const { data: parent } = await db
				.from('org_hierarchy_nodes')
				.select('node_type, organization_id')
				.eq('id', node.parent_id)
				.eq('organization_id', organization.id)
				.maybeSingle();
			if (!parent) return fail(400, { error: 'hierarchy.parent_not_found' });
			parentType = parent.node_type as HierarchyNodeType;
		}
		if (!validateContainment(node.node_type, parentType)) {
			return fail(400, { error: 'hierarchy.invalid_containment' });
		}

		// Children-to-reparent must still be valid under this node's type.
		if (childIds.length > 0) {
			const { data: childRows } = await db
				.from('org_hierarchy_nodes')
				.select('id, node_type')
				.in('id', childIds)
				.eq('organization_id', organization.id);
			for (const c of childRows ?? []) {
				if (!validateContainment(c.node_type as HierarchyNodeType, node.node_type)) {
					return fail(400, { error: 'hierarchy.invalid_containment' });
				}
			}
		}

		// Re-insert with the original id preserved so any remaining
		// references still resolve.
		const { error: insertErr } = await db.from('org_hierarchy_nodes').insert({
			id: node.id,
			organization_id: organization.id,
			parent_id: node.parent_id,
			node_type: node.node_type,
			name: node.name,
			title: node.title,
			description: node.description,
			user_id: node.user_id,
			position_x: node.position_x ?? 0,
			position_y: node.position_y ?? 0,
			sort_order: node.sort_order ?? 0,
			created_by: locals.user.id
		});
		if (insertErr) {
			console.error('restoreHierarchyNode insert error:', insertErr);
			return fail(500, { error: 'error.generic' });
		}

		// Pull the specified children back under the restored node.
		if (childIds.length > 0) {
			const { error: reparentErr } = await db
				.from('org_hierarchy_nodes')
				.update({ parent_id: node.id, updated_at: new Date().toISOString() })
				.in('id', childIds)
				.eq('organization_id', organization.id);
			if (reparentErr) {
				console.error('restoreHierarchyNode child-reparent error:', reparentErr);
				return fail(500, { error: 'error.generic' });
			}
		}

		await writeHierarchyAudit(
			organization.id,
			node.id,
			'created',
			locals.user.id,
			null,
			node,
			'restore'
		);

		return { hierarchyRestoreSuccess: true };
	},

	/**
	 * Bulk-create hierarchy nodes from CSV import.
	 *
	 * Accepts a JSON payload of rows with name, nodeType, parentName,
	 * title, and description. Rows are processed sequentially because
	 * later rows may reference earlier rows as parents. Each row is
	 * validated for containment before insert.
	 *
	 * Max 500 rows per request. Partial success is reported back.
	 */
	bulkCreateHierarchyNodes: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const m = memberships?.[0];
		if (!m?.organizations) return fail(403, { error: 'error.generic' });
		const organization = m.organizations;
		const r = m.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const fd = await request.formData();
		const payloadRaw = fd.get('payload')?.toString();
		if (!payloadRaw) return fail(400, { error: 'validation.field_required' });

		let rows: Array<{
			name: string;
			title: string | null;
			nodeType: string;
			parentName: string | null;
			description: string | null;
		}>;
		try {
			rows = JSON.parse(payloadRaw);
		} catch {
			return fail(400, { error: 'error.generic' });
		}

		if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
			return fail(400, { error: 'hierarchy.bulk.error_too_many' });
		}

		const validTypes = ['executive_leader', 'department', 'team', 'individual'];

		const { data: existingNodes } = await db
			.from('org_hierarchy_nodes')
			.select('id, name, node_type')
			.eq('organization_id', organization.id);

		const nameMap = new Map<string, { id: string; nodeType: HierarchyNodeType }>();
		for (const n of existingNodes ?? []) {
			nameMap.set(n.name.toLowerCase().trim(), {
				id: n.id,
				nodeType: n.node_type as HierarchyNodeType
			});
		}

		let successCount = 0;
		let failureCount = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];

			if (!row.name || !row.nodeType || !validTypes.includes(row.nodeType)) {
				failureCount++;
				continue;
			}

			let parentId: string | null = null;
			if (row.parentName) {
				const parent = nameMap.get(row.parentName.toLowerCase().trim());
				if (!parent) {
					failureCount++;
					continue;
				}
				if (!validateContainment(row.nodeType as HierarchyNodeType, parent.nodeType)) {
					failureCount++;
					continue;
				}
				parentId = parent.id;
			} else if (row.nodeType !== 'executive_leader') {
				failureCount++;
				continue;
			}

			let siblingQuery = db
				.from('org_hierarchy_nodes')
				.select('sort_order')
				.eq('organization_id', organization.id);
			siblingQuery = parentId
				? siblingQuery.eq('parent_id', parentId)
				: siblingQuery.is('parent_id', null);
			const { data: siblings } = await siblingQuery;

			const nextSort =
				((siblings ?? []).reduce(
					(max: number, s: { sort_order: number | null }) => Math.max(max, s.sort_order ?? 0),
					-1
				) as number) + 1;

			const { data: inserted, error: insertError } = await db
				.from('org_hierarchy_nodes')
				.insert({
					organization_id: organization.id,
					parent_id: parentId,
					node_type: row.nodeType as HierarchyNodeType,
					name: row.name.trim(),
					title: row.title?.trim() || null,
					description: row.description?.trim() || null,
					sort_order: nextSort,
					created_by: locals.user.id
				})
				.select('id, node_type, name')
				.single();

			if (insertError || !inserted) {
				failureCount++;
				continue;
			}

			nameMap.set(inserted.name.toLowerCase().trim(), {
				id: inserted.id,
				nodeType: inserted.node_type as HierarchyNodeType
			});

			await writeHierarchyAudit(
				organization.id,
				inserted.id,
				'created',
				locals.user.id,
				null,
				inserted,
				'bulk_upload'
			);
			successCount++;
		}

		return { bulkUploadSuccess: true, successCount, failureCount };
	}
};
;null as any as Actions;