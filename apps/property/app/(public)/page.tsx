import Link from "next/link";
import { ArrowRight, Building2, CalendarRange, ShieldCheck, Sparkles } from "lucide-react";
import {
  PropertyAgentCard,
  PropertyAreaCard,
  PropertyCampaignPanel,
  PropertyDifferentiatorCard,
  PropertyListingCard,
  PropertyMetricGrid,
  PropertyPortfolioStats,
  PropertySearchBar,
  PropertySectionIntro,
  PropertyTrustPill,
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
            <div className="property-kicker">{copy.home.heroKicker}</div>
            <h1 className="property-display mt-6 max-w-5xl text-[var(--property-ink)]">
              {copy.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--property-ink-soft)] sm:text-lg">
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
            <div className="property-panel rounded-[2.5rem] p-6 sm:p-8">
              <div className="property-kicker">{copy.home.whyKicker}</div>
              <div className="mt-5 grid gap-4">
                {copy.home.whyCards.map((item, index) => {
                  const icons = [ShieldCheck, CalendarRange, Building2];
                  const Icon = icons[index] ?? ShieldCheck;
                  return (
                  <div key={item.title} className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
                    <Icon className="h-5 w-5 text-[var(--property-accent-strong)]" />
                    <div className="mt-4 text-xl font-semibold text-[var(--property-ink)]">{item.title}</div>
                    <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{item.body}</p>
                  </div>
                  );
                })}
              </div>
            </div>

            <PropertyMetricGrid items={metrics} />
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

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="property-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="property-kicker">{copy.home.managedKicker}</div>
            <h2 className="property-heading mt-4">
              {copy.home.managedTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--property-ink-soft)]">
              {copy.home.managedBody}
            </p>
            <div className="mt-6 space-y-4">
              {snapshot.services.map((service) => (
                <div key={service.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
                  <div className="text-lg font-semibold text-[var(--property-ink)]">{service.title}</div>
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

          <div className="space-y-6">
            <PropertyPortfolioStats
              listings={snapshot.listings.filter((item) => item.status === "approved")}
              managedRecords={snapshot.managedRecords}
              copy={copy}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PropertyTrustPill
                icon={<Sparkles className="h-5 w-5" />}
                title={copy.home.trustPills[0].title}
                body={copy.home.trustPills[0].body}
              />
              <PropertyTrustPill
                icon={<ShieldCheck className="h-5 w-5" />}
                title={copy.home.trustPills[1].title}
                body={copy.home.trustPills[1].body}
              />
              <PropertyTrustPill
                icon={<CalendarRange className="h-5 w-5" />}
                title={copy.home.trustPills[2].title}
                body={copy.home.trustPills[2].body}
              />
              <PropertyTrustPill
                icon={<Building2 className="h-5 w-5" />}
                title={copy.home.trustPills[3].title}
                body={copy.home.trustPills[3].body}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker={copy.home.differentiatorsKicker}
          title={copy.home.differentiatorsTitle}
          description={copy.home.differentiatorsDescription}
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          {snapshot.differentiators.slice(0, 4).map((item) => (
            <PropertyDifferentiatorCard key={item.id} item={item} />
          ))}
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
