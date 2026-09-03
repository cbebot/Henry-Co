/**
 * @henryco/dashboard-modules-learn
 *
 * The learn (Henry Onyx Academy) module package. Importing this module
 * registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { learnModule } from "./module";

registerModule(learnModule);

export { learnModule };
export type {
  QuickAction,
  QuickActionGroup,
  LearnSnapshot,
  LearnStats,
  LearnMetrics,
  LearnHeroState,
  LearnActivityRow,
} from "./data";
