import { SellerApplicationWizard } from "@/components/marketplace/seller-application-wizard";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { sellerPlans } from "@/lib/marketplace/governance";

export const dynamic = "force-dynamic";

const VALID_PLAN_IDS = new Set(sellerPlans.map((plan) => plan.id));

export default async function SellerApplicationStartPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
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
      title="Seller application"
      description="Step 1 focuses on store identity, business basics, and category focus before moderation work begins."
      {...accountWorkspaceNav("/account/seller-application")}
    >
      <SellerApplicationWizard
        step="start"
        initialApplication={data.application}
        initialPlan={requestedPlan}
      />
    </WorkspaceShell>
  );
}
