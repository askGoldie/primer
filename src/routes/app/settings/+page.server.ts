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
import { sql, maybeOne, many, one } from '$lib/server/db.js';

/**
 * Lookup the caller's active membership and its organization in one round-trip.
 * Returns null when the user has no membership or the org row is missing.
 */
async function loadCallerMembership(userId: string): Promise<{
	role: string;
	organization: { id: string; name: string; cycle_cadence: string | null };
} | null> {
	const row = await maybeOne<{
		role: string;
		org_id: string;
		org_name: string;
		org_cycle_cadence: string | null;
	}>(sql`
		select
			m.role,
			o.id              as org_id,
			o.name            as org_name,
			o.cycle_cadence   as org_cycle_cadence
		from org_members m
		join organizations o on o.id = m.organization_id
		where m.user_id = ${userId}
		  and m.removed_at is null
		limit 1
	`);
	if (!row) return null;
	return {
		role: row.role,
		organization: {
			id: row.org_id,
			name: row.org_name,
			cycle_cadence: row.org_cycle_cadence
		}
	};
}

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
		await sql`
			insert into audit_log (
				organization_id, entity_type, entity_id, action, changed_by,
				previous_value, new_value, context
			) values (
				${orgId}, 'node', ${entityId}, ${action}, ${userId},
				${prev === null ? null : sql.json(prev as never)},
				${next === null ? null : sql.json(next as never)},
				${context}
			)
		`;
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

