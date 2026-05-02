import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Compass,
  KeyRound,
  Search,
  ShieldCheck,
} from "lucide-react";
import { HenryCoTactileCard, PublicProofRail, PublicSpotlight } from "@henryco/ui/public-shell";
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
import { getPropertyViewer } from "@/lib/property/auth";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";

export const dynamic = "force-dynamic";

export default async function PropertyHomePage() {
  const locale = await getPropertyPublicLocale();
  const copy = getPropertyPublicCopy(locale);
  const snapshot = await getPropertyHomeData();
  const viewer = await getPropertyViewer();
  const heroCampaign = snapshot.campaigns[0] ?? null;
  const metrics = snapshot.metrics.map((item, index) => ({
    ...item,
    label: copy.home.metrics[index]?.label ?? item.label,
    hint: copy.home.metrics[index]?.hint ?? item.hint,
  }));
  const approvedListings = snapshot.listings.filter((listing) => listing.status === "approved");
  const liveListingCount = approvedListings.length;
  const viewerFirstName = viewer.user?.fullName?.split(/\s+/)[0]?.trim() || null;

  return (
    <main className="pb-20">
      {/* Premium focused hero — search front-and-center, two clear persona paths,
          tight trust strip. Repeat visitors see a continue affordance. */}
      <section className="mx-auto max-w-[92rem] px-5 pt-6 sm:px-8 sm:pt-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-2 text-[var(--property-ink-soft)]">
          <span className="property-kicker">{copy.home.heroKicker}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--property-line)] bg-black/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
            <ShieldCheck className="h-3 w-3 text-[var(--property-accent-strong)]" />
            Vetted listings, verified owners
          </span>
          {liveListingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--property-line)] bg-black/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/85" />
              {liveListingCount} live listings now
            </span>
          ) : null}
        </div>

        <h1 className="property-display mt-5 max-w-4xl text-balance text-[var(--property-ink)]">
          {copy.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-[var(--property-ink-soft)] sm:text-base sm:leading-8 lg:text-lg">
          {copy.home.heroBody}
        </p>

        {/* Search bar IS the primary action — full-width, in front of any panel. */}
        <div className="mt-7 sm:mt-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            <Search className="h-3.5 w-3.5 text-[var(--property-accent-strong)]" />
            Start here
          </div>
          <div className="mt-3">
            <PropertySearchBar
              areas={snapshot.areas}
              submitLabel={copy.home.searchSubmit}
              copy={copy}
            />
          </div>
        </div>

        {/* Two persona paths — clear next step for renters/buyers vs owners/agents.
            HenryCoTactileCard scopes hover lift to fine pointers only so
            touch devices never see the stuck-hover state owner flagged on
            /care, and gives mobile a clean :active feedback instead. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-5">
          <HenryCoTactileCard
            href="/search"
            ariaLabel="Looking for a place"
            className="border-[var(--property-line)] bg-black/15"
          >
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-accent-strong)]">
                <Compass className="h-3.5 w-3.5" />
                Looking for a place
              </div>
              <h2 className="mt-3 text-[1.25rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.4rem]">
                Browse vetted homes, apartments, and managed properties.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--property-ink-soft)]">
                Filter by area, price, and managed status. Save listings, request viewings,
                and message owners — all from your HenryCo account.
              </p>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--property-ink)]">
              {copy.home.primaryCta}
              <ArrowRight className="h-4 w-4 transition [@media(hover:hover)]:group-hover:translate-x-0.5" />
            </div>
          </HenryCoTactileCard>

          <HenryCoTactileCard
            href="/submit"
            ariaLabel="Listing a place"
            className="border-[var(--property-line)] bg-black/15"
          >
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-accent-strong)]">
                <KeyRound className="h-3.5 w-3.5" />
                Listing a place
              </div>
              <h2 className="mt-3 text-[1.25rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.4rem]">
                Submit a property and reach serious renters and buyers.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--property-ink-soft)]">
                Built for owners and agents. Inquiries land in your HenryCo inbox; managed
                support is available if you want HenryCo to handle viewings and screening.
              </p>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--property-ink)]">
              {copy.home.secondaryCta}
              <ArrowRight className="h-4 w-4 transition [@media(hover:hover)]:group-hover:translate-x-0.5" />
            </div>
          </HenryCoTactileCard>
        </div>

        {/* Returning user shortcut — small, never in the way of new visitors. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--property-ink-soft)]">
          {viewer.user ? (
            <>
              <span className="text-[var(--property-ink)]">
                Welcome back{viewerFirstName ? `, ${viewerFirstName}` : ""}.
              </span>
              <Link
                href={getSharedAccountPropertyUrl()}
                className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
              >
                Continue in your property activity
              </Link>
              <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[var(--property-line)] sm:inline-block" />
              <Link
                href={getSharedAccountPropertyUrl("viewings")}
                className="font-semibold transition hover:text-[var(--property-ink)]"
              >
                Track a viewing
              </Link>
            </>
          ) : (
            <>
              <span>Returning?</span>
              <Link
                href={getSharedAccountPropertyUrl()}
                className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
              >
                Open your property activity
              </Link>
              <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[var(--property-line)] sm:inline-block" />
              <Link
                href={getSharedAccountPropertyUrl("viewings")}
                className="font-semibold transition hover:text-[var(--property-ink)]"
              >
                Track a viewing
              </Link>
            </>
          )}
        </div>

        {/* Trust + why-it-works rail — replaces the old right-side stack but on its own row. */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="property-kicker">{copy.home.whyKicker}</div>
            <ul className="mt-5 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
              {copy.home.whyCards.map((item, index) => {
                const icons = [ShieldCheck, CalendarRange, Building2];
                const Icon = icons[index] ?? ShieldCheck;
                return (
                  <li key={item.title} className="flex gap-4 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--property-line)] bg-black/15 text-[var(--property-accent-strong)]">
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

          <div className="self-end">
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
