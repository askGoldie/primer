/**
 * Hierarchy builder undo/redo store
 *
 * Classic command pattern: every reversible hierarchy mutation gets pushed
 * onto an undoStack as a command object that knows how to run its own
 * inverse. Ctrl/Cmd+Z pops one and runs it; Ctrl/Cmd+Shift+Z reverses.
 *
 * Design decisions worth calling out for maintainers:
 *
 *   1. **Client-side only.** No server-side "undo" API. Each command's
 *      `undo()` method composes existing server actions (reparent,
 *      restoreHierarchyNode, etc.). This means undo semantics are
 *      "replay the inverse server action" rather than "roll back a
 *      transaction" — much simpler, and robust to multi-user edits.
 *
 *   2. **Delete is explicitly non-undoable.** The UI confirms cascade
 *      delete before submission and communicates that it can't be
 *      undone. Including DELETE in the stack would require reviving
 *      cascaded subtrees (goals, metrics, scores) which currently
 *      hard-cascade in the FK graph.
 *
 *   3. **Dissolve IS undoable** via the `restoreHierarchyNode` server
 *      action, which re-inserts the dissolved node with its original
 *      UUID and pulls the promoted children back under it.
 *
 *   4. **SessionStorage persistence.** The stacks survive refresh
 *      within a tab (sessionStorage) but not across tabs, which matches
 *      the mental model users have from other canvas editors.
 *
 *   6. **Stack depth 50.** Enough for real workflow reorgs; beyond this
 *      the memory + serialization cost outweighs the value of going
 *      further back in time.
 *
 * @see /docs/hierarchy-system-reference.md §4 (UndoAction type in spec)
 * @see https://www.esveo.com/en/blog/undo-redo-and-the-command-pattern/
 */

import { invalidateAll } from "$app/navigation";

/** Max number of commands held in each stack. Older ones are dropped. */
const MAX_STACK_DEPTH = 50;

const STORAGE_KEY = "primer.hierarchy.undo";

/**
 * A hierarchy-mutation command. Each variant carries the minimal state
 * needed to reverse itself. The `label` is a human-readable i18n key
 * shown in the undo pill ("Undo 'Move Sales'").
 */
export type HierarchyCommand =
  | {
      kind: "create";
      nodeId: string;
      labelKey: string;
      labelArgs?: Record<string, string>;
    }
  | {
      kind: "update";
      nodeId: string;
      previous: {
        name: string;
        title: string | null;
        description: string | null;
        userId: string | null;
      };
      next: {
        name: string;
        title: string | null;
        description: string | null;
        userId: string | null;
      };
      labelKey: string;
      labelArgs?: Record<string, string>;
    }
  | {
      kind: "reparent";
      nodeId: string;
      previousParentId: string | null;
      newParentId: string | null;
      labelKey: string;
      labelArgs?: Record<string, string>;
    }
  | {
      kind: "dissolve";
      // Full node snapshot so restore can re-insert with original id.
      dissolvedNode: {
        id: string;
        parent_id: string | null;
        node_type: "executive_leader" | "department" | "team" | "individual";
        name: string;
        title: string | null;
        description: string | null;
        user_id: string | null;
        position_x: number;
        position_y: number;
        sort_order: number;
      };
      promotedChildIds: string[];
      labelKey: string;
      labelArgs?: Record<string, string>;
    };

/**
 * POSTs a SvelteKit form action and returns true on 2xx. Avoids bringing
 * in the enhance runtime here — the undo store runs in response to
 * keyboard events, not form submissions, so we hand-roll the fetch.
 */
async function submitAction(action: string, fd: FormData): Promise<boolean> {
  const res = await fetch(`?/${action}`, {
    method: "POST",
    body: fd,
    headers: { "x-sveltekit-action": "true" },
  });
  return res.ok;
}

/**
 * Execute the inverse of a command by composing existing server actions.
 * Returns true on success so the caller can decide whether to push the
 * command onto the opposite stack.
 */
