import Link from "next/link";
import { PropertySignOutButton } from "@/components/property/sign-out-button";
import {
  PropertyEmptyState,
  PropertyListingCard,
  PropertyMetricCard,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { getPropertyDashboardData } from "@/lib/property/data";
import { getAccountNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  await requirePropertyUser("/account");
  const data = await getPropertyDashboardData();

  return (
    <PropertyWorkspaceShell
      kicker="Account"
      title="Your property dashboard"
      description="Saved listings, inquiries, scheduled viewings, and owner submissions all stay visible here for future HenryCo account continuity."
      nav={getAccountNavigation("/account")}
      actions={<PropertySignOutButton />}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <PropertyMetricCard
          label="Saved"
          value={String(data.savedListings.length)}
          hint="Properties you kept for later review."
        />
        <PropertyMetricCard
          label="Inquiries"
          value={String(data.inquiries.length)}
          hint="Live inquiry records attached to your account or email."
        />
        <PropertyMetricCard
          label="Viewings"
          value={String(data.viewings.length)}
          hint="Requested and scheduled appointments."
        />
        <PropertyMetricCard
          label="Listings"
          value={String(data.listings.length)}
          hint="Owner or agent submissions attributed to you."
        />
      </div>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Recent activity</div>
        {data.notifications.length ? (
          <div className="mt-5 space-y-3">
            {data.notifications.slice(0, 6).map((notification) => (
              <div
                key={notification.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--property-ink)]">
                    {notification.subject}
                  </div>
                  <div className="mt-1 text-xs text-[var(--property-ink-soft)]">
                    {notification.channel} · {notification.templateKey}
                  </div>
                </div>
                <PropertyStatusBadge status={notification.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <PropertyEmptyState
              title="No account notifications yet."
              body="Submit an inquiry, request a viewing, or save a property to start building your HenryCo property history."
              action={
                <Link
                  href="/search"
                  className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Browse listings
                </Link>
              }
            />
          </div>
        )}
      </section>

      {data.savedListings.length ? (
        <section>
          <div className="mb-4 text-sm font-semibold text-[var(--property-ink)]">Saved shortlist</div>
          <div className="grid gap-5 xl:grid-cols-3">
            {data.savedListings.slice(0, 3).map((listing) => (
              <PropertyListingCard key={listing.id} listing={listing} saved />
            ))}
          </div>
        </section>
      ) : null}
    </PropertyWorkspaceShell>
  );
}
