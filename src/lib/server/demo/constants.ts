/**
 * Demo Environment Constants
 *
 * Fixed identifiers and credentials for the pre-populated demo instance.
 * All demo visitors share the same user session, viewing the system as
 * Hans Ruber (CEO) with viewer-level permissions.
 *
 * These UUIDs are deterministic so the seed and reset functions always
 * target the same rows. They are v4-format but hand-chosen for clarity.
 */

// ============================================================================
// Demo User (shared visitor identity)
// ============================================================================

/** The single demo user account all visitors share */
export const DEMO_USER_ID = '00000000-0000-4000-a000-000000000001';

/** Demo login credentials (public - visitors use these) */
export const DEMO_EMAIL = 'demo@primer.company';
export const DEMO_PASSWORD = 'demo2025';

/** Display name shown in the app shell */
export const DEMO_USER_NAME = 'Hans Ruber';

// ============================================================================
// Demo Organization
// ============================================================================

export const DEMO_ORG_ID = '00000000-0000-4000-a000-000000000010';
export const DEMO_ORG_NAME = 'Meridian Construction';
export const DEMO_ORG_INDUSTRY = 'construction';

// ============================================================================
// Platform Organization (internal team testing instance)
//
// A fully populated org with 3 tiers of leadership + individual contributors.
// Structure: 1 CEO → 4 VPs → 16 Directors → 48 ICs = 69 people total.
//
// The org tree is defined as a nested structure for readability. Use
// flattenPlatformRoster() to get a flat array for seeding.
//
// UUID scheme:
//   User IDs:  00000000-0000-4000-b000-{idx padded to 12}
//   Node IDs:  00000000-0000-4000-b100-{idx padded to 12}
//
// Index numbering encodes the hierarchy:
//   CEO=1, VPs=10/20/30/40, Directors=11-14/21-25/31-33/41-44,
//   ICs=111-113/121-123/.../441-443
// ============================================================================

export const PLATFORM_ORG_ID = '00000000-0000-4000-a000-000000000020';
export const PLATFORM_ORG_NAME = '(Demo Company) Tier Internal';

/** Shared password for all platform test accounts */
export const PLATFORM_PASSWORD = 'platform2025';

/** Cookie name for the selected perspective (used by stubbed login and app layout) */
export const PERSPECTIVE_COOKIE = 'primer_perspective';

// ---- UUID generators from index ----

/** Generate a deterministic platform user UUID from an index number */
export function platformUserId(idx: number): string {
	return `00000000-0000-4000-b000-${idx.toString().padStart(12, '0')}`;
}

/** Generate a deterministic platform hierarchy node UUID from an index number */
export function platformNodeId(idx: number): string {
	return `00000000-0000-4000-b100-${idx.toString().padStart(12, '0')}`;
}

/** Generate a deterministic platform metric UUID from an index number */
export function platformMetricId(idx: number): string {
	return `00000000-0000-4000-b200-${idx.toString().padStart(12, '0')}`;
}

/** Generate a deterministic platform score snapshot UUID from an index number */
export function platformSnapshotId(idx: number): string {
	return `00000000-0000-4000-b300-${idx.toString().padStart(12, '0')}`;
}

/** Generate a deterministic platform inquiry UUID from an index number */
export function platformInquiryId(idx: number): string {
	return `00000000-0000-4000-b400-${idx.toString().padStart(12, '0')}`;
}

/** Convenience: the CEO's user ID (used as createdBy / assignedBy) */
export const PLATFORM_CEO_USER_ID = platformUserId(1);

// ---- Tree type ----

/**
 * A person in the platform org tree.
 *
 * The `idx` field is used to generate deterministic user and node UUIDs.
 * The nested `reports` array defines the hierarchy - flattenPlatformRoster()
 * walks this tree to produce the flat array needed for DB insertion.
 */
export interface PlatformPerson {
	idx: number;
	email: string;
	name: string;
	title: string;
	orgRole: 'owner' | 'editor' | 'viewer';
	nodeType: 'executive_leader' | 'department' | 'team' | 'individual';
	description: string;
	reports?: PlatformPerson[];
}

/** A flattened person with computed IDs and parent reference */
export interface FlatPlatformPerson {
	userId: string;
	nodeId: string;
	parentNodeId: string | null;
	email: string;
	name: string;
	title: string;
	orgRole: 'owner' | 'editor' | 'viewer';
	nodeType: 'executive_leader' | 'department' | 'team' | 'individual';
	description: string;
}

