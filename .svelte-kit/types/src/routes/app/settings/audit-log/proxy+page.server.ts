// @ts-nocheck
/**
 * Audit Log Viewer Page Server
 *
 * Paginated view of the audit_log table with filters for
 * entity_type, action, changed_by (user), and date range.
 *
 * Access: owner, system_admin, hr_admin
 *
 * @see /supabase/migrations/20260101000007_audit.sql
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import { canExportComplianceReports } from '$lib/server/permissions.js';
import type { AuditAction, AuditEntityType, OrgRole } from '$lib/types/database.js';

const PAGE_SIZE = 50;

export const load = async ({ parent, url }: Parameters<PageServerLoad>[0]) => {
	const { organization, membership } = await parent();

	const role = membership.role as OrgRole;

	// Only owner, system_admin, hr_admin can access
	if (!canExportComplianceReports(role)) {
		redirect(302, '/app');
	}

	// Parse filters from query params
	const entityType = url.searchParams.get('entity_type') ?? null;
	const action = url.searchParams.get('action') ?? null;
	const changedBy = url.searchParams.get('changed_by') ?? null;
	const dateFrom = url.searchParams.get('date_from') ?? null;
	const dateTo = url.searchParams.get('date_to') ?? null;
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));

	// Build query
	let query = db
		.from('audit_log')
		.select('*, users!audit_log_changed_by_fkey(name, email)', { count: 'exact' })
		.eq('organization_id', organization.id)
		.order('created_at', { ascending: false })
		.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

	if (entityType) {
		query = query.eq('entity_type', entityType as AuditEntityType);
	}
	if (action) {
		query = query.eq('action', action as AuditAction);
	}
	if (changedBy) {
		query = query.eq('changed_by', changedBy);
	}
	if (dateFrom) {
		query = query.gte('created_at', dateFrom);
	}
	if (dateTo) {
		query = query.lte('created_at', dateTo + 'T23:59:59.999Z');
	}

	const { data: entries, count } = await query;

	const auditEntries = (entries ?? []).map((entry) => {
		const userData = entry.users as { name: string; email: string } | null;
		return {
			id: entry.id,
			entityType: entry.entity_type,
			entityId: entry.entity_id,
			action: entry.action,
			changedBy: entry.changed_by,
			changedByName: userData?.name ?? null,
			changedByEmail: userData?.email ?? null,
			previousValue: entry.previous_value,
			newValue: entry.new_value,
			context: entry.context,
			createdAt: entry.created_at
		};
	});

	// Get unique users for filter dropdown
	const { data: auditUsers } = await db
		.from('audit_log')
		.select('changed_by, users!audit_log_changed_by_fkey(name)')
		.eq('organization_id', organization.id)
		.limit(100);

	const uniqueUsers = new Map<string, string>();
	for (const u of auditUsers ?? []) {
		const userData = u.users as { name: string } | null;
		if (userData?.name) {
			uniqueUsers.set(u.changed_by, userData.name);
		}
	}

	return {
		entries: auditEntries,
		totalCount: count ?? 0,
		page,
		pageSize: PAGE_SIZE,
		totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
		filters: { entityType, action, changedBy, dateFrom, dateTo },
		availableUsers: Array.from(uniqueUsers.entries()).map(([id, name]) => ({ id, name })),
		canExport: canExportComplianceReports(role)
	};
};
