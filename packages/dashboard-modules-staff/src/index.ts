/**
 * @henryco/dashboard-modules-staff
 *
 * Track C (DASH-9) staff dashboard modules.
 *
 * The default barrel re-exports each module's public API. Side-effect
 * registration with the shell registry happens via the `./modules`
 * subpath import.
 */

// Module descriptors + page components.
export {
  staffOverviewModule,
  StaffOverviewPage,
  type StaffOverviewPageProps,
  type StaffOverviewSnapshot,
  type AccessibleDivisionTile,
  type AssignedToMeSummary,
} from "./staff-overview";

export {
  staffCareModule,
  StaffCarePageClient,
  StaffCarePageServer,
  loadCareQueueSnapshot,
  type StaffCarePageClientProps,
  type StaffCarePageServerProps,
  type CareBookingRow,
  type CareQueueSnapshot,
  type CareSupabaseClient,
} from "./staff-care";

export {
  staffMarketplaceModule,
  StaffMarketplacePageServer,
  loadMarketplaceQueueSnapshot,
  type StaffMarketplacePageProps,
  type MarketplaceOrderRow,
  type MarketplaceQueueSnapshot,
  type MarketplaceQueueClient,
} from "./staff-marketplace";

export {
  staffPropertyModule,
  StaffPropertyPageServer,
  loadPropertyQueueSnapshot,
  type StaffPropertyPageProps,
  type PropertyListingRow,
  type PropertySupabaseClient,
} from "./staff-property";

export {
  staffStudioModule,
  StaffStudioPageServer,
  loadStudioQueueSnapshot,
  type StaffStudioPageProps,
  type StudioProjectRow,
  type StudioSupabaseClient,
} from "./staff-studio";

export {
  staffJobsModule,
  StaffJobsPageServer,
  loadJobsQueueSnapshot,
  type StaffJobsPageProps,
  type JobApplicationRow,
  type JobsSupabaseClient,
} from "./staff-jobs";

export {
  staffLearnModule,
  StaffLearnPageServer,
  loadLearnQueueSnapshot,
  type StaffLearnPageProps,
  type LearnCourseRow,
  type LearnSupabaseClient,
} from "./staff-learn";

export {
  staffLogisticsModule,
  StaffLogisticsPageServer,
  loadLogisticsQueueSnapshot,
  type StaffLogisticsPageProps,
  type LogisticsShipmentRow,
  type LogisticsSupabaseClient,
} from "./staff-logistics";

export {
  staffSupportModule,
  StaffSupportPageServer,
  loadSupportQueueSnapshot,
  type StaffSupportPageProps,
  type SupportThreadRow,
  type SupportSupabaseClient,
} from "./staff-support";

export {
  staffModerationModule,
  StaffModerationPageServer,
  loadModerationQueueSnapshot,
  type StaffModerationPageProps,
  type ModerationCaseRow,
  type ModerationSupabaseClient,
} from "./staff-moderation";

export {
  staffFinanceOperatorModule,
  StaffFinanceOperatorPageServer,
  loadFinanceQueueSnapshot,
  type StaffFinanceOperatorPageProps,
  type PayoutRequestRow,
  type FinanceSupabaseClient,
} from "./staff-finance-operator";

export {
  staffSettingsModule,
  StaffSettingsPageServer,
  type StaffSettingsPageProps,
} from "./staff-settings";
