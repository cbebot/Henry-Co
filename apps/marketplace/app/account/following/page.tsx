import { EmptyState, VendorCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountFollowingPage() {
  await requireMarketplaceUser("/account/following");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Following"
      description="Followed stores persist into the account record so merchandising and re-engagement can stay contextual instead of generic."
      nav={accountNav("/account/following")}
    >
      {data.follows.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.follows.map((vendor) => (
            <VendorCard key={vendor.slug} vendor={vendor} />
          ))}
        </div>
      ) : (
        <EmptyState title="No followed stores yet." body="Follow a store to keep its trust passport and latest offers close." />
      )}
    </WorkspaceShell>
  );
}
