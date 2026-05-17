import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";

import { requireAccountUser } from "@/lib/auth";
import {
  getCareBookings,
  getDivisionActivity,
} from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/care/styles.css";
import { CareHero } from "@/components/care/CareHero";
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
const CARE_BOOK_URL = "https://care.henrycogroup.com/book";
const CARE_TRACK_URL = "https://care.henrycogroup.com/track";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionCare;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

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
    getDivisionActivity(user.id, "care"),
  ]);

  const stats = careStats(bookings);
  const filteredBookings = bookings.filter((b) => matchesCareFilter(b, activeFilter));
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / CARE_PAGE_SIZE));
  const page = Math.min(pageRequested, totalPages);
  const listSlice = filteredBookings.slice((page - 1) * CARE_PAGE_SIZE, page * CARE_PAGE_SIZE);
  const activityRows = toCareActivityRows(activity);

  // Resolve hero copy from i18n slice (was previously baked into helpers).
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

  return (
    <div className="acct-care acct-fade-in">
      <CareHero
        stats={stats}
        labels={{
          eyebrow: copy.hero.eyebrow,
          sideKicker: copy.hero.sideKicker,
          sideTitle: copy.hero.sideTitle,
          sideBody: copy.hero.sideBody,
          breakdownLabel: copy.hero.breakdownLabel,
          tilesAriaLabel: copy.hero.tilesAriaLabel,
          tileLabels: copy.hero.tileLabels,
          tileFoot: {
            totalEmpty: copy.hero.tileFoot.totalEmpty,
            totalWith: (n: number) =>
              formatAccountTemplate(copy.hero.tileFoot.totalWithTemplate, { count: n }),
            inFlightEmpty: copy.hero.tileFoot.inFlightEmpty,
            inFlightWith: copy.hero.tileFoot.inFlightWith,
            paymentEmpty: copy.hero.tileFoot.paymentEmpty,
            paymentWith: copy.hero.tileFoot.paymentWith,
            completedEmpty: copy.hero.tileFoot.completedEmpty,
            completedWith: copy.hero.tileFoot.completedWith,
          },
          breakdownLabels: copy.hero.breakdownLabels,
          headline: heroHeadline,
          blurb: heroBlurb,
          ctaPrimary: {
            label: heroCtaPrimaryLabel,
            href: state === "attention" ? "#care-bookings" : state === "active" ? CARE_TRACK_URL : CARE_BOOK_URL,
          },
          ctaSecondary: {
            label: heroCtaSecondaryLabel,
            href: state === "active" ? CARE_BOOK_URL : CARE_TRACK_URL,
          },
        }}
      />

      {stats.topActiveBooking ? (
        <section aria-labelledby="acct-care-glance">
          <div className="acct-care__section-head">
            <h2 id="acct-care-glance" className="acct-care__section-title">
              {copy.sections.glance}
            </h2>
            <span className="acct-care__section-meta">{copy.sections.glanceMeta}</span>
          </div>
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
        </section>
      ) : null}

      <section id="care-bookings" aria-labelledby="acct-care-bookings">
        <div className="acct-care__section-head">
          <h2 id="acct-care-bookings" className="acct-care__section-title">
            {copy.sections.bookings}
          </h2>
          <span className="acct-care__section-meta">{bookingsMeta}</span>
        </div>
        {bookings.length === 0 ? (
          <div className="acct-care__empty">
            <strong>{copy.empty.title}</strong>
            {copy.empty.body}
          </div>
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
        )}
      </section>

      <section aria-labelledby="acct-care-activity">
        <div className="acct-care__section-head">
          <h2 id="acct-care-activity" className="acct-care__section-title">
            {copy.sections.activity}
          </h2>
          <span className="acct-care__section-meta">{activityMeta}</span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-care__empty">
            <strong>{copy.sections.activity}</strong>
            {copy.sections.activityEmpty}
          </div>
        ) : (
          <CareActivity
            activity={activityRows}
            shortMonths={copy.formatLabels.shortMonths}
            ariaLabel={copy.activityAriaLabel}
          />
        )}
      </section>
    </div>
  );
}
