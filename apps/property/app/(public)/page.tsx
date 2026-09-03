import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Compass,
  KeyRound,
  Search,
  ShieldCheck,
} from "lucide-react";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { PropertyListingCard } from "@/components/property/ui";
import { PropertyRecommendedForYou } from "@/components/property/property-recommended-for-you";
import { PropertySearchBar } from "@/components/property/property-search-bar";
import { PROPERTY_ROLE_VOCAB, resolveChromePlan, standingFromRoles } from "@henryco/aware";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getPropertyHomeData } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getPropertyPublicCopy } from "@/lib/public-copy";
import { getPropertyViewer } from "@/lib/property/auth";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NGN = (value: number) => formatCurrency(value, "NGN");

/**
 * Property home — editorial ledger composition.
 *
 * Composition principles (deliberately distinct from Zillow / Compass /
 * Sotheby's / Airbnb / Booking):
 *
 *   1. Lead with INTENT, not a search box. Three intent paths — Live in
 *      it / Own it / List or steward it — sit as ledger rows under the
 *      title. Search is offered as a refinement at the top-right of
 *      the hero, not as the dominant element.
 *
 *   2. Inventory presented as a LEDGER (left) + FEATURED IMAGE column
 *      (right) — areas, live counts, average rent, average sale all
 *      typeset in tabular numerals on hairline-divided rows. No card
 *      sprawl, no Zillow-style 3-up tile grids for areas.
 *
 *   3. Differentiators surfaced as a PULL-QUOTE editorial spread, not
 *      as a 4-up feature grid.
 *
 *   4. Agents shown as a CONTRIBUTORS page — single image per row,
 *      name, territory, one-line bio. Magazine layout, not the
 *      generic "Meet the team" 3-up cards every property platform ships.
 *
 *   5. Featured listings keep the existing PropertyListingCard atom but
 *      sit inside a clean two-row band, not a deep-shadow grid.
 *
 *   6. Every section ships designed empty-state copy when its data is
 *      absent, so a fresh tenant operator never sees a broken-looking
 *      page.
 *
 * Tokens used: --property-ink, --property-ink-soft, --property-ink-muted,
 * --property-line, --property-line-strong, --property-accent-strong,
 * --property-accent-soft, --property-sage-soft. No new colour systems.
 */
