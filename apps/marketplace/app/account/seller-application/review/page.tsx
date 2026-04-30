import { SellerApplicationWizard } from "@/components/marketplace/seller-application-wizard";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function SellerApplicationReviewPage() {
  await requireMarketplaceUser("/account/seller-application/review");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Seller review"
      description="Step 3 confirms the application before it enters moderation and owner-alert workflows."
      {...accountWorkspaceNav("/account/seller-application")}
    >
      <SellerApplicationWizard step="review" initialApplication={data.application} />
    </WorkspaceShell>
  );
}
