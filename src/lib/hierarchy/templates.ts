/**
 * Hierarchy Quick-Start Templates
 *
 * Pre-built org chart scaffolds used when an admin opens the Hierarchy tab
 * for an empty organization. The template is a nested tree of plain objects
 * that the server walks to create real `org_hierarchy_nodes` rows.
 *
 * Scaled by executive count (3-8). Each additional exec layers another
 * department in on top of the previous size:
 *
 * | Count | Departments added                                        |
 * |-------|----------------------------------------------------------|
 * |   3   | Finance (CFO), Operations (COO), Sales                   |
 * |   4   | + Marketing (Marketing Director)                          |
 * |   5   | + Technology (CTO)                                        |
 * |   6   | + Human Resources (HR Director)                           |
 * |   7   | + Legal & Compliance (General Counsel)                    |
 * |   8   | + Product (VP Product)                                    |
 *
 * All templates share a single `executive_leader` root ("CEO / President").
 *
 * @see /docs/hierarchy-system-reference.md §8 for the origin spec
 */

import type { HierarchyNodeType } from '$lib/types/index.js';

/**
 * A single node in a hierarchy template. The template is processed
 * depth-first to create real database rows at populate time.
 */
export interface HierarchyTemplateNode {
	/** Which containment slot this node occupies */
	nodeType: HierarchyNodeType;
	/** Display name (e.g. "Finance", "Accounting Team") */
	name: string;
	/** Optional job title for executives/managers */
	title?: string;
	/** Nested children; omit for leaf nodes */
	children?: HierarchyTemplateNode[];
}

/**
 * Standard departments, ordered by priority. The first N are included
 * for a given executive count.
 */
const DEPARTMENT_POOL: HierarchyTemplateNode[] = [
	{
		nodeType: 'department',
		name: 'Finance',
		title: 'CFO',
		children: [
			{ nodeType: 'team', name: 'Accounting' },
			{ nodeType: 'team', name: 'Financial Planning' }
		]
	},
	{
		nodeType: 'department',
		name: 'Operations',
		title: 'COO',
		children: [
			{ nodeType: 'team', name: 'Production' },
			{ nodeType: 'team', name: 'Logistics' }
		]
	},
	{
		nodeType: 'department',
		name: 'Sales',
		title: 'Sales Manager',
		children: [{ nodeType: 'team', name: 'Account Executives' }]
	},
	{
		nodeType: 'department',
		name: 'Marketing',
		title: 'Marketing Director',
		children: [
			{ nodeType: 'team', name: 'Brand' },
			{ nodeType: 'team', name: 'Growth' }
		]
	},
	{
		nodeType: 'department',
		name: 'Technology',
		title: 'CTO',
		children: [
			{ nodeType: 'team', name: 'Engineering' },
			{ nodeType: 'team', name: 'Infrastructure' }
		]
	},
	{
		nodeType: 'department',
		name: 'Human Resources',
		title: 'HR Director',
		children: [{ nodeType: 'team', name: 'People Operations' }]
	},
	{
		nodeType: 'department',
		name: 'Legal & Compliance',
		title: 'General Counsel',
		children: [{ nodeType: 'team', name: 'Compliance' }]
	},
	{
		nodeType: 'department',
		name: 'Product',
		title: 'VP Product',
		children: [{ nodeType: 'team', name: 'Product Management' }]
	}
];

/**
 * Build a template rooted at a single CEO with the first N departments
 * from {@link DEPARTMENT_POOL}.
 *
 * @param executiveCount - Number of executive departments (clamped to 3-8)
 * @returns Root-level template nodes; pass `null` parent when populating
 */
export function getHierarchyTemplate(executiveCount: number): HierarchyTemplateNode[] {
	const clamped = Math.min(Math.max(executiveCount, 3), 8);

	return [
		{
			nodeType: 'executive_leader',
			name: 'CEO / President',
			title: 'CEO',
			children: DEPARTMENT_POOL.slice(0, clamped)
		}
	];
}
