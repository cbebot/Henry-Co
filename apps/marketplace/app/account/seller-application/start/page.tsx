import { SellerApplicationWizard } from "@/components/marketplace/seller-application-wizard";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { sellerPlans } from "@/lib/marketplace/governance";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceSellerApplicationCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

const VALID_PLAN_IDS = new Set(sellerPlans.map((plan) => plan.id));

export default async function SellerApplicationStartPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceSellerApplicationCopy(locale);
  const sp = (await searchParams) ?? {};
  const requestedPlan =
    sp.plan && VALID_PLAN_IDS.has(sp.plan as never) ? sp.plan : null;
  const nextPath = requestedPlan
    ? `/account/seller-application/start?plan=${encodeURIComponent(requestedPlan)}`
    : "/account/seller-application/start";
  await requireMarketplaceUser(nextPath);
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title={copy.startPage.shellTitle}
      description={copy.startPage.shellDescription}
      {...accountWorkspaceNav("/account/seller-application", locale)}
    >
      <SellerApplicationWizard
        step="start"
        initialApplication={data.application}
        initialPlan={requestedPlan}
      />
    </WorkspaceShell>
  );
}
