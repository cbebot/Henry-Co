import Link from "next/link";
import { PropertyListingCard, PropertyManagedRecordCard, PropertyPortfolioStats, PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";

export const dynamic = "force-dynamic";

export default async function ManagedPropertyPage() {
  const snapshot = await getPropertySnapshot();
  const managedListings = snapshot.listings.filter(
    (item) => item.status === "approved" && item.managedByHenryCo
  );

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Managed property"
        title="Operations-grade management for owners who want calmer execution after the listing goes live."
        description="HenryCo Property can support tenant communication, inspections, reporting, maintenance coordination, short-let operations, and owner trust workflows after inquiry and occupancy."
        actions={
          <Link
            href="/submit"
            className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Submit a managed property
          </Link>
        }
      />

      <div className="mt-8">
        <PropertyPortfolioStats
          listings={snapshot.listings.filter((item) => item.status === "approved")}
          managedRecords={snapshot.managedRecords}
        />
      </div>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="property-panel rounded-[2.3rem] p-6 sm:p-8">
          <div className="property-kicker">Service lines</div>
          <div className="mt-6 space-y-4">
            {snapshot.services.map((service) => (
              <div key={service.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
                <div className="text-xl font-semibold text-[var(--property-ink)]">{service.title}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{service.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.bullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {snapshot.managedRecords.map((record) => (
            <PropertyManagedRecordCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <PropertySectionIntro
          kicker="Managed listings"
          title="Homes and stays already operating on HenryCo property rails."
          description="These listings carry stronger readiness, reporting, and coordination than passive pass-through inventory."
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {managedListings.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
