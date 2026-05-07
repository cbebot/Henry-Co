/**
 * @rail/default — parallel-route slot for the WorkspaceRail.
 *
 * V2-DASH-01 G7 ships an empty default. DASH-2 introduces the
 * module registry and replaces this default with a server component
 * that calls `getEligibleModules(viewer)` and renders the
 * WorkspaceRail with module entries.
 *
 * Returning null from the slot is a Next.js App Router convention
 * for "render nothing" — the layout still receives the prop, the
 * tree just collapses to an empty fragment.
 */
export default function RailDefault(): null {
  return null;
}
