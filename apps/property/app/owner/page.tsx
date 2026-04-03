import Link from "next/link";
import {
  PropertyMetricCard,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { getOwnerWorkspaceData } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";

export const dynamic = "force-dynamic";

export default async function OwnerWorkspacePage() {
  await requirePropertyUser("/owner");
  const data = await getOwnerWorkspaceData();

  return (
    <PropertyWorkspaceShell
      kicker="Owner"
      title="Owner submission and listing visibility"
      description="This surface is for owners and relationship managers who need a cleaner record of submissions, review states, and incoming responses."
      nav={getWorkspaceNavigation("/owner")}
      actions={
        <Link
          href="/submit"
          className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Submit property
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <PropertyMetricCard
          label="Listings"
          value={String(data.listings.length)}
          hint="Properties attributed to your owner profile."
        />
        <PropertyMetricCard
          label="Applications"
          value={String(data.applications.length)}
          hint="Verification-backed submission records."
        />
        <PropertyMetricCard
          label="Inquiries"
          value={String(data.inquiries.length)}
          hint="Owner-visible lead activity mirrored into your workspace."
        />
      </div>

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Portfolio records</div>
        <div className="mt-5 space-y-4">
          {data.listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
            >
              <div>
                <div className="text-lg font-semibold text-[var(--property-ink)]">{listing.title}</div>
                <div className="mt-1 text-sm text-[var(--property-ink-soft)]">{listing.locationLabel}</div>
              </div>
              <PropertyStatusBadge status={listing.status} />
            </div>
          ))}
        </div>
      </section>
    </PropertyWorkspaceShell>
  );
}
