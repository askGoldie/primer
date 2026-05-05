/**
 * Audit Log CSV Export API
 *
 * GET with query params: entity_type, date_from, date_to, format=csv
 * Access: owner, system_admin, hr_admin
 *
 * Returns CSV of audit log entries matching the filter.
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db.js';
import { canExportComplianceReports } from '$lib/server/permissions.js';
import type { AuditEntityType, OrgRole } from '$lib/types/database.js';
import { t } from '$lib/i18n/index.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		error(401, t(locals.locale, 'error.unauthorized'));
	}

	// Get user's org membership
	const { data: membership } = await db
		.from('org_members')
		.select('organization_id, role')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.single();

	if (!membership) {
		error(403, t(locals.locale, 'error.no_membership'));
	}

	const role = membership.role as OrgRole;
	if (!canExportComplianceReports(role)) {
		error(403, t(locals.locale, 'error.insufficient_permissions'));
	}

	// Parse filters
	const entityType = url.searchParams.get('entity_type') ?? null;
	const dateFrom = url.searchParams.get('date_from') ?? null;
	const dateTo = url.searchParams.get('date_to') ?? null;

	// Build query
	let query = db
		.from('audit_log')
		.select('*, users!audit_log_changed_by_fkey(name)')
		.eq('organization_id', membership.organization_id)
		.order('created_at', { ascending: false })
		.limit(10000);

	if (entityType) {
		query = query.eq('entity_type', entityType as AuditEntityType);
	}
	if (dateFrom) {
		query = query.gte('created_at', dateFrom);
	}
	if (dateTo) {
		query = query.lte('created_at', dateTo + 'T23:59:59.999Z');
	}

	const { data: entries } = await query;

	// Build CSV
	const csvRows = [
		[
			t(locals.locale, 'export.csv.timestamp'),
			t(locals.locale, 'export.csv.actor'),
			t(locals.locale, 'export.csv.entity_type'),
			t(locals.locale, 'export.csv.entity_id'),
			t(locals.locale, 'export.csv.action'),
			t(locals.locale, 'export.csv.context'),
			t(locals.locale, 'export.csv.previous_value'),
			t(locals.locale, 'export.csv.new_value')
		].join(','),
		...(entries ?? []).map((entry) => {
			const userData = entry.users as { name: string } | null;
			return [
				entry.created_at,
				`"${(userData?.name ?? '').replace(/"/g, '""')}"`,
				entry.entity_type,
				entry.entity_id,
				entry.action,
				`"${(entry.context ?? '').replace(/"/g, '""')}"`,
				`"${JSON.stringify(entry.previous_value ?? {}).replace(/"/g, '""')}"`,
				`"${JSON.stringify(entry.new_value ?? {}).replace(/"/g, '""')}"`
			].join(',');
		})
	];

	const csv = csvRows.join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
};
