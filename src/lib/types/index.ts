/**
 * Core Type Definitions for Primer
 *
 * These types define the data structures used throughout the application.
 * They mirror the database schema defined in database-schema-spec.md
 */

// ============================================================================
// Tier Framework Types
// ============================================================================

/**
 * The five tier levels for operational health assessment
 */
export type TierLevel = 'alarm' | 'concern' | 'content' | 'effective' | 'optimized';

/**
 * Numeric values for each tier (used in composite score calculation)
 */
export const TIER_NUMERIC_VALUES: Record<TierLevel, number> = {
	alarm: 1,
	concern: 2,
	content: 3,
	effective: 4,
	optimized: 5
};

// ============================================================================
// User and Authentication Types
// ============================================================================

/**
 * User account record
 */
export interface User {
	id: string;
	email: string;
	name: string;
	locale: string;
	deactivatedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Session record for authentication
 */
export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	createdAt: Date;
}

// ============================================================================
// Organization Types
// ============================================================================

/**
 * Cycle cadence for self-inquiries
 */
export type CycleCadence = 'monthly' | 'quarterly';

/**
 * Performance measurement cadence
 *
 * Controls how often a metric is measured. This is independent of the
 * organization's cycle_cadence and can be set per-metric so that
 * different operational outputs are tracked at appropriate frequencies.
 */
export type PerformanceCadence = 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

/**
 * Organization record (top-level tenant entity)
 */
export interface Organization {
	id: string;
	name: string;
	industry: string | null;
	cycleCadence: CycleCadence;
	inquiryEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
}

/**
 * Organization member roles
 *
 * - owner: Full control (CEO/purchaser). Can assign all roles.
 * - system_admin: Org-wide management without hierarchy position.
 *   Can capture snapshots, assign metrics, approve, adjust scores,
 *   and start new cycles for ANY node. Delegated by owner.
 * - hr_admin: HR leadership role with org-wide member management,
 *   compliance export, and inquiry visibility. Cannot manage org
 *   settings, capture/adjust snapshots, or bypass hierarchy for
 *   metric operations. Can assign editor/viewer/participant roles.
 * - editor: Read/write for their subtree (hierarchy-gated).
 * - participant: Active contributor between viewer and editor.
 *   Can create own goals, record performance data, submit metrics
 *   for manager approval, and file inquiries. Cannot approve
 *   metrics, manage other nodes, or capture snapshots.
 * - viewer: Read-only access.
 *
 * @see /supabase/migrations/20260101000017_system_admin_role.sql
 * @see /supabase/migrations/20260101000019_role_expansion.sql
 */
export type OrgMemberRole =
	| 'owner'
	| 'system_admin'
	| 'hr_admin'
	| 'editor'
	| 'participant'
	| 'viewer';

/**
 * Organization membership record
 */
export interface OrgMember {
	id: string;
	organizationId: string;
	userId: string;
	role: OrgMemberRole;
	assignedBy: string | null;
	assignedAt: Date;
	removedAt: Date | null;
	removalReason: string | null;
}

// ============================================================================
// Hierarchy Types
// ============================================================================

/**
 * Node types in the organizational hierarchy
 */
export type HierarchyNodeType = 'executive_leader' | 'department' | 'team' | 'individual';

/**
 * Containment rules for hierarchy nodes
 */
export const CONTAINMENT_RULES: Record<HierarchyNodeType, HierarchyNodeType[]> = {
	executive_leader: ['department'],
	department: ['department', 'team', 'individual'],
	team: ['individual'],
	individual: []
};

/**
 * Valid parent types for each node type
 */
export const VALID_PARENTS: Record<HierarchyNodeType, (HierarchyNodeType | 'root')[]> = {
	executive_leader: ['root'],
	department: ['executive_leader', 'department'],
	team: ['department'],
	individual: ['department', 'team']
};

/**
 * Organizational hierarchy node
 */
