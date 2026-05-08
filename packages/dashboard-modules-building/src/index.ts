/**
 * @henryco/dashboard-modules-building
 *
 * Hidden future module — registers the Building division's slot in the
 * shell registry but returns "hidden" from `getEligibleViewer` until
 * the division ships an app. Importing this package side-effect-
 * registers the module so when the gate flips, the rail surfaces the
 * entry without further plumbing changes.
 *
 * See `module.tsx` MODULE_ENABLED constant for the flip-the-gate
 * ritual.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { buildingModule } from "./module";

registerModule(buildingModule);

export { buildingModule };
