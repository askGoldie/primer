<script lang="ts">
	/**
	 * HierarchyBuilder
	 *
	 * Tree-view CRUD surface for an organization's `org_hierarchy_nodes`.
	 * Renders inside the Hierarchy tab of /app/settings.
	 *
	 * Features:
	 *  - Collapsible tree grouped by parent_id
	 *  - Create/edit/delete forms with containment enforcement
	 *  - Reparent via parent picker
	 *  - User assignment dropdown pulled from active org_members
	 *  - Quick-start template wizard for empty orgs (3-8 executives)
	 *  - Undo/redo for mutations
	 *
	 * All mutations go through SvelteKit form actions on the settings page
	 * server — this component is a thin reactive shell over that surface.
	 */

	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { t } from '$lib/i18n/index.js';
	import { CONTAINMENT_RULES, type HierarchyNodeType, type Locale } from '$lib/types/index.js';
	import { validateContainment } from '$lib/hierarchy/containment.js';
	import { HierarchyUndoStore } from '$lib/hierarchy/undo.svelte.js';
	import BulkUpload from './BulkUpload.svelte';

	/** Shape of a hierarchy node as loaded by +page.server.ts */
	interface HierarchyTreeNode {
		id: string;
		parentId: string | null;
		nodeType: HierarchyNodeType;
		name: string;
		title: string | null;
		description: string | null;
		sortOrder: number;
		userId: string | null;
		userName: string | null;
	}

	interface AssignableMember {
		userId: string;
		name: string;
		email: string;
	}

	let {
		nodes,
		members,
		locale
	}: {
		nodes: HierarchyTreeNode[];
		members: AssignableMember[];
		locale: Locale;
	} = $props();

	/** Panel mode: which form (if any) is currently open in the right pane. */
	type PanelMode =
		| { kind: 'none' }
		| { kind: 'create'; parentId: string | null; defaultType: HierarchyNodeType }
		| { kind: 'edit'; nodeId: string };

	let panel = $state<PanelMode>({ kind: 'none' });

	/** Whether the bulk upload surface is visible. */
	let showBulkUpload = $state(false);

	/**
	 * In-flight submission tracker. Holds the name of the action currently
	 * being awaited (e.g. 'create', 'update', 'delete'), or null when idle.
	 *
	 * This is the fix for the "double submit" bug: before this existed, users
	 * clicked Save multiple times while the request was in flight, which
	 * created duplicate rows server-side. Submit buttons now read this flag
	 * to disable themselves and show a spinner until the server responds.
	 */
	let submitting = $state<string | null>(null);

	/**
	 * Transient flash banner. Holds an i18n key for ~3.5s after a mutation,
	 * then auto-clears. `flashIsError` toggles the banner's visual tone so
	 * the same surface can carry both success and failure messages without
	 * swallowing them into a second slot.
	 */
	let flash = $state<string | null>(null);
	let flashIsError = $state<boolean>(false);
	let flashTimer: ReturnType<typeof setTimeout> | null = null;
	function showFlash(key: string, isError = false) {
		flash = key;
		flashIsError = isError;
		if (flashTimer) clearTimeout(flashTimer);
		flashTimer = setTimeout(() => {
			flash = null;
			flashTimer = null;
		}, 3500);
	}

	/**
	 * Build a SvelteKit `use:enhance` callback that:
	 *  - Marks the form as submitting (for spinner + disabled state)
	 *  - Lets SvelteKit's default `update()` run, which already calls
	 *    `invalidateAll()` internally — so we don't double-invalidate
	 *  - Shows a flash banner on success and runs an optional side effect
	 *
	 * Before this helper, each form manually called `invalidateAll()` after
	 * `update()`, which triggered the page's load function twice per submit.
	 * That was redundant and has been removed.
	 */
	/**
	 * Shared undo store for the whole builder — both tree and canvas views
	 * push commands onto it so Ctrl/Cmd+Z walks the same chain regardless
	 * of which view the user was in when they made a mutation.
	 */
	const undoStore = new HierarchyUndoStore();

	function runAction(
		name: string,
		successKey: string,
		onSuccess?: (data: Record<string, unknown> | null) => void
	): SubmitFunction {
		return () => {
			submitting = name;
			return async ({ result, update }) => {
				try {
					await update();
					if (result.type === 'success') {
						showFlash(successKey);
						onSuccess?.((result.data ?? null) as Record<string, unknown> | null);
					} else if (result.type === 'failure') {
						// Server actions return `{ error: 'some.i18n.key' }` — bubble
						// that up as a red flash so the user sees why the op failed
						// (e.g. dissolve refusing an invalid containment promotion).
						const errKey =
							typeof result.data === 'object' && result.data && 'error' in result.data
								? String((result.data as { error?: string }).error ?? 'error.generic')
								: 'error.generic';
						showFlash(errKey, true);
					}
				} finally {
					submitting = null;
				}
			};
		};
	}

	/** Which subtrees are expanded. Default: everything expanded on first render. */
	let expanded = $state<Record<string, boolean>>({});
	$effect(() => {
		// Seed every node as expanded the first time we see it.
		for (const n of nodes) {
			if (expanded[n.id] === undefined) expanded[n.id] = true;
		}
	});

	/** Root nodes (no parent). Sorted by sort_order for stable rendering. */
	const roots = $derived(
		nodes.filter((n) => n.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder)
	);

	/** Direct children lookup by parent id, memoized via $derived. */
	const childrenByParent = $derived.by(() => {
		const map = new SvelteMap<string, HierarchyTreeNode[]>();
		for (const n of nodes) {
			if (!n.parentId) continue;
			if (!map.has(n.parentId)) map.set(n.parentId, []);
			map.get(n.parentId)!.push(n);
		}
		for (const list of map.values()) {
			list.sort((a, b) => a.sortOrder - b.sortOrder);
		}
		return map;
	});

	function getChildren(parentId: string): HierarchyTreeNode[] {
		return childrenByParent.get(parentId) ?? [];
	}

	/**
	 * Valid child types a given parent node can accept. Used to hide
	 * "+ Add" buttons on leaf-only nodes and to populate the type picker.
	 */
	function allowedChildren(parentType: HierarchyNodeType | null): HierarchyNodeType[] {
		if (parentType === null) return ['executive_leader'];
		return CONTAINMENT_RULES[parentType];
	}

	/**
	 * Label for the inline "+ Add …" button next to a node in the tree.
	 * When a parent can only contain one type of child, we name it
	 * specifically (e.g. "Add employee" under a team) so the user knows
	 * what they're creating. When it accepts multiple types, we fall back
	 * to a generic "Add" and let the form's type picker disambiguate.
	 */
	function addChildLabel(parentType: HierarchyNodeType): string {
		const allowed = CONTAINMENT_RULES[parentType];
		if (allowed.length === 1) {
			switch (allowed[0]) {
				case 'department':
					return t(locale, 'hierarchy.add_department');
				case 'team':
					return t(locale, 'hierarchy.add_team');
				case 'individual':
					return t(locale, 'hierarchy.add_employee');
				case 'executive_leader':
					return t(locale, 'hierarchy.add_root');
			}
		}
		return t(locale, 'hierarchy.add_child');
	}

	/**
	 * Valid parent nodes for a given child type. Used by the parent picker
	 * on the create and edit forms. Excludes the node itself and its
	 * descendants (cycle prevention) when editing.
	 */
	function validParentNodes(
		childType: HierarchyNodeType,
		excludeNodeId: string | null
	): { id: string | null; label: string }[] {
		const descendantSet = new SvelteSet<string>();
		if (excludeNodeId) {
			descendantSet.add(excludeNodeId);
			// Walk descendants so we can exclude them from parent choices.
			const stack = [excludeNodeId];
			while (stack.length) {
				const cur = stack.pop()!;
				for (const c of getChildren(cur)) {
					descendantSet.add(c.id);
					stack.push(c.id);
				}
			}
		}
		const out: { id: string | null; label: string }[] = [];
		// Root slot only offered when the child is executive_leader.
		if (validateContainment(childType, null)) {
			out.push({ id: null, label: t(locale, 'hierarchy.root_label') });
		}
		for (const n of nodes) {
			if (descendantSet.has(n.id)) continue;
			if (validateContainment(childType, n.nodeType)) {
				out.push({ id: n.id, label: formatNodeLabel(n) });
			}
		}
		return out;
	}

	function formatNodeLabel(n: HierarchyTreeNode): string {
		return n.title ? `${n.name} (${n.title})` : n.name;
	}

	function nodeTypeLabel(type: HierarchyNodeType): string {
		return t(locale, `hierarchy.type.${type}`);
	}

	function toggle(id: string) {
		expanded[id] = !expanded[id];
	}

	function openCreate(parentId: string | null, parentType: HierarchyNodeType | null) {
		const allowed = allowedChildren(parentType);
		if (allowed.length === 0) return;
		panel = { kind: 'create', parentId, defaultType: allowed[0] };
	}

	function openEdit(nodeId: string) {
		panel = { kind: 'edit', nodeId };
	}

	function closePanel() {
		panel = { kind: 'none' };
	}

	/** The currently-editing node, or undefined if panel is not in edit mode. */
	const editingNode = $derived.by(() => {
		if (panel.kind !== 'edit') return undefined;
		const id = panel.nodeId;
		return nodes.find((n) => n.id === id);
	});

	/** Form state — uncontrolled-ish; we reset via keying the form. */
	let createFormType = $state<HierarchyNodeType>('department');
	$effect(() => {
		if (panel.kind === 'create') {
			createFormType = panel.defaultType;
		}
	});

	/** Delete confirmation modal state. */
	let pendingDeleteId = $state<string | null>(null);
	/** Dissolve confirmation modal state. Shown when the user chooses the
	 * non-destructive alternative to delete from the edit panel. */
	let pendingDissolveId = $state<string | null>(null);
	const pendingDeleteNode = $derived(
		pendingDeleteId ? nodes.find((n) => n.id === pendingDeleteId) : undefined
	);
	const pendingDeleteDescendantCount = $derived.by(() => {
		if (!pendingDeleteId) return 0;
		let count = 0;
		const stack = [pendingDeleteId];
		while (stack.length) {
			const cur = stack.pop()!;
			for (const c of getChildren(cur)) {
				count++;
				stack.push(c.id);
			}
		}
		return count;
	});

	/**
	 * The node the user is trying to dissolve, plus the parent that would
	 * receive its promoted children. Both are derived so the modal stays
	 * in sync with the server's authoritative tree between submissions.
	 */
	const pendingDissolveNode = $derived(
		pendingDissolveId ? nodes.find((n) => n.id === pendingDissolveId) : undefined
	);
	const pendingDissolveParent = $derived.by(() => {
		const dn = pendingDissolveNode;
		if (!dn || !dn.parentId) return undefined;
		return nodes.find((n) => n.id === dn.parentId);
	});
	const pendingDissolveChildCount = $derived.by(() => {
		if (!pendingDissolveId) return 0;
		return getChildren(pendingDissolveId).length;
	});

	/**
	 * Global keyboard shortcuts for undo/redo/search. Ignores keypresses
	 * that originate in a form control (input, textarea, select,
	 * contenteditable) so they don't hijack normal typing-undo.
	 */
	$effect(() => {
		if (typeof window === 'undefined') return;
		function isEditable(target: EventTarget | null): boolean {
			if (!(target instanceof HTMLElement)) return false;
			const tag = target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
			if (target.isContentEditable) return true;
			return false;
		}
		async function onKey(e: KeyboardEvent) {
			// Skip global shortcuts while the user is typing into a field.
			if (isEditable(e.target)) return;
			const metaOrCtrl = e.metaKey || e.ctrlKey;

			// Cmd/Ctrl+Z — undo (Shift variant → redo)
			if (metaOrCtrl && e.key.toLowerCase() === 'z') {
				e.preventDefault();
				if (e.shiftKey) {
					const ok = await undoStore.redo();
					if (ok) showFlash('hierarchy.undo.redo_applied');
					else if (undoStore.canRedo) showFlash('error.generic', true);
				} else {
					const ok = await undoStore.undo();
					if (ok) showFlash('hierarchy.undo.undo_applied');
					else if (undoStore.canUndo) showFlash('error.generic', true);
				}
				return;
			}
			// Cmd/Ctrl+Y — alternative redo (Windows convention)
			if (metaOrCtrl && e.key.toLowerCase() === 'y') {
				e.preventDefault();
				const ok = await undoStore.redo();
				if (ok) showFlash('hierarchy.undo.redo_applied');
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	/** Valid reparent targets for the currently edited node. */
	const editParentOptions = $derived(
		editingNode ? validParentNodes(editingNode.nodeType, editingNode.id) : []
	);

	/** Valid parent targets for the in-progress create form. */
	const createParentOptions = $derived(
		panel.kind === 'create' ? validParentNodes(createFormType, null) : []
	);
</script>

{#if flash}
	<!--
		Flash banner — shared between success (accent2 green) and failure
		(red) outcomes. aria-live=polite so screen readers announce without
		hijacking focus.
	-->
	<div
		role="status"
		aria-live="polite"
		class="mb-4 rounded-lg border px-4 py-2 text-sm {flashIsError
			? 'border-red-500/40 bg-red-500/10 text-red-500'
			: 'border-accent2/30 bg-accent2/10 text-accent2'}"
	>
		{t(locale, flash)}
	</div>
{/if}

{#if nodes.length === 0}
	<!-- Empty org — show the template wizard -->
	<div class="rounded-lg border border-border bg-surfaceMid p-6">
		<h3 class="text-base font-medium text-primary">
			{t(locale, 'hierarchy.template.heading')}
		</h3>
		<p class="mt-1 text-sm text-secondary">
			{t(locale, 'hierarchy.template.description')}
		</p>
		<form
			method="POST"
			action="?/populateHierarchyTemplate"
			use:enhance={runAction('template', 'hierarchy.success_template')}
			class="mt-4 flex flex-wrap items-end gap-3"
		>
			<div>
				<label for="template-exec-count" class="mb-1 block text-xs font-medium text-secondary">
					{t(locale, 'hierarchy.template.exec_count_label')}
				</label>
				<select
					id="template-exec-count"
					name="executiveCount"
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				>
					{#each [3, 4, 5, 6, 7, 8] as n (n)}
						<option value={n}>
							{t(locale, 'hierarchy.template.exec_count_option', { count: String(n) })}
						</option>
					{/each}
				</select>
			</div>
			<button
				type="submit"
				disabled={submitting === 'template'}
				class="inline-flex items-center gap-2 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if submitting === 'template'}
					{@render spinner()}
					{t(locale, 'hierarchy.saving')}
				{:else}
					{t(locale, 'hierarchy.template.submit')}
				{/if}
			</button>
		</form>

		<div class="mt-4 border-t border-border pt-4">
			<button
				type="button"
				class="text-sm font-medium text-accent1 hover:text-accent1/80"
				onclick={() => (showBulkUpload = !showBulkUpload)}
			>
				{t(locale, showBulkUpload ? 'hierarchy.bulk.hide' : 'hierarchy.bulk.show')}
			</button>
		</div>

		{#if showBulkUpload}
			<div class="mt-4">
				<BulkUpload {nodes} {locale} onClose={() => (showBulkUpload = false)} />
			</div>
		{/if}
	</div>
{:else}
	<!--
		Populated chart. Layout:
		  [ undo/redo + "+ add root" row ]
		  [ tree list | side panel (form) ]
	-->
	<div class="mb-3 flex flex-wrap items-center justify-end gap-2">
		<div class="flex items-center gap-2">
			<!--
				Undo / redo pills. Disabled when their respective stacks are
				empty so the pill also serves as a discoverability signal
				for the Ctrl+Z / Ctrl+Shift+Z shortcuts printed in tooltip.
			-->
			<button
				type="button"
				class="rounded-lg border border-border bg-surfaceMid px-3 py-1 text-xs font-medium text-primary hover:bg-surfaceHigh disabled:cursor-not-allowed disabled:opacity-40"
				disabled={!undoStore.canUndo}
				title={t(locale, 'hierarchy.undo.undo_title')}
				onclick={async () => {
					const ok = await undoStore.undo();
					if (ok) showFlash('hierarchy.undo.undo_applied');
				}}
			>
				↶ {t(locale, 'hierarchy.undo.undo')}
				{#if undoStore.topUndoLabel}
					<span class="ml-1 text-secondary"
						>· {t(locale, undoStore.topUndoLabel.key, undoStore.topUndoLabel.args)}</span
					>
				{/if}
			</button>
			<button
				type="button"
				class="rounded-lg border border-border bg-surfaceMid px-3 py-1 text-xs font-medium text-primary hover:bg-surfaceHigh disabled:cursor-not-allowed disabled:opacity-40"
				disabled={!undoStore.canRedo}
				title={t(locale, 'hierarchy.undo.redo_title')}
				onclick={async () => {
					const ok = await undoStore.redo();
					if (ok) showFlash('hierarchy.undo.redo_applied');
				}}
			>
				↷ {t(locale, 'hierarchy.undo.redo')}
			</button>

			{#if roots.length === 0 || (roots.length > 0 && roots[0].nodeType === 'executive_leader')}
				<button
					type="button"
					class="text-xs font-medium text-accent1 hover:text-accent1/80"
					onclick={() => openCreate(null, null)}
				>
					+ {t(locale, 'hierarchy.add_root')}
				</button>
			{/if}

			<button
				type="button"
				class="text-xs font-medium text-accent1 hover:text-accent1/80"
				onclick={() => (showBulkUpload = !showBulkUpload)}
			>
				{t(locale, showBulkUpload ? 'hierarchy.bulk.hide' : 'hierarchy.bulk.show')}
			</button>
		</div>
	</div>

	{#if showBulkUpload}
		<div class="mb-4">
			<BulkUpload {nodes} {locale} onClose={() => (showBulkUpload = false)} />
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
		<!-- Main column: collapsible tree list -->
		<div class="min-w-0">
			<div class="rounded-lg border border-border bg-surfaceMid p-4">
				<h3 class="mb-3 text-base font-medium text-primary">
					{t(locale, 'hierarchy.tree_heading')}
				</h3>
				<ul class="space-y-1 text-sm">
					{#each roots as root (root.id)}
						{@render treeItem(root, 0)}
					{/each}
				</ul>
			</div>
		</div>

		{@render rightColumn()}
	</div>
{/if}

{#if pendingDissolveNode && pendingDissolveParent}
	<!--
		Dissolve confirmation modal. Shows the user exactly what will
		happen — the node vanishes and its direct children get re-parented
		to the grandparent. Child subtrees stay intact.
	-->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md rounded-lg border border-border bg-surface p-6">
			<h3 class="text-base font-medium text-primary">
				{t(locale, 'hierarchy.dissolve_confirm_heading')}
			</h3>
			<p class="mt-2 text-sm text-secondary">
				{t(locale, 'hierarchy.dissolve_confirm_body', {
					name: pendingDissolveNode.name,
					count: String(pendingDissolveChildCount),
					parent: pendingDissolveParent.name
				})}
			</p>
			<form
				method="POST"
				action="?/dissolveHierarchyNode"
				use:enhance={runAction('dissolve', 'hierarchy.success_dissolved', (data) => {
					pendingDissolveId = null;
					panel = { kind: 'none' };
					// Server returns the full pre-dissolve node + child ids
					// so we can build an inverse-restore command.
					const dissolvedNode = data?.dissolvedNode as
						| {
								id: string;
								parent_id: string | null;
								node_type: 'executive_leader' | 'department' | 'team' | 'individual';
								name: string;
								title: string | null;
								description: string | null;
								user_id: string | null;
								position_x: number;
								position_y: number;
								sort_order: number;
						  }
						| undefined;
					const promotedChildIds = (data?.promotedChildIds as string[]) ?? [];
					if (dissolvedNode) {
						undoStore.push({
							kind: 'dissolve',
							dissolvedNode,
							promotedChildIds,
							labelKey: 'hierarchy.undo.dissolve_label',
							labelArgs: { name: dissolvedNode.name }
						});
					}
				})}
				class="mt-4 flex justify-end gap-2"
			>
				<input type="hidden" name="nodeId" value={pendingDissolveNode.id} />
				<button
					type="button"
					disabled={submitting === 'dissolve'}
					class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh disabled:cursor-not-allowed disabled:opacity-60"
					onclick={() => (pendingDissolveId = null)}
				>
					{t(locale, 'action.cancel')}
				</button>
				<button
					type="submit"
					disabled={submitting === 'dissolve'}
					class="inline-flex items-center gap-2 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if submitting === 'dissolve'}
						{@render spinner()}
						{t(locale, 'hierarchy.saving')}
					{:else}
						{t(locale, 'hierarchy.dissolve_confirm_submit')}
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}

{#if pendingDeleteNode}
	<!-- Delete confirmation modal -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md rounded-lg border border-border bg-surface p-6">
			<h3 class="text-base font-medium text-primary">
				{t(locale, 'hierarchy.delete_confirm_heading')}
			</h3>
			<p class="mt-2 text-sm text-secondary">
				{t(locale, 'hierarchy.delete_confirm_body', {
					name: pendingDeleteNode.name,
					count: String(pendingDeleteDescendantCount)
				})}
			</p>
			<form
				method="POST"
				action="?/deleteHierarchyNode"
				use:enhance={runAction('delete', 'hierarchy.success_deleted', () => {
					pendingDeleteId = null;
					panel = { kind: 'none' };
				})}
				class="mt-4 flex justify-end gap-2"
			>
				<input type="hidden" name="nodeId" value={pendingDeleteNode.id} />
				<button
					type="button"
					disabled={submitting === 'delete'}
					class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh disabled:cursor-not-allowed disabled:opacity-60"
					onclick={() => (pendingDeleteId = null)}
				>
					{t(locale, 'action.cancel')}
				</button>
				<button
					type="submit"
					disabled={submitting === 'delete'}
					class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if submitting === 'delete'}
						{@render spinner()}
						{t(locale, 'hierarchy.saving')}
					{:else}
						{t(locale, 'hierarchy.delete_confirm_submit')}
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}

{#snippet rightColumn()}
	<div class="flex min-h-0 flex-col gap-4 overflow-y-auto">
		<div class="rounded-lg border border-border bg-surfaceMid p-4">
			{#if panel.kind === 'none'}
				<p class="text-sm text-secondary">
					{t(locale, 'hierarchy.panel_empty')}
				</p>
			{:else if panel.kind === 'create'}
				{@render createForm(panel.parentId)}
			{:else if panel.kind === 'edit' && editingNode}
				{@render editForm(editingNode)}
			{/if}
		</div>
	</div>
{/snippet}

{#snippet treeItem(node: HierarchyTreeNode, depth: number)}
	{@const children = getChildren(node.id)}
	{@const canAddChild = allowedChildren(node.nodeType).length > 0}
	<li>
		<div
			class="flex items-center gap-2 rounded px-2 py-1 hover:bg-surfaceHigh/60"
			style:padding-left="{depth * 16 + 8}px"
		>
			{#if children.length > 0}
				<button
					type="button"
					class="flex h-5 w-5 items-center justify-center text-xs text-secondary hover:text-primary"
					onclick={() => toggle(node.id)}
					aria-label={expanded[node.id]
						? t(locale, 'hierarchy.collapse')
						: t(locale, 'hierarchy.expand')}
				>
					{expanded[node.id] ? '▾' : '▸'}
				</button>
			{:else}
				<span class="inline-block h-5 w-5"></span>
			{/if}

			<span class="flex-1 truncate text-sm text-primary">
				<span class="font-medium">{node.name}</span>
				{#if node.title}
					<span class="text-xs text-secondary"> · {node.title}</span>
				{/if}
				{#if node.userName}
					<span class="ml-1 text-xs text-secondary">· {node.userName}</span>
				{/if}
			</span>

			<span
				class="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-secondary uppercase"
			>
				{nodeTypeLabel(node.nodeType)}
			</span>

			<button
				type="button"
				class="text-xs text-accent1 hover:text-accent1/80"
				onclick={() => openEdit(node.id)}
			>
				{t(locale, 'action.edit')}
			</button>
			{#if canAddChild}
				<button
					type="button"
					class="text-xs text-accent1 hover:text-accent1/80"
					onclick={() => openCreate(node.id, node.nodeType)}
				>
					+ {addChildLabel(node.nodeType)}
				</button>
			{/if}
		</div>
		{#if expanded[node.id] && children.length > 0}
			<ul class="space-y-1">
				{#each children as child (child.id)}
					{@render treeItem(child, depth + 1)}
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

{#snippet createForm(parentId: string | null)}
	<div class="flex items-center justify-between">
		<h3 class="text-base font-medium text-primary">
			{t(locale, 'hierarchy.create_heading')}
		</h3>
		<button type="button" class="text-xs text-secondary hover:text-primary" onclick={closePanel}>
			{t(locale, 'action.cancel')}
		</button>
	</div>
	<form
		method="POST"
		action="?/createHierarchyNode"
		use:enhance={runAction('create', 'hierarchy.success_created', (data) => {
			panel = { kind: 'none' };
			// Push an inverse-delete command onto the undo stack. The
			// server returns the new nodeId precisely so we can do this
			// without guessing which row is new.
			const nodeId = (data?.nodeId as string | undefined) ?? null;
			if (nodeId) {
				undoStore.push({
					kind: 'create',
					nodeId,
					labelKey: 'hierarchy.undo.create_label'
				});
			}
		})}
		class="mt-4 space-y-3"
	>
		<div>
			<label for="create-type" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_type')}
			</label>
			<select
				id="create-type"
				name="nodeType"
				bind:value={createFormType}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			>
				{#each ['executive_leader', 'department', 'team', 'individual'] as HierarchyNodeType[] as nt (nt)}
					<option value={nt}>{nodeTypeLabel(nt)}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="create-parent" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_parent')}
			</label>
			<select
				id="create-parent"
				name="parentId"
				value={parentId ?? ''}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			>
				{#each createParentOptions as opt (opt.id ?? 'root')}
					<option value={opt.id ?? ''}>{opt.label}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="create-name" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_name')}
			</label>
			<input
				id="create-name"
				name="name"
				type="text"
				required
				maxlength="200"
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			/>
		</div>

		<div>
			<label for="create-title" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_title')}
			</label>
			<input
				id="create-title"
				name="title"
				type="text"
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			/>
		</div>

		<div>
			<label for="create-description" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_description')}
			</label>
			<textarea
				id="create-description"
				name="description"
				rows="2"
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			></textarea>
		</div>

		<div>
			<label for="create-user" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_user')}
			</label>
			<select
				id="create-user"
				name="userId"
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			>
				<option value="">{t(locale, 'hierarchy.field_user_none')}</option>
				{#each members as m (m.userId)}
					<option value={m.userId}>{m.name}</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-secondary/80">
				{t(locale, 'hierarchy.field_user_hint')}
			</p>
		</div>

		<button
			type="submit"
			disabled={submitting === 'create'}
			class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{#if submitting === 'create'}
				{@render spinner()}
				{t(locale, 'hierarchy.saving')}
			{:else}
				{t(locale, 'hierarchy.create_submit')}
			{/if}
		</button>
	</form>
{/snippet}

{#snippet editForm(node: HierarchyTreeNode)}
	<div class="flex items-center justify-between">
		<h3 class="text-base font-medium text-primary">
			{t(locale, 'hierarchy.edit_heading')}
		</h3>
		<button type="button" class="text-xs text-secondary hover:text-primary" onclick={closePanel}>
			{t(locale, 'action.cancel')}
		</button>
	</div>

	<!-- Update form -->
	<form
		method="POST"
		action="?/updateHierarchyNode"
		use:enhance={(submitEvent) => {
			// Snapshot pre-state at submit time so the undo command can
			// restore the previous values on invert. Taken here (not in
			// the success callback) because `node` may have changed by
			// the time the server response lands if another edit came in.
			const previous = {
				name: node.name,
				title: node.title,
				description: node.description,
				userId: node.userId
			};
			const next = {
				name: (submitEvent.formData.get('name') as string) ?? '',
				title: (submitEvent.formData.get('title') as string) || null,
				description: (submitEvent.formData.get('description') as string) || null,
				userId: (submitEvent.formData.get('userId') as string) || null
			};
			return runAction('update', 'hierarchy.success_updated', () => {
				panel = { kind: 'none' };
				undoStore.push({
					kind: 'update',
					nodeId: node.id,
					previous,
					next,
					labelKey: 'hierarchy.undo.update_label',
					labelArgs: { name: previous.name }
				});
			})(submitEvent);
		}}
		class="mt-4 space-y-3"
	>
		<input type="hidden" name="nodeId" value={node.id} />

		<div>
			<span class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_type')}
			</span>
			<span class="text-sm text-primary">{nodeTypeLabel(node.nodeType)}</span>
		</div>

		<div>
			<label for="edit-name" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_name')}
			</label>
			<input
				id="edit-name"
				name="name"
				type="text"
				required
				maxlength="200"
				value={node.name}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			/>
		</div>

		<div>
			<label for="edit-title" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_title')}
			</label>
			<input
				id="edit-title"
				name="title"
				type="text"
				value={node.title ?? ''}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			/>
		</div>

		<div>
			<label for="edit-description" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_description')}
			</label>
			<textarea
				id="edit-description"
				name="description"
				rows="2"
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
				>{node.description ?? ''}</textarea
			>
		</div>

		<div>
			<label for="edit-user" class="mb-1 block text-xs font-medium text-secondary">
				{t(locale, 'hierarchy.field_user')}
			</label>
			<select
				id="edit-user"
				name="userId"
				value={node.userId ?? ''}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			>
				<option value="">{t(locale, 'hierarchy.field_user_none')}</option>
				{#each members as m (m.userId)}
					<option value={m.userId}>{m.name}</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-secondary/80">
				{t(locale, 'hierarchy.field_user_hint')}
			</p>
		</div>

		<button
			type="submit"
			disabled={submitting === 'update'}
			class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{#if submitting === 'update'}
				{@render spinner()}
				{t(locale, 'hierarchy.saving')}
			{:else}
				{t(locale, 'action.save')}
			{/if}
		</button>
	</form>

	<!-- Reparent form -->
	<div class="mt-6 border-t border-border pt-4">
		<h4 class="text-sm font-medium text-primary">
			{t(locale, 'hierarchy.reparent_heading')}
		</h4>
		<form
			method="POST"
			action="?/reparentHierarchyNode"
			use:enhance={(submitEvent) => {
				// Capture the before-parent so the undo command can put
				// the node back where it came from. Read from `node`
				// because the parentId SELECT's current value is what
				// we're moving TO, not from.
				const previousParentId = node.parentId;
				const newParentIdRaw = (submitEvent.formData.get('parentId') as string) ?? '';
				const newParentId = newParentIdRaw === '' ? null : newParentIdRaw;
				return runAction('reparent', 'hierarchy.success_reparented', () => {
					undoStore.push({
						kind: 'reparent',
						nodeId: node.id,
						previousParentId,
						newParentId,
						labelKey: 'hierarchy.undo.reparent_label',
						labelArgs: { name: node.name }
					});
				})(submitEvent);
			}}
			class="mt-2 flex gap-2"
		>
			<input type="hidden" name="nodeId" value={node.id} />
			<select
				name="parentId"
				value={node.parentId ?? ''}
				class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
			>
				{#each editParentOptions as opt (opt.id ?? 'root')}
					<option value={opt.id ?? ''}>{opt.label}</option>
				{/each}
			</select>
			<button
				type="submit"
				disabled={submitting === 'reparent'}
				class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if submitting === 'reparent'}
					{@render spinner()}
					{t(locale, 'hierarchy.saving')}
				{:else}
					{t(locale, 'hierarchy.reparent_submit')}
				{/if}
			</button>
		</form>
	</div>

	<!--
		Destructive zone: Dissolve (promote children) vs Delete (cascade).
		Both trigger confirm modals rather than firing the form directly.
		Dissolve is disabled when the node is a root — no valid parent to
		promote children to.
	-->
	<div class="mt-6 flex flex-col gap-2 border-t border-border pt-4">
		<button
			type="button"
			class="text-left text-sm font-medium text-primary hover:text-accent1 disabled:cursor-not-allowed disabled:opacity-40"
			disabled={node.parentId === null}
			onclick={() => (pendingDissolveId = node.id)}
		>
			{t(locale, 'hierarchy.dissolve')}
		</button>
		<button
			type="button"
			class="text-left text-sm font-medium text-red-500 hover:text-red-400"
			onclick={() => (pendingDeleteId = node.id)}
		>
			{t(locale, 'hierarchy.delete')}
		</button>
	</div>
{/snippet}

{#snippet spinner()}
	<!--
		Tiny inline loading indicator shown inside submit buttons while an
		action is in flight. Uses Tailwind's animate-spin utility; the SVG
		is standard Heroicons-style to avoid pulling in an icon library.
	-->
	<svg
		class="h-4 w-4 animate-spin"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
		></circle>
		<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
	</svg>
{/snippet}