export interface HierarchyNode {
	id: string;
	organizationId: string;
	parentId: string | null;
	nodeType: HierarchyNodeType;
	name: string;
	title: string | null;
	description: string | null;
	userId: string | null; // Bound user account
	positionX: number;
	positionY: number;
	isCollapsed: boolean;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string | null;
}

/**
 * Hierarchy node with computed children count
 */
export interface HierarchyNodeWithChildren extends HierarchyNode {
	childrenCount: number;
}

// ============================================================================
// Goal Types
// ============================================================================

export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'defined' | 'in_progress' | 'completed' | 'deferred';

/**
 * Goal type classification
 *
 * - strategic: long-term organizational direction
 * - operational: day-to-day operational health
 * - developmental: skill/capability growth
 * - compliance: regulatory, legal, board mandates
 */
export type GoalType = 'strategic' | 'operational' | 'developmental' | 'compliance';

/**
 * Goal origin — how a goal was created
 *
 * - self_created: user created the goal themselves
 * - cascaded: goal was cascaded down from a parent node's goal
 * - superior_assigned: goal was directly assigned by a superior
 */
export type GoalOrigin = 'self_created' | 'cascaded' | 'superior_assigned';

/**
 * Goal dependency type
 *
 * - blocks: this goal cannot progress until the dependency is met
 * - informs: this goal's outcome shapes decisions on the dependent goal
 * - supports: this goal contributes to but does not gate the dependent goal
 */
export type GoalDependencyType = 'blocks' | 'informs' | 'supports';

/**
 * SWOT analysis data structure
 */
export interface SwotData {
	directBenefits: string[];
	indirectBenefits: string[];
	acceptableCosts: string[];
	unacceptableCosts: string[];
}

/**
 * Organization goal record
 *
 * Goals are assigned to hierarchy nodes (employees) and can be reassigned.
 * Each goal has a type classification, quintile-aligned achievement tracking
 * (target_tier vs actual_tier), performance vs actual value capture, and
 * optional snapshot linkage. Leaders see rollup of all accessible nodes' goals.
 */
export interface OrgGoal {
	id: string;
	organizationId: string;
	hierarchyNodeId: string | null;
	title: string;
	description: string | null;
	priority: GoalPriority;
	status: GoalStatus;
	goalType: GoalType;
	goalOrigin: GoalOrigin;
	sourceGoalId: string | null;
	targetTier: TierLevel | null;
	actualTier: TierLevel | null;
	targetValue: Record<string, unknown> | null;
	actualValue: Record<string, unknown> | null;
	dueDate: string | null;
	assignedBy: string | null;
	snapshotId: string | null;
	swot: SwotData | null;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string | null;
}

/**
 * Goal dependency record
 *
 * Captures cross-goal relationships. A goal can depend on another goal
 * regardless of which node owns each goal, enabling cross-functional
 * dependency tracking. Dependencies are broadly defined: blocks, informs,
 * or supports.
 */
export interface GoalDependency {
	id: string;
	goalId: string;
	dependsOnGoalId: string;
	dependencyType: GoalDependencyType;
	description: string | null;
	createdBy: string | null;
	createdAt: Date;
}

// ============================================================================
// Metric Types
// ============================================================================

/**
 * How a metric is measured
 */
export type MeasurementType =
	| 'numeric'
	| 'percentage'
	| 'currency'
	| 'binary'
	| 'scale'
	| 'milestone'
	| 'checklist'
	| 'range'
	| 'qualitative';

/**
 * Indicator type for metrics
 */
export type IndicatorType = 'health' | 'leading' | 'lagging';

/**
 * Origin of a metric
 */
export type MetricOrigin =
	| 'regulatory'
	| 'board'
	| 'superior_assigned'
	| 'co_authored'
	| 'self_defined';

/**
 * Measurement configuration structures by type
 */
export interface NumericConfig {
	unit?: string;
	direction?: 'higher_is_better' | 'lower_is_better';
}

