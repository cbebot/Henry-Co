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
import { careStats, toCareActivityRows, type CareLocale } from "@/components/care/helpers";

import CareBookingsDashboard, {
  CARE_BOOKING_FILTER_OPTIONS,
  matchesCareFilter,
  type CareBookingFilterId,
} from "@/components/divisions/CareBookingsDashboard";

export const dynamic = "force-dynamic";

const CARE_PAGE_SIZE = 12;

const COPY_EN = {
  eyebrow: "Care · live",
  sideKicker: "How this room works",
  sideTitle: "Book on Care, follow up here.",
  sideBody: "Every booking made on HenryCo Care mirrors into this room — tracking code, payment status, and the next operational step land here automatically. The dashboard below stays in sync as service progresses.",
  breakdownLabel: "By status",
  tileLabels: {
    total: "Bookings",
    inFlight: "In service",
    payment: "Awaiting payment",
    completed: "Completed",
  },
  tileFoot: {
    totalEmpty: "Book your first Care service to start",
    totalWith: (n: number) => `${n} linked to this account`,
    inFlightEmpty: "Nothing actively moving right now",
    inFlightWith: "Live status mirrors below",
    paymentEmpty: "No outstanding payment verification",
    paymentWith: "Submit or check receipt below",
    completedEmpty: "No services completed yet",
    completedWith: "Marked done by the Care team",
  },
  sectionGlance: "Next action",
  sectionGlanceMeta: "The most time-sensitive booking surfaces here.",
  sectionBookings: "All bookings",
  sectionBookingsEmpty: "Bookings made while signed in appear here in real time.",
  sectionBookingsMeta: (n: number) => `${n} booking${n === 1 ? "" : "s"} · filter, paginate, and open any one for the live detail.`,
  sectionActivity: "Recent activity",
  sectionActivityEmpty: "Status updates, receipts, and reviews surface here as they happen.",
  sectionActivityMeta: (n: number) => `${n} update${n === 1 ? "" : "s"} · most recent first`,
  emptyTitle: "No Care bookings linked yet",
  emptyBody: "Bookings you make on Care while signed in land here immediately. Older bookings also surface once their email or phone matches your shared profile.",
  glanceNextAction: "Next action",
  glanceService: "Service",
  glancePickup: "Pickup",
  glanceBalance: "Balance due",
  glanceTracking: "Tracking",
  activityAriaLabel: "Care activity",
};

const COPY_FR: typeof COPY_EN = {
  eyebrow: "Care · en direct",
  sideKicker: "Comment cette pièce fonctionne",
  sideTitle: "Réservez sur Care, suivez ici.",
  sideBody: "Chaque réservation faite sur HenryCo Care est miroitée dans cette pièce — code de suivi, statut du paiement, et la prochaine étape opérationnelle arrivent ici automatiquement. Le tableau de bord ci-dessous reste synchronisé pendant le service.",
  breakdownLabel: "Par statut",
  tileLabels: {
    total: "Réservations",
    inFlight: "En cours",
    payment: "Paiement à vérifier",
    completed: "Terminées",
  },
  tileFoot: {
    totalEmpty: "Réservez votre premier service Care",
    totalWith: (n: number) => `${n} liée${n === 1 ? "" : "s"} à ce compte`,
    inFlightEmpty: "Rien d’actif pour le moment",
    inFlightWith: "Statut en direct ci-dessous",
    paymentEmpty: "Aucune vérification de paiement en attente",
    paymentWith: "Soumettre ou vérifier le reçu ci-dessous",
    completedEmpty: "Aucune prestation terminée pour le moment",
    completedWith: "Marquées comme terminées par Care",
  },
  sectionGlance: "Prochaine action",
  sectionGlanceMeta: "La réservation la plus urgente est mise en avant ici.",
  sectionBookings: "Toutes les réservations",
  sectionBookingsEmpty: "Les réservations faites en étant connecté apparaissent ici en temps réel.",
  sectionBookingsMeta: (n: number) => `${n} réservation${n === 1 ? "" : "s"} · filtrer, paginer et ouvrir le détail en direct.`,
  sectionActivity: "Activité récente",
  sectionActivityEmpty: "Mises à jour de statut, reçus et avis apparaissent ici dès qu’ils se produisent.",
  sectionActivityMeta: (n: number) => `${n} mise${n === 1 ? "" : "s"} à jour · plus récentes en premier`,
  emptyTitle: "Aucune réservation Care liée pour le moment",
  emptyBody: "Les nouvelles réservations faites en étant connecté apparaîtront ici immédiatement. Les anciennes réservations apparaîtront aussi une fois que leur e-mail ou téléphone correspondra à votre profil partagé.",
  glanceNextAction: "Prochaine action",
  glanceService: "Service",
  glancePickup: "Enlèvement",
  glanceBalance: "Solde dû",
  glanceTracking: "Suivi",
  activityAriaLabel: "Activité Care",
};

export default async function CarePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [localeRaw, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const locale: CareLocale = localeRaw === "fr" ? "fr" : "en";
  const copy = locale === "fr" ? COPY_FR : COPY_EN;

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

  return (
    <div className="acct-care acct-fade-in">
      <CareHero
        stats={stats}
        locale={locale}
        labels={{
          eyebrow: copy.eyebrow,
          sideKicker: copy.sideKicker,
          sideTitle: copy.sideTitle,
          sideBody: copy.sideBody,
          breakdownLabel: copy.breakdownLabel,
          tileLabels: copy.tileLabels,
          tileFoot: copy.tileFoot,
        }}
      />

      {stats.topActiveBooking ? (
        <section aria-labelledby="acct-care-glance">
          <div className="acct-care__section-head">
            <h2 id="acct-care-glance" className="acct-care__section-title">
              {copy.sectionGlance}
            </h2>
            <span className="acct-care__section-meta">{copy.sectionGlanceMeta}</span>
          </div>
          <CareActiveGlance
            booking={stats.topActiveBooking}
            locale={locale}
            labels={{
              nextActionLabel: copy.glanceNextAction,
              serviceLabel: copy.glanceService,
              pickupLabel: copy.glancePickup,
              balanceLabel: copy.glanceBalance,
              trackingLabel: copy.glanceTracking,
            }}
          />
        </section>
      ) : null}

      <section id="care-bookings" aria-labelledby="acct-care-bookings">
        <div className="acct-care__section-head">
          <h2 id="acct-care-bookings" className="acct-care__section-title">
            {copy.sectionBookings}
          </h2>
          <span className="acct-care__section-meta">
            {bookings.length === 0
              ? copy.sectionBookingsEmpty
              : copy.sectionBookingsMeta(bookings.length)}
          </span>
        </div>
        {bookings.length === 0 ? (
          <div className="acct-care__empty">
            <strong>{copy.emptyTitle}</strong>
            {copy.emptyBody}
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
          />
        )}
      </section>

      <section aria-labelledby="acct-care-activity">
        <div className="acct-care__section-head">
          <h2 id="acct-care-activity" className="acct-care__section-title">
            {copy.sectionActivity}
          </h2>
          <span className="acct-care__section-meta">
            {activityRows.length === 0
              ? copy.sectionActivityEmpty
              : copy.sectionActivityMeta(activityRows.length)}
          </span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-care__empty">
            <strong>{copy.sectionActivity}</strong>
            {copy.sectionActivityEmpty}
          </div>
        ) : (
          <CareActivity
            activity={activityRows}
            locale={locale}
            ariaLabel={copy.activityAriaLabel}
          />
        )}
      </section>
    </div>
  );
}
