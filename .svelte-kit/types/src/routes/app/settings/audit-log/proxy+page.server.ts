// @ts-nocheck
/**
 * Audit Log Viewer Page Server
 *
 * Paginated view of the audit_log table with filters for
 * entity_type, action, changed_by (user), and date range.
 *
 * Access: owner, system_admin, hr_admin
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { sql, many, maybeOne } from '$lib/server/db.js';
import { canExportComplianceReports } from '$lib/server/permissions.js';
import type { OrgRole } from '$lib/types/database.js';

const PAGE_SIZE = 50;

interface AuditRow {
	id: string;
	entity_type: string;
	entity_id: string;
	action: string;
	changed_by: string;
	user_name: string | null;
	user_email: string | null;
	previous_value: Record<string, unknown> | null;
	new_value: Record<string, unknown> | null;
	context: string | null;
	created_at: string;
}

export const load = async ({ parent, url }: Parameters<PageServerLoad>[0]) => {
	const { organization, membership } = await parent();

	const role = membership.role as OrgRole;

	if (!canExportComplianceReports(role)) {
		redirect(302, '/app');
	}

	const entityType = url.searchParams.get('entity_type');
	const action = url.searchParams.get('action');
	const changedBy = url.searchParams.get('changed_by');
	const dateFrom = url.searchParams.get('date_from');
	const dateTo = url.searchParams.get('date_to');
	const dateToInclusive = dateTo ? `${dateTo}T23:59:59.999Z` : null;
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const offset = (page - 1) * PAGE_SIZE;

	const entries = await many<AuditRow>(sql`
		select
			a.id,
			a.entity_type,
			a.entity_id,
			a.action,
			a.changed_by,
			u.name as user_name,
			u.email as user_email,
			a.previous_value,
			a.new_value,
			a.context,
			a.created_at
		from audit_log a
		left join users u on u.id = a.changed_by
		where a.organization_id = ${organization.id}
			${entityType ? sql`and a.entity_type = ${entityType}` : sql``}
			${action ? sql`and a.action = ${action}` : sql``}
			${changedBy ? sql`and a.changed_by = ${changedBy}` : sql``}
			${dateFrom ? sql`and a.created_at >= ${dateFrom}` : sql``}
			${dateToInclusive ? sql`and a.created_at <= ${dateToInclusive}` : sql``}
		order by a.created_at desc
		limit ${PAGE_SIZE}
		offset ${offset}
	`);

	const countRow = await maybeOne<{ count: string }>(sql`
		select count(*)::text as count
		from audit_log a
		where a.organization_id = ${organization.id}
			${entityType ? sql`and a.entity_type = ${entityType}` : sql``}
			${action ? sql`and a.action = ${action}` : sql``}
			${changedBy ? sql`and a.changed_by = ${changedBy}` : sql``}
			${dateFrom ? sql`and a.created_at >= ${dateFrom}` : sql``}
			${dateToInclusive ? sql`and a.created_at <= ${dateToInclusive}` : sql``}
	`);
	const totalCount = Number(countRow?.count ?? 0);

	const auditEntries = entries.map((entry) => ({
		id: entry.id,
		entityType: entry.entity_type,
		entityId: entry.entity_id,
		action: entry.action,
		changedBy: entry.changed_by,
		changedByName: entry.user_name,
		changedByEmail: entry.user_email,
		previousValue: entry.previous_value,
		newValue: entry.new_value,
		context: entry.context,
		createdAt: entry.created_at
	}));

	const auditUsers = await many<{ changed_by: string; user_name: string | null }>(sql`
		select distinct a.changed_by, u.name as user_name
		from audit_log a
		left join users u on u.id = a.changed_by
		where a.organization_id = ${organization.id} and u.name is not null
		limit 100
	`);

	const uniqueUsers = new Map<string, string>();
	for (const u of auditUsers) {
		if (u.user_name) uniqueUsers.set(u.changed_by, u.user_name);
	}

	return {
		entries: auditEntries,
		totalCount,
		page,
		pageSize: PAGE_SIZE,
		totalPages: Math.ceil(totalCount / PAGE_SIZE),
		filters: { entityType, action, changedBy, dateFrom, dateTo },
		availableUsers: Array.from(uniqueUsers.entries()).map(([id, name]) => ({ id, name })),
		canExport: canExportComplianceReports(role)
	};
};
