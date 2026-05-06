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
import { sql, maybeOne, many } from '$lib/server/db.js';
import { canExportComplianceReports } from '$lib/server/permissions.js';
import type { OrgRole } from '$lib/types/index.js';
import { t } from '$lib/i18n/index.js';

interface AuditEntryRow {
	created_at: string;
	entity_type: string;
	entity_id: string;
	action: string;
	context: string | null;
	previous_value: unknown;
	new_value: unknown;
	user_name: string | null;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		error(401, t(locals.locale, 'error.unauthorized'));
	}

	const membership = await maybeOne<{ organization_id: string; role: OrgRole }>(sql`
		select organization_id, role
		from org_members
		where user_id = ${locals.user.id} and removed_at is null
		limit 1
	`);

	if (!membership) {
		error(403, t(locals.locale, 'error.no_membership'));
	}

	if (!canExportComplianceReports(membership.role)) {
		error(403, t(locals.locale, 'error.insufficient_permissions'));
	}

	const entityType = url.searchParams.get('entity_type');
	const dateFrom = url.searchParams.get('date_from');
	const dateTo = url.searchParams.get('date_to');
	const dateToInclusive = dateTo ? `${dateTo}T23:59:59.999Z` : null;

	const entries = await many<AuditEntryRow>(sql`
		select
			a.created_at,
			a.entity_type,
			a.entity_id,
			a.action,
			a.context,
			a.previous_value,
			a.new_value,
			u.name as user_name
		from audit_log a
		left join users u on u.id = a.changed_by
		where a.organization_id = ${membership.organization_id}
			${entityType ? sql`and a.entity_type = ${entityType}` : sql``}
			${dateFrom ? sql`and a.created_at >= ${dateFrom}` : sql``}
			${dateToInclusive ? sql`and a.created_at <= ${dateToInclusive}` : sql``}
		order by a.created_at desc
		limit 10000
	`);

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
		...entries.map((entry) =>
			[
				entry.created_at,
				`"${(entry.user_name ?? '').replace(/"/g, '""')}"`,
				entry.entity_type,
				entry.entity_id,
				entry.action,
				`"${(entry.context ?? '').replace(/"/g, '""')}"`,
				`"${JSON.stringify(entry.previous_value ?? {}).replace(/"/g, '""')}"`,
				`"${JSON.stringify(entry.new_value ?? {}).replace(/"/g, '""')}"`
			].join(',')
		)
	];

	const csv = csvRows.join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
};
