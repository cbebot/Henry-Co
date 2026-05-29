/**
 * @henryco/dashboard-shell — public surface.
 *
 * The unified shell primitive package: tokens, components, contracts,
 * and chrome composition. Every later DASH phase consumes from here.
 *
 * Imports are scoped via the package's `exports` map:
 *   import { Panel } from "@henryco/dashboard-shell/components";
 *   import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
 *   import { IdentityBar } from "@henryco/dashboard-shell/shell";
 *
 * The default barrel below re-exports the most-used surfaces for
 * convenience; explicit subpath imports are encouraged for tree-shaking
 * clarity.
 */

// Tokens (typed records, no runtime cost)
export * from "./tokens";

// Components (primitives)
export * from "./components";

// Shell chrome composition
export * from "./shell";

// ACCOUNT-PREMIUM-01 — customer-dashboard surface primitives.
// (HeroCard / NextStepRow / MetricStrip / TimelineCard / EmptyStateCard / DivisionLanding)
// Hosts may also import via the explicit subpath `@henryco/dashboard-shell/surfaces`.
export * from "./surfaces";

// Contracts (DASH-2+ consumption)
export * from "./register";
// V3-11 — module-contract is a re-export alias of ./register (the
// DashboardModule.nextStep field lives there). Importing both is safe:
// the symbols are identical, so the barrel does not double-define.
export type { DashboardModule as DashboardModuleContract } from "./module-contract";
export * from "./home-widget";
export * from "./command-palette";
export * from "./command-aggregator";
export * from "./notification-categories";
export * from "./role-gate";

// Track C (DASH-9) — staff dashboard registry.
export * from "./staff-register";

// Track B (DASH-8) — owner dashboard registry.
export * from "./owner-register";
