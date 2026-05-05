# Organizational Hierarchy & Goals System Reference

A reusable system for building organizational hierarchies with strict containment rules, goal management with SWOT analysis, multi-user access control, and visual canvas positioning.

---

## 1. Architecture Overview

The system consists of five layers:

1. **Database** - PostgreSQL tables with RLS policies (designed for Supabase)
2. **Types** - TypeScript interfaces and containment rule definitions
3. **API** - CRUD functions using Supabase client
4. **State Management** - Reactive stores (original uses Svelte 5 runes, adapt to your framework)
5. **Templates** - Pre-built org chart structures for quick-start population

---

## 2. Data Model

### 2.1 Hierarchy Nodes (`org_hierarchy_nodes`)

The core table storing all nodes in a self-referencing tree structure.

```sql
CREATE TABLE org_hierarchy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'executive_leader', 'department', 'team', 'individual'
  )),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  title TEXT,
  description TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Key design decisions:**

- `parent_id` self-references for tree structure; `NULL` means root node
- `ON DELETE CASCADE` on `parent_id` ensures deleting a node removes its entire subtree
- `position_x`/`position_y` support visual canvas layout
- `is_collapsed` tracks visual expand/collapse state
- `sort_order` controls sibling ordering

**Recommended indexes:**

```sql
CREATE INDEX idx_hierarchy_nodes_org ON org_hierarchy_nodes(organization_id);
CREATE INDEX idx_hierarchy_nodes_parent ON org_hierarchy_nodes(parent_id);
CREATE INDEX idx_hierarchy_nodes_type ON org_hierarchy_nodes(organization_id, node_type);
```

### 2.2 Goals (`org_goals`)

Goals can be attached to any hierarchy node or exist at the organization level.

```sql
CREATE TABLE org_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hierarchy_node_id UUID REFERENCES org_hierarchy_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('defined', 'in_progress', 'completed', 'deferred')) DEFAULT 'defined',
  swot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Key design decisions:**

- `hierarchy_node_id` is nullable - `NULL` means an organization-level goal
- `swot` is JSONB to store structured SWOT analysis data
- Cascading delete removes goals when their parent node is deleted

**Recommended indexes:**

```sql
CREATE INDEX idx_org_goals_org ON org_goals(organization_id);
CREATE INDEX idx_org_goals_node ON org_goals(hierarchy_node_id);
```

### 2.3 Organization Members (`org_members`)

Multi-user access control with role-based permissions.

```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  assigned_by UUID REFERENCES user_profiles(user_id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  removal_reason TEXT,
  UNIQUE (organization_id, user_id)
);
```

**Key design decisions:**

- Soft-delete via `removed_at` (not hard delete) to preserve audit trail
- Three roles: `owner` (full control), `editor` (read/write), `viewer` (read-only)
- `assigned_by` tracks who granted access

**Recommended indexes:**

```sql
CREATE INDEX idx_org_members_org ON org_members(organization_id);
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_active ON org_members(organization_id) WHERE removed_at IS NULL;
```

### 2.4 Updated-at Trigger

Auto-update timestamps on row modification:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER org_hierarchy_nodes_updated_at
  BEFORE UPDATE ON org_hierarchy_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER org_goals_updated_at
  BEFORE UPDATE ON org_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 3. Node Types & Containment Rules

### 3.1 Four Node Types

| Type               | Purpose                                         | Can be root?                    |
| ------------------ | ----------------------------------------------- | ------------------------------- |
| `executive_leader` | Top-level leadership (CEO, President)           | Yes (only type allowed at root) |
| `department`       | Organizational divisions (Finance, Engineering) | No                              |
| `team`             | Working groups within departments               | No                              |
| `individual`       | Individual contributors / roles                 | No                              |

### 3.2 Containment Rules

Strict parent-child relationships enforced at the application layer:

```typescript
// What children each node type can contain
const CONTAINMENT_RULES = {
	executive_leader: ['department'],
	department: ['department', 'team', 'individual'],
	team: ['individual'],
	individual: [] // leaf nodes, no children
};

// What parent types each node type can have
const VALID_PARENTS = {
	executive_leader: ['root'], // only at root level
	department: ['executive_leader', 'department'], // nested departments allowed
	team: ['department'], // must be under a department
	individual: ['department', 'team'] // under department or team
};
```

**Validation function:**

```typescript
function validateContainment(nodeType: string, parentType: string | null): boolean {
	if (parentType === null) {
		return nodeType === 'executive_leader';
	}
	const validParents = VALID_PARENTS[nodeType];
	return validParents?.includes(parentType) || false;
}
```

### 3.3 Example Valid Hierarchy