export const load: PageServerLoad = async ({ parent }) => {
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
		const memberRows = await many<{
			id: string;
			user_id: string;
			role: string;
			user_name: string | null;
			user_email: string | null;
		}>(sql`
			select
				m.id, m.user_id, m.role,
				u.name  as user_name,
				u.email as user_email
			from org_members m
			left join users u on u.id = m.user_id
			where m.organization_id = ${organization.id}
			  and m.removed_at is null
			order by m.assigned_at asc
		`);

		members = memberRows.map((m) => ({
			id: m.id,
			userId: m.user_id,
			userName: m.user_name ?? '',
			userEmail: m.user_email ?? '',
			role: m.role
		}));
	}

	// ── Visibility / access control ─────────────────────────────────────────
	// Shown on the Organization tab (was its own tab previously). Admin-only.
	let peerVisibilitySetting: 'score_only' | 'metrics' | 'full' = 'score_only';
	let grants: VisibilityGrant[] = [];
	let allNodesList: { id: string; name: string; title: string | null }[] = [];
	let hasNode = false;

	if (showVisibility) {
		// Fetch all nodes in org (for dropdowns and grant lookups)
		const allNodes = await many<{
			id: string;
			name: string;
			title: string | null;
			peer_visibility: string;
		}>(sql`
			select id, name, title, peer_visibility
			from org_hierarchy_nodes
			where organization_id = ${organization.id}
		`);

		// Current node's peer_visibility setting (only if user has a node)
		if (userNode) {
			hasNode = true;
			const currentNodeRecord = allNodes.find((n) => n.id === userNode.id);
			peerVisibilitySetting =
				(currentNodeRecord?.peer_visibility as 'score_only' | 'metrics' | 'full') ?? 'score_only';
		}

		// Active visibility grants — scope depends on whether the caller has a node
		interface GrantRow {
			id: string;
			grantee_node_id: string;
			scope_node_id: string | null;
			visibility: string;
			created_at: string;
		}
		let grantsRaw: GrantRow[] = [];
		if (userNode) {
			const userNodeRow = await maybeOne<{ user_id: string | null }>(sql`
				select user_id from org_hierarchy_nodes where id = ${userNode.id}
			`);
			const grantedById = userNodeRow?.user_id ?? '';
			grantsRaw = await many<GrantRow>(sql`
				select id, grantee_node_id, scope_node_id, visibility, created_at
				from visibility_grants
				where organization_id = ${organization.id}
				  and granted_by = ${grantedById}
				  and revoked_at is null
			`);
		} else {
			grantsRaw = await many<GrantRow>(sql`
				select id, grantee_node_id, scope_node_id, visibility, created_at
				from visibility_grants
				where organization_id = ${organization.id}
				  and revoked_at is null
			`);
		}

		grants = grantsRaw.map((g) => {
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
		const hNodes = await many<{
			id: string;
			parent_id: string | null;
			node_type: 'executive_leader' | 'department' | 'team' | 'individual';
			name: string;
			title: string | null;
			description: string | null;
			sort_order: number | null;
			user_id: string | null;
			user_name: string | null;
		}>(sql`
			select
				n.id, n.parent_id, n.node_type, n.name, n.title, n.description,
				n.sort_order, n.user_id,
				u.name as user_name
			from org_hierarchy_nodes n
			left join users u on u.id = n.user_id
			where n.organization_id = ${organization.id}
			order by n.sort_order asc
		`);

		hierarchyNodes = hNodes.map((n) => ({
			id: n.id,
			parentId: n.parent_id,
			nodeType: n.node_type,
			name: n.name,
			title: n.title,
			description: n.description,
			sortOrder: n.sort_order ?? 0,
			userId: n.user_id,
			userName: n.user_name ?? null
		}));

		// Active org members — used by the user-assignment dropdown on the
		// create/edit form. Offboarded members (removed_at IS NOT NULL) are
		// excluded because assigning them makes no sense.
		const assignRows = await many<{
			user_id: string;
			user_name: string | null;
			user_email: string | null;
		}>(sql`
			select
				m.user_id,
				u.name  as user_name,
				u.email as user_email
			from org_members m
			left join users u on u.id = m.user_id
			where m.organization_id = ${organization.id}
			  and m.removed_at is null
		`);

		assignableMembers = assignRows
			.map((r) => ({
				userId: r.user_id,
				name: r.user_name ?? '',
				email: r.user_email ?? ''
			}))
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
		const allNodes = await many<{
			id: string;
			name: string;
			title: string | null;
			node_type: string;
			parent_id: string | null;
			user_name: string | null;
			user_email: string | null;
		}>(sql`
			select
				n.id, n.name, n.title, n.node_type, n.parent_id,
				u.name  as user_name,
				u.email as user_email
			from org_hierarchy_nodes n
			left join users u on u.id = n.user_id
			where n.organization_id = ${organization.id}
			order by n.sort_order asc
		`);

		// For each node, get latest snapshot + metric counts + lock state.
		// This is N+1 on purpose — the admin surface gets rare traffic and
		// the per-node detail is the whole point of the view.
		auditNodes = await Promise.all(
			allNodes.map(async (node) => {
				const latestSnapshot = await maybeOne<{
					id: string;
					composite_score: number;
					composite_tier: string;
					cycle_label: string | null;
					created_at: string;
				}>(sql`
					select id, composite_score, composite_tier, cycle_label, created_at
					from score_snapshots
					where node_id = ${node.id}
					order by created_at desc
					limit 1
				`);

				const metricCountRow = await one<{ count: string }>(sql`
					select count(*)::text as count from metrics where node_id = ${node.id}
				`);
				const lockedCountRow = await one<{ count: string }>(sql`
					select count(*)::text as count from metrics
					where node_id = ${node.id} and locked_by_snapshot_id is not null
				`);
				const pendingCountRow = await one<{ count: string }>(sql`
					select count(*)::text as count from metrics
					where node_id = ${node.id}
					  and submitted_at is not null
					  and approved_at is null
				`);
				const perfLogCountRow = await one<{ count: string }>(sql`
					select count(*)::text as count from performance_logs where node_id = ${node.id}
				`);

				const metricCount = Number(metricCountRow.count);
				const lockedCount = Number(lockedCountRow.count);
				const pendingCount = Number(pendingCountRow.count);
				const perfLogCount = Number(perfLogCountRow.count);

				return {
					id: node.id,
					name: node.name,
					title: node.title,
					nodeType: node.node_type,
					parentId: node.parent_id,
					userName: node.user_name ?? null,
					userEmail: node.user_email ?? null,
					latestSnapshot: latestSnapshot
						? {
								id: latestSnapshot.id,
								score: latestSnapshot.composite_score,
								tier: latestSnapshot.composite_tier as TierLevel,
								cycleLabel: latestSnapshot.cycle_label,
								createdAt: latestSnapshot.created_at
							}
						: null,
					metricCount,
					lockedCount,
					pendingCount,
					perfLogCount,
					isLocked: lockedCount > 0
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
			const placements = await many<{
				id: string;
				user_id: string;
				user_name: string | null;
				user_email: string | null;
				requested_at: string;
			}>(sql`
				select
					p.id, p.user_id, p.requested_at,
					u.name  as user_name,
					u.email as user_email
				from placement_requests p
				left join users u on u.id = p.user_id
				where p.organization_id = ${organization.id}
				  and p.resolved_at is null
				order by p.requested_at desc
			`);

			pendingPlacements = placements.map((p) => ({
				id: p.id,
				userId: p.user_id,
				userName: p.user_name ?? null,
				userEmail: p.user_email ?? null,
				requestedAt: p.requested_at
			}));
		}

		// ── Department overview (system_admin / owner only) ─────────────────
		if (isSystemAdmin) {
			const rootNodes = allNodes.filter((n) => n.parent_id === null);
			const topLevelDepts =
				rootNodes.length > 0
					? allNodes.filter((n) => rootNodes.some((r) => r.id === n.parent_id))
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

export const actions: Actions = {
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
	updateOrg: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		if (!canManageOrgSettings(ctx.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const inquiryEnabled = formData.get('inquiryEnabled') === 'on';

		if (!name) {
			return fail(400, { error: 'validation.field_required' });
		}

		await sql`
			update organizations
			set name = ${name},
			    inquiry_enabled = ${inquiryEnabled},
			    updated_at = now()
			where id = ${ctx.organization.id}
		`;

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
	updateCycleCadence: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		if (!canManageOrgSettings(ctx.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const cycleCadence = formData.get('cycleCadence')?.toString() as 'monthly' | 'quarterly';

		if (cycleCadence !== 'monthly' && cycleCadence !== 'quarterly') {
			return fail(400, { error: 'validation.field_required' });
		}

		await sql`
			update organizations
			set cycle_cadence = ${cycleCadence}, updated_at = now()
			where id = ${ctx.organization.id}
		`;

		return { cadenceSuccess: true };
	},

	/**
	 * Update a member's role. Owner only; owners can't change their own role.
	 */
	updateRole: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const callerMembership = await maybeOne<{ role: string; organization_id: string }>(sql`
			select role, organization_id from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);

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

		const targetMember = await maybeOne<{ user_id: string; role: string }>(sql`
			select user_id, role from org_members
			where id = ${membershipId} and organization_id = ${callerMembership.organization_id}
		`);

		if (!targetMember) {
			return fail(404, { error: 'error.generic' });
		}

		if (targetMember.user_id === locals.user.id) {
			return fail(400, { error: 'settings.cannot_change_own_role' });
		}

		await sql`update org_members set role = ${newRole} where id = ${membershipId}`;

		return { roleSuccess: true };
	},

	/**
	 * Update the current node's peer_visibility setting.
	 * (Unchanged from old settings page. Lives under Organization tab now.)
	 */
	updatePeerVisibility: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const peerVisibility = formData.get('peerVisibility')?.toString() as
			| 'score_only'
			| 'metrics'
			| 'full';

		if (!peerVisibility || !['score_only', 'metrics', 'full'].includes(peerVisibility)) {
			return fail(400, { error: 'validation.field_required' });
		}

		const membershipData = await maybeOne<{ organization_id: string; role: string }>(sql`
			select organization_id, role from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);
		if (!membershipData || !canManageVisibility(membershipData.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const orgId = membershipData.organization_id;
		if (!orgId) return fail(403, { error: 'error.generic' });

		const ownNode = await maybeOne<{ id: string }>(sql`
			select id from org_hierarchy_nodes
			where organization_id = ${orgId} and user_id = ${locals.user.id}
		`);

		if (!ownNode) return fail(403, { error: 'error.generic' });

		try {
			await sql`
				update org_hierarchy_nodes set peer_visibility = ${peerVisibility} where id = ${ownNode.id}
			`;
		} catch (err) {
			console.error('updatePeerVisibility error:', err);
			return fail(500, { error: 'error.generic' });
		}

		return { peerVisibilitySuccess: true };
	},

	/**
	 * Grant elevated visibility to a specific person.
	 * (Unchanged from old settings page. Lives under Organization tab now.)
	 */
	createGrant: async ({ request, locals }) => {
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

		const membershipData = await maybeOne<{ organization_id: string; role: string }>(sql`
			select organization_id, role from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);
		if (!membershipData || !canManageVisibility(membershipData.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		try {
			await sql`
				insert into visibility_grants (
					organization_id, grantee_node_id, scope_node_id, visibility, granted_by
				) values (
					${membershipData.organization_id}, ${granteeNodeId}, ${scopeNodeId},
					${visibility}, ${locals.user.id}
				)
			`;
		} catch (err) {
			console.error('createGrant error:', err);
			return fail(500, { error: 'error.generic' });
		}

		return { grantSuccess: true };
	},

	/**
	 * Revoke an existing visibility grant.
	 * (Unchanged from old settings page. Lives under Organization tab now.)
	 */
	revokeGrant: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const formData = await request.formData();
		const grantId = formData.get('grantId')?.toString();

		if (!grantId) return fail(400, { error: 'validation.field_required' });

		const mem = await maybeOne<{ role: string; organization_id: string }>(sql`
			select role, organization_id from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);

		try {
			if (mem?.role === 'system_admin' || mem?.role === 'owner') {
				await sql`
					update visibility_grants
					set revoked_at = now()
					where id = ${grantId} and organization_id = ${mem.organization_id}
				`;
			} else {
				await sql`
					update visibility_grants
					set revoked_at = now()
					where id = ${grantId} and granted_by = ${locals.user.id}
				`;
			}
		} catch (err) {
			console.error('revokeGrant error:', err);
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
	resolvePlacement: async ({ request, locals }) => {
		if (!locals.user) return fail(403);

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		if (!canManageMembers(ctx.role as OrgRole)) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const placementId = formData.get('placementId')?.toString();
		if (!placementId) return fail(400, { error: 'validation.field_required' });

		await sql`
			update placement_requests
			set resolved_at = now(), resolved_by = ${locals.user.id}
			where id = ${placementId} and organization_id = ${ctx.organization.id}
		`;

		return { resolvePlacementSuccess: true };
	},

	/**
	 * Bulk snapshot capture across many nodes.
	 *
	 * Ported verbatim from the old /app/admin page. Owner / system_admin only.
	 */
	bulkSnapshot: async ({ request, locals }) => {
		if (!locals.user) return fail(403);

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		if (ctx.role !== 'owner' && ctx.role !== 'system_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const cycleLabel = formData.get('cycleLabel')?.toString().trim();
		const notes = formData.get('notes')?.toString().trim() || null;
		const scope = formData.get('scope')?.toString(); // 'all' or comma-separated IDs

		if (!cycleLabel) return fail(400, { error: 'validation.field_required' });

		let targetNodeIds: string[];
		if (scope === 'all') {
			const allNodes = await many<{ id: string }>(sql`
				select id from org_hierarchy_nodes where organization_id = ${ctx.organization.id}
			`);
			targetNodeIds = allNodes.map((n) => n.id);
		} else {
			targetNodeIds = (scope ?? '').split(',').filter(Boolean);
		}

		let captured = 0;
		let skipped = 0;

		for (const nodeId of targetNodeIds) {
			const nodeMetrics = await many<{
				id: string;
				name: string;
				measurement_type: string;
				origin: string;
				current_value: string | number | null;
				current_tier: string | null;
				weight: number | null;
			}>(sql`
				select id, name, measurement_type, origin, current_value, current_tier, weight
				from metrics
				where node_id = ${nodeId}
			`);

			const scoreable = nodeMetrics.filter((m) => m.current_tier && m.weight);

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
					currentValue: m.current_value as string | number | null,
					currentTier: m.current_tier as TierLevel,
					weight: m.weight as number
				}))
			);

			const snapshot = await one<{ id: string }>(sql`
				insert into score_snapshots (
					organization_id, node_id, composite_score, composite_tier,
					metric_details, cycle_label, notes, recorded_by
				) values (
					${ctx.organization.id}, ${nodeId}, ${compositeScore}, ${compositeTier},
					${sql.json(metricDetails as never)}, ${cycleLabel}, ${notes}, ${locals.user.id}
				)
				returning id
			`);

			await sql`
				update metrics
				set locked_by_snapshot_id = ${snapshot.id}, updated_at = now()
				where node_id = ${nodeId}
			`;

			captured++;
		}

		return { bulkSnapshotSuccess: true, captured, skipped };
	},

	/**
	 * Bulk unlock — starts a new cycle for multiple nodes.
	 *
	 * Ported verbatim from the old /app/admin page. Owner / system_admin only.
	 */
	bulkUnlock: async ({ request, locals }) => {
		if (!locals.user) return fail(403);

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		if (ctx.role !== 'owner' && ctx.role !== 'system_admin') {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const scope = formData.get('scope')?.toString();

		let targetNodeIds: string[];
		if (scope === 'all') {
			const allNodes = await many<{ id: string }>(sql`
				select id from org_hierarchy_nodes where organization_id = ${ctx.organization.id}
			`);
			targetNodeIds = allNodes.map((n) => n.id);
		} else {
			targetNodeIds = (scope ?? '').split(',').filter(Boolean);
		}

		for (const nodeId of targetNodeIds) {
			await sql`
				update metrics
				set locked_by_snapshot_id = null,
				    submitted_at = null,
				    submitted_by = null,
				    approved_at = null,
				    approved_by = null,
				    updated_at = now()
				where node_id = ${nodeId}
			`;
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
	createHierarchyNode: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

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
			const parent = await maybeOne<{ node_type: string; organization_id: string }>(sql`
				select node_type, organization_id from org_hierarchy_nodes where id = ${parentId}
			`);
			if (!parent || parent.organization_id !== organization.id) {
				return fail(400, { error: 'hierarchy.parent_not_found' });
			}
			parentType = parent.node_type as HierarchyNodeType;
		}
		if (!validateContainment(nodeType, parentType)) {
			return fail(400, { error: 'hierarchy.invalid_containment' });
		}

		// Next sort_order among siblings.
		const siblings = parentId
			? await many<{ sort_order: number | null }>(sql`
					select sort_order from org_hierarchy_nodes
					where organization_id = ${organization.id} and parent_id = ${parentId}
				`)
			: await many<{ sort_order: number | null }>(sql`
					select sort_order from org_hierarchy_nodes
					where organization_id = ${organization.id} and parent_id is null
				`);
		const nextSort = siblings.reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) + 1;

		let inserted: Record<string, unknown>;
		try {
			inserted = await one<Record<string, unknown>>(sql`
				insert into org_hierarchy_nodes (
					organization_id, parent_id, node_type, name, title, description,
					user_id, sort_order, created_by
				) values (
					${organization.id}, ${parentId}, ${nodeType}, ${name}, ${title}, ${description},
					${userId}, ${nextSort}, ${locals.user.id}
				)
				returning *
			`);
		} catch (err) {
			console.error('createHierarchyNode error:', err);
			return fail(500, { error: 'error.generic' });
		}

		const insertedId = inserted.id as string;
		await writeHierarchyAudit(
			organization.id,
			insertedId,
			'created',
			locals.user.id,
			null,
			inserted,
			'create'
		);

		// Return the new id so the client can build an inverse-delete command
		// for undo/redo without having to diff the pre/post node list.
		return { hierarchyCreateSuccess: true, nodeId: insertedId };
	},

	/**
	 * Update non-structural fields on an existing node.
	 * Reparenting is handled by {@link reparentHierarchyNode} so that path
	 * gets its own containment check.
	 */
	updateHierarchyNode: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

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
		const prev = await maybeOne<Record<string, unknown>>(sql`
			select * from org_hierarchy_nodes
			where id = ${nodeId} and organization_id = ${organization.id}
		`);

		let updated: Record<string, unknown> | null;
		try {
			updated = await maybeOne<Record<string, unknown>>(sql`
				update org_hierarchy_nodes
				set name = ${name},
				    title = ${title},
				    description = ${description},
				    user_id = ${userId},
				    updated_at = now()
				where id = ${nodeId} and organization_id = ${organization.id}
				returning *
			`);
		} catch (err) {
			console.error('updateHierarchyNode error:', err);
			return fail(500, { error: 'error.generic' });
		}

		if (!updated) return fail(500, { error: 'error.generic' });

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
	deleteHierarchyNode: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		if (!nodeId) return fail(400, { error: 'validation.field_required' });

		// Snapshot for audit — delete is intentionally NOT reversible in
		// the UI's undo stack, but audit still wants the pre-state on record
		// for compliance and for the "restore from trash" feature we may
		// add later (see Tier 2 soft-delete migration in the follow-up plan).
		const prev = await maybeOne<Record<string, unknown>>(sql`
			select * from org_hierarchy_nodes
			where id = ${nodeId} and organization_id = ${organization.id}
		`);

		try {
			await sql`
				delete from org_hierarchy_nodes
				where id = ${nodeId} and organization_id = ${organization.id}
			`;
		} catch (err) {
			console.error('deleteHierarchyNode error:', err);
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
	reparentHierarchyNode: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		const newParentRaw = fd.get('parentId')?.toString() ?? '';
		const newParentId = newParentRaw === '' ? null : newParentRaw;

		if (!nodeId) return fail(400, { error: 'validation.field_required' });

		// Load all nodes once so we can both resolve the child's node_type
		// and walk descendants to guard against cycles.
		const nodes = await many<{ id: string; parent_id: string | null; node_type: string }>(sql`
			select id, parent_id, node_type
			from org_hierarchy_nodes
			where organization_id = ${organization.id}
		`);

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

		try {
			await sql`
				update org_hierarchy_nodes
				set parent_id = ${newParentId}, updated_at = now()
				where id = ${nodeId} and organization_id = ${organization.id}
			`;
		} catch (err) {
			console.error('reparentHierarchyNode error:', err);
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
	populateHierarchyTemplate: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

		const fd = await request.formData();
		const executiveCount = parseInt(fd.get('executiveCount')?.toString() ?? '3', 10);
		if (isNaN(executiveCount) || executiveCount < 3 || executiveCount > 8) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Guard: only allowed for empty orgs.
		const existing = await maybeOne<{ id: string }>(sql`
			select id from org_hierarchy_nodes where organization_id = ${organization.id} limit 1
		`);
		if (existing) {
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
				const titleOrNull = node.title ?? null;
				const sortOrder = sort++;
				const inserted = await one<{ id: string }>(sql`
					insert into org_hierarchy_nodes (
						organization_id, parent_id, node_type, name, title, sort_order, created_by
					) values (
						${orgId}, ${parentId}, ${node.nodeType}, ${node.name}, ${titleOrNull},
						${sortOrder}, ${createdBy}
					)
					returning id
				`);
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
	dissolveHierarchyNode: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

		const fd = await request.formData();
		const nodeId = fd.get('nodeId')?.toString();
		if (!nodeId) return fail(400, { error: 'validation.field_required' });

		const node = await maybeOne<{
			id: string;
			parent_id: string | null;
			node_type: string;
			organization_id: string;
		}>(sql`
			select id, parent_id, node_type, organization_id
			from org_hierarchy_nodes
			where id = ${nodeId} and organization_id = ${organization.id}
		`);
		if (!node) return fail(404, { error: 'error.generic' });

		if (node.parent_id === null) {
			return fail(400, { error: 'hierarchy.dissolve_root_disallowed' });
		}

		const parent = await maybeOne<{ id: string; node_type: string }>(sql`
			select id, node_type from org_hierarchy_nodes
			where id = ${node.parent_id} and organization_id = ${organization.id}
		`);
		if (!parent) return fail(400, { error: 'hierarchy.parent_not_found' });

		const kids = await many<{ id: string; node_type: string }>(sql`
			select id, node_type from org_hierarchy_nodes
			where parent_id = ${nodeId} and organization_id = ${organization.id}
		`);

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
		const fullNode = await maybeOne<Record<string, unknown>>(sql`
			select * from org_hierarchy_nodes
			where id = ${nodeId} and organization_id = ${organization.id}
		`);

		for (const c of kids) {
			try {
				await sql`
					update org_hierarchy_nodes
					set parent_id = ${parent.id}, updated_at = now()
					where id = ${c.id} and organization_id = ${organization.id}
				`;
			} catch (err) {
				console.error('dissolveHierarchyNode promotion error:', err);
				return fail(500, { error: 'error.generic' });
			}
		}

		try {
			await sql`
				delete from org_hierarchy_nodes
				where id = ${nodeId} and organization_id = ${organization.id}
			`;
		} catch (err) {
			console.error('dissolveHierarchyNode delete error:', err);
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
	restoreHierarchyNode: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

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
		const existing = await maybeOne<{ id: string }>(sql`
			select id from org_hierarchy_nodes
			where id = ${node.id} and organization_id = ${organization.id}
		`);
		if (existing) return fail(400, { error: 'hierarchy.restore_id_exists' });

		// Parent containment re-validation.
		let parentType: HierarchyNodeType | null = null;
		if (node.parent_id) {
			const parent = await maybeOne<{ node_type: string }>(sql`
				select node_type from org_hierarchy_nodes
				where id = ${node.parent_id} and organization_id = ${organization.id}
			`);
			if (!parent) return fail(400, { error: 'hierarchy.parent_not_found' });
			parentType = parent.node_type as HierarchyNodeType;
		}
		if (!validateContainment(node.node_type, parentType)) {
			return fail(400, { error: 'hierarchy.invalid_containment' });
		}

		// Children-to-reparent must still be valid under this node's type.
		if (childIds.length > 0) {
			const childRows = await many<{ id: string; node_type: string }>(sql`
				select id, node_type from org_hierarchy_nodes
				where id in ${sql(childIds)} and organization_id = ${organization.id}
			`);
			for (const c of childRows) {
				if (!validateContainment(c.node_type as HierarchyNodeType, node.node_type)) {
					return fail(400, { error: 'hierarchy.invalid_containment' });
				}
			}
		}

		// Re-insert with the original id preserved so any remaining
		// references still resolve.
		const positionX = node.position_x ?? 0;
		const positionY = node.position_y ?? 0;
		const sortOrder = node.sort_order ?? 0;
		try {
			await sql`
				insert into org_hierarchy_nodes (
					id, organization_id, parent_id, node_type, name, title, description,
					user_id, position_x, position_y, sort_order, created_by
				) values (
					${node.id}, ${organization.id}, ${node.parent_id}, ${node.node_type},
					${node.name}, ${node.title}, ${node.description}, ${node.user_id},
					${positionX}, ${positionY}, ${sortOrder}, ${locals.user.id}
				)
			`;
		} catch (err) {
			console.error('restoreHierarchyNode insert error:', err);
			return fail(500, { error: 'error.generic' });
		}

		// Pull the specified children back under the restored node.
		if (childIds.length > 0) {
			try {
				await sql`
					update org_hierarchy_nodes
					set parent_id = ${node.id}, updated_at = now()
					where id in ${sql(childIds)} and organization_id = ${organization.id}
				`;
			} catch (err) {
				console.error('restoreHierarchyNode child-reparent error:', err);
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
	bulkCreateHierarchyNodes: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { error: 'error.generic' });

		const ctx = await loadCallerMembership(locals.user.id);
		if (!ctx) return fail(403, { error: 'error.generic' });
		const r = ctx.role as OrgRole;
		if (r !== 'owner' && r !== 'system_admin' && r !== 'hr_admin') {
			return fail(403, { error: 'error.generic' });
		}
		const organization = ctx.organization;

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

		const existingNodes = await many<{ id: string; name: string; node_type: string }>(sql`
			select id, name, node_type from org_hierarchy_nodes
			where organization_id = ${organization.id}
		`);

		const nameMap = new Map<string, { id: string; nodeType: HierarchyNodeType }>();
		for (const n of existingNodes) {
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

			const siblings = parentId
				? await many<{ sort_order: number | null }>(sql`
						select sort_order from org_hierarchy_nodes
						where organization_id = ${organization.id} and parent_id = ${parentId}
					`)
				: await many<{ sort_order: number | null }>(sql`
						select sort_order from org_hierarchy_nodes
						where organization_id = ${organization.id} and parent_id is null
					`);

			const nextSort =
				siblings.reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) + 1;

			const trimmedName = row.name.trim();
			const titleOrNull = row.title?.trim() || null;
			const descriptionOrNull = row.description?.trim() || null;

			let inserted: { id: string; node_type: string; name: string };
			try {
				inserted = await one<{ id: string; node_type: string; name: string }>(sql`
					insert into org_hierarchy_nodes (
						organization_id, parent_id, node_type, name, title, description,
						sort_order, created_by
					) values (
						${organization.id}, ${parentId}, ${row.nodeType}, ${trimmedName},
						${titleOrNull}, ${descriptionOrNull}, ${nextSort}, ${locals.user.id}
					)
					returning id, node_type, name
				`);
			} catch {
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
