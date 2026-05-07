/**
 * @henryco/auth — unified identity + dashboard routing for the HenryCo
 * ecosystem.
 *
 * Source of truth for the four anti-pattern-#7 audit findings (§A.3-2,
 * §C.1-1): a single TypeScript surface that wraps Supabase + the SQL
 * `is_staff_in()` predicate, so per-app `lib/<vertical>/auth.ts` files
 * no longer reimplement role logic in TS.
 *
 * Default barrel — types ONLY. Server functionality lives at
 * `@henryco/auth/server` to keep the boundary explicit (server-only
 * imports cannot accidentally leak into client bundles via this barrel).
 *
 * Import patterns:
 *
 *   // Client component — types only:
 *   import type { DashboardRole, AccessSnapshot } from "@henryco/auth";
 *
 *   // Server component / server action:
 *   import { requireUnifiedViewer, resolveUserDashboard } from "@henryco/auth/server";
 *
 *   // Server action setting the preference cookie:
 *   import { setDashboardPreference } from "@henryco/auth/cookies";
 */

export type {
  AccessSnapshot,
  DashboardOption,
  DashboardPreference,
  DashboardResolution,
  DashboardRole,
  StaffDivision,
  StaffDivisionMembership,
  UnifiedViewer,
  ViewerRoles,
} from "./types";

export {
  DASHBOARD_PREFERENCE_COOKIE,
  DASHBOARD_PREFERENCE_VALUES,
} from "./types";
