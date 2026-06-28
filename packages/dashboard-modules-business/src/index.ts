/**
 * @henryco/dashboard-modules-business
 *
 * The business (Henry Onyx Business) module package. Importing this
 * module registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { businessModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module is a
// no-op because `registerModule` checks slug + identity.
registerModule(businessModule);

export { businessModule };
export type {
  BusinessSnapshot,
  BusinessMembershipView,
  BusinessActingView,
  BusinessRole,
  BusinessStatus,
} from "./data";
