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

export const dynamic = "force-dynamic";

export default async function PropertyHomePage() {
  const snapshot = await getPropertyHomeData();
  const heroCampaign = snapshot.campaigns[0] ?? null;

  return (
    <main className="pb-20">
      <section className="mx-auto max-w-[92rem] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="property-panel rounded-[3rem] px-7 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="property-kicker">HenryCo Property</div>
            <h1 className="property-display mt-6 max-w-5xl text-[var(--property-ink)]">
              Property discovery for people who do not want noise, guesswork, or weak follow-through.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--property-ink-soft)] sm:text-lg">
              Browse curated rentals, sale inventory, commercial spaces, and managed homes with
              better listing quality, stronger trust notes, structured viewing requests, and calmer
              owner communication.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="property-button-primary inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"
              >
                Explore listings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/submit"
                className="property-button-secondary inline-flex rounded-full px-6 py-4 text-sm font-semibold"
              >
                Submit a property
              </Link>
            </div>

            <div className="mt-10">
              <PropertySearchBar areas={snapshot.areas} submitLabel="Start a calm search" />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="property-panel rounded-[2.5rem] p-6 sm:p-8">
              <div className="property-kicker">Why this feels different</div>
              <div className="mt-5 grid gap-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Trust signals on every serious listing",
                    body: "Managed status, verification notes, and readiness context are surfaced before contact is made.",
                  },
                  {
                    icon: CalendarRange,
                    title: "Viewing flow with less waste",
                    body: "Requests, confirmation, reminders, and agent assignment are structured to reduce dead-end tours.",
                  },
                  {
                    icon: Building2,
                    title: "Managed-property layer beyond lead capture",
                    body: "HenryCo can keep operating the home, short-let, or portfolio after the listing goes live.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5">
                    <item.icon className="h-5 w-5 text-[var(--property-accent-strong)]" />
                    <div className="mt-4 text-xl font-semibold text-[var(--property-ink)]">{item.title}</div>
                    <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <PropertyMetricGrid items={snapshot.metrics} />
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
          kicker="Featured listings"
          title="Premium homes and workspaces with stronger context before the first viewing."
          description="The featured surface prioritizes better photography, clearer positioning, tighter moderation, and listings with higher-conviction next steps."
          actions={
            <Link
              href="/search"
              className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              View all listings
            </Link>
          }
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {snapshot.featuredListings.slice(0, 3).map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <PropertyRecommendedForYou listings={snapshot.listings} />

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker="Areas"
          title="Location pages that explain the market, not just the stock."
          description="Each area surface gives serious renters and buyers the market context, hotspots, and trust rails behind the shortlist."
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {snapshot.areas.map((area) => (
            <PropertyAreaCard
              key={area.id}
              area={area}
              count={snapshot.listings.filter((listing) => listing.status === "approved" && listing.locationSlug === area.slug).length}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="property-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="property-kicker">Managed-property services</div>
            <h2 className="property-heading mt-4">
              A property platform that continues after marketing, inquiries, and move-in.
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--property-ink-soft)]">
              HenryCo Property is designed to market, qualify, coordinate, and then keep operating
              selected properties through owner reporting, inspections, maintenance coordination,
              and ongoing trust services.
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
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PropertyTrustPill
                icon={<Sparkles className="h-5 w-5" />}
                title="Editorial moderation"
                body="Listing quality is improved before publication so premium inventory does not look like clutter."
              />
              <PropertyTrustPill
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Owner and operator trust notes"
                body="Trust rails are attached to listings so serious inquiries start with better information."
              />
              <PropertyTrustPill
                icon={<CalendarRange className="h-5 w-5" />}
                title="Viewing accountability"
                body="Scheduling and reminders are tracked server-side, which reduces low-confidence follow-up."
              />
              <PropertyTrustPill
                icon={<Building2 className="h-5 w-5" />}
                title="Unified HenryCo memory"
                body="Saved properties, inquiries, and viewings are mirrored for future cross-division account continuity."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker="Differentiators"
          title="Designed to be calmer, tighter, and more operationally serious than a classified board."
          description="These are the product and operations choices that turn the platform into a trust surface, not just a listing dump."
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          {snapshot.differentiators.slice(0, 4).map((item) => (
            <PropertyDifferentiatorCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PropertySectionIntro
          kicker="Relationship managers"
          title="People behind the listings, viewings, and managed-property follow-through."
          description="The operator layer is visible because premium real estate decisions need stronger coordination than anonymous form handoffs."
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
