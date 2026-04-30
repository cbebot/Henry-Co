import { EmptyState, VendorCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

type SearchParams = {
  followed?: string;
  unfollowed?: string;
};

export default async function AccountFollowingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireMarketplaceUser("/account/following");
  const [data, params] = await Promise.all([getBuyerDashboardData(), searchParams]);

  const toast = params.unfollowed
    ? "Unfollowed store."
    : params.followed
      ? "Now following store."
      : null;

  return (
    <WorkspaceShell
      title="Following"
      description="Followed stores persist into the account record so merchandising and re-engagement can stay contextual instead of generic."
      {...accountWorkspaceNav("/account/following")}
    >
      {toast ? (
        <div className="rounded-[1.25rem] border border-[rgba(76,201,160,0.35)] bg-[rgba(76,201,160,0.12)] px-4 py-3 text-sm font-medium text-[var(--market-success,#4CC9A0)]">
          {toast}
        </div>
      ) : null}

      {data.follows.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.follows.map((vendor) => (
            <div key={vendor.slug} className="flex flex-col gap-3">
              <VendorCard vendor={vendor} />
              <form action="/api/marketplace" method="POST">
                <input type="hidden" name="intent" value="vendor_follow_toggle" />
                <input type="hidden" name="vendor_slug" value={vendor.slug} />
                <input type="hidden" name="return_to" value="/account/following" />
                <button
                  type="submit"
                  className="w-full rounded-full border border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.08)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-alert,#F87171)] hover:bg-[rgba(232,88,88,0.16)]"
                >
                  Unfollow store
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No followed stores yet."
          body="Follow a store to keep its trust passport and latest offers close."
          ctaHref="/search"
          ctaLabel="Discover stores"
        />
      )}
    </WorkspaceShell>
  );
}
