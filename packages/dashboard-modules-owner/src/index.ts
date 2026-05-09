/**
 * @henryco/dashboard-modules-owner
 *
 * Track B (DASH-8) owner dashboard modules.
 *
 * The default barrel re-exports each module's public API. Side-effect
 * registration with the owner registry happens via the `./modules`
 * subpath import — host apps import that once at process startup.
 */

export { ownerOverviewModule } from "./owner-overview";
export { ownerDivisionsModule } from "./owner-divisions";
export { ownerFinanceModule } from "./owner-finance";
export { ownerStaffModule } from "./owner-staff";
export { ownerBrandModule } from "./owner-brand";
export { ownerMessagingModule } from "./owner-messaging";
export { ownerOperationsModule } from "./owner-operations";
export { ownerAiModule } from "./owner-ai";
export { ownerSettingsModule } from "./owner-settings";
