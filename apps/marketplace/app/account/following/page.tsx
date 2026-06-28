import { EmptyState, VendorCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceCustomerAccountCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

/* TODO(wave3-catalogue): paginate translation — followed-stores grid is a
   list surface and VendorCard renders raw vendor.description per row;
   defer per-row translation to a focused catalogue wave with caching. */

type SearchParams = {
  followed?: string;
  unfollowed?: string;
};

export default async function AccountFollowingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceCustomerAccountCopy(locale);
  await requireMarketplaceUser("/account/following");
  const [data, params] = await Promise.all([getBuyerDashboardData(), searchParams]);

  const toast = params.unfollowed
    ? copy.following.toastUnfollowed
    : params.followed
      ? copy.following.toastFollowed
      : null;

  return (
    <WorkspaceShell
      title={copy.following.title}
      description={copy.following.description}
      {...accountWorkspaceNav("/account/following", locale)}
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
                  {copy.following.unfollow}
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={copy.following.emptyTitle}
          body={copy.following.emptyBody}
          ctaHref="/search"
          ctaLabel={copy.following.emptyCta}
        />
      )}
    </WorkspaceShell>
  );
}
