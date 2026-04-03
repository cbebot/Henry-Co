import Link from "next/link";
import { PropertyEmptyState, PropertyListingCard, PropertyWorkspaceShell } from "@/components/property/ui";
import { getPropertyDashboardData } from "@/lib/property/data";
import { getAccountNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";

export const dynamic = "force-dynamic";

export default async function SavedListingsPage() {
  await requirePropertyUser("/account/saved");
  const data = await getPropertyDashboardData();

  return (
    <PropertyWorkspaceShell
      kicker="Saved"
      title="Saved properties"
      description="A shortlist of homes and spaces you want to compare without reopening the search from scratch."
      nav={getAccountNavigation("/account/saved")}
    >
      {data.savedListings.length ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {data.savedListings.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} saved />
          ))}
        </div>
      ) : (
        <PropertyEmptyState
          title="No saved listings yet."
          body="Sign into the public property pages and save homes or workspaces that deserve a second look."
          action={
            <Link
              href="/search"
              className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Search listings
            </Link>
          }
        />
      )}
    </PropertyWorkspaceShell>
  );
}
