import { SellerApplicationWizard } from "@/components/marketplace/seller-application-wizard";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceSellerApplicationCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

export default async function SellerApplicationReviewPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceSellerApplicationCopy(locale);
  await requireMarketplaceUser("/account/seller-application/review");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title={copy.reviewPage.shellTitle}
      description={copy.reviewPage.shellDescription}
      {...accountWorkspaceNav("/account/seller-application", locale)}
    >
      <SellerApplicationWizard step="review" initialApplication={data.application} />
    </WorkspaceShell>
  );
}