export default async function PropertyHomePage() {
  const [locale, snapshot, viewer] = await Promise.all([
    getPropertyPublicLocale(),
    getPropertyHomeData(),
    getPropertyViewer(),
  ]);
  const copy = getPropertyPublicCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // AWARE-SP5: never recruit someone who already lists — an agent's "submit a
  // property" CTA becomes their workspace (the same tested matrix the chrome
  // uses).
  const standing = standingFromRoles(
    { signedIn: Boolean(viewer.user), roles: viewer.roles },
    PROPERTY_ROLE_VOCAB,
  );
  const plan = resolveChromePlan("property", standing);
  const isAgent = standing.kind === "operator";
  const submitCta = (fallbackLabel: string) =>
    isAgent
      ? { href: plan.recruit.href, label: t(plan.recruit.label) }
      : { href: "/submit", label: fallbackLabel };

  const approvedListings = snapshot.listings.filter(
    (listing) => listing.status === "approved" || listing.status === "published"
  );
  const liveListingCount = approvedListings.length;
  const featuredListings = snapshot.featuredListings.slice(0, 3);
  const areaIndex = snapshot.areas.map((area) => ({
    ...area,
    liveCount: approvedListings.filter((listing) => listing.locationSlug === area.slug).length,
  }));
  const managedRecords = snapshot.managedRecords ?? [];
  const managedActive = managedRecords.filter((record) => record.status === "active").length;
  const managedPipeline = managedRecords.filter((record) => record.status === "pipeline").length;
  const managedValue = managedRecords.reduce(
    (total, record) => total + (record.portfolioValue ?? 0),
    0
  );
  const agents = snapshot.agents ?? [];
  const differentiators = snapshot.differentiators ?? [];
  const viewerFirstName = viewer.user?.fullName?.split(/\s+/)[0]?.trim() || null;
  const inventoryYear = new Date().getFullYear();

  // Home page renders three small Supabase-row ledgers: differentiators
  // (capped at 4), services (full list), agents (capped at 8). Each list
  // is short and visible, so wrap title/name + description/summary.
  // Areas table renders area.name + marketNote and gets wrapped too.
  const visibleDifferentiators = differentiators.slice(0, 4);
  const localizedDifferentiators = await Promise.all(
    visibleDifferentiators.map(async (item) => {
      const [name, description] = await Promise.all([
        resolveLocalizedDynamicField({
          record: item as unknown as Record<string, unknown>,
          field: "name",
          locale,
          fallback: item.name ?? "",
          machineTranslate: locale !== "en",
        }),
        resolveLocalizedDynamicField({
          record: item as unknown as Record<string, unknown>,
          field: "description",
          locale,
          fallback: item.description ?? "",
          machineTranslate: locale !== "en",
        }),
      ]);
      return { ...item, name, description };
    }),
  );
  const localizedServices = await Promise.all(
    (snapshot.services ?? []).map(async (service) => {
      const [title, summary] = await Promise.all([
        resolveLocalizedDynamicField({
          record: service as unknown as Record<string, unknown>,
          field: "title",
          locale,
          fallback: service.title ?? "",
          machineTranslate: locale !== "en",
        }),
        resolveLocalizedDynamicField({
          record: service as unknown as Record<string, unknown>,
          field: "summary",
          locale,
          fallback: service.summary ?? "",
          machineTranslate: locale !== "en",
        }),
      ]);
      return { ...service, title, summary };
    }),
  );
  const visibleAgents = agents.slice(0, 8);
  const localizedAgents = await Promise.all(
    visibleAgents.map(async (agent) => {
      const [name, label] = await Promise.all([
        resolveLocalizedDynamicField({
          record: agent as unknown as Record<string, unknown>,
          field: "name",
          locale,
          fallback: agent.name ?? "",
          machineTranslate: locale !== "en",
        }),
        resolveLocalizedDynamicField({
          record: agent as unknown as Record<string, unknown>,
          field: "label",
          locale,
          fallback: agent.label ?? "",
          machineTranslate: locale !== "en",
        }),
      ]);
      return { ...agent, name, label };
    }),
  );
  // Areas ledger — wrap name + marketNote for the six visible rows.
  const visibleAreas = areaIndex.slice(0, 6);
  const localizedAreas = await Promise.all(
    visibleAreas.map(async (area) => {
      const [name, marketNote] = await Promise.all([
        resolveLocalizedDynamicField({
          record: area as unknown as Record<string, unknown>,
          field: "name",
          locale,
          fallback: area.name ?? "",
          machineTranslate: locale !== "en",
        }),
        resolveLocalizedDynamicField({
          record: area as unknown as Record<string, unknown>,
          field: "marketNote",
          locale,
          fallback: area.marketNote ?? "",
          machineTranslate: locale !== "en",
        }),
      ]);
      return { ...area, name, marketNote };
    }),
  );

  return (
    <main id="henryco-main" tabIndex={-1} className="pb-24">
      {/* HERO ──────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-[92rem] px-5 pt-10 sm:px-8 sm:pt-14 lg:px-10 lg:pt-20">
        {/* Top trust strip — three calm signals, anchored by a tiny live
            indicator and the inventory year. The year is a deliberately
            understated provenance signal — "this is a working ledger,
            not a mood board". */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--property-ink-soft)]">
          <span className="inline-flex items-center gap-1.5 text-[var(--property-accent-strong)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {copy.home.trustStrip.vetted}
          </span>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[var(--property-line-strong)] sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            {liveListingCount > 0
              ? liveListingCount >= 10
                ? copy.home.trustStrip.listingsLiveTemplate.replace(
                    "{count}",
                    String(liveListingCount),
                  )
                : copy.home.trustStrip.curatedBeforePublic
              : copy.home.trustStrip.inventoryUnderReview}
          </span>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[var(--property-line-strong)] sm:inline-block" />
          <span>{copy.home.trustStrip.inventoryLabel} {inventoryYear}</span>
        </div>

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] lg:items-end lg:gap-16">
          {/* Left column — title and intent ledger */}
          <div>
            <h1 className="property-display max-w-3xl text-balance text-[var(--property-ink)]">
              {copy.home.heroPage.title}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-7 text-[var(--property-ink-soft)] sm:text-[15.5px] sm:leading-8">
              {copy.home.heroPage.body}
            </p>

            {/* Intent ledger — three rows, each is a real next step.
                On mobile, rows stack at full width. On desktop the
                arrows align to a right gutter and rows pick up a hover
                ledge that shifts the title 2px right. */}
            <ul className="mt-9 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
              {[
                {
                  href: "/search",
                  kicker: copy.home.intentLedger[0]?.kicker ?? "",
                  title: copy.home.intentLedger[0]?.title ?? "",
                  body: copy.home.intentLedger[0]?.body ?? "",
                  icon: Compass,
                },
                {
                  href: "/search?managed=1",
                  kicker: copy.home.intentLedger[1]?.kicker ?? "",
                  title: copy.home.intentLedger[1]?.title ?? "",
                  body: copy.home.intentLedger[1]?.body ?? "",
                  icon: CalendarRange,
                },
                {
                  href: "/submit",
                  kicker: copy.home.intentLedger[2]?.kicker ?? "",
                  title: copy.home.intentLedger[2]?.title ?? "",
                  body: copy.home.intentLedger[2]?.body ?? "",
                  icon: KeyRound,
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <li key={row.href} className="group/row">
                    <Link
                      href={row.href}
                      className="
                        flex flex-col gap-1.5 py-5
                        transition duration-200 ease-out
                        hover:text-[var(--property-ink)]
                        sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-6
                      "
                    >
                      <span className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--property-accent-strong)]">
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {row.kicker}
                      </span>
                      <span className="block">
                        <span className="block text-[18px] font-semibold leading-[1.25] tracking-[-0.012em] text-[var(--property-ink)] transition-transform duration-300 ease-out group-hover/row:translate-x-[2px] sm:text-[19px]">
                          {row.title}
                        </span>
                        <span className="mt-1.5 block max-w-xl text-[13.5px] leading-6 text-[var(--property-ink-soft)]">
                          {row.body}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="
                          mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full
                          border border-[var(--property-line)] text-[var(--property-ink-soft)]
                          transition duration-300 ease-out
                          group-hover/row:translate-x-[3px]
                          group-hover/row:border-[var(--property-accent-strong)]
                          group-hover/row:text-[var(--property-accent-strong)]
                          sm:mt-0
                        "
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Returning user shortcut — small, never in the way of
                new visitors. Stays anonymous-friendly. */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--property-ink-soft)]">
              {viewer.user ? (
                <>
                  <span className="text-[var(--property-ink)]">
                    {copy.home.returningVisitor.signedIn}
                    {viewerFirstName ? ` · ${viewerFirstName}` : ""}.
                  </span>
                  <Link
                    href={getSharedAccountPropertyUrl()}
                    className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
                  >
                    {copy.home.returningVisitor.continueLink}
                  </Link>
                </>
              ) : (
                <>
                  <span>{copy.home.returningVisitor.returningPrompt}</span>
                  <Link
                    href={getSharedAccountPropertyUrl()}
                    className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
                  >
                    {copy.home.returningVisitor.openActivityLink}
                  </Link>
                </>
              )}
              <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[var(--property-line)] sm:inline-block" />
              <Link
                href={getSharedAccountPropertyUrl("viewings")}
                className="font-semibold transition hover:text-[var(--property-ink)]"
              >
                {copy.home.returningVisitor.trackViewingLink}
              </Link>
            </div>
          </div>

          {/* Right column — inventory snapshot + refinement search.
              The numerical block is the editorial signature: tabular
              numerals, generous label tracking, hairline rules. The
              search bar sits below it as a "go deeper" affordance,
              not a primary CTA. */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-[color:var(--home-sheet)] p-6 sm:p-7 shadow-[0_30px_90px_-55px_rgb(var(--home-ink-rgb)/0.18)]">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-accent-strong)]">
                {copy.home.inventorySnapshot.title}
              </p>

              <dl className="mt-5 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
                <Stat
                  label={copy.home.inventorySnapshot.liveListingsLabel}
                  value={`${liveListingCount}`}
                />
                <Stat
                  label={copy.home.inventorySnapshot.areasCoveredLabel}
                  value={`${areaIndex.length}`}
                  hint={
                    areaIndex.length > 0
                      ? localizedAreas
                          .slice(0, 3)
                          .map((a) => a.name)
                          .join(" · ")
                      : copy.home.inventorySnapshot.areasCoveredEmptyHint
                  }
                />
                <Stat
                  label={copy.home.inventorySnapshot.managedPortfolioLabel}
                  value={`${managedActive}`}
                  hint={
                    managedRecords.length === 0
                      ? undefined
                      : managedValue > 0
                      ? copy.home.inventorySnapshot.managedPipelineTemplate
                          .replace("{pipeline}", String(managedPipeline))
                          .replace("{value}", formatCompactNumber(managedValue))
                          .replace(
                            "{suffix}",
                            copy.home.inventorySnapshot.managedUnderManagementSuffix,
                          )
                      : copy.home.inventorySnapshot.managedPipelinePartialTemplate
                          .replace("{pipeline}", String(managedPipeline))
                          .replace(
                            "{setupLabel}",
                            copy.home.inventorySnapshot.managedValueUnderSetup,
                          )
                  }
                />
                <Stat
                  label={copy.home.inventorySnapshot.pendingReviewLabel}
                  value={`${snapshot.listings.filter((listing) => listing.status === "submitted" || listing.status === "under_review").length}`}
                  hint={copy.home.inventorySnapshot.pendingReviewHint}
                />
              </dl>

              <div className="mt-6">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-ink-soft)]">
                  <Search className="mr-1.5 inline h-3 w-3 align-[-1px] text-[var(--property-accent-strong)]" />
                  {copy.home.inventorySnapshot.refineSearchLabel}
                </p>
                <div className="mt-3">
                  <PropertySearchBar
                    areas={snapshot.areas}
                    submitLabel={copy.home.searchSubmit}
                    copy={copy}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FEATURED INVENTORY ─────────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 sm:mt-24 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="property-kicker">{copy.home.featuredKicker}</p>
            <h2 className="mt-3 text-balance text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--property-ink)] sm:text-[2.1rem]">
              {copy.home.featuredTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-7 text-[var(--property-ink-soft)]">
              {copy.home.featuredDescription}
            </p>
          </div>
          <Link
            href="/search"
            className="
              inline-flex items-center gap-1.5 self-start text-[13px] font-semibold tracking-[-0.005em]
              text-[var(--property-accent-strong)] underline-offset-[6px]
              transition hover:underline
            "
          >
            {copy.home.featuredCta}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredListings.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredListings.map((listing) => (
              <PropertyListingCard key={listing.id} listing={listing} copy={copy} />
            ))}
          </div>
        ) : (
          // Empty state — designed, not "no items". Tells the visitor
          // exactly what's happening at the operator layer.
          <div className="mt-10 rounded-[1.4rem] border border-[var(--property-line)] bg-[color:var(--home-surface-04)] px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-ink-muted)]">
              {copy.home.featuredEmpty.eyebrow}
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--property-ink-soft)]">
              {copy.home.featuredEmpty.body}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="property-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold"
              >
                {copy.home.featuredEmpty.browseCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={submitCta(copy.home.featuredEmpty.submitCta).href}
                className="inline-flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
              >
                {submitCta(copy.home.featuredEmpty.submitCta).label}
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* RECOMMENDED FOR YOU — keeps the existing personalisation rail */}
      <PropertyRecommendedForYou listings={snapshot.listings} copy={copy} />

      {/* AREAS LEDGER ───────────────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:mt-24 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:items-end">
          <div>
            <p className="property-kicker">{copy.home.areasKicker}</p>
            <h2 className="mt-3 text-balance text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--property-ink)] sm:text-[2.1rem]">
              {copy.home.areasTitle}
            </h2>
            <p className="mt-3 max-w-md text-[14.5px] leading-7 text-[var(--property-ink-soft)]">
              {copy.home.areasDescription}
            </p>
          </div>

          {areaIndex.length > 0 ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-[var(--property-line)]">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-[color:var(--home-surface-07)] text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
                    <th scope="col" className="w-[44%] px-4 py-3 text-left sm:w-[42%] sm:px-6">
                      {copy.home.areasTable.headerArea}
                    </th>
                    <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell sm:px-6">
                      {copy.home.areasTable.headerAvgRent}
                    </th>
                    <th scope="col" className="hidden px-4 py-3 text-right md:table-cell md:px-6">
                      {copy.home.areasTable.headerAvgSale}
                    </th>
                    <th scope="col" className="px-4 py-3 text-right sm:px-6">
                      {copy.home.areasTable.headerLive}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--property-line)]">
                  {localizedAreas.map((area) => (
                    <tr
                      key={area.id}
                      className="group/area transition hover:bg-[color:color-mix(in_srgb,var(--home-accent)_6%,transparent)]"
                    >
                      <td className="px-4 py-4 align-top sm:px-6">
                        <Link
                          href={`/search?area=${encodeURIComponent(area.slug)}`}
                          className="block"
                        >
                          <span className="block text-[15px] font-semibold tracking-[-0.005em] text-[var(--property-ink)] transition group-hover/area:text-[var(--property-accent-strong)]">
                            {area.name}
                          </span>
                          <span className="mt-1 block text-[12px] uppercase tracking-[0.16em] text-[var(--property-ink-muted)]">
                            {area.city}
                          </span>
                          {area.marketNote ? (
                            <span className="mt-2 block max-w-md text-[12.5px] leading-relaxed text-[var(--property-ink-soft)]">
                              {area.marketNote}
                            </span>
                          ) : null}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-4 text-right align-top tabular-nums sm:table-cell sm:px-6">
                        <span className="text-[14px] font-semibold tracking-tight text-[var(--property-ink)]">
                          {area.averageRent > 0 ? NGN(area.averageRent) : "—"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 text-right align-top tabular-nums md:table-cell md:px-6">
                        <span className="text-[14px] font-semibold tracking-tight text-[var(--property-ink)]">
                          {area.averageSale > 0 ? NGN(area.averageSale) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right align-top tabular-nums sm:px-6">
                        <span
                          className={`
                            text-[14px] font-semibold tracking-tight
                            ${area.liveCount > 0 ? "text-[var(--property-ink)]" : "text-[var(--property-ink-muted)]"}
                          `}
                        >
                          {area.liveCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-[color:var(--home-surface-04)] p-8">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-ink-muted)]">
                {copy.home.areasTable.emptyEyebrow}
              </p>
              <p className="mt-3 text-[14.5px] leading-7 text-[var(--property-ink-soft)]">
                {copy.home.areasTable.emptyBody}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* DIFFERENTIATORS — editorial pull-quote band ────────────────── */}
      {differentiators.length > 0 ? (
        <section className="mx-auto mt-24 max-w-[92rem] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.45fr] lg:gap-20">
            <div>
              <p className="property-kicker">{copy.home.differentiatorsKicker}</p>
              <h2 className="mt-3 text-balance text-[1.6rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--property-ink)] sm:text-[2rem]">
                {copy.home.differentiatorsTitle}
              </h2>
              <p className="mt-4 max-w-md text-[14.5px] leading-7 text-[var(--property-ink-soft)]">
                {copy.home.differentiatorsDescription}
              </p>
            </div>

            {/* Pull-quote spread — each differentiator becomes a numbered
                editorial entry, hairline divided. No tile chrome, no
                rounded-card noise. */}
            <ol className="divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
              {localizedDifferentiators.map((item, index) => (
                <li key={item.id} className="py-6 sm:py-7">
                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-6">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--property-accent-strong)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-[17px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--property-ink)] sm:text-[18.5px]">
                        {item.name}
                      </p>
                      <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[var(--property-ink-soft)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* MANAGED OPERATING LANE ─────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="property-kicker">{copy.home.managedKicker}</p>
            <h2 className="mt-3 text-balance text-[1.7rem] font-semibold leading-[1.06] tracking-[-0.022em] text-[var(--property-ink)] sm:text-[2.1rem]">
              {copy.home.managedTitle}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-8 text-[var(--property-ink-soft)]">
              {copy.home.managedBody}
            </p>

            {localizedServices.length > 0 ? (
              <ul className="mt-8 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
                {localizedServices.map((service, index) => (
                  <li key={service.id} className="py-5 sm:py-6">
                    <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-6">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--property-sage-soft)]/85">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[15.5px] font-semibold tracking-[-0.005em] text-[var(--property-ink)]">
                          {service.title}
                        </p>
                        <p className="mt-1 max-w-xl text-[13.5px] leading-7 text-[var(--property-ink-soft)]">
                          {service.summary}
                        </p>
                        {service.bullets && service.bullets.length > 0 ? (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {service.bullets.slice(0, 4).map((bullet) => (
                              <li
                                key={bullet}
                                className="rounded-full border border-[var(--property-line)] bg-[color:var(--home-surface-04)] px-2.5 py-1 text-[11px] font-medium text-[var(--property-ink-soft)]"
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Numerical column — managed economics visible up front */}
          <aside className="lg:pt-20">
            <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-[color:var(--home-sheet)] p-6 sm:p-7 shadow-[0_30px_90px_-55px_rgb(var(--home-ink-rgb)/0.18)]">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--home-accent-text)]">
                {copy.home.managedAside.title}
              </p>
              <dl className="mt-5 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
                <Stat
                  label={copy.home.managedAside.activeEngagementsLabel}
                  value={`${managedActive}`}
                />
                <Stat
                  label={copy.home.managedAside.inPipelineLabel}
                  value={`${managedPipeline}`}
                />
                <Stat
                  label={copy.home.managedAside.combinedValueLabel}
                  value={managedValue > 0 ? `${formatCompactNumber(managedValue)} NGN` : "—"}
                  hint={copy.home.managedAside.combinedValueHint}
                />
              </dl>
              <p className="mt-5 text-[12.5px] leading-6 text-[var(--property-ink-muted)]">
                {copy.home.managedAside.footnote}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* AGENT CONTRIBUTORS PAGE ────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="property-kicker">{copy.home.agentsKicker}</p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.018em] text-[var(--property-ink)] sm:text-[1.85rem]">
              {copy.home.agentsTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[var(--property-ink-soft)]">
              {copy.home.agentsDescription}
            </p>
          </div>
        </div>

        {agents.length > 0 ? (
          // Editorial spread — large image, name, territory, one-line bio.
          // Snaps on mobile, 4-up grid on desktop. No card chrome.
          <ol className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {localizedAgents.map((agent) => (
              <li key={agent.id} className="group/agent">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem] border border-[var(--property-line)] bg-[color:var(--home-surface-07)]">
                  {agent.photoUrl ? (
                    <Image
                      src={agent.photoUrl}
                      alt={`${agent.name} — ${agent.label}`}
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 92vw"
                      className="object-cover transition duration-500 group-hover/agent:scale-[1.02]"
                    />
                  ) : (
                    // Empty image state — initials block in agent's
                    // territory tone. Looks intentional, not broken.
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[color:color-mix(in_srgb,var(--home-accent)_18%,transparent)] to-[color:color-mix(in_srgb,var(--property-sage)_18%,transparent)]">
                      <span className="text-[2.4rem] font-semibold tracking-[-0.04em] text-[var(--property-ink-soft)]">
                        {agent.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </span>
                    </div>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(11,7,5,0.62)] to-transparent"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-[15.5px] font-semibold tracking-[-0.005em] text-[var(--property-ink)]">
                    {agent.name}
                  </p>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-[var(--property-accent-strong)]">
                    {agent.label}
                  </p>
                  {agent.territories && agent.territories.length > 0 ? (
                    <p className="mt-2 text-[13px] leading-6 text-[var(--property-ink-soft)]">
                      {agent.territories.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          // Empty state — editorial. Operator-facing message.
          <div className="mt-10 rounded-[1.4rem] border border-[var(--property-line)] bg-[color:var(--home-surface-04)] p-8">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--property-ink-muted)]">
              {copy.home.agentsEmpty.eyebrow}
            </p>
            <p className="mt-3 max-w-xl text-[14px] leading-7 text-[var(--property-ink-soft)]">
              {copy.home.agentsEmpty.body}
            </p>
          </div>
        )}
      </section>

      {/* CLOSING CTA ─────────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="rounded-[1.6rem] border border-[var(--property-line-strong)] bg-gradient-to-br from-[color:color-mix(in_srgb,var(--home-accent)_8%,transparent)] via-transparent to-[color:color-mix(in_srgb,var(--property-sage)_8%,transparent)] p-7 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr] sm:items-center sm:gap-10">
            <div>
              <p className="property-kicker">{copy.home.closingCta.eyebrow}</p>
              <h2 className="mt-3 text-balance text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.018em] text-[var(--property-ink)] sm:text-[1.85rem]">
                {copy.home.closingCta.title}
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-7 text-[var(--property-ink-soft)]">
                {copy.home.closingCta.body}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Link
                href="/search"
                className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold sm:w-auto"
              >
                {copy.home.closingCta.browseCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={submitCta(copy.home.closingCta.submitCta).href}
                className="property-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold sm:w-auto"
              >
                {submitCta(copy.home.closingCta.submitCta).label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Stat — a single editorial ledger row. Tabular numerals on the value,
 * label tracking calibrated for the rail eyebrow style.
 */
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
          {label}
        </dt>
        {hint ? (
          <p className="mt-1 max-w-[20rem] text-[12px] leading-5 text-[var(--property-ink-soft)]">
            {hint}
          </p>
        ) : null}
      </div>
      <dd className="shrink-0 text-right text-[1.4rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--property-ink)]">
        {value}
      </dd>
    </div>
  );
}
