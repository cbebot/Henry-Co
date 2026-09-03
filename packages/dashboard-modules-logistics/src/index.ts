/**
 * @henryco/dashboard-modules-logistics
 *
 * The logistics (Henry Onyx Logistics) module package. Importing this
 * module registers the module with the shell registry as a side effect.
 */

import { registerModule } from "@henryco/dashboard-shell";
import { logisticsModule } from "./module";

registerModule(logisticsModule);

export { logisticsModule };
export type {
  LogisticsSnapshot,
  LogisticsMetrics,
  LogisticsActiveShipment,
  QuickAction,
  QuickActionGroup,
} from "./data";