async function invertCommand(cmd: HierarchyCommand): Promise<boolean> {
  switch (cmd.kind) {
    case "create": {
      // Inverse of create = delete the just-created node. This IS an
      // exception to the "delete is not undoable" rule: we're undoing
      // a user's own just-made creation, so cascading nothing extra
      // is expected. The node has no children yet in practice.
      const fd = new FormData();
      fd.set("nodeId", cmd.nodeId);
      const ok = await submitAction("deleteHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
    case "update": {
      const fd = new FormData();
      fd.set("nodeId", cmd.nodeId);
      fd.set("name", cmd.previous.name);
      fd.set("title", cmd.previous.title ?? "");
      fd.set("description", cmd.previous.description ?? "");
      fd.set("userId", cmd.previous.userId ?? "");
      const ok = await submitAction("updateHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
    case "reparent": {
      const fd = new FormData();
      fd.set("nodeId", cmd.nodeId);
      fd.set("parentId", cmd.previousParentId ?? "");
      const ok = await submitAction("reparentHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
    case "dissolve": {
      // Inverse of dissolve = restore: re-insert the node + pull
      // children back underneath it.
      const fd = new FormData();
      fd.set("node", JSON.stringify(cmd.dissolvedNode));
      fd.set("childIds", JSON.stringify(cmd.promotedChildIds));
      const ok = await submitAction("restoreHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
  }
}

/**
 * Re-apply a command — used for redo after undo. For most kinds this
 * means reverse of the inverse, i.e. replay the forward shape.
 */
async function replayCommand(cmd: HierarchyCommand): Promise<boolean> {
  switch (cmd.kind) {
    case "create": {
      // Re-apply create would require re-inserting with the original id,
      // which restoreHierarchyNode does. Treat replay of create as a
      // restore with no children.
      const fd = new FormData();
      // The caller didn't capture the full node data for a fresh create,
      // but the just-undone delete cleared the node. Without the full
      // node snapshot, we can't replay. Pop the redo chain for this
      // command kind — it's a known corner case; users rarely redo a
      // create-then-undo sequence.
      void fd;
      console.warn("Redo of create is not supported; drop this command.");
      return false;
    }
    case "update": {
      const fd = new FormData();
      fd.set("nodeId", cmd.nodeId);
      fd.set("name", cmd.next.name);
      fd.set("title", cmd.next.title ?? "");
      fd.set("description", cmd.next.description ?? "");
      fd.set("userId", cmd.next.userId ?? "");
      const ok = await submitAction("updateHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
    case "reparent": {
      const fd = new FormData();
      fd.set("nodeId", cmd.nodeId);
      fd.set("parentId", cmd.newParentId ?? "");
      const ok = await submitAction("reparentHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
    case "dissolve": {
      // Re-apply dissolve: just call dissolve again on the newly-restored node.
      const fd = new FormData();
      fd.set("nodeId", cmd.dissolvedNode.id);
      const ok = await submitAction("dissolveHierarchyNode", fd);
      if (ok) await invalidateAll();
      return ok;
    }
  }
}

interface PersistedStacks {
  undo: HierarchyCommand[];
  redo: HierarchyCommand[];
}

function loadPersisted(): PersistedStacks {
  if (typeof sessionStorage === "undefined") return { undo: [], redo: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { undo: [], redo: [] };
    const parsed = JSON.parse(raw) as PersistedStacks;
    if (!Array.isArray(parsed.undo) || !Array.isArray(parsed.redo)) {
      return { undo: [], redo: [] };
    }
    return parsed;
  } catch {
    return { undo: [], redo: [] };
  }
}

function persist(state: PersistedStacks): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or disabled — silently skip */
  }
}

/**
 * Reactive store exposing undo/redo stacks + push/undo/redo operations.
 * Instantiate once at the HierarchyBuilder component level and pass
 * down to children via props. Using a class so each mount gets its own
 * stacks and runes work correctly.
 */
export class HierarchyUndoStore {
  #undo = $state<HierarchyCommand[]>([]);
  #redo = $state<HierarchyCommand[]>([]);
  #busy = $state<boolean>(false);

  constructor() {
    const persisted = loadPersisted();
    this.#undo = persisted.undo;
    this.#redo = persisted.redo;
  }

  /** Public read-only view of the undo stack (for toolbar label). */
  get undoStack(): readonly HierarchyCommand[] {
    return this.#undo;
  }
  get redoStack(): readonly HierarchyCommand[] {
    return this.#redo;
  }
  get canUndo(): boolean {
    return this.#undo.length > 0 && !this.#busy;
  }
  get canRedo(): boolean {
    return this.#redo.length > 0 && !this.#busy;
  }
  get busy(): boolean {
    return this.#busy;
  }

  /** The top of the undo stack — drives the toolbar pill label. */
  get topUndoLabel(): { key: string; args?: Record<string, string> } | null {
    const top = this.#undo[this.#undo.length - 1];
    if (!top) return null;
    return { key: top.labelKey, args: top.labelArgs };
  }

  /**
   * Record a forward mutation. Clears the redo stack — any redo chain
   * was built against a historical state that no longer holds after
   * this new mutation.
   */
  push(cmd: HierarchyCommand): void {
    this.#undo = [...this.#undo, cmd].slice(-MAX_STACK_DEPTH);
    this.#redo = [];
    persist({ undo: this.#undo, redo: this.#redo });
  }

  /** Undo the most recent recorded mutation, if any. */
  async undo(): Promise<boolean> {
    if (!this.canUndo) return false;
    const cmd = this.#undo[this.#undo.length - 1];
    this.#busy = true;
    try {
      const ok = await invertCommand(cmd);
      if (ok) {
        this.#undo = this.#undo.slice(0, -1);
        this.#redo = [...this.#redo, cmd].slice(-MAX_STACK_DEPTH);
        persist({ undo: this.#undo, redo: this.#redo });
      }
      return ok;
    } finally {
      this.#busy = false;
    }
  }

  /** Redo the most recently undone mutation, if any. */
  async redo(): Promise<boolean> {
    if (!this.canRedo) return false;
    const cmd = this.#redo[this.#redo.length - 1];
    this.#busy = true;
    try {
      const ok = await replayCommand(cmd);
      if (ok) {
        this.#redo = this.#redo.slice(0, -1);
        this.#undo = [...this.#undo, cmd].slice(-MAX_STACK_DEPTH);
        persist({ undo: this.#undo, redo: this.#redo });
      }
      return ok;
    } finally {
      this.#busy = false;
    }
  }

  /** Wipe both stacks. Useful on view-mode change if desired. */
  clear(): void {
    this.#undo = [];
    this.#redo = [];
    persist({ undo: [], redo: [] });
  }
}