// ---- Full org tree (69 people) ----

/**
 * The complete platform organization hierarchy.
 *
 * 1 CEO → 4 VPs → 16 Directors → 48 Individual Contributors
 *
 * Each VP heads a department: Operations, Engineering, Finance, Sales.
 * Directors run teams within each department.
 * ICs are the individual contributors each director manages.
 */
export const PLATFORM_ORG_TREE: PlatformPerson = {
	idx: 1,
	email: 'alex.rivera@primer.internal',
	name: 'Alex Rivera',
	title: 'CEO',
	orgRole: 'owner',
	nodeType: 'executive_leader',
	description: 'Full access. Can manage org settings, approve thresholds, resolve inquiries.',
	reports: [
		// ----------------------------------------------------------------
		// VP of Operations - Jordan Lee
		// ----------------------------------------------------------------
		{
			idx: 10,
			email: 'jordan.lee@primer.internal',
			name: 'Jordan Lee',
			title: 'VP of Operations',
			orgRole: 'editor',
			nodeType: 'department',
			description: 'Can edit metrics, set thresholds, file and review inquiries for Operations.',
			reports: [
				{
					idx: 11,
					email: 'taylor.brooks@primer.internal',
					name: 'Taylor Brooks',
					title: 'Director of Logistics',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 111,
							email: 'riley.adams@primer.internal',
							name: 'Riley Adams',
							title: 'Logistics Coordinator',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 112,
							email: 'emery.sullivan@primer.internal',
							name: 'Emery Sullivan',
							title: 'Shipping Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 113,
							email: 'skyler.grant@primer.internal',
							name: 'Skyler Grant',
							title: 'Warehouse Supervisor',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 12,
					email: 'reese.donovan@primer.internal',
					name: 'Reese Donovan',
					title: 'Director of Quality',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 121,
							email: 'finley.ward@primer.internal',
							name: 'Finley Ward',
							title: 'QA Specialist',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 122,
							email: 'rowan.blake@primer.internal',
							name: 'Rowan Blake',
							title: 'Compliance Officer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 123,
							email: 'jesse.mitchell@primer.internal',
							name: 'Jesse Mitchell',
							title: 'Quality Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 13,
					email: 'jamie.navarro@primer.internal',
					name: 'Jamie Navarro',
					title: 'Director of Facilities',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 131,
							email: 'harper.ellis@primer.internal',
							name: 'Harper Ellis',
							title: 'Facilities Coordinator',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 132,
							email: 'kai.ramirez@primer.internal',
							name: 'Kai Ramirez',
							title: 'Maintenance Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 133,
							email: 'phoenix.torres@primer.internal',
							name: 'Phoenix Torres',
							title: 'Space Planner',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 14,
					email: 'quinn.mercer@primer.internal',
					name: 'Quinn Mercer',
					title: 'Director of Procurement',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 141,
							email: 'lennox.sato@primer.internal',
							name: 'Lennox Sato',
							title: 'Buyer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 142,
							email: 'marley.okafor@primer.internal',
							name: 'Marley Okafor',
							title: 'Vendor Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 143,
							email: 'river.chen@primer.internal',
							name: 'River Chen',
							title: 'Procurement Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				}
			]
		},

		// ----------------------------------------------------------------
		// VP of Engineering - Sam Patel
		// ----------------------------------------------------------------
		{
			idx: 20,
			email: 'sam.patel@primer.internal',
			name: 'Sam Patel',
			title: 'VP of Engineering',
			orgRole: 'editor',
			nodeType: 'department',
			description: 'Can edit metrics, set thresholds, file and review inquiries for Engineering.',
			reports: [
				{
					idx: 21,
					email: 'hayden.park@primer.internal',
					name: 'Hayden Park',
					title: 'Director of Product',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 211,
							email: 'cameron.vega@primer.internal',
							name: 'Cameron Vega',
							title: 'Sr. Product Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 212,
							email: 'ashton.cruz@primer.internal',
							name: 'Ashton Cruz',
							title: 'Product Designer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 213,
							email: 'peyton.lam@primer.internal',
							name: 'Peyton Lam',
							title: 'Product Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 22,
					email: 'drew.castillo@primer.internal',
					name: 'Drew Castillo',
					title: 'Director of Infrastructure',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 221,
							email: 'logan.mueller@primer.internal',
							name: 'Logan Mueller',
							title: 'Site Reliability Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 222,
							email: 'kendall.nair@primer.internal',
							name: 'Kendall Nair',
							title: 'DevOps Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 223,
							email: 'tatum.kowalski@primer.internal',
							name: 'Tatum Kowalski',
							title: 'Cloud Architect',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 23,
					email: 'blake.andersen@primer.internal',
					name: 'Blake Andersen',
					title: 'Director of QA',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 231,
							email: 'marlowe.fischer@primer.internal',
							name: 'Marlowe Fischer',
							title: 'QA Lead',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 232,
							email: 'ellis.tanaka@primer.internal',
							name: 'Ellis Tanaka',
							title: 'Test Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 233,
							email: 'arden.osei@primer.internal',
							name: 'Arden Osei',
							title: 'Automation Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 24,
					email: 'shiloh.bergman@primer.internal',
					name: 'Shiloh Bergman',
					title: 'Director of Data',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 241,
							email: 'jules.nakamura@primer.internal',
							name: 'Jules Nakamura',
							title: 'Data Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 242,
							email: 'remy.dubois@primer.internal',
							name: 'Remy Dubois',
							title: 'Data Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 243,
							email: 'sage.lindgren@primer.internal',
							name: 'Sage Lindgren',
							title: 'ML Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 25,
					email: 'micah.romano@primer.internal',
					name: 'Micah Romano',
					title: 'Director of Security',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 251,
							email: 'oakley.frazier@primer.internal',
							name: 'Oakley Frazier',
							title: 'Security Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 252,
							email: 'briar.hoffman@primer.internal',
							name: 'Briar Hoffman',
							title: 'Penetration Tester',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 253,
							email: 'lane.prescott@primer.internal',
							name: 'Lane Prescott',
							title: 'SOC Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				}
			]
		},

		// ----------------------------------------------------------------
		// VP of Finance - Morgan Kim
		// ----------------------------------------------------------------
		{
			idx: 30,
			email: 'morgan.kim@primer.internal',
			name: 'Morgan Kim',
			title: 'VP of Finance',
			orgRole: 'editor',
			nodeType: 'department',
			description: 'Can edit metrics, set thresholds, file and review inquiries for Finance.',
			reports: [
				{
					idx: 31,
					email: 'rory.langston@primer.internal',
					name: 'Rory Langston',
					title: 'Director of Accounting',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 311,
							email: 'wren.gallagher@primer.internal',
							name: 'Wren Gallagher',
							title: 'Staff Accountant',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 312,
							email: 'hollis.sinclair@primer.internal',
							name: 'Hollis Sinclair',
							title: 'AP Specialist',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 313,
							email: 'noel.carmichael@primer.internal',
							name: 'Noel Carmichael',
							title: 'AR Specialist',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 32,
					email: 'frankie.novak@primer.internal',
					name: 'Frankie Novak',
					title: 'Director of FP&A',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 321,
							email: 'sutton.price@primer.internal',
							name: 'Sutton Price',
							title: 'Financial Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 322,
							email: 'campbell.voss@primer.internal',
							name: 'Campbell Voss',
							title: 'Budget Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 323,
							email: 'bellamy.cross@primer.internal',
							name: 'Bellamy Cross',
							title: 'Sr. Financial Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 33,
					email: 'dakota.webb@primer.internal',
					name: 'Dakota Webb',
					title: 'Director of Treasury',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 331,
							email: 'harlow.keating@primer.internal',
							name: 'Harlow Keating',
							title: 'Treasury Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 332,
							email: 'haven.brandt@primer.internal',
							name: 'Haven Brandt',
							title: 'Cash Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 333,
							email: 'sterling.marsh@primer.internal',
							name: 'Sterling Marsh',
							title: 'Risk Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				}
			]
		},

		// ----------------------------------------------------------------
		// VP of Sales - Casey Chen
		// ----------------------------------------------------------------
		{
			idx: 40,
			email: 'casey.chen@primer.internal',
			name: 'Casey Chen',
			title: 'VP of Sales',
			orgRole: 'editor',
			nodeType: 'department',
			description: 'Can edit metrics, set thresholds, file and review inquiries for Sales.',
			reports: [
				{
					idx: 41,
					email: 'devon.hartley@primer.internal',
					name: 'Devon Hartley',
					title: 'Director of Enterprise Sales',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 411,
							email: 'shay.callahan@primer.internal',
							name: 'Shay Callahan',
							title: 'Enterprise Account Executive',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 412,
							email: 'torin.mcbride@primer.internal',
							name: 'Torin McBride',
							title: 'Solutions Engineer',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 413,
							email: 'corin.ashworth@primer.internal',
							name: 'Corin Ashworth',
							title: 'Sr. Account Executive',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 42,
					email: 'avery.thornton@primer.internal',
					name: 'Avery Thornton',
					title: 'Director of SMB Sales',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 421,
							email: 'scout.hensley@primer.internal',
							name: 'Scout Hensley',
							title: 'SMB Account Executive',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 422,
							email: 'perry.cunningham@primer.internal',
							name: 'Perry Cunningham',
							title: 'SMB Account Executive',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 423,
							email: 'dallas.wakefield@primer.internal',
							name: 'Dallas Wakefield',
							title: 'Sales Development Rep',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 43,
					email: 'robin.caldwell@primer.internal',
					name: 'Robin Caldwell',
					title: 'Director of Partnerships',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 431,
							email: 'wynne.beaumont@primer.internal',
							name: 'Wynne Beaumont',
							title: 'Partner Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 432,
							email: 'linden.chow@primer.internal',
							name: 'Linden Chow',
							title: 'Partner Manager',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 433,
							email: 'arbor.delgado@primer.internal',
							name: 'Arbor Delgado',
							title: 'Alliance Coordinator',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				},
				{
					idx: 44,
					email: 'parker.ellison@primer.internal',
					name: 'Parker Ellison',
					title: 'Director of Sales Ops',
					orgRole: 'editor',
					nodeType: 'team',
					description: 'Can edit own metrics and thresholds, file inquiries.',
					reports: [
						{
							idx: 441,
							email: 'kit.brennan@primer.internal',
							name: 'Kit Brennan',
							title: 'Sales Ops Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 442,
							email: 'darcy.whitmore@primer.internal',
							name: 'Darcy Whitmore',
							title: 'CRM Administrator',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						},
						{
							idx: 443,
							email: 'sasha.volkov@primer.internal',
							name: 'Sasha Volkov',
							title: 'RevOps Analyst',
							orgRole: 'viewer',
							nodeType: 'individual',
							description: 'Read-only. Can view dashboards, metrics, and inquiry history.'
						}
					]
				}
			]
		}
	]
};

/**
 * Recursively flatten the platform org tree into a flat array
 * with computed user/node UUIDs and parent references.
 *
 * Used by the seed function to insert all accounts, memberships,
 * and hierarchy nodes in one pass.
 */
export function flattenPlatformRoster(
	node: PlatformPerson = PLATFORM_ORG_TREE,
	parentNodeId: string | null = null
): FlatPlatformPerson[] {
	const flat: FlatPlatformPerson[] = [];
	const person: FlatPlatformPerson = {
		userId: platformUserId(node.idx),
		nodeId: platformNodeId(node.idx),
		parentNodeId,
		email: node.email,
		name: node.name,
		title: node.title,
		orgRole: node.orgRole,
		nodeType: node.nodeType,
		description: node.description
	};
	flat.push(person);

	if (node.reports) {
		for (const child of node.reports) {
			flat.push(...flattenPlatformRoster(child, person.nodeId));
		}
	}

	return flat;
}

/**
 * Legacy compatibility: flat array of all platform accounts.
 * Equivalent to flattenPlatformRoster() but cached at module load.
 */
export const PLATFORM_ROSTER = flattenPlatformRoster();

// ============================================================================
// Hierarchy Node IDs
// ============================================================================

/** Hans Ruber - CEO / Executive Leader */
export const DEMO_NODE_HANS = '00000000-0000-4000-a000-000000000100';

/** Marcus - VP of Operations */
export const DEMO_NODE_MARCUS = '00000000-0000-4000-a000-000000000101';

/** Rachel - CFO */
export const DEMO_NODE_RACHEL = '00000000-0000-4000-a000-000000000102';

/** James - VP of Business Development */
export const DEMO_NODE_JAMES = '00000000-0000-4000-a000-000000000103';

/** Nina - VP of Safety */
export const DEMO_NODE_NINA = '00000000-0000-4000-a000-000000000104';

// ============================================================================
// Leader User IDs (non-login, used as assignedBy / references)
// ============================================================================

export const DEMO_USER_MARCUS = '00000000-0000-4000-a000-000000000002';
export const DEMO_USER_RACHEL = '00000000-0000-4000-a000-000000000003';
export const DEMO_USER_JAMES = '00000000-0000-4000-a000-000000000004';
export const DEMO_USER_NINA = '00000000-0000-4000-a000-000000000005';

// ============================================================================
// Metric IDs (Hans's stack)
// ============================================================================

export const DEMO_METRIC_SCHEDULE = '00000000-0000-4000-a000-000000001001';
export const DEMO_METRIC_BUDGET = '00000000-0000-4000-a000-000000001002';
export const DEMO_METRIC_WINRATE = '00000000-0000-4000-a000-000000001003';
export const DEMO_METRIC_CASH = '00000000-0000-4000-a000-000000001004';

// Marcus's metrics
export const DEMO_METRIC_MARCUS_1 = '00000000-0000-4000-a000-000000001011';
export const DEMO_METRIC_MARCUS_2 = '00000000-0000-4000-a000-000000001012';
export const DEMO_METRIC_MARCUS_3 = '00000000-0000-4000-a000-000000001013';

// Rachel's metrics
export const DEMO_METRIC_RACHEL_1 = '00000000-0000-4000-a000-000000001021';
export const DEMO_METRIC_RACHEL_2 = '00000000-0000-4000-a000-000000001022';
export const DEMO_METRIC_RACHEL_3 = '00000000-0000-4000-a000-000000001023';
export const DEMO_METRIC_RACHEL_4 = '00000000-0000-4000-a000-000000001024';

// James's metrics
export const DEMO_METRIC_JAMES_1 = '00000000-0000-4000-a000-000000001031';
export const DEMO_METRIC_JAMES_2 = '00000000-0000-4000-a000-000000001032';
export const DEMO_METRIC_JAMES_3 = '00000000-0000-4000-a000-000000001033';

// Nina's metrics
export const DEMO_METRIC_NINA_1 = '00000000-0000-4000-a000-000000001041';
export const DEMO_METRIC_NINA_2 = '00000000-0000-4000-a000-000000001042';
export const DEMO_METRIC_NINA_3 = '00000000-0000-4000-a000-000000001043';

// ============================================================================
// Inquiry IDs
// ============================================================================

/** Nina's self-inquiry (threshold recalibration) */
export const DEMO_INQUIRY_NINA_SELF = '00000000-0000-4000-a000-000000002001';

/** James's peer inquiry (lead quality → win rate) */
export const DEMO_INQUIRY_JAMES_PEER = '00000000-0000-4000-a000-000000002002';

// ============================================================================
// Score Snapshot IDs
// ============================================================================

export const DEMO_SNAPSHOT_HANS_1 = '00000000-0000-4000-a000-000000003001';
export const DEMO_SNAPSHOT_HANS_2 = '00000000-0000-4000-a000-000000003002';
export const DEMO_SNAPSHOT_HANS_3 = '00000000-0000-4000-a000-000000003003';
export const DEMO_SNAPSHOT_MARCUS_1 = '00000000-0000-4000-a000-000000003011';
export const DEMO_SNAPSHOT_RACHEL_1 = '00000000-0000-4000-a000-000000003021';
export const DEMO_SNAPSHOT_JAMES_1 = '00000000-0000-4000-a000-000000003031';
export const DEMO_SNAPSHOT_NINA_1 = '00000000-0000-4000-a000-000000003041';
export const DEMO_SNAPSHOT_NINA_2 = '00000000-0000-4000-a000-000000003042';

// ============================================================================
// Org Member IDs
// ============================================================================

export const DEMO_MEMBER_HANS = '00000000-0000-4000-a000-000000004001';
export const DEMO_MEMBER_MARCUS = '00000000-0000-4000-a000-000000004002';
export const DEMO_MEMBER_RACHEL = '00000000-0000-4000-a000-000000004003';
export const DEMO_MEMBER_JAMES = '00000000-0000-4000-a000-000000004004';
export const DEMO_MEMBER_NINA = '00000000-0000-4000-a000-000000004005';
