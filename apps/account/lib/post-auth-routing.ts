/**
 * V2-DASH-01 G8 — back-compat barrel for `@/lib/post-auth-routing`.
 *
 * Source of truth: `@henryco/auth/server`. This file used to carry
 * the full 411-line implementation; DASH-1 promoted it to
 * `packages/auth/` so the IdentityBar role-switcher and the
 * chooser POST handler share one resolver (closes anti-pattern #7,
 * audit §A.3-2 / §C.1-1).
 *
 * Existing call sites in apps/account/app/{login,auth/*,api/auth/*}
 * keep their `from "@/lib/post-auth-routing"` imports working via
 * this barrel. New code should import from `@henryco/auth/server`
 * directly so the package boundary stays explicit.
 *
 * Behaviour parity: the new implementation is a verbatim port of the
 * pre-DASH-1 logic. The admin Supabase client reads the same env
 * vars (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`),
 * the access-snapshot reader joins the same five tables
 * (`profiles` + `owner_profiles` + four per-division
 * `*_role_memberships`), and `decideDashboardResolution` honours the
 * same `next` / `preferredDashboardKey` precedence.
 */

export type {
  DashboardRole,
  DashboardOption,
  DashboardResolution,
  AccessSnapshot,
} from "@henryco/auth";

export { DASHBOARD_PREFERENCE_COOKIE } from "@henryco/auth";

export {
  decideDashboardResolution,
  resolveUserDashboard,
  resolveAuthenticatedDestination,
  loadDashboardOptions,
} from "@henryco/auth/server";
