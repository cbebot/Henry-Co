import { WorkspaceShell } from "@/components/marketplace/shell";
import { DecisionRefusalNotice } from "@/components/marketplace/decision-refusal-notice";
import { VendorApplicationQueue } from "@/components/marketplace/vendor-application-queue";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const [data, params] = await Promise.all([
    getStaffQueueData(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  // An approval the system refused says why, instead of returning to the queue in silence.
  const refusalError = typeof params.error === "string" ? params.error : undefined;

  return (
    <WorkspaceShell
      title="Vendor Applications"
      description="Review seller applications before granting store access. Approve to create the vendor store, hold for further checks, or reject with a note."
      nav={staffNav("/admin", "/admin", locale)}
    >
      <DecisionRefusalNotice error={refusalError} locale={locale} />
      <VendorApplicationQueue
        applications={data.applications as Array<Record<string, unknown>>}
        returnTo="/admin"
      />
    </WorkspaceShell>
  );
}
