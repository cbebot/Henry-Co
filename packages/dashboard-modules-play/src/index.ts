/**
 * @henryco/dashboard-modules-play
 *
 * The play (Henry Onyx Live) module package. Importing this module
 * registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { playModule } from "./module";

// Side-effect registration. Idempotent — re-importing this module is a
// no-op because `registerModule` checks slug + identity.
registerModule(playModule);

export { playModule };
export type {
  PlaySnapshot,
  PlayProfileView,
  PlayLeaderboardEntry,
  PlayGame,
} from "./data";
