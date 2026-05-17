import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  PropertyListingCard,
  PropertyManagedRecordCard,
  PropertyPortfolioStats,
  PropertySectionIntro,
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getPropertyManagedCopy } from "@henryco/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPropertyPublicLocale();
  const copy = getPropertyManagedCopy(locale);
  return {
    title: copy.meta.title,
    description: copy.meta.description,
  };
}

export default async function ManagedPropertyPage() {
  const [locale, snapshot] = await Promise.all([
    getPropertyPublicLocale(),
    getPropertySnapshot(),
  ]);
  const copy = getPropertyManagedCopy(locale);

  const managedListings = snapshot.listings.filter(
    (item) => item.status === "approved" && item.managedByHenryCo,
  );

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={copy.page.kicker}
        title={copy.page.title}
        description={copy.page.description}
        actions={
          <Link
            href="/submit"
            className="property-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            {copy.page.submitCta}
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
            {copy.serviceLines.sectionKicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
            {copy.serviceLines.sectionTitle}
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
            {copy.recentRecords.sectionKicker}
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
          kicker={copy.managedListings.kicker}
          title={copy.managedListings.title}
          description={copy.managedListings.description}
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
              {copy.cta.kicker}
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
              {copy.cta.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--property-ink-soft)]">
              {copy.cta.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/submit"
              className="property-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {copy.cta.submitCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-6 py-3 text-sm font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/50"
            >
              {copy.cta.trustCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