```
executive_leader: "CEO / President"
├── department: "Finance" (title: "CFO")
│   └── team: "Accounting"
├── department: "Operations" (title: "COO")
│   ├── department: "Office Management / HR"   ← nested department
│   └── team: "Production / Service"
│       └── individual: "Staff / Associates"
└── department: "Sales" (title: "Sales Manager")
    └── team: "Account Executives"
        └── individual: "Senior Account Executive"
```

---

## 4. Type Definitions

```typescript
export type HierarchyNodeType = 'executive_leader' | 'department' | 'team' | 'individual';

export interface HierarchyNode {
	id: string;
	organization_id: string;
	parent_id: string | null;
	node_type: HierarchyNodeType;
	name: string;
	title: string | null;
	description: string | null;
	position_x: number;
	position_y: number;
	is_collapsed: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
	children_count?: number; // computed client-side
}

export interface Goal {
	id: string;
	organization_id: string;
	hierarchy_node_id: string | null; // null = organization-level goal
	title: string;
	description: string | null;
	priority: 'low' | 'medium' | 'high';
	status: 'defined' | 'in_progress' | 'completed' | 'deferred';
	swot: SwotData | null;
	created_at: string;
	updated_at: string;
	level_type?: HierarchyNodeType | 'organization'; // computed for display
	level_name?: string; // computed for display
}

export interface SwotData {
	direct_benefits: string[];
	indirect_benefits: string[];
	acceptable_costs: string[];
	unacceptable_costs: string[];
}

export interface CanvasViewport {
	x: number;
	y: number;
	zoom: number;
}

export interface UndoAction {
	type: 'create' | 'delete' | 'update' | 'reparent' | 'reposition';
	nodeId: string;
	previousState: Partial<HierarchyNode>;
	deletedSubtree?: HierarchyNode[]; // for undoing deletes
}
```

---

## 5. Access Control (Row-Level Security)

### 5.1 Permission Check Functions

```sql
-- Check if user is organization owner (creator or owner role)
CREATE OR REPLACE FUNCTION is_org_owner(org_uuid UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_uuid AND created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_uuid
      AND user_id = auth.uid()
      AND role = 'owner'
      AND removed_at IS NULL
  );
END;
$$;

-- Check any active membership
CREATE OR REPLACE FUNCTION is_org_member(org_uuid UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN is_org_owner(org_uuid) OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_uuid
      AND user_id = auth.uid()
      AND removed_at IS NULL
  );
END;
$$;

-- Check editor-or-above access
CREATE OR REPLACE FUNCTION is_org_editor(org_uuid UUID) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN is_org_owner(org_uuid) OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
      AND removed_at IS NULL
  );
END;
$$;
```

### 5.2 RLS Policy Matrix

| Table                 | SELECT                                | INSERT                        | UPDATE                        | DELETE                        |
| --------------------- | ------------------------------------- | ----------------------------- | ----------------------------- | ----------------------------- |
| `org_members`         | Super admin, org owner, or own row    | Super admin only              | Super admin only              | Super admin only              |
| `org_hierarchy_nodes` | Super admin, org owner, or any member | Super admin, owner, or editor | Super admin, owner, or editor | Super admin, owner, or editor |
| `org_goals`           | Super admin or any member             | Super admin or editor         | Super admin or editor         | Super admin or editor         |

### 5.3 RLS Policies (full SQL)

```sql
-- Hierarchy nodes
CREATE POLICY "hierarchy_nodes_select" ON org_hierarchy_nodes
  FOR SELECT USING (
    (select is_super_admin()) OR is_org_owner(organization_id) OR is_org_member(organization_id)
  );
CREATE POLICY "hierarchy_nodes_insert" ON org_hierarchy_nodes
  FOR INSERT WITH CHECK (
    (select is_super_admin()) OR is_org_owner(organization_id) OR is_org_editor(organization_id)
  );
CREATE POLICY "hierarchy_nodes_update" ON org_hierarchy_nodes
  FOR UPDATE USING (
    (select is_super_admin()) OR is_org_owner(organization_id) OR is_org_editor(organization_id)
  );
CREATE POLICY "hierarchy_nodes_delete" ON org_hierarchy_nodes
  FOR DELETE USING (
    (select is_super_admin()) OR is_org_owner(organization_id) OR is_org_editor(organization_id)
  );

-- Goals
CREATE POLICY "org_goals_select" ON org_goals
  FOR SELECT USING (
    (select is_super_admin()) OR is_org_member(organization_id)
  );
CREATE POLICY "org_goals_insert" ON org_goals
  FOR INSERT WITH CHECK (
    (select is_super_admin()) OR is_org_editor(organization_id)
  );
CREATE POLICY "org_goals_update" ON org_goals
  FOR UPDATE USING (
    (select is_super_admin()) OR is_org_editor(organization_id)
  );
CREATE POLICY "org_goals_delete" ON org_goals
  FOR DELETE USING (
    (select is_super_admin()) OR is_org_editor(organization_id)
  );
```

