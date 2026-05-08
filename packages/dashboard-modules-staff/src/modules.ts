/**
 * @henryco/dashboard-modules-staff/modules — single import that
 * registers every Track C module with the staff registry.
 *
 * Usage from the host app:
 *   import "@henryco/dashboard-modules-staff/modules";
 *
 * Track A's pattern uses one import per module package; Track C
 * consolidates because all 12+ modules ship in one package.
 */

import { registerStaffModule } from "@henryco/dashboard-shell";

import { staffOverviewModule } from "./staff-overview";
import { staffCareModule } from "./staff-care";
import { staffMarketplaceModule } from "./staff-marketplace";
import { staffPropertyModule } from "./staff-property";
import { staffStudioModule } from "./staff-studio";
import { staffJobsModule } from "./staff-jobs";
import { staffLearnModule } from "./staff-learn";
import { staffLogisticsModule } from "./staff-logistics";
import { staffSupportModule } from "./staff-support";
import { staffModerationModule } from "./staff-moderation";
import { staffFinanceOperatorModule } from "./staff-finance-operator";
import { staffSettingsModule } from "./staff-settings";

registerStaffModule(staffOverviewModule);
registerStaffModule(staffCareModule);
registerStaffModule(staffMarketplaceModule);
registerStaffModule(staffPropertyModule);
registerStaffModule(staffStudioModule);
registerStaffModule(staffJobsModule);
registerStaffModule(staffLearnModule);
registerStaffModule(staffLogisticsModule);
registerStaffModule(staffSupportModule);
registerStaffModule(staffModerationModule);
registerStaffModule(staffFinanceOperatorModule);
registerStaffModule(staffSettingsModule);

export {
  staffOverviewModule,
  staffCareModule,
  staffMarketplaceModule,
  staffPropertyModule,
  staffStudioModule,
  staffJobsModule,
  staffLearnModule,
  staffLogisticsModule,
  staffSupportModule,
  staffModerationModule,
  staffFinanceOperatorModule,
  staffSettingsModule,
};
