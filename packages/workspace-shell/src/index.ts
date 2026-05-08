/**
 * @henryco/workspace-shell — shared workspace chrome engine.
 *
 * Single source of truth for sidebar / mobile-header / bottom-nav /
 * primitives across every authenticated workspace in HenryCo (studio
 * /client, jobs candidate/employer/recruiter, learn learner/instructor,
 * care staff, property agent, marketplace vendor, logistics dispatch,
 * etc).
 *
 * Hosts wire it up by:
 *   1. Importing the stylesheet once: `@import "@henryco/workspace-shell/styles";`
 *   2. Adding a per-division CSS-variable mapping that redirects --ws-*
 *      tokens onto the host's division tokens (--studio-bg, --jobs-accent, ...)
 *   3. Wrapping the layout's children with <WorkspaceShell ... />.
 *
 * The shell does NOT do auth, data fetching, or routing. It composes
 * chrome from typed props the host provides. Server-component compatible
 * end to end.
 */

export { WorkspaceShell } from "./shell";
export { WorkspaceSidebar } from "./sidebar";
export { WorkspaceMobileHeader } from "./mobile-header";
export { WorkspaceBottomNav } from "./bottom-nav";

export {
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceLinkButton,
  WorkspaceStatusBadge,
  WorkspaceEmptyState,
  WorkspaceDivider,
} from "./primitives";

export type {
  WorkspaceCardProps,
  WorkspaceButtonProps,
  WorkspaceButtonVariant,
  WorkspaceLinkButtonProps,
  WorkspaceStatusBadgeProps,
  WorkspaceEmptyStateProps,
} from "./primitives";

export {
  WorkspaceSkeletonBlock,
  WorkspaceDashboardSkeleton,
  WorkspaceListSkeleton,
  WorkspaceDetailSkeleton,
} from "./skeletons";

export { WorkspaceErrorBoundary } from "./error-boundary";
export type { WorkspaceErrorBoundaryProps } from "./error-boundary";

export { isNavActive, isTakeoverPath } from "./internal";

export type {
  WorkspaceDivision,
  WorkspaceNavItem,
  WorkspaceViewer,
  WorkspaceBrand,
  WorkspaceBadgeMap,
  WorkspaceShellProps,
  WorkspaceTone,
} from "./types";
