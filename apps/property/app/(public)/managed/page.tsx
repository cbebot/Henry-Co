import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  PropertyListingCard,
  PropertyManagedRecordCard,
  PropertyPortfolioStats,
  PropertySectionIntro,
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";

export const dynamic = "force-dynamic";

export default async function ManagedPropertyPage() {
  const snapshot = await getPropertySnapshot();
  const managedListings = snapshot.listings.filter(
    (item) => item.status === "approved" && item.managedByHenryCo,
  );

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Managed property"
        title="Operations-grade management after the listing goes live."
        description="Tenant communication, inspections, reporting, maintenance coordination, short-let operations, and owner trust workflows — held on one operating rail rather than scattered across apps and chat threads."
        actions={
          <Link
            href="/submit"
            className="property-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            Submit a managed property
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mt-10">
        <PropertyPortfolioStats
          listings={snapshot.listings.filter((item) => item.status === "approved")}
          managedRecords={snapshot.managedRecords}
        />
      </div>

      <section className="mt-14 grid gap-12 xl:grid-cols-[0.95fr,1.05fr] xl:divide-x xl:divide-[var(--property-line)]">
        <div>
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Service lines
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
            What HenryCo handles after acceptance.
          </h2>
          <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
            {snapshot.services.map((service) => (
              <li key={service.id} className="py-5">
                <h3 className="text-base font-semibold tracking-tight text-[var(--property-ink)]">
                  {service.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--property-ink-soft)]">
                  {service.summary}
                </p>
                {service.bullets && service.bullets.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="rounded-full border border-[var(--property-line)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--property-ink-soft)]"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:pl-12">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Recent managed records
          </p>
          <div className="mt-6 space-y-5">
            {snapshot.managedRecords.map((record) => (
              <PropertyManagedRecordCard key={record.id} record={record} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <PropertySectionIntro
          kicker="Managed listings"
          title="Homes and stays already on managed rails."
          description="Stronger readiness, reporting, and coordination than passive pass-through inventory."
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {managedListings.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-[var(--property-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
              Move forward
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
              Submit your property — we’ll review the operating fit, not just the badge.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--property-ink-soft)]">
              Managed acceptance implies HenryCo operational involvement. Non-managed listings can
              still publish, but the owner remains responsible for day-to-day reality.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/submit"
              className="property-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Submit a property
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-6 py-3 text-sm font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/50"
            >
              How HenryCo governs listings
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
