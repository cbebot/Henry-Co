/**
 * @henryco/dashboard-modules-studio
 *
 * The studio (Henry Onyx Studio) module package. Importing this module
 * registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { studioModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module is a
// no-op because `registerModule` checks slug + identity.
registerModule(studioModule);

export { studioModule };
export type { StudioMetricsSnapshot } from "./data";