---

## 6. API Layer

### 6.1 Hierarchy Node Operations

```typescript
// Fetch all nodes for an organization, sorted by sort_order
getHierarchyNodes(supabase, orgId): Promise<HierarchyNode[]>

// Create a new node
createHierarchyNode(supabase, orgId, {
  parent_id: string | null,
  node_type: HierarchyNodeType,
  name: string,
  title?: string,
  description?: string,
  position_x?: number,
  position_y?: number
}): Promise<HierarchyNode>

// Update non-structural fields
updateHierarchyNode(supabase, nodeId, {
  name?, title?, description?, is_collapsed?, position_x?, position_y?, sort_order?
}): Promise<HierarchyNode>

// Delete node (cascades to children via FK)
deleteHierarchyNode(supabase, nodeId): Promise<void>

// Move node to a new parent (validate containment rules first)
reparentHierarchyNode(supabase, nodeId, newParentId): Promise<HierarchyNode>

// Batch update positions for canvas layout
batchUpdatePositions(supabase, orgId, [
  { id, position_x, position_y }
]): Promise<void>
```

### 6.2 Goal Operations

```typescript
// Fetch goals with optional filters
getGoals(supabase, orgId, {
  hierarchy_node_id?: string,
  priority?: string,
  status?: string
}): Promise<Goal[]>

// Create a goal (org-level if hierarchy_node_id is null)
createGoal(supabase, orgId, {
  hierarchy_node_id?: string | null,
  title: string,
  description?: string,
  priority?: 'low' | 'medium' | 'high'
}): Promise<Goal>

// Update goal properties
updateGoal(supabase, goalId, {
  title?, description?, priority?, status?, swot?
}): Promise<Goal>

// Delete a goal
deleteGoal(supabase, goalId): Promise<void>
```

---

## 7. State Management Pattern

The store manages nodes as a flat array and derives tree structure client-side.

### 7.1 Core State

| Field            | Type              | Purpose                        |
| ---------------- | ----------------- | ------------------------------ |
| `nodes`          | `HierarchyNode[]` | Flat array of all loaded nodes |
| `selectedNodeId` | `string \| null`  | Currently selected node        |
| `viewport`       | `CanvasViewport`  | Canvas zoom/pan state          |
| `undoStack`      | `UndoAction[]`    | Undo history                   |
| `redoStack`      | `UndoAction[]`    | Redo history                   |
| `loading`        | `boolean`         | Loading state                  |

### 7.2 Derived State

```typescript
selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
rootNodes = nodes.filter((n) => n.parent_id === null);
```

### 7.3 Tree Traversal Helpers

```typescript
// Get direct children of a node
function getChildren(nodeId: string): HierarchyNode[] {
	return nodes.filter((n) => n.parent_id === nodeId);
}

// Get entire subtree (recursive)
function getSubtree(nodeId: string): HierarchyNode[] {
	const result: HierarchyNode[] = [];
	const children = getChildren(nodeId);
	for (const child of children) {
		result.push(child);
		result.push(...getSubtree(child.id));
	}
	return result;
}
```

### 7.4 Undo/Redo Pattern

Every mutation pushes to `undoStack` and clears `redoStack`:

- **create**: stores `{ type: 'create', nodeId, previousState: {} }`
- **update**: stores `{ type: 'update', nodeId, previousState: <full previous node> }`
- **delete**: stores `{ type: 'delete', nodeId, previousState: <node>, deletedSubtree: <all descendants> }`
- **reparent**: stores `{ type: 'reparent', nodeId, previousState: <node with old parent_id> }`
- **reposition**: stores `{ type: 'reposition', nodeId, previousState: <node with old position> }`

### 7.5 Goal Store State

| Field           | Type                                         | Purpose                             |
| --------------- | -------------------------------------------- | ----------------------------------- |
| `goals`         | `Goal[]`                                     | All goals for the organization      |
| `filteredGoals` | `Goal[]` (derived)                           | Goals after applying active filters |
| `filters`       | `{ hierarchy_node_id?, priority?, status? }` | Active filter criteria              |
| `loading`       | `boolean`                                    | Loading state                       |

---

## 8. Hierarchy Templates (Quick-Start Population)

Templates provide pre-built org structures scaled by executive count (3-8).

