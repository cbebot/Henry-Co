/**
 * Shared identity + dashboard-routing types for the HenryCo ecosystem.
 *
 * Client-safe — no Supabase imports, no `server-only` directive. Types here
 * cross the server/client boundary freely (e.g. the IdentityBar reads a
 * resolved AccessSnapshot from a server component and renders the role
 * pill on the client).
 *
 * Source of truth: this file. `apps/account/lib/post-auth-routing.ts`
 * re-exports these for back-compat with prior call sites.
 */

/**
 * The five lanes a HenryCo viewer can land in. `customer` = personal
 * account; `staff` = cross-division operator; `division_operator` = staff
 * with access to exactly one division; `super_admin` = owner-tier
 * privilege; `owner` reserved for the future when owner identity becomes
 * a first-class lane (today owners route through `super_admin`).
 */
export type DashboardRole = "customer" | "staff" | "division_operator" | "super_admin";

/**
 * One option shown to a multi-role user on the chooser screen. The `key`
 * is the surface (`customer` / `staff` / `owner`) the user picks; `role`
 * is the resolved DashboardRole that surface maps to for the user (e.g.
 * a single-division staff member picking `staff` resolves to
 * `division_operator`).
 */
export type DashboardOption = {
  key: "customer" | "staff" | "owner";
  role: DashboardRole;
  title: string;
  description: string;
  href: string;
};

/**
 * The output of post-auth routing. Either land them somewhere directly,
 * or hand off to the chooser screen for ambiguous (multi-role) users.
 */
export type DashboardResolution =
  | { kind: "redirect"; role: DashboardRole; redirectUrl: string }
  | { kind: "chooser"; chooserUrl: string; options: DashboardOption[] };

/**
 * The access snapshot every routing + identity decision is derived from.
 * Computed once via `readAccessSnapshot()` (server-only) and passed into
 * pure decision functions.
 *
 * `staffDivisionCount` enables the single-division → `division_operator`
 * promotion in `buildDashboardOptions`.
 */
export type AccessSnapshot = {
  hasOwnerAccess: boolean;
  hasStaffAccess: boolean;
  staffDivisionCount: number;
  ownerRole: string | null;
  profileRole: string | null;
};

/**
 * The unified viewer object the shell consumes. Composed of the
 * authenticated Supabase user + the access snapshot + the resolved
 * DashboardRole.
 *
 * `requireUnifiedViewer()` returns this; null is never returned (the
 * helper redirects unauthenticated callers to the login page).
 */
export type UnifiedViewer = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
  };
  access: AccessSnapshot;
  /**
   * The viewer's resolved primary role for the CURRENT request. Drives
   * which workspace surfaces are listed and which `getDashboardSummary()`
   * branch fires.
   */
  role: DashboardRole;
  /**
   * Coarse-grain viewer kind for downstream consumers that don't care
   * about the customer/staff division distinction.
   */
  kind: "customer" | "staff" | "owner";
};

/**
 * The shape `getViewerRoles()` returns. Mirrors the AccessSnapshot but
 * adds the actual division memberships (not just count) for surfaces
 * that need the list (e.g. the staff workspace rail picking which
 * division entries to render).
 */
export type ViewerRoles = {
  hasOwnerAccess: boolean;
  hasStaffAccess: boolean;
  staffDivisionCount: number;
  staffDivisions: ReadonlyArray<StaffDivisionMembership>;
  staffMemberships: ReadonlyArray<StaffDivisionMembership>;
  ownerRole: string | null;
  profileRole: string | null;
};

/**
 * One staff membership row resolved from the per-division role tables
 * (`marketplace_role_memberships`, `studio_role_memberships`, etc.) or
 * from the `profiles.role` legacy fallback for divisions without a
 * dedicated table (care, logistics, jobs, hub, staff, account, security,
 * system).
 *
 * `source` distinguishes the two paths so callers can decide whether to
 * surface the membership uniformly or differentiate per source.
 */
export type StaffDivisionMembership = {
  division: StaffDivision;
  role: string;
  source: "division_table" | "legacy_profile";
};

/**
 * The 12 staff divisions the SQL `is_staff_in()` predicate recognises
 * (per `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:300-307`).
 *
 * NOTE: `account` and `system` are organisation-wide operator surfaces,
 * not customer-facing divisions. They appear here because `is_staff_in()`
 * accepts them — but they will not appear in division-membership readouts
 * unless the caller has the org-wide operator role.
 */
export type StaffDivision =
  | "marketplace"
  | "studio"
  | "property"
  | "learn"
  | "logistics"
  | "jobs"
  | "care"
  | "hub"
  | "staff"
  | "account"
  | "security"
  | "system";

/**
 * Cookie name for the remembered dashboard preference. The chooser POST
 * handler writes this; the IdentityBar role-switcher writes this; the
 * resolver reads this on subsequent visits to skip the chooser.
 *
 * 90-day Max-Age, scoped to `.henrycogroup.com` so it crosses subdomains.
 * Set via `setDashboardPreference()` in `./cookies.ts`.
 */
export const DASHBOARD_PREFERENCE_COOKIE = "hc_dash_pref";

/**
 * The values the preference cookie may carry. Anything else is treated
 * as absent.
 */
export const DASHBOARD_PREFERENCE_VALUES = ["customer", "staff", "owner"] as const;

export type DashboardPreference = (typeof DASHBOARD_PREFERENCE_VALUES)[number];

/**
 * Cookie name for `hc_session_state` — V3-01 transport-layer signal of
 * the viewer's session lifecycle. Written by the refresh middleware on
 * every request; read by SSR + the client-side `subscribeSessionState`
 * helper for cross-tab soft signals.
 *
 * NOT a security boundary. Supabase's httpOnly session cookie remains
 * the only thing trusted for authentication. This cookie exists so
 * server components can branch on signed-in-ness without round-
 * tripping to Supabase, and the client can react softly to lifecycle
 * changes without a hard refresh.
 *
 * `signed-in`         — access token valid (refreshed if needed).
 * `signed-in-stale`   — auth still valid but profile/role data may be
 *                       stale (e.g., role granted in another tab, this
 *                       tab hasn't re-fetched yet).
 * `signed-out`        — no session present.
 * `reauth-required`   — refresh failed; user must re-authenticate.
 */
export const HC_SESSION_STATE_COOKIE = "hc_session_state";

export const SESSION_STATE_VALUES = [
  "signed-in",
  "signed-in-stale",
  "signed-out",
  "reauth-required",
] as const;

export type SessionState = (typeof SESSION_STATE_VALUES)[number];
