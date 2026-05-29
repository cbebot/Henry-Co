/**
 * @henryco/dashboard-shell/module-contract — canonical re-export of the
 * DashboardModule contract.
 *
 * The contract type itself lives in `./register` (alongside the runtime
 * registry that consumes it). V3-11 (one-job-per-card) extended that type
 * with the `nextStep?: { href: string; label: string }` field so every
 * module declares its single "exact next step" rather than dumping the
 * viewer onto a generic hub.
 *
 * This module exists because the V3-11 contract names
 * `packages/dashboard-shell/src/module-contract.ts` as the home of the
 * module type. Rather than move the type (and churn every `./register`
 * import across the dashboard-modules packages), we re-export it here so
 * BOTH import paths resolve. New consumers may import from either:
 *
 *   import type { DashboardModule } from "@henryco/dashboard-shell";          // barrel
 *   import type { DashboardModule } from "@henryco/dashboard-shell/register"; // co-located
 */

export type {
  DashboardModule,
  ModuleSlug,
  ModuleSize,
  RailSlot,
  RouteEntry,
  EmptyTeaching,
  ModuleRegistry,
  DashboardRole,
} from "./register";

export {
  registerModule,
  getRegisteredModules,
  getEligibleModules,
  moduleVisibleToRole,
} from "./register";
