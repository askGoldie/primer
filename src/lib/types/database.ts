/**
 * Supabase Database Type Definitions
 *
 * Generated from the SQL migrations in /supabase/migrations/.
 * This file is the TypeScript source of truth for all table shapes,
 * replacing the previous Drizzle ORM schema definitions.
 *
 * Usage:
 *   import type { Database, Tables, Enums } from '$lib/types/database.js';
 *
 * @see /supabase/migrations/ for the canonical SQL schema
 */

// ============================================================================
// Enum Types (from 20260101000001_enums.sql)
// ============================================================================

export type TierLevel = 'alarm' | 'concern' | 'content' | 'effective' | 'optimized';
export type OrgRole = 'owner' | 'system_admin' | 'hr_admin' | 'editor' | 'participant' | 'viewer';
export type NodeType = 'executive_leader' | 'department' | 'team' | 'individual';
export type CycleCadence = 'monthly' | 'quarterly';
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
export type IndicatorType = 'health' | 'leading' | 'lagging';
export type MetricOrigin =
	| 'regulatory'
	| 'board'
	| 'superior_assigned'
	| 'co_authored'
	| 'self_defined';
export type ThresholdResolution =
	| 'draft'
	| 'aligned'
	| 'leader_accepted'
	| 'superior_accepted'
	| 'committed';
export type InquiryType = 'self' | 'peer';
export type InquiryStatus = 'filed' | 'under_review' | 'resolved' | 'dismissed';
export type ChallengeType = 'threshold' | 'weight' | 'definition' | 'measurement';
export type ResolutionAction = 'adjusted' | 'no_change' | 'deferred';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'defined' | 'in_progress' | 'completed' | 'deferred';
export type GoalType = 'strategic' | 'operational' | 'developmental' | 'compliance';
export type GoalDependencyType = 'blocks' | 'informs' | 'supports';
export type GoalOrigin = 'self_created' | 'cascaded' | 'superior_assigned';
export type PerformanceCadence = 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
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

// ============================================================================
// Database Schema Type (Supabase convention)
// ============================================================================

