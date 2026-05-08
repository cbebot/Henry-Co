/**
 * @henryco/dashboard-modules-support
 *
 * The support module package. Importing this module registers the
 * module with the shell registry as a side effect:
 *
 *   import "@henryco/dashboard-modules-support";   // registers
 *   import { supportModule } from "@henryco/dashboard-modules-support";
 *
 * Hosts (currently `apps/account`) should import the package once at
 * the layout root so the registration happens before any
 * `getEligibleModules(viewer)` walk fires.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { supportModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module is
// a no-op because `registerModule` checks slug + identity.
registerModule(supportModule);

export { supportModule };
export type {
  SupportSnapshot,
  SupportThreadRow,
  SupportThreadStatus,
  SupportThreadPriority,
} from "./data";