export interface PercentageConfig {
	direction: 'higher_is_better' | 'lower_is_better';
}

export interface CurrencyConfig {
	currency: string;
	direction: 'higher_is_better' | 'lower_is_better';
}

export interface BinaryConfig {
	trueLabel?: string;
	falseLabel?: string;
}

export interface ScaleConfig {
	min: number;
	max: number;
	labels?: Record<string, string>;
	direction: 'higher_is_better' | 'lower_is_better';
}

export interface MilestoneItem {
	key: string;
	label: string;
}

export interface MilestoneConfig {
	milestones: MilestoneItem[];
}

export interface ChecklistItem {
	key: string;
	label: string;
}

export interface ChecklistConfig {
	items: ChecklistItem[];
}

export interface RangeConfig {
	unit?: string;
	lowerBound: number;
	upperBound: number;
}

export type MeasurementConfig =
	| NumericConfig
	| PercentageConfig
	| CurrencyConfig
	| BinaryConfig
	| ScaleConfig
	| MilestoneConfig
	| ChecklistConfig
	| RangeConfig
	| null;

/**
 * Current value structures by measurement type
 */
export interface NumericValue {
	value: number;
}

export interface BinaryValue {
	value: boolean;
}

export interface MilestoneValue {
	completed: string[];
	current: string;
}

export interface ChecklistValue {
	completed: string[];
	total: number;
}

export interface ScaleValue {
	value: number;
	max?: number;
}

export interface QualitativeValue {
	observation: string;
}

export type MetricValue =
	| NumericValue
	| BinaryValue
	| MilestoneValue
	| ChecklistValue
	| ScaleValue
	| QualitativeValue
	| null;

/**
 * Metric record
 */
