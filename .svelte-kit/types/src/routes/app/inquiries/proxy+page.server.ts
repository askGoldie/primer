// @ts-nocheck
/**
 * Inquiries Page Server
 *
 * Lists all inquiries - both self-inquiries and peer inquiries.
 * Core mechanism for challenging thresholds and weights.
 */

import type { PageServerLoad } from "./$types.js";
import { sql, many } from "$lib/server/db.js";

interface InquiryRow {
  id: string;
  inquiry_type: string;
  status: string;
  challenge_type: string;
  rationale: string;
  resolution_summary: string | null;
  resolution_action: string | null;
  filed_at: string;
  resolved_at: string | null;
  metric_id: string | null;
  metric_name: string | null;
  filed_by_id: string | null;
  filed_by_name: string | null;
  filed_by_node_id: string | null;
  filed_by_node_name: string | null;
  filed_by_node_title: string | null;
}

export const load = async ({ parent, locals }: Parameters<PageServerLoad>[0]) => {
  const { organization, userNode, membership } = await parent();

  const isPrivileged =
    membership.role === "owner" || membership.role === "system_admin";
  const userId = locals.user!.id;

  const allInquiries = await many<InquiryRow>(sql`
		select
			i.id,
			i.inquiry_type,
			i.status,
			i.challenge_type,
			i.rationale,
			i.resolution_summary,
			i.resolution_action,
			i.filed_at,
			i.resolved_at,
			m.id as metric_id,
			m.name as metric_name,
			fbu.id as filed_by_id,
			fbu.name as filed_by_name,
			fbn.id as filed_by_node_id,
			fbn.name as filed_by_node_name,
			fbn.title as filed_by_node_title
		from inquiries i
		left join metrics m on m.id = i.target_metric_id
		left join users fbu on fbu.id = i.filed_by
		left join org_hierarchy_nodes fbn on fbn.id = i.filed_by_node_id
		where i.organization_id = ${organization.id}
			${isPrivileged ? sql`` : sql`and (i.filed_by = ${userId} or i.authority_id = ${userId})`}
		order by i.filed_at desc
		limit 50
	`);

  return {
    inquiries: allInquiries.map((row) => ({
      id: row.id,
      type: row.inquiry_type,
      status: row.status,
      challengeType: row.challenge_type,
      rationale: row.rationale,
      resolutionSummary: row.resolution_summary,
      resolutionAction: row.resolution_action,
      filedAt: row.filed_at,
      resolvedAt: row.resolved_at,
      targetMetric: {
        id: row.metric_id,
        name: row.metric_name,
      },
      filedBy: {
        id: row.filed_by_id,
        name: row.filed_by_name,
      },
      filedByNode: {
        id: row.filed_by_node_id,
        name: row.filed_by_node_name,
        title: row.filed_by_node_title,
      },
    })),
    canFileInquiry: !!userNode,
  };
};
