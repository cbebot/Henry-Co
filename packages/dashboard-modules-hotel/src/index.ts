/**
 * @henryco/dashboard-modules-hotel
 *
 * Hidden future module — registers the Hotels division's slot in the
 * shell registry but returns "hidden" from `getEligibleViewer` until
 * the division ships an app. Importing this package side-effect-
 * registers the module so when the gate flips, the rail surfaces the
 * entry without further plumbing changes.
 *
 * See `module.tsx` MODULE_ENABLED constant for the flip-the-gate
 * ritual.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { hotelModule } from "./module";

registerModule(hotelModule);

export { hotelModule };