export interface Metric {
	id: string;
	organizationId: string;
	nodeId: string;
	assignedBy: string;
	name: string;
	description: string | null;
	measurementType: MeasurementType;
	measurementConfig: MeasurementConfig;
	indicatorType: IndicatorType;
	weight: number | null;
	currentTier: TierLevel | null;
	currentValue: MetricValue;
	origin: MetricOrigin;
	originDetail: string | null;
	sortOrder: number;
	approvedAt: Date | null;
	approvedBy: string | null;
	performanceCadence: PerformanceCadence | null;
	lockedBySnapshotId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================================================
// Threshold Types
// ============================================================================

/**
 * Resolution state for threshold agreements
 */
export type ThresholdResolution =
	| 'draft'
	| 'aligned'
	| 'leader_accepted'
	| 'superior_accepted'
	| 'committed';

/**
 * Metric threshold record (one per tier per metric)
 */
export interface MetricThreshold {
	id: string;
	metricId: string;
	tier: TierLevel;
	description: string;
	setBy: string;
	resolution: ThresholdResolution;
	leaderDescription: string | null;
	superiorDescription: string | null;
	resolutionNote: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================================================
// Review Types
// ============================================================================

/**
 * Metric review record (cycle-by-cycle review by superior)
 */
export interface MetricReview {
	id: string;
	metricId: string;
	reviewerId: string;
	leaderTier: TierLevel;
	reviewerTier: TierLevel | null;
	comment: string | null;
	cycleLabel: string | null;
	createdAt: Date;
}

// ============================================================================
// Score Types
// ============================================================================

/**
 * Per-metric breakdown in a score snapshot
 */
export interface MetricScoreDetail {
	metricId: string;
	metricName: string;
	measurementType: MeasurementType;
	origin: MetricOrigin;
	currentValue: MetricValue;
	tier: TierLevel;
	tierValue: number;
	weight: number;
	weightedContribution: number;
}

/**
 * Score snapshot record (immutable point-in-time record)
 */
export interface ScoreSnapshot {
	id: string;
	organizationId: string;
	nodeId: string;
	compositeScore: number;
	compositeTier: TierLevel;
	metricDetails: MetricScoreDetail[];
	cycleLabel: string | null;
	recordedBy: string;
	notes: string | null;
	adjustedBy: string | null;
	adjustedAt: Date | null;
	createdAt: Date;
}

// ============================================================================
// Performance Log Types
// ============================================================================

/**
 * Performance log entry — an immutable record of a measured value
 * for one metric during one period.
 *
 * Customers populate this from their operational systems (ERP, CRM,
 * spreadsheets, APIs, etc.) so the tier framework reflects real data.
 */
export interface PerformanceLog {
	id: string;
	organizationId: string;
	nodeId: string;
	metricId: string;
	periodStart: string; // ISO date (YYYY-MM-DD)
	periodEnd: string; // ISO date (YYYY-MM-DD)
	cadence: PerformanceCadence;
	measuredValue: MetricValue;
	assessedTier: TierLevel;
	dataSource: string | null;
	notes: string | null;
	recordedBy: string;
	createdAt: Date;
}

// ============================================================================
// Inquiry Types
// ============================================================================

export type InquiryType = 'self' | 'peer';
export type InquiryStatus = 'filed' | 'under_review' | 'resolved' | 'dismissed';
export type ChallengeType = 'threshold' | 'weight' | 'definition' | 'measurement';
export type ResolutionAction = 'adjusted' | 'no_change' | 'deferred';

/**
 * Inquiry record
 */
export interface Inquiry {
	id: string;
	organizationId: string;
	inquiryType: InquiryType;
	status: InquiryStatus;
	filedBy: string;
	filedByNodeId: string;
	targetMetricId: string;
	affectedMetricId: string;
	authorityId: string;
	authorityNodeId: string;
	challengeType: ChallengeType;
	rationale: string;
	resolutionSummary: string | null;
	resolutionAction: ResolutionAction | null;
	resolvedAt: Date | null;
	resolvedBy: string | null;
	filedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Inquiry comment record
 */
export interface InquiryComment {
	id: string;
	inquiryId: string;
	authorId: string;
	body: string;
	createdAt: Date;
}

// ============================================================================
// Audit Types
// ============================================================================

export type AuditEntityType =
	| 'metric'
	| 'threshold'
	| 'weight'
	| 'score'
	| 'inquiry'
	| 'organization'
	| 'user'
	| 'node';

export type AuditAction =
	| 'created'
	| 'updated'
	| 'deleted'
	| 'approved'
	| 'filed'
	| 'resolved'
	| 'dismissed'
	| 'deactivated'
	| 'bound'
	| 'unbound';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
	id: string;
	organizationId: string;
	entityType: AuditEntityType;
	entityId: string;
	action: AuditAction;
	changedBy: string;
	previousValue: Record<string, unknown> | null;
	newValue: Record<string, unknown> | null;
	context: string | null;
	createdAt: Date;
}

// ============================================================================
// Industry Types (for demo site)
// ============================================================================

export type Industry =
	| 'construction'
	| 'healthcare'
	| 'professional_services'
	| 'manufacturing'
	| 'retail';

export type VisitorRole = 'ceo' | 'vp' | 'team_lead';

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Supported locales
 */
export type Locale = 'en' | 'zh' | 'es' | 'ar' | 'fr' | 'de' | 'ja' | 'pt' | 'ko';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh', 'es', 'ar', 'fr', 'de', 'ja', 'pt', 'ko'];

export const LOCALE_NAMES: Record<Locale, string> = {
	en: 'English',
	zh: '中文',
	es: 'Español',
	ar: 'العربية',
	fr: 'Français',
	de: 'Deutsch',
	ja: '日本語',
	pt: 'Português',
	ko: '한국어'
};

/**
 * RTL locales
 */
export const RTL_LOCALES: Locale[] = ['ar'];

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: Locale): boolean {
	return RTL_LOCALES.includes(locale);
}
