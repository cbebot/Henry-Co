/**
 * @henryco/dashboard-modules-care
 *
 * The care (Henry Onyx Fabric Care) module package. Importing this
 * module registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { careModule } from "./module";

// Side-effect registration. Idempotent — re-importing is a no-op because
// `registerModule` checks slug + identity.
registerModule(careModule);

export { careModule };
export type {
  QuickAction,
  QuickActionGroup,
  CareSnapshot,
  CareBooking,
  CareStats,
  CareActivityRow,
  HeroState,
  StatusKind,
} from "./data";
