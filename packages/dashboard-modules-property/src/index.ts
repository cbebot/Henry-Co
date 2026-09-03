/**
 * @henryco/dashboard-modules-property
 *
 * The property (Henry Onyx Property) module package. Importing this
 * module registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { propertyModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module is a
// no-op because `registerModule` checks slug + identity.
registerModule(propertyModule);

export { propertyModule };
export type {
  PropertySnapshot,
  PropertySavedListing,
  PropertyStats,
  HeroState,
  QuickAction,
  QuickActionGroup,
} from "./data";
