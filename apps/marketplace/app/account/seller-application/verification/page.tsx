import { SellerApplicationWizard } from "@/components/marketplace/seller-application-wizard";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function SellerApplicationVerificationPage() {
  await requireMarketplaceUser("/account/seller-application/verification");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Seller verification"
      description="Step 2 captures the trust story, KYC context, and service standards that determine whether the store is ready for approval."
      nav={accountNav("/account/seller-application")}
    >
      <SellerApplicationWizard step="verification" initialApplication={data.application} />
    </WorkspaceShell>
  );
}