export type Database = {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					email: string;
					password_hash: string | null;
					name: string;
					locale: string;
					email_verified: boolean;
					is_admin: boolean;
					deactivated_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					email: string;
					password_hash?: string | null;
					name: string;
					locale?: string;
					email_verified?: boolean;
					is_admin?: boolean;
					deactivated_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					password_hash?: string | null;
					name?: string;
					locale?: string;
					email_verified?: boolean;
					is_admin?: boolean;
					deactivated_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			sessions: {
				Row: {
					id: string;
					user_id: string;
					expires_at: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					expires_at: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					expires_at?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'sessions_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			email_verification_tokens: {
				Row: {
					id: string;
					user_id: string;
					token_hash: string;
					expires_at: string;
					used_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					token_hash: string;
					expires_at: string;
					used_at?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					token_hash?: string;
					expires_at?: string;
					used_at?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'email_verification_tokens_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			password_reset_tokens: {
				Row: {
					id: string;
					user_id: string;
					token_hash: string;
					expires_at: string;
					used_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					token_hash: string;
					expires_at: string;
					used_at?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					token_hash?: string;
					expires_at?: string;
					used_at?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'password_reset_tokens_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			organizations: {
				Row: {
					id: string;
					name: string;
					industry: string | null;
					cycle_cadence: CycleCadence;
					inquiry_enabled: boolean;
					created_by: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					industry?: string | null;
					cycle_cadence?: CycleCadence;
					inquiry_enabled?: boolean;
					created_by: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					industry?: string | null;
					cycle_cadence?: CycleCadence;
					inquiry_enabled?: boolean;
					created_by?: string;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'organizations_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			org_members: {
				Row: {
					id: string;
					organization_id: string;
					user_id: string;
					role: OrgRole;
					assigned_by: string | null;
					assigned_at: string;
					removed_at: string | null;
					removal_reason: string | null;
				};
				Insert: {
					id?: string;
					organization_id: string;
					user_id: string;
					role: OrgRole;
					assigned_by?: string | null;
					assigned_at?: string;
					removed_at?: string | null;
					removal_reason?: string | null;
				};
				Update: {
					id?: string;
					organization_id?: string;
					user_id?: string;
					role?: OrgRole;
					assigned_by?: string | null;
					assigned_at?: string;
					removed_at?: string | null;
					removal_reason?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'org_members_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_members_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_members_assigned_by_fkey';
						columns: ['assigned_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			org_hierarchy_nodes: {
				Row: {
					id: string;
					organization_id: string;
					parent_id: string | null;
					node_type: NodeType;
					name: string;
					title: string | null;
					description: string | null;
					user_id: string | null;
					position_x: number;
					position_y: number;
					is_collapsed: boolean;
					sort_order: number;
					peer_visibility: 'score_only' | 'metrics' | 'full';
					created_by: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					parent_id?: string | null;
					node_type: NodeType;
					name: string;
					title?: string | null;
					description?: string | null;
					user_id?: string | null;
					position_x?: number;
					position_y?: number;
					is_collapsed?: boolean;
					sort_order?: number;
					peer_visibility?: 'score_only' | 'metrics' | 'full';
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					parent_id?: string | null;
					node_type?: NodeType;
					name?: string;
					title?: string | null;
					description?: string | null;
					user_id?: string | null;
					position_x?: number;
					position_y?: number;
					is_collapsed?: boolean;
					sort_order?: number;
					peer_visibility?: 'score_only' | 'metrics' | 'full';
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'org_hierarchy_nodes_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_hierarchy_nodes_parent_id_fkey';
						columns: ['parent_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_hierarchy_nodes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_hierarchy_nodes_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			org_goals: {
				Row: {
					id: string;
					organization_id: string;
					hierarchy_node_id: string | null;
					title: string;
					description: string | null;
					priority: GoalPriority;
					status: GoalStatus;
					goal_type: GoalType;
					goal_origin: GoalOrigin;
					source_goal_id: string | null;
					target_tier: TierLevel | null;
					actual_tier: TierLevel | null;
					target_value: Record<string, unknown> | null;
					actual_value: Record<string, unknown> | null;
					due_date: string | null;
					assigned_by: string | null;
					snapshot_id: string | null;
					swot: Record<string, unknown> | null;
					created_by: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					hierarchy_node_id?: string | null;
					title: string;
					description?: string | null;
					priority?: GoalPriority;
					status?: GoalStatus;
					goal_type?: GoalType;
					goal_origin?: GoalOrigin;
					source_goal_id?: string | null;
					target_tier?: TierLevel | null;
					actual_tier?: TierLevel | null;
					target_value?: Record<string, unknown> | null;
					actual_value?: Record<string, unknown> | null;
					due_date?: string | null;
					assigned_by?: string | null;
					snapshot_id?: string | null;
					swot?: Record<string, unknown> | null;
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					hierarchy_node_id?: string | null;
					title?: string;
					description?: string | null;
					priority?: GoalPriority;
					status?: GoalStatus;
					goal_type?: GoalType;
					goal_origin?: GoalOrigin;
					source_goal_id?: string | null;
					target_tier?: TierLevel | null;
					actual_tier?: TierLevel | null;
					target_value?: Record<string, unknown> | null;
					actual_value?: Record<string, unknown> | null;
					due_date?: string | null;
					assigned_by?: string | null;
					snapshot_id?: string | null;
					swot?: Record<string, unknown> | null;
					created_by?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'org_goals_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_goals_hierarchy_node_id_fkey';
						columns: ['hierarchy_node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_goals_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_goals_assigned_by_fkey';
						columns: ['assigned_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_goals_snapshot_id_fkey';
						columns: ['snapshot_id'];
						isOneToOne: false;
						referencedRelation: 'score_snapshots';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'org_goals_source_goal_id_fkey';
						columns: ['source_goal_id'];
						isOneToOne: false;
						referencedRelation: 'org_goals';
						referencedColumns: ['id'];
					}
				];
			};
			goal_dependencies: {
				Row: {
					id: string;
					goal_id: string;
					depends_on_goal_id: string;
					dependency_type: GoalDependencyType;
					description: string | null;
					created_by: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					goal_id: string;
					depends_on_goal_id: string;
					dependency_type?: GoalDependencyType;
					description?: string | null;
					created_by?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					goal_id?: string;
					depends_on_goal_id?: string;
					dependency_type?: GoalDependencyType;
					description?: string | null;
					created_by?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'goal_dependencies_goal_id_fkey';
						columns: ['goal_id'];
						isOneToOne: false;
						referencedRelation: 'org_goals';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'goal_dependencies_depends_on_goal_id_fkey';
						columns: ['depends_on_goal_id'];
						isOneToOne: false;
						referencedRelation: 'org_goals';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'goal_dependencies_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			goal_adjustments: {
				Row: {
					id: string;
					goal_id: string;
					adjusted_by: string;
					field: string;
					old_value: string | null;
					new_value: string | null;
					reason: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					goal_id: string;
					adjusted_by: string;
					field: string;
					old_value?: string | null;
					new_value?: string | null;
					reason?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					goal_id?: string;
					adjusted_by?: string;
					field?: string;
					old_value?: string | null;
					new_value?: string | null;
					reason?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'goal_adjustments_goal_id_fkey';
						columns: ['goal_id'];
						isOneToOne: false;
						referencedRelation: 'org_goals';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'goal_adjustments_adjusted_by_fkey';
						columns: ['adjusted_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			visibility_grants: {
				Row: {
					id: string;
					organization_id: string;
					grantee_node_id: string;
					scope_node_id: string | null;
					visibility: 'score_only' | 'metrics' | 'full';
					granted_by: string;
					created_at: string;
					revoked_at: string | null;
				};
				Insert: {
					id?: string;
					organization_id: string;
					grantee_node_id: string;
					scope_node_id?: string | null;
					visibility?: 'score_only' | 'metrics' | 'full';
					granted_by: string;
					created_at?: string;
					revoked_at?: string | null;
				};
				Update: {
					id?: string;
					organization_id?: string;
					grantee_node_id?: string;
					scope_node_id?: string | null;
					visibility?: 'score_only' | 'metrics' | 'full';
					granted_by?: string;
					created_at?: string;
					revoked_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'visibility_grants_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'visibility_grants_grantee_node_id_fkey';
						columns: ['grantee_node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'visibility_grants_scope_node_id_fkey';
						columns: ['scope_node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'visibility_grants_granted_by_fkey';
						columns: ['granted_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			placement_requests: {
				Row: {
					id: string;
					organization_id: string;
					user_id: string;
					requested_at: string;
					resolved_at: string | null;
					resolved_by: string | null;
				};
				Insert: {
					id?: string;
					organization_id: string;
					user_id: string;
					requested_at?: string;
					resolved_at?: string | null;
					resolved_by?: string | null;
				};
				Update: {
					id?: string;
					organization_id?: string;
					user_id?: string;
					requested_at?: string;
					resolved_at?: string | null;
					resolved_by?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'placement_requests_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'placement_requests_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'placement_requests_resolved_by_fkey';
						columns: ['resolved_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			metrics: {
				Row: {
					id: string;
					organization_id: string;
					node_id: string;
					assigned_by: string;
					name: string;
					description: string | null;
					measurement_type: MeasurementType;
					measurement_config: Record<string, unknown> | null;
					indicator_type: IndicatorType;
					weight: number | null;
					current_tier: TierLevel | null;
					current_value: Record<string, unknown> | null;
					origin: MetricOrigin;
					origin_detail: string | null;
					sort_order: number;
					approved_at: string | null;
					approved_by: string | null;
					submitted_at: string | null;
					submitted_by: string | null;
					performance_cadence: PerformanceCadence | null;
					locked_by_snapshot_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					node_id: string;
					assigned_by: string;
					name: string;
					description?: string | null;
					measurement_type: MeasurementType;
					measurement_config?: Record<string, unknown> | null;
					indicator_type?: IndicatorType;
					weight?: number | null;
					current_tier?: TierLevel | null;
					current_value?: Record<string, unknown> | null;
					origin: MetricOrigin;
					origin_detail?: string | null;
					sort_order?: number;
					approved_at?: string | null;
					approved_by?: string | null;
					submitted_at?: string | null;
					submitted_by?: string | null;
					performance_cadence?: PerformanceCadence | null;
					locked_by_snapshot_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					node_id?: string;
					assigned_by?: string;
					name?: string;
					description?: string | null;
					measurement_type?: MeasurementType;
					measurement_config?: Record<string, unknown> | null;
					indicator_type?: IndicatorType;
					weight?: number | null;
					current_tier?: TierLevel | null;
					current_value?: Record<string, unknown> | null;
					origin?: MetricOrigin;
					origin_detail?: string | null;
					sort_order?: number;
					approved_at?: string | null;
					approved_by?: string | null;
					submitted_at?: string | null;
					submitted_by?: string | null;
					performance_cadence?: PerformanceCadence | null;
					locked_by_snapshot_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'metrics_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'metrics_node_id_fkey';
						columns: ['node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'metrics_assigned_by_fkey';
						columns: ['assigned_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'metrics_approved_by_fkey';
						columns: ['approved_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			metric_thresholds: {
				Row: {
					id: string;
					metric_id: string;
					tier: TierLevel;
					description: string;
					set_by: string;
					resolution: ThresholdResolution;
					leader_description: string | null;
					superior_description: string | null;
					resolution_note: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					metric_id: string;
					tier: TierLevel;
					description: string;
					set_by: string;
					resolution?: ThresholdResolution;
					leader_description?: string | null;
					superior_description?: string | null;
					resolution_note?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					metric_id?: string;
					tier?: TierLevel;
					description?: string;
					set_by?: string;
					resolution?: ThresholdResolution;
					leader_description?: string | null;
					superior_description?: string | null;
					resolution_note?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'metric_thresholds_metric_id_fkey';
						columns: ['metric_id'];
						isOneToOne: false;
						referencedRelation: 'metrics';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'metric_thresholds_set_by_fkey';
						columns: ['set_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			metric_reviews: {
				Row: {
					id: string;
					metric_id: string;
					reviewer_id: string;
					leader_tier: TierLevel;
					reviewer_tier: TierLevel | null;
					comment: string | null;
					cycle_label: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					metric_id: string;
					reviewer_id: string;
					leader_tier: TierLevel;
					reviewer_tier?: TierLevel | null;
					comment?: string | null;
					cycle_label?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					metric_id?: string;
					reviewer_id?: string;
					leader_tier?: TierLevel;
					reviewer_tier?: TierLevel | null;
					comment?: string | null;
					cycle_label?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'metric_reviews_metric_id_fkey';
						columns: ['metric_id'];
						isOneToOne: false;
						referencedRelation: 'metrics';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'metric_reviews_reviewer_id_fkey';
						columns: ['reviewer_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			score_snapshots: {
				Row: {
					id: string;
					organization_id: string;
					node_id: string;
					composite_score: number;
					composite_tier: TierLevel;
					metric_details: Record<string, unknown>;
					cycle_label: string | null;
					recorded_by: string;
					notes: string | null;
					adjusted_by: string | null;
					adjusted_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					node_id: string;
					composite_score: number;
					composite_tier: TierLevel;
					metric_details: Record<string, unknown>;
					cycle_label?: string | null;
					recorded_by: string;
					notes?: string | null;
					adjusted_by?: string | null;
					adjusted_at?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					node_id?: string;
					composite_score?: number;
					composite_tier?: TierLevel;
					metric_details?: Record<string, unknown>;
					cycle_label?: string | null;
					recorded_by?: string;
					notes?: string | null;
					adjusted_by?: string | null;
					adjusted_at?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'score_snapshots_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'score_snapshots_node_id_fkey';
						columns: ['node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'score_snapshots_recorded_by_fkey';
						columns: ['recorded_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			inquiries: {
				Row: {
					id: string;
					organization_id: string;
					inquiry_type: InquiryType;
					status: InquiryStatus;
					filed_by: string;
					filed_by_node_id: string;
					target_metric_id: string;
					affected_metric_id: string;
					authority_id: string;
					authority_node_id: string;
					challenge_type: ChallengeType;
					rationale: string;
					resolution_summary: string | null;
					resolution_action: ResolutionAction | null;
					resolved_at: string | null;
					resolved_by: string | null;
					filed_at: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					inquiry_type: InquiryType;
					status?: InquiryStatus;
					filed_by: string;
					filed_by_node_id: string;
					target_metric_id: string;
					affected_metric_id: string;
					authority_id: string;
					authority_node_id: string;
					challenge_type: ChallengeType;
					rationale: string;
					resolution_summary?: string | null;
					resolution_action?: ResolutionAction | null;
					resolved_at?: string | null;
					resolved_by?: string | null;
					filed_at?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					inquiry_type?: InquiryType;
					status?: InquiryStatus;
					filed_by?: string;
					filed_by_node_id?: string;
					target_metric_id?: string;
					affected_metric_id?: string;
					authority_id?: string;
					authority_node_id?: string;
					challenge_type?: ChallengeType;
					rationale?: string;
					resolution_summary?: string | null;
					resolution_action?: ResolutionAction | null;
					resolved_at?: string | null;
					resolved_by?: string | null;
					filed_at?: string;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'inquiries_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_filed_by_fkey';
						columns: ['filed_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_filed_by_node_id_fkey';
						columns: ['filed_by_node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_target_metric_id_fkey';
						columns: ['target_metric_id'];
						isOneToOne: false;
						referencedRelation: 'metrics';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_affected_metric_id_fkey';
						columns: ['affected_metric_id'];
						isOneToOne: false;
						referencedRelation: 'metrics';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_authority_id_fkey';
						columns: ['authority_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_authority_node_id_fkey';
						columns: ['authority_node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiries_resolved_by_fkey';
						columns: ['resolved_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			inquiry_comments: {
				Row: {
					id: string;
					inquiry_id: string;
					author_id: string;
					body: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					inquiry_id: string;
					author_id: string;
					body: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					inquiry_id?: string;
					author_id?: string;
					body?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'inquiry_comments_inquiry_id_fkey';
						columns: ['inquiry_id'];
						isOneToOne: false;
						referencedRelation: 'inquiries';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'inquiry_comments_author_id_fkey';
						columns: ['author_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			audit_log: {
				Row: {
					id: string;
					organization_id: string;
					entity_type: AuditEntityType;
					entity_id: string;
					action: AuditAction;
					changed_by: string;
					previous_value: Record<string, unknown> | null;
					new_value: Record<string, unknown> | null;
					context: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					entity_type: AuditEntityType;
					entity_id: string;
					action: AuditAction;
					changed_by: string;
					previous_value?: Record<string, unknown> | null;
					new_value?: Record<string, unknown> | null;
					context?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					entity_type?: AuditEntityType;
					entity_id?: string;
					action?: AuditAction;
					changed_by?: string;
					previous_value?: Record<string, unknown> | null;
					new_value?: Record<string, unknown> | null;
					context?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'audit_log_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'audit_log_changed_by_fkey';
						columns: ['changed_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			licenses: {
				Row: {
					id: string;
					user_id: string;
					purchased_at: string;
					status: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					purchased_at?: string;
					status?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					purchased_at?: string;
					status?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'licenses_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			narrative_events: {
				Row: {
					id: string;
					session_id: string;
					event_type: string;
					event_value: string | null;
					locale: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					event_type: string;
					event_value?: string | null;
					locale: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					event_type?: string;
					event_value?: string | null;
					locale?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			account_events: {
				Row: {
					id: string;
					account_id: string | null;
					license_id: string | null;
					event_type: string;
					error_detail: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					account_id?: string | null;
					license_id?: string | null;
					event_type: string;
					error_detail?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					account_id?: string | null;
					license_id?: string | null;
					event_type?: string;
					error_detail?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'account_events_account_id_fkey';
						columns: ['account_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'account_events_license_id_fkey';
						columns: ['license_id'];
						isOneToOne: false;
						referencedRelation: 'licenses';
						referencedColumns: ['id'];
					}
				];
			};
			demo_events: {
				Row: {
					id: string;
					account_id: string;
					event_type: string;
					event_value: string | null;
					locale: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					account_id: string;
					event_type: string;
					event_value?: string | null;
					locale: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					account_id?: string;
					event_type?: string;
					event_value?: string | null;
					locale?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'demo_events_account_id_fkey';
						columns: ['account_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			purchase_events: {
				Row: {
					id: string;
					account_id: string | null;
					customer_email: string | null;
					event_type: string;
					locale: string | null;
					error_detail: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					account_id?: string | null;
					customer_email?: string | null;
					event_type: string;
					locale?: string | null;
					error_detail?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					account_id?: string | null;
					customer_email?: string | null;
					event_type?: string;
					locale?: string | null;
					error_detail?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'purchase_events_account_id_fkey';
						columns: ['account_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			download_events: {
				Row: {
					id: string;
					account_id: string;
					license_id: string;
					version: string;
					event_type: string;
					error_detail: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					account_id: string;
					license_id: string;
					version: string;
					event_type: string;
					error_detail?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					account_id?: string;
					license_id?: string;
					version?: string;
					event_type?: string;
					error_detail?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'download_events_account_id_fkey';
						columns: ['account_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'download_events_license_id_fkey';
						columns: ['license_id'];
						isOneToOne: false;
						referencedRelation: 'licenses';
						referencedColumns: ['id'];
					}
				];
			};
			performance_logs: {
				Row: {
					id: string;
					organization_id: string;
					node_id: string;
					metric_id: string;
					period_start: string;
					period_end: string;
					cadence: PerformanceCadence;
					measured_value: Record<string, unknown>;
					assessed_tier: TierLevel;
					data_source: string | null;
					notes: string | null;
					recorded_by: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					node_id: string;
					metric_id: string;
					period_start: string;
					period_end: string;
					cadence: PerformanceCadence;
					measured_value: Record<string, unknown>;
					assessed_tier: TierLevel;
					data_source?: string | null;
					notes?: string | null;
					recorded_by: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					organization_id?: string;
					node_id?: string;
					metric_id?: string;
					period_start?: string;
					period_end?: string;
					cadence?: PerformanceCadence;
					measured_value?: Record<string, unknown>;
					assessed_tier?: TierLevel;
					data_source?: string | null;
					notes?: string | null;
					recorded_by?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'performance_logs_organization_id_fkey';
						columns: ['organization_id'];
						isOneToOne: false;
						referencedRelation: 'organizations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'performance_logs_node_id_fkey';
						columns: ['node_id'];
						isOneToOne: false;
						referencedRelation: 'org_hierarchy_nodes';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'performance_logs_metric_id_fkey';
						columns: ['metric_id'];
						isOneToOne: false;
						referencedRelation: 'metrics';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'performance_logs_recorded_by_fkey';
						columns: ['recorded_by'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			tier_level: TierLevel;
			org_role: OrgRole;
			node_type: NodeType;
			cycle_cadence: CycleCadence;
			measurement_type: MeasurementType;
			indicator_type: IndicatorType;
			metric_origin: MetricOrigin;
			threshold_resolution: ThresholdResolution;
			inquiry_type: InquiryType;
			inquiry_status: InquiryStatus;
			challenge_type: ChallengeType;
			resolution_action: ResolutionAction;
			goal_priority: GoalPriority;
			goal_status: GoalStatus;
			goal_type: GoalType;
			goal_dependency_type: GoalDependencyType;
			performance_cadence: PerformanceCadence;
			audit_entity_type: AuditEntityType;
			audit_action: AuditAction;
		};
	};
};

// ============================================================================
// Convenience Types
// ============================================================================

/** Shorthand to access a table's Row type */
export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];

/** Shorthand to access a table's Insert type */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];

/** Shorthand to access a table's Update type */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];

/** Shorthand to access an enum type */
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
