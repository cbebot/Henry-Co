import { SellerApplicationWizard } from "@/components/marketplace/seller-application-wizard";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function SellerApplicationStartPage() {
  await requireMarketplaceUser("/account/seller-application/start");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Seller application"
      description="Step 1 focuses on store identity, business basics, and category focus before moderation work begins."
      {...accountWorkspaceNav("/account/seller-application")}
    >
      <SellerApplicationWizard step="start" initialApplication={data.application} />
    </WorkspaceShell>
  );
}
