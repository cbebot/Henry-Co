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
import { handleStaffCareBulkAction, makeBulkActionHandler } from "../../_actions/bulk-actions";
import { makeExportAction } from "../../_actions/exports";
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
    case "staff-overview": {
      return <StaffOverviewPage viewer={viewer} supabase={supabase as never} />;
    }
    case "staff-care": {
      const exportHandler = await makeExportAction("staff-care", "care", "care_booking");
      return (
        <StaffCarePageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={handleStaffCareBulkAction}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-marketplace": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-marketplace",
        division: "marketplace",
        entityType: "marketplace_order",
        revalidatePath: "/modules/staff-marketplace",
      });
      const exportHandler = await makeExportAction(
        "staff-marketplace",
        "marketplace",
        "marketplace_order",
      );
      return (
        <StaffMarketplacePageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-property": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-property",
        division: "property",
        entityType: "property_listing",
        revalidatePath: "/modules/staff-property",
      });
      const exportHandler = await makeExportAction(
        "staff-property",
        "property",
        "property_listing",
      );
      return (
        <StaffPropertyPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-studio": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-studio",
        division: "studio",
        entityType: "studio_project",
        revalidatePath: "/modules/staff-studio",
      });
      const exportHandler = await makeExportAction(
        "staff-studio",
        "studio",
        "studio_project",
      );
      return (
        <StaffStudioPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-jobs": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-jobs",
        division: "jobs",
        entityType: "jobs_application",
        revalidatePath: "/modules/staff-jobs",
      });
      const exportHandler = await makeExportAction(
        "staff-jobs",
        "jobs",
        "jobs_application",
      );
      return (
        <StaffJobsPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-learn": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-learn",
        division: "learn",
        entityType: "learn_course",
        revalidatePath: "/modules/staff-learn",
      });
      const exportHandler = await makeExportAction(
        "staff-learn",
        "learn",
        "learn_course",
      );
      return (
        <StaffLearnPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-logistics": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-logistics",
        division: "logistics",
        entityType: "logistics_shipment",
        revalidatePath: "/modules/staff-logistics",
      });
      const exportHandler = await makeExportAction(
        "staff-logistics",
        "logistics",
        "logistics_shipment",
      );
      return (
        <StaffLogisticsPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-support": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-support",
        division: null,
        entityType: "support_thread",
        revalidatePath: "/modules/staff-support",
      });
      const exportHandler = await makeExportAction(
        "staff-support",
        null,
        "support_thread",
      );
      return (
        <StaffSupportPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-moderation": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-moderation",
        division: null,
        entityType: "moderation_case",
        revalidatePath: "/modules/staff-moderation",
      });
      const exportHandler = await makeExportAction(
        "staff-moderation",
        null,
        "moderation_case",
      );
      return (
        <StaffModerationPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-finance-operator": {
      const bulkActionHandler = makeBulkActionHandler({
        module: "staff-finance-operator",
        division: null,
        entityType: "payout_request",
        revalidatePath: "/modules/staff-finance-operator",
      });
      const exportHandler = await makeExportAction(
        "staff-finance-operator",
        null,
        "payout_request",
      );
      return (
        <StaffFinanceOperatorPageServer
          viewer={viewer}
          supabase={supabase as never}
          bulkActionHandler={bulkActionHandler}
          exportHandler={exportHandler}
        />
      );
    }
    case "staff-settings": {
      return (
        <StaffSettingsPageServer
          viewer={viewer}
          accountSettingsUrl={getAccountUrl("/settings")}
        />
      );
    }
    default:
      notFound();
  }
}
