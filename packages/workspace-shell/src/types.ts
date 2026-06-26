import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AppLocale } from "@henryco/i18n";

/**
 * Supported workspace divisions. Each one carries a `data-workspace-division`
 * attribute on the shell root, which the host app's stylesheet uses to map
 * the generic --ws-* tokens onto its own division tokens (--studio-bg,
 * --jobs-accent, etc).
 *
 * Adding a new division here is the only required code change to onboard
 * a new workspace surface; the host app supplies the CSS mapping.
 */
export type WorkspaceDivision =
  | "studio"
  | "jobs-candidate"
  | "jobs-employer"
  | "jobs-recruiter"
  | "learn-learner"
  | "learn-instructor"
  | "learn-owner"
  | "care"
  | "property"
  | "property-agent"
  | "marketplace"
  | "marketplace-vendor"
  | "logistics-customer"
  | "logistics-business"
  | "logistics-dispatch"
  | "logistics-rider"
  | "account"
  | "hub-staff";

/**
 * Single nav item. `icon` is required so every workspace renders a
 * recognisable glyph — the previous "every link uses the same Sparkles"
 * regression in jobs taught us that.
 *
 * `matchPrefix` (optional) lets a parent route "own" its sub-routes.
 * Eg. /candidate/applications/[id] highlights the Applications link.
 */
export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
  /** Render a numeric/dot indicator next to this link. Useful for unread
   * counts, pending invoices, etc. The shell handles the visual; the host
   * passes the number via `badges` keyed by href. */
  hasIndicator?: boolean;
  /** Optional tooltip / aria-description for icons that aren't fully
   * obvious — eg. "Files" with a generic file icon. */
  description?: string;
};

/**
 * Minimal viewer profile rendered in the sidebar viewer card and the
 * mobile-header profile chip. The shell does NOT fetch this — the host
 * passes whatever its auth gate returned.
 */
export type WorkspaceViewer = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  initials?: string;
};

/**
 * Brand strip displayed in the sidebar header and the mobile header.
 * Kept tiny so we don't bake studio-specific decisions into the shell.
 */
export type WorkspaceBrand = {
  /** Short label (eg. "Studio portal", "Candidate hub", "Vendor console"). */
  shortName: string;
  /** Tiny kicker above the short name (eg. "HenryCo"). */
  kicker?: string;
  /** Optional href the brand chip links to (defaults to the first nav item). */
  href?: string;
  /** Optional Lucide icon for the brand square. Defaults to Sparkles. */
  icon?: LucideIcon;
};

/**
 * Numeric badge map keyed by nav-item href. The shell renders the number
 * next to the matching nav link in both the sidebar and the bottom-nav.
 *
 *   { "/client/messages": 3, "/client/payments": 2 }
 */
export type WorkspaceBadgeMap = Record<string, number>;

/**
 * Public surface of the WorkspaceShell. The host orchestrates auth +
 * data fetching; the shell renders chrome.
 *
 * Server-component compatible — every prop is serialisable except
 * `children` which Next handles.
 */
export type WorkspaceShellProps = {
  /** Division token. Sets `data-workspace-division` on the root and lets
   * the host CSS map the generic --ws-* tokens onto division tokens. */
  division: WorkspaceDivision;

  /** Top-of-sidebar brand strip + mobile-header brand. */
  brand: WorkspaceBrand;

  /** Authenticated viewer for the sidebar viewer card + profile chip. */
  viewer: WorkspaceViewer;

  /** Full nav list shown in the desktop sidebar. */
  navigation: WorkspaceNavItem[];

  /** Subset shown in the mobile bottom-nav (typically 4-5 highest-frequency
   * surfaces). Defaults to the first 5 items of `navigation`. */
  mobileNavigation?: WorkspaceNavItem[];

  /** Numeric counts rendered as badges next to nav items. */
  badges?: WorkspaceBadgeMap;

  /** Total "needs your action" count rendered on the mobile bell + the
   * sidebar attention banner. */
  attentionCount?: number;

  /** Where the bell + the sidebar attention banner navigate to. Defaults
   * to the first nav item; usually an in-app /notifications surface. */
  notificationsHref?: string;

  /** Where the mobile profile chip navigates to. Defaults to the last
   * nav item with label matching /profile|settings/i. */
  profileHref?: string;

  /** External account-settings URL (typically the shared HenryCo account
   * dashboard). Rendered in the sidebar viewer card footer. */
  accountSettingsUrl?: string;

  /** Routes that opt out of the standard chrome and render full-bleed
   * (eg. /client/messages takeover). The shell short-circuits chrome
   * for these and just renders children. */
  takeoverPrefixes?: string[];

  /** Current request pathname. Required so the shell knows when to apply
   * a takeover and which nav item is active. The host typically reads
   * this from headers (x-pathname stamped by middleware/proxy). */
  pathname: string;

  /** Optional children rendered above the brand strip in the sidebar.
   * Used by hosts that want to render a division switcher OR an area
   * badge (eg. jobs renders an icon+title+subtitle pill at the top). */
  sidebarTopSlot?: ReactNode;

  /** Optional right-rail content. When set the layout switches to
   * three columns at lg+: sidebar (left) → main (center) → rail (right).
   * Hidden on mobile/tablet — the rail content stacks below `children`. */
  rightRail?: ReactNode;

  /** Active UI locale for the shell chrome copy (nav aria-labels, the
   * attention banner, viewer fallbacks, etc). Defaults to "en". */
  locale?: AppLocale;

  /** Optional content rendered as the page body. */
  children: ReactNode;
};

/**
 * Common visual tone vocabulary. Every variant in the shell reads the
 * same tone token to stay consistent.
 */
export type WorkspaceTone = "neutral" | "good" | "warn" | "danger" | "info";
