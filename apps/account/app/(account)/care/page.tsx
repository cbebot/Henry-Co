import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import { henryDomain } from "@henryco/config";
import {
  HeroCard,
  EmptyStateCard,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import {
  getCareBookings,
  getDivisionActivity,
} from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/care/styles.css";
import { CareActiveGlance } from "@/components/care/CareActiveGlance";
import { CareActivity } from "@/components/care/CareActivity";
import { careStats, heroState, toCareActivityRows } from "@/components/care/helpers";

import CareBookingsDashboard, {
  CARE_BOOKING_FILTER_OPTIONS,
  matchesCareFilter,
  type CareBookingFilterId,
} from "@/components/divisions/CareBookingsDashboard";

export const dynamic = "force-dynamic";

const CARE_PAGE_SIZE = 12;
// V3-07(S2): build CTAs from henryDomain() so preview/staging deployments
// route to the matching base domain instead of always production.
const CARE_BOOK_URL = henryDomain("care", "/book");
const CARE_TRACK_URL = henryDomain("care", "/track");

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionCare;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

/**
 * Care landing — division overview rebuilt against the shared surface
 * primitives (`<HeroCard />`, `<EmptyStateCard />`, `<DivisionLanding />`).
 *
 * ACCOUNT-PREMIUM-01 (session 1 reference).
 *
 * Composition (top → bottom):
 *   1. <HeroCard variant="paired"> — state-driven (empty/calm/active/attention)
 *      + 4 tiles (total / in-flight / payment / completed)
 *      + side breakdown (in-flight / scheduled / payment / completed counts)
 *   2. <CareActiveGlance /> — when there's a top active booking, the next-action
 *      surface (kept as a richer card than NextStepRow because it has a full
 *      metadata grid; logically equivalent to NextStepRow but with more weight)
 *   3. Bookings section — list with filter/pagination via CareBookingsDashboard
 *      (or EmptyStateCard when stats.total === 0)
 *   4. Activity section — recent activity timeline (or EmptyStateCard)
 *
 * State driving:
 *   - heroState(stats) returns "empty" | "calm" | "active" | "attention"
 *   - the four state slices in copy.hero.state.* carry localized headline/blurb/CTA copy
 *   - tile tones lift the payment value when balanceDue > 0
 */
export default async function CarePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale).divisionCare;

  const params = searchParams ? await searchParams : {};
  const selectedBookingId = typeof params.booking === "string" ? params.booking : null;
  const filterRaw = typeof params.filter === "string" ? params.filter : "all";
  const activeFilter: CareBookingFilterId = CARE_BOOKING_FILTER_OPTIONS.some((o) => o.id === filterRaw)
    ? (filterRaw as CareBookingFilterId)
    : "all";
  const pageRaw = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const pageRequested = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const [bookings, activity] = await Promise.all([
    getCareBookings(user.id),
    getDivisionActivity(user.id, "care", 20, locale),
  ]);

  const stats = careStats(bookings);
  const filteredBookings = bookings.filter((b) => matchesCareFilter(b, activeFilter));
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / CARE_PAGE_SIZE));
  const page = Math.min(pageRequested, totalPages);
  const listSlice = filteredBookings.slice((page - 1) * CARE_PAGE_SIZE, page * CARE_PAGE_SIZE);
  const activityRows = toCareActivityRows(activity);

  // ── Build HeroCard props from state machine ──────────────────────
  const state = heroState(stats);
  const heroCount =
    state === "empty"
      ? 0
      : state === "attention"
        ? stats.needsPayment + stats.needsAttention
        : state === "active"
          ? stats.inFlight
          : stats.total;
  let heroHeadline: string;
  let heroBlurb: string;
  let heroCtaPrimaryLabel: string;
  let heroCtaSecondaryLabel: string;
  if (state === "empty") {
    const s = copy.hero.state.empty;
    heroHeadline = s.headline;
    heroBlurb = s.blurb;
    heroCtaPrimaryLabel = s.ctaPrimary;
    heroCtaSecondaryLabel = s.ctaSecondary;
  } else {
    const s =
      state === "attention"
        ? copy.hero.state.attention
        : state === "active"
          ? copy.hero.state.active
          : copy.hero.state.calm;
    heroHeadline = formatAccountTemplate(
      heroCount === 1 ? s.headlineTemplateSingular : s.headlineTemplatePlural,
      { count: heroCount },
    );
    heroBlurb = s.blurb;
    heroCtaPrimaryLabel = s.ctaPrimary;
    heroCtaSecondaryLabel = s.ctaSecondary;
  }

  const ctaPrimaryHref =
    state === "attention" ? "#care-bookings" : state === "active" ? CARE_TRACK_URL : CARE_BOOK_URL;
  const ctaSecondaryHref = state === "active" ? CARE_BOOK_URL : CARE_TRACK_URL;

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.hero.tileLabels.total,
      value: stats.total,
      foot:
        stats.total === 0
          ? copy.hero.tileFoot.totalEmpty
          : formatAccountTemplate(copy.hero.tileFoot.totalWithTemplate, { count: stats.total }),
    },
    {
      label: copy.hero.tileLabels.inFlight,
      value: stats.inFlight,
      foot:
        stats.inFlight === 0
          ? copy.hero.tileFoot.inFlightEmpty
          : copy.hero.tileFoot.inFlightWith,
      tone: stats.inFlight > 0 ? "active" : "default",
    },
    {
      label: copy.hero.tileLabels.payment,
      value: stats.needsPayment,
      foot:
        stats.needsPayment === 0
          ? copy.hero.tileFoot.paymentEmpty
          : copy.hero.tileFoot.paymentWith,
      tone: stats.needsPayment > 0 ? "warning" : "default",
    },
    {
      label: copy.hero.tileLabels.completed,
      value: stats.completed,
      foot:
        stats.completed === 0
          ? copy.hero.tileFoot.completedEmpty
          : copy.hero.tileFoot.completedWith,
    },
  ];

  const breakdownAll: ReadonlyArray<HeroCardBreakdownRow> = [
    { label: copy.hero.breakdownLabels.inFlight, count: stats.inFlight, color: "var(--acct-gold)" },
    { label: copy.hero.breakdownLabels.scheduled, count: stats.scheduled, color: "var(--acct-blue)" },
    { label: copy.hero.breakdownLabels.payment, count: stats.needsPayment, color: "var(--acct-red)" },
    { label: copy.hero.breakdownLabels.completed, count: stats.completed, color: "var(--acct-green)" },
  ];
  const breakdown = breakdownAll.filter((row) => row.count > 0);

  // ── Section metas ───────────────────────────────────────────────
  const bookingsMeta =
    bookings.length === 0
      ? copy.sections.bookingsEmpty
      : formatAccountTemplate(
          bookings.length === 1
            ? copy.sections.bookingsMetaTemplateSingular
            : copy.sections.bookingsMetaTemplatePlural,
          { count: bookings.length },
        );
  const activityMeta =
    activityRows.length === 0
      ? copy.sections.activityEmpty
      : formatAccountTemplate(
          activityRows.length === 1
            ? copy.sections.activityMetaTemplateSingular
            : copy.sections.activityMetaTemplatePlural,
          { count: activityRows.length },
        );

  // ── Compose sections ────────────────────────────────────────────
  const sections = [
    // Active glance (when present) is rendered as a section to stay
    // adjacent to the bookings list. The card itself is a richer
    // capability than NextStepRow so we keep it as its own card.
    ...(stats.topActiveBooking
      ? [
          {
            id: "care-glance",
            title: copy.sections.glance,
            meta: copy.sections.glanceMeta,
            content: (
              <CareActiveGlance
                booking={stats.topActiveBooking}
                locale={locale}
                labels={{
                  nextActionLabel: copy.glance.nextActionLabel,
                  serviceLabel: copy.glance.serviceLabel,
                  pickupLabel: copy.glance.pickupLabel,
                  balanceLabel: copy.glance.balanceLabel,
                  trackingLabel: copy.glance.trackingLabel,
                  serviceFallback: copy.glance.serviceFallback,
                  toBeScheduled: copy.formatLabels.toBeScheduled,
                  shortMonths: copy.formatLabels.shortMonths,
                  statusLabels: copy.status,
                }}
              />
            ),
          },
        ]
      : []),
    {
      id: "care-bookings",
      title: copy.sections.bookings,
      meta: bookingsMeta,
      content:
        bookings.length === 0 ? (
          <EmptyStateCard
            kicker={copy.hero.eyebrow}
            title={copy.empty.title}
            body={copy.empty.body}
            cta={{ label: copy.hero.state.empty.ctaPrimary, href: CARE_BOOK_URL }}
          />
        ) : (
          <CareBookingsDashboard
            locale={locale}
            bookings={filteredBookings}
            listBookings={listSlice}
            selectedBookingId={selectedBookingId}
            activeFilter={activeFilter}
            page={page}
            totalPages={totalPages}
            pageSize={CARE_PAGE_SIZE}
            totalFiltered={filteredBookings.length}
            copy={copy.dashboard}
            statusValueLabels={copy.statusValueLabels}
          />
        ),
    },
    {
      id: "care-activity",
      title: copy.sections.activity,
      meta: activityMeta,
      content:
        activityRows.length === 0 ? (
          <EmptyStateCard
            kicker={copy.sections.activity}
            title={copy.sections.activity}
            body={copy.sections.activityEmpty}
          />
        ) : (
          <CareActivity
            activity={activityRows}
            shortMonths={copy.formatLabels.shortMonths}
            ariaLabel={copy.activityAriaLabel}
          />
        ),
    },
  ];

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "attention"
        ? "attention"
        : state === "active"
          ? "active"
          : "calm";

  return (
    <DivisionLanding
      className="acct-care acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={copy.hero.eyebrow}
          headline={heroHeadline}
          blurb={heroBlurb}
          ariaTilesLabel={copy.hero.tilesAriaLabel}
          ctaPrimary={{ label: heroCtaPrimaryLabel, href: ctaPrimaryHref }}
          ctaSecondary={{ label: heroCtaSecondaryLabel, href: ctaSecondaryHref }}
          tiles={tiles}
          side={{
            kicker: copy.hero.sideKicker,
            title: copy.hero.sideTitle,
            body: copy.hero.sideBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: copy.hero.breakdownLabel,
                    rows: breakdown,
                  }
                : undefined,
          }}
        />
      }
      sections={sections}
    />
  );
}
