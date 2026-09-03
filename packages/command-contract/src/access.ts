import type { AttentionItem, StaffDivision } from "./types";

/**
 * A staging stand-in for the real `UnifiedViewer` (`@henryco/auth`). It mirrors
 * the real predicate NAMES — `hasOwnerAccess` ⇔ `is_owner()`/super_admin,
 * `hasStaffAccess` ⇔ `is_platform_staff()`/`is_staff_in(any)`, `staffDivisions`
 * ⇔ the set of `is_staff_in(division)` — WITHOUT importing any server-only code,
 * so the access boundary is provable on staging with mocked sessions. At live
 * wiring (V3-COMMAND-03) this is replaced by the real viewer and SQL predicates;
 * the gating call sites and `visibleItems` logic do not change.
 */
export type MockViewer = {
  kind: "owner" | "staff" | "customer";
  hasOwnerAccess: boolean;
  hasStaffAccess: boolean;
  staffDivisions: readonly StaffDivision[];
};

/** A pure-owner session (super_admin, no staff lane). */
export function ownerViewer(): MockViewer {
  return { kind: "owner", hasOwnerAccess: true, hasStaffAccess: false, staffDivisions: [] };
}

/** A staff session scoped to the given divisions (`is_staff_in` set). */
export function staffViewer(divisions: readonly StaffDivision[]): MockViewer {
  return { kind: "staff", hasOwnerAccess: false, hasStaffAccess: true, staffDivisions: divisions };
}

/** A customer session — denied both operator surfaces. */
export function customerViewer(): MockViewer {
  return { kind: "customer", hasOwnerAccess: false, hasStaffAccess: false, staffDivisions: [] };
}

/** Gate for the Owner Command Center (`apps/command`). */
export function canViewCommandCenter(viewer: MockViewer): boolean {
  return viewer.hasOwnerAccess;
}

/** Gate for the Staff Workspace (`apps/work`). */
export function canViewStaffWorkspace(viewer: MockViewer): boolean {
  return viewer.hasStaffAccess;
}

function staffCanSee(viewer: MockViewer, item: AttentionItem): boolean {
  if (item.surface === "owner") return false; // owner-only items never reach staff
  const scope = item.staffScope ?? [];
  const divisions = new Set<string>(viewer.staffDivisions);
  return scope.some((division) => divisions.has(division));
}

/**
 * The items a viewer may see. The owner sees the full firehose; staff see
 * `staff`/`both` items intersected with their divisions; a customer sees
 * nothing. Owner access takes precedence (an owner who is also staff still
 * sees everything).
 */
export function visibleItems(
  viewer: MockViewer,
  items: readonly AttentionItem[],
): AttentionItem[] {
  if (viewer.hasOwnerAccess) return [...items];
  if (viewer.hasStaffAccess) return items.filter((item) => staffCanSee(viewer, item));
  return [];
}
