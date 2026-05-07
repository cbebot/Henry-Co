/**
 * @henryco/dashboard-modules-account
 *
 * The customer-overview module package. Importing this module
 * registers the module with the shell registry as a side effect:
 *
 *   import "@henryco/dashboard-modules-account";   // registers
 *   import { customerOverviewModule } from "@henryco/dashboard-modules-account";  // also registers
 *
 * Hosts (currently `apps/account`) should import the module package
 * once at the layout root so the registration happens before any
 * `getEligibleModules(viewer)` walk fires.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { customerOverviewModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module
// is a no-op because `registerModule` checks slug + identity.
registerModule(customerOverviewModule);

export { customerOverviewModule };
export type { CustomerOverviewSnapshot, TrustTier } from "./data";
