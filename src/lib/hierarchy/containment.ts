/**
 * Hierarchy Containment Validation
 *
 * Thin wrapper around the `VALID_PARENTS` map in `$lib/types` that returns
 * true/false for a given (child, parent) pair. Used by both the server
 * (to reject malformed mutations) and the client (to hide/disable invalid
 * parent choices in the Hierarchy tab form).
 *
 * @see /docs/hierarchy-system-reference.md §3.2 for the source-of-truth rules
 */

import { VALID_PARENTS, type HierarchyNodeType } from "$lib/types/index.js";

/**
 * Check whether a child of `nodeType` is allowed to sit under a parent
 * of `parentType`. A `null` parent is only legal for `executive_leader`.
 *
 * @example
 * validateContainment('team', 'department')       // true
 * validateContainment('team', 'executive_leader') // false
 * validateContainment('executive_leader', null)   // true
 */
export function validateContainment(
  nodeType: HierarchyNodeType,
  parentType: HierarchyNodeType | null,
): boolean {
  if (parentType === null) {
    return nodeType === "executive_leader";
  }
  return VALID_PARENTS[nodeType].includes(parentType);
}