### 8.1 Template Structure

```typescript
interface HierarchyTemplateNode {
	node_type: HierarchyNodeType;
	name: string;
	title?: string;
	children?: HierarchyTemplateNode[];
}

function getHierarchyTemplate(executiveCount: number): HierarchyTemplateNode[];
```

### 8.2 Progressive Department Inclusion

| Executive Count | Departments Included                   |
| --------------- | -------------------------------------- |
| 3               | Finance (CFO), Operations (COO), Sales |
| 4               | + Marketing (Marketing Director)       |
| 5               | + Technology (CTO)                     |
| 6               | + Human Resources (HR Director)        |
| 7               | + Legal & Compliance (General Counsel) |
| 8               | + Product (VP Product)                 |

All templates share a single `executive_leader` root: "CEO / President".

### 8.3 Template Population Algorithm

To populate a hierarchy from a template, recursively walk the template tree and create nodes:

```typescript
async function populateFromTemplate(
	supabase: SupabaseClient,
	orgId: string,
	executiveCount: number
) {
	const template = getHierarchyTemplate(executiveCount);

	async function createSubtree(nodes: HierarchyTemplateNode[], parentId: string | null) {
		for (const tpl of nodes) {
			const node = await createHierarchyNode(supabase, orgId, {
				parent_id: parentId,
				node_type: tpl.node_type,
				name: tpl.name,
				title: tpl.title
			});
			if (tpl.children?.length) {
				await createSubtree(tpl.children, node.id);
			}
		}
	}

	await createSubtree(template, null);
}
```

---

## 9. API Endpoints

### 9.1 Hierarchy Nodes

| Method   | Path                                     | Purpose                             |
| -------- | ---------------------------------------- | ----------------------------------- |
| `GET`    | `/api/hierarchy/[orgId]/nodes`           | List all nodes for organization     |
| `POST`   | `/api/hierarchy/[orgId]/nodes`           | Create node (validates containment) |
| `PATCH`  | `/api/hierarchy/nodes/[nodeId]`          | Update node properties              |
| `DELETE` | `/api/hierarchy/nodes/[nodeId]`          | Delete node + subtree               |
| `PATCH`  | `/api/hierarchy/nodes/[nodeId]/reparent` | Move node to new parent             |
| `PATCH`  | `/api/hierarchy/[orgId]/positions`       | Batch update canvas positions       |

### 9.2 Goals

| Method   | Path                          | Purpose                             |
| -------- | ----------------------------- | ----------------------------------- |
| `GET`    | `/api/[orgId]/goals`          | List goals (supports query filters) |
| `POST`   | `/api/[orgId]/goals`          | Create goal                         |
| `PATCH`  | `/api/[orgId]/goals/[goalId]` | Update goal                         |
| `DELETE` | `/api/[orgId]/goals/[goalId]` | Delete goal                         |

---

## 10. UI Features Checklist

When implementing the frontend, the reference system includes:

- **Canvas view**: Zoomable/pannable SVG canvas with drag-to-position nodes
- **Tree view**: Collapsible tree list as alternate display
- **Node editor modal**: Create/edit nodes with type, name, title, description
- **Connection lines**: Visual parent-child relationship lines (SVG paths)
- **Canvas toolbar**: Zoom controls, auto-layout, zoom-to-fit, reset
- **Quick-start wizard**: Select executive count to populate from template
- **Goal modal**: Attach goals to any hierarchy level with SWOT analysis
- **Goal cards/list**: Filterable by node, priority, status
- **SWOT quadrants**: Four-quadrant display (direct benefits, indirect benefits, acceptable costs, unacceptable costs)
- **Undo/redo**: Full mutation history with keyboard shortcuts
- **PDF export**: Export hierarchy visualization

---

## 11. Adaptation Notes

When porting to a new project:

1. **Database**: The SQL is Supabase/PostgreSQL-specific. Adapt `auth.uid()`, `gen_random_uuid()`, and RLS policies for your auth system.
2. **API client**: Replace `SupabaseClient` calls with your ORM/query builder. The API signatures remain the same.
3. **State management**: The store pattern (flat array + derived tree) works in any framework. Replace Svelte 5 runes (`$state`, `$derived`) with your framework's reactivity (React useState, Vue ref, etc.).
4. **Containment rules**: Enforce in both API endpoints (server-side validation) and UI (disable invalid parent selections). The rules map is the source of truth.
5. **Templates**: The template data structure is framework-agnostic. Adjust department names/roles for your domain.
6. **`is_super_admin()` / `is_assessment_admin()`**: These functions are referenced in RLS policies but defined elsewhere. You'll need your own admin role system.
