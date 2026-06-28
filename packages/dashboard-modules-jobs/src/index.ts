/**
 * @henryco/dashboard-modules-jobs
 *
 * The jobs (Henry Onyx Jobs) module package. Importing this module
 * registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { jobsModule } from "./module";

registerModule(jobsModule);

export { jobsModule };
export type { JobsSnapshot, QuickAction, QuickActionGroup } from "./data";
