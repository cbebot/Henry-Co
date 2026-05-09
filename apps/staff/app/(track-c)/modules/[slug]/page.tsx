import { notFound } from "next/navigation";
import { getEligibleStaffModules } from "@henryco/dashboard-shell";
import { getAccountUrl } from "@henryco/config";
import "@henryco/dashboard-modules-staff/modules";

import {
  StaffOverviewPage,
  StaffCarePageServer,
  StaffMarketplacePageServer,
  StaffPropertyPageServer,
  StaffStudioPageServer,
  StaffJobsPageServer,
  StaffLearnPageServer,
  StaffLogisticsPageServer,
  StaffSupportPageServer,
  StaffModerationPageServer,
  StaffFinanceOperatorPageServer,
  StaffSettingsPageServer,
} from "@henryco/dashboard-modules-staff";

import { requireTrackCStaffViewer } from "../../_internal/viewer";
import {
  handleStaffCareBulkAction,
  handleStaffMarketplaceBulkAction,
  handleStaffPropertyBulkAction,
  handleStaffStudioBulkAction,
  handleStaffJobsBulkAction,
  handleStaffLearnBulkAction,
  handleStaffLogisticsBulkAction,
  handleStaffSupportBulkAction,
  handleStaffModerationBulkAction,
  handleStaffFinanceOperatorBulkAction,
} from "../../_actions/bulk-actions";
import {
  handleStaffCareExport,
  handleStaffMarketplaceExport,
  handleStaffPropertyExport,
  handleStaffStudioExport,
  handleStaffJobsExport,
  handleStaffLearnExport,
  handleStaffLogisticsExport,
  handleStaffSupportExport,
  handleStaffModerationExport,
  handleStaffFinanceOperatorExport,
} from "../../_actions/exports";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Track C catch-all module router.
 *
 * Resolves /modules/[slug] to the corresponding module page server
 * component. Each module hydrates its own snapshot from the
 * authenticated supabase client + accepts server-action handlers for
 * bulk actions and exports.
 *
 * Why one big switch instead of dynamic dispatch via the registry?
 * Because the modules' page server components have HETEROGENEOUS prop
 * shapes (each takes its own snapshot type) — TypeScript can verify
 * the wiring at the catch-all when each branch is explicit. A
 * dynamic dispatch would lose the type guarantees.
 */
export default async function TrackCModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await requireTrackCStaffViewer();
  const eligible = getEligibleStaffModules(viewer);
  const moduleEntry = eligible.find((m) => m.slug === slug);
  if (!moduleEntry) {
    notFound();
  }

  const supabase = await createStaffSupabaseServer();

  switch (slug) {
    case "staff-overview":
      return <StaffOverviewPage viewer={viewer} supabase={supabase as never} />;
    case "staff-care":
      return (
        <StaffCarePageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffCareBulkAction}
          exportHandler={handleStaffCareExport}
        />
      );
    case "staff-marketplace":
      return (
        <StaffMarketplacePageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffMarketplaceBulkAction}
          exportHandler={handleStaffMarketplaceExport}
        />
      );
    case "staff-property":
      return (
        <StaffPropertyPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffPropertyBulkAction}
          exportHandler={handleStaffPropertyExport}
        />
      );
    case "staff-studio":
      return (
        <StaffStudioPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffStudioBulkAction}
          exportHandler={handleStaffStudioExport}
        />
      );
    case "staff-jobs":
      return (
        <StaffJobsPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffJobsBulkAction}
          exportHandler={handleStaffJobsExport}
        />
      );
    case "staff-learn":
      return (
        <StaffLearnPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffLearnBulkAction}
          exportHandler={handleStaffLearnExport}
        />
      );
    case "staff-logistics":
      return (
        <StaffLogisticsPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffLogisticsBulkAction}
          exportHandler={handleStaffLogisticsExport}
        />
      );
    case "staff-support":
      return (
        <StaffSupportPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffSupportBulkAction}
          exportHandler={handleStaffSupportExport}
        />
      );
    case "staff-moderation":
      return (
        <StaffModerationPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffModerationBulkAction}
          exportHandler={handleStaffModerationExport}
        />
      );
    case "staff-finance-operator":
      return (
        <StaffFinanceOperatorPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffFinanceOperatorBulkAction}
          exportHandler={handleStaffFinanceOperatorExport}
        />
      );
    case "staff-settings":
      return (
        <StaffSettingsPageServer
          viewer={viewer}
          accountSettingsUrl={getAccountUrl("/settings")}
        />
      );
    default:
      notFound();
  }
}
