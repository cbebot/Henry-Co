import { WorkspaceShell } from "@/components/marketplace/shell";
import { AccountAddressesClient } from "@/components/marketplace/account-addresses-client";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  await requireMarketplaceUser("/account/addresses");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Addresses"
      description="Saved addresses stay tied to the shared account so future HenryCo services can reuse the same customer context."
      {...accountWorkspaceNav("/account/addresses")}
    >
      <AccountAddressesClient initialAddresses={data.addresses} />
    </WorkspaceShell>
  );
}
