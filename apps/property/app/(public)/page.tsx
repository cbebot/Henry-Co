import Link from "next/link";
import { ArrowRight, Building2, CalendarRange, ShieldCheck } from "lucide-react";
import { PublicProofRail, PublicSpotlight } from "@henryco/ui/public-shell";
import {
  PropertyAgentCard,
  PropertyAreaCard,
  PropertyCampaignPanel,
  PropertyListingCard,
  PropertyPortfolioStats,
  PropertySearchBar,
  PropertySectionIntro,
} from "@/components/property/ui";
import { PropertyRecommendedForYou } from "@/components/property/property-recommended-for-you";
import { getPropertyHomeData } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getPropertyPublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

export default async function PropertyHomePage() {
  const locale = await getPropertyPublicLocale();
  const copy = getPropertyPublicCopy(locale);
  const snapshot = await getPropertyHomeData();
  const heroCampaign = snapshot.campaigns[0] ?? null;
  const metrics = snapshot.metrics.map((item, index) => ({
    ...item,
    label: copy.home.metrics[index]?.label ?? item.label,
    hint: copy.home.metrics[index]?.hint ?? item.hint,
  }));

  return (
    <main className="pb-20">
      <section className="mx-auto max-w-[92rem] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="property-panel rounded-[3rem] px-7 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="flex flex-wrap items-center gap-2">
              <span className="property-kicker">{copy.home.heroKicker}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--property-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                <ShieldCheck className="h-3 w-3 text-[var(--property-accent-strong)]" />
                Vetted listings, verified owners
              </span>
            </div>
            <h1 className="property-display mt-6 max-w-4xl text-balance text-[var(--property-ink)]">
              {copy.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-[var(--property-ink-soft)] sm:text-lg">
              {copy.home.heroBody}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="property-button-primary inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"
              >
                {copy.home.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/submit"
                className="property-button-secondary inline-flex rounded-full px-6 py-4 text-sm font-semibold"
              >
                {copy.home.secondaryCta}
              </Link>
            </div>

            <div className="mt-10">
              <PropertySearchBar areas={snapshot.areas} submitLabel={copy.home.searchSubmit} copy={copy} />
            </div>
          </div>

          <div className="grid gap-6">
            <div>
              <div className="property-kicker">{copy.home.whyKicker}</div>
              <ul className="mt-5 space-y-5 border-y border-[var(--property-line)] py-5">
                {copy.home.whyCards.map((item, index) => {
                  const icons = [ShieldCheck, CalendarRange, Building2];
                  const Icon = icons[index] ?? ShieldCheck;
                  return (
                    <li key={item.title} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--property-line)] bg-black/15 text-[var(--property-accent-strong)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-base font-semibold tracking-tight text-[var(--property-ink)]">{item.title}</div>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--property-ink-soft)]">{item.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <PublicProofRail
              density="default"
              variant="rail"
              items={metrics.map((m) => ({ label: m.label, value: m.value, hint: m.hint }))}
            />
          </div>
        </div>
      </section>

      {heroCampaign ? (
        <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
          <PropertyCampaignPanel campaign={heroCampaign} />
        </section>
      ) : null}

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker={copy.home.featuredKicker}
          title={copy.home.featuredTitle}
          description={copy.home.featuredDescription}
          actions={
            <Link
              href="/search"
              className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              {copy.home.featuredCta}
            </Link>
          }
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {snapshot.featuredListings.slice(0, 3).map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} copy={copy} />
          ))}
        </div>
      </section>

      <PropertyRecommendedForYou listings={snapshot.listings} copy={copy} />

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker={copy.home.areasKicker}
          title={copy.home.areasTitle}
          description={copy.home.areasDescription}
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {snapshot.areas.map((area) => (
            <PropertyAreaCard
              key={area.id}
              area={area}
              copy={copy}
              count={snapshot.listings.filter((listing) => listing.status === "approved" && listing.locationSlug === area.slug).length}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10 space-y-8">
        <PublicSpotlight
          tone="contrast"
          eyebrow={copy.home.differentiatorsKicker}
          title={copy.home.differentiatorsTitle}
          body={copy.home.differentiatorsDescription}
          aside={
            <ul className="space-y-4">
              {snapshot.differentiators.slice(0, 4).map((item) => (
                <li key={item.id} className="border-l border-white/15 pl-4">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{item.description}</p>
                </li>
              ))}
            </ul>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="property-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="property-kicker">{copy.home.managedKicker}</div>
            <h2 className="property-heading mt-4">{copy.home.managedTitle}</h2>
            <p className="mt-5 text-base leading-8 text-[var(--property-ink-soft)]">
              {copy.home.managedBody}
            </p>
            <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
              {snapshot.services.map((service) => (
                <li key={service.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="text-base font-semibold tracking-tight text-[var(--property-ink)]">{service.title}</div>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--property-ink-soft)]">{service.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="rounded-full border border-[var(--property-line)] bg-black/10 px-2.5 py-1 text-[11px] font-medium text-[var(--property-ink-soft)]"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <PropertyPortfolioStats
              listings={snapshot.listings.filter((item) => item.status === "approved")}
              managedRecords={snapshot.managedRecords}
              copy={copy}
            />
            <PublicProofRail
              eyebrow="What you can rely on"
              density="tight"
              variant="rail"
              items={[
                { label: copy.home.trustPills[0].title, value: "Vetted", hint: copy.home.trustPills[0].body },
                { label: copy.home.trustPills[1].title, value: "Verified", hint: copy.home.trustPills[1].body },
                { label: copy.home.trustPills[2].title, value: "On time", hint: copy.home.trustPills[2].body },
                { label: copy.home.trustPills[3].title, value: "Tracked", hint: copy.home.trustPills[3].body },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker={copy.home.agentsKicker}
          title={copy.home.agentsTitle}
          description={copy.home.agentsDescription}
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {snapshot.agents.map((agent) => (
            <PropertyAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>
    </main>
  );
}

