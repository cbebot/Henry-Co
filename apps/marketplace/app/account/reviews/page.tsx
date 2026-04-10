import { WorkspaceShell } from "@/components/marketplace/shell";
import { AccountReviewsClient } from "@/components/marketplace/account-reviews-client";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, getMarketplaceHomeData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  await requireMarketplaceUser("/account/reviews");
  const [buyer, snapshot] = await Promise.all([getBuyerDashboardData(), getMarketplaceHomeData()]);

  return (
    <WorkspaceShell
      title="Reviews"
      description="Verified purchase reviews, moderation state, and trust contribution stay visible here instead of disappearing after checkout."
      nav={accountNav("/account/reviews")}
    >
      <AccountReviewsClient
        products={snapshot.products.map((product) => ({
          slug: product.slug,
          title: product.title,
        }))}
        initialReviews={buyer.reviews}
      />
    </WorkspaceShell>
  );
}
