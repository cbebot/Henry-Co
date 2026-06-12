import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { EmptyState, VendorCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

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
  const t = (text: string) => translateSurfaceLabel(locale, text);
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
      {...accountWorkspaceNav("/account/following", locale)}
    >
      {toast ? (
        <div className="rounded-[1.25rem] border border-[rgba(76,201,160,0.35)] bg-[rgba(76,201,160,0.12)] px-4 py-3 text-sm font-medium text-[color:var(--acct-green-ink)]">
          {toast}
        </div>
      ) : null}

      {data.follows.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.follows.map((vendor) => (
            <div key={vendor.slug} className="flex flex-col gap-3">
              <VendorCard vendor={vendor} />
              <MarketplaceActionForm
                intent="vendor_follow_toggle"
                hidden={{ vendor_slug: vendor.slug, return_to: "/account/following" }}
                submitLabel={t("Unfollow store")}
                pendingLabel={t("Unfollowing store")}
                successTitle={t("Unfollowed store.")}
                errorTitle={t("Following could not be updated.")}
                buttonClassName="w-full rounded-full border border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.08)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acct-red-ink)] hover:bg-[rgba(232,88,88,0.16)] disabled:cursor-wait disabled:opacity-80"
              />
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
