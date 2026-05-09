/**
 * @henryco/dashboard-modules-owner/modules — single import that
 * registers every Track B module with the owner registry.
 *
 * Usage from the host app:
 *   import "@henryco/dashboard-modules-owner/modules";
 *
 * Mirrors Track C's `dashboard-modules-staff/modules` pattern: one
 * package, one consolidated import, side-effect registration.
 *
 * Anti-pattern #19 enforcement: this file ONLY calls
 * `registerOwnerModule` (Track B's registry). Track A consumer
 * modules and Track C staff modules cannot leak into Track B because
 * they register on different maps via different functions.
 */

import { registerOwnerModule } from "@henryco/dashboard-shell/owner-register";

import { ownerOverviewModule } from "./owner-overview";
import { ownerDivisionsModule } from "./owner-divisions";
import { ownerFinanceModule } from "./owner-finance";
import { ownerStaffModule } from "./owner-staff";
import { ownerBrandModule } from "./owner-brand";
import { ownerMessagingModule } from "./owner-messaging";
import { ownerOperationsModule } from "./owner-operations";
import { ownerAiModule } from "./owner-ai";
import { ownerSettingsModule } from "./owner-settings";

registerOwnerModule(ownerOverviewModule);
registerOwnerModule(ownerDivisionsModule);
registerOwnerModule(ownerFinanceModule);
registerOwnerModule(ownerStaffModule);
registerOwnerModule(ownerBrandModule);
registerOwnerModule(ownerMessagingModule);
registerOwnerModule(ownerOperationsModule);
registerOwnerModule(ownerAiModule);
registerOwnerModule(ownerSettingsModule);

export {
  ownerOverviewModule,
  ownerDivisionsModule,
  ownerFinanceModule,
  ownerStaffModule,
  ownerBrandModule,
  ownerMessagingModule,
  ownerOperationsModule,
  ownerAiModule,
  ownerSettingsModule,
};
