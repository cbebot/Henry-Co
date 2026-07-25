import { WorkspaceShell } from "@/components/marketplace/shell";
import { VendorApplicationQueue } from "@/components/marketplace/vendor-application-queue";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const data = await getStaffQueueData();

  return (
    <WorkspaceShell
      title="Vendor Applications"
      description="Review seller applications before granting store access. Approve to create the vendor store, hold for further checks, or reject with a note."
      nav={staffNav("/admin", "/admin", locale)}
    >
      <VendorApplicationQueue
        applications={data.applications as Array<Record<string, unknown>>}
        returnTo="/admin"
      />
    </WorkspaceShell>
  );
}
