import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import type { LinkedCareBooking } from "@/lib/care-sync";
import {
  divisionColor,
  formatCurrencyAmount,
  formatDate,
  timeAgoLocalized,
} from "@/lib/format";

function toneChipClasses(tone: LinkedCareBooking["nextAction"]["tone"]) {
  if (tone === "success") {
    return "border border-[var(--acct-line)] bg-[var(--acct-green-soft)] text-[var(--acct-green)]";
  }
  if (tone === "warning") {
    return "border border-[var(--acct-line)] bg-[var(--acct-orange-soft)] text-[var(--acct-orange)]";
  }
  return "border border-[var(--acct-line)] bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]";
}

function statusChipClasses(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["delivered", "customer_confirmed", "inspection_completed", "service_completed"].includes(normalized)) {
    return "border border-[var(--acct-line)] bg-[var(--acct-green-soft)] text-[var(--acct-green)]";
  }
  if (["cancelled", "issue", "exception", "rejected"].includes(normalized)) {
    return "border border-[var(--acct-line)] bg-[var(--acct-red-soft)] text-[var(--acct-red)]";
  }
  if (["booked", "awaiting_payment", "receipt_submitted", "under_review"].includes(normalized)) {
    return "border border-[var(--acct-line)] bg-[var(--acct-orange-soft)] text-[var(--acct-orange)]";
  }
  return "border border-[var(--acct-line)] bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]";
}

function summaryMetric(label: string, value: string, hint: string, tone?: string) {
  return { label, value, hint, tone };
}

const FILTER_OPTIONS = [
  { id: "all" },
  { id: "unpaid" },
  { id: "receipt" },
  { id: "active" },
  { id: "completed" },
  { id: "issue" },
] as const;

export type CareBookingFilterId = (typeof FILTER_OPTIONS)[number]["id"];

function matchesCareFilter(booking: LinkedCareBooking, filter: CareBookingFilterId) {
  if (filter === "all") return true;
  const st = String(booking.status || "").trim().toLowerCase();
  const v = booking.payment.verificationStatus.toLowerCase();

  if (filter === "unpaid") return booking.payment.balanceDue > 0;

  if (filter === "receipt") {
    return (
      ["receipt_submitted", "under_review", "awaiting_receipt", "awaiting_corrected_proof"].includes(v) ||
      v.includes("receipt")
    );
  }

  if (filter === "active") {
    return !["cancelled", "rejected", "delivered", "customer_confirmed", "inspection_completed", "service_completed"].includes(
      st
    );
  }

  if (filter === "completed") {
    return Boolean(booking.reviewUrl) || ["delivered", "customer_confirmed", "inspection_completed", "service_completed"].includes(st);
  }

  if (filter === "issue") {
    return ["cancelled", "rejected", "issue", "exception"].includes(st) || v === "rejected";
  }

  return true;
}

export { matchesCareFilter, FILTER_OPTIONS as CARE_BOOKING_FILTER_OPTIONS };

function getStatusLabel(locale: string, value?: string | null, fallback = "Booked") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;

  const english: Record<string, string> = {
    booked: "Booked",
    awaiting_payment: "Awaiting payment",
    receipt_submitted: "Receipt submitted",
    under_review: "Under review",
    delivered: "Delivered",
    customer_confirmed: "Customer confirmed",
    inspection_completed: "Inspection completed",
    service_completed: "Service completed",
    cancelled: "Cancelled",
    issue: "Issue",
    exception: "Exception",
    rejected: "Rejected",
  };

  const french: Record<string, string> = {
    booked: "Réservé",
    awaiting_payment: "Paiement attendu",
    receipt_submitted: "Reçu envoyé",
    under_review: "En revue",
    delivered: "Livré",
    customer_confirmed: "Confirmé par le client",
    inspection_completed: "Inspection terminée",
    service_completed: "Service terminé",
    cancelled: "Annulé",
    issue: "Incident",
    exception: "Exception",
    rejected: "Rejeté",
  };

  return (locale === "fr" ? french : english)[normalized] || normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CareBookingsDashboard({
  locale,
  bookings,
  listBookings,
  selectedBookingId,
  activeFilter,
  page,
  totalPages,
  pageSize,
  totalFiltered,
}: {
  locale: string;
  bookings: LinkedCareBooking[];
  listBookings: LinkedCareBooking[];
  selectedBookingId?: string | null;
  activeFilter: CareBookingFilterId;
  page: number;
  totalPages: number;
  pageSize: number;
  totalFiltered: number;
}) {
  const copy =
    locale === "fr"
      ? {
          filters: {
            all: "Tout",
            unpaid: "Solde dû",
            receipt: "Reçu / revue",
            active: "En cours",
            completed: "Terminées",
            issue: "Incidents",
          },
          filtered: "filtré",
          bookingSingular: "réservation",
          bookingPlural: "réservations",
          metrics: {
            visible: "Réservations visibles",
            visibleHint: "Vraies réservations Care liées à ce compte.",
            balance: "Solde restant",
            balanceHintSome: "{count} réservation(s) demandent encore un suivi de paiement.",
            balanceHintNone: "Aucun solde Care impayé n’est ouvert pour le moment.",
            receiptQueue: "File des reçus",
            receiptQueueHintSome: "Des réservations avec reçu envoyé attendent encore une vérification.",
            receiptQueueHintNone: "Aucun retard de vérification de reçu n’est lié à ce compte.",
            completed: "Terminées",
            completedHintSome: "Des réservations terminées peuvent maintenant passer au suivi d’avis.",
            completedHintNone: "Les réservations Care terminées apparaîtront ici à la fin du service.",
          },
          linkedBookings: "Réservations Care liées",
          linkedBookingsDescription: "Vos réservations Care, leur statut de paiement et les prochaines actions.",
          onThisPage: "sur cette page",
          selectedBooking: "Réservation sélectionnée",
          paymentSnapshot: "Aperçu du paiement",
          receiptVisibility: "Visibilité du reçu",
          nextBestAction: "Meilleure action suivante",
          serviceSummary: "Résumé du service",
          serviceFallback: "Service Care",
          addressPending: "Adresse en attente",
          updated: "Mis à jour",
          balanceDue: "Solde dû",
          nextMove: "Prochaine action",
          paginationLabel: "Pagination des réservations Care",
          pageLabel: "Page",
          of: "sur",
          perPage: "par page",
          previous: "Précédent",
          next: "Suivant",
          customerFallback: "Client",
          scheduledDate: "Date prévue",
          notScheduled: "Pas encore planifié",
          timeWindow: "Créneau horaire",
          windowPending: "Créneau en attente",
          pickupAddress: "Adresse de collecte",
          returnAddress: "Adresse de retour / livraison",
          returnAddressFallback: "Utilise l’adresse de collecte sauf modification pendant la réservation",
          trackingCode: "Code de suivi",
          quotedTotal: "Total estimé",
          amountRecorded: "Montant enregistré",
          receiptState: "État du reçu",
          receiptsSubmitted: "Reçus envoyés",
          lastSubmission: "Dernier envoi",
          noReceiptYet: "Aucun reçu pour le moment",
          openLiveBooking: "Ouvrir la réservation en direct",
          leaveReview: "Laisser un avis",
        }
      : {
          filters: {
            all: "All",
            unpaid: "Balance due",
            receipt: "Receipt / review",
            active: "In progress",
            completed: "Completed",
            issue: "Issues",
          },
          filtered: "filtered",
          bookingSingular: "booking",
          bookingPlural: "bookings",
          metrics: {
            visible: "Visible bookings",
            visibleHint: "Real Care bookings linked to this account.",
            balance: "Outstanding balance",
            balanceHintSome: "{count} booking(s) still need payment follow-up.",
            balanceHintNone: "No unpaid Care balance is currently open.",
            receiptQueue: "Receipt queue",
            receiptQueueHintSome: "Bookings with submitted receipts still waiting for verification.",
            receiptQueueHintNone: "No receipt-verification backlog is linked to this account.",
            completed: "Completed",
            completedHintSome: "Completed bookings that can move into review follow-up.",
            completedHintNone: "Completed Care bookings will appear here once service closes.",
          },
          linkedBookings: "Linked Care bookings",
          linkedBookingsDescription: "Your Care bookings, payment status, and upcoming actions.",
          onThisPage: "on this page",
          selectedBooking: "Selected booking",
          paymentSnapshot: "Payment snapshot",
          receiptVisibility: "Receipt visibility",
          nextBestAction: "Next best action",
          serviceSummary: "Service summary",
          serviceFallback: "Care service",
          addressPending: "Address pending",
          updated: "Updated",
          balanceDue: "Balance due",
          nextMove: "Next move",
          paginationLabel: "Care bookings pagination",
          pageLabel: "Page",
          of: "of",
          perPage: "per page",
          previous: "Previous",
          next: "Next",
          customerFallback: "Customer",
          scheduledDate: "Scheduled date",
          notScheduled: "Not scheduled yet",
          timeWindow: "Time window",
          windowPending: "Window pending",
          pickupAddress: "Pickup address",
          returnAddress: "Return / delivery address",
          returnAddressFallback: "Uses pickup address unless changed during booking",
          trackingCode: "Tracking code",
          quotedTotal: "Quoted total",
          amountRecorded: "Amount recorded",
          receiptState: "Receipt state",
          receiptsSubmitted: "Receipts submitted",
          lastSubmission: "Last submission",
          noReceiptYet: "No receipt yet",
          openLiveBooking: "Open live booking",
          leaveReview: "Leave review",
        };

  const accent = divisionColor("care");
  const moneyLocale = locale === "fr" ? "fr-FR" : "en-NG";
  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    label: copy.filters[option.id],
  }));
  const selectedBooking =
    bookings.find((booking) => booking.id === selectedBookingId) ??
    listBookings[0] ??
    bookings[0] ??
    null;
  const unpaidBookings = bookings.filter((booking) => booking.payment.balanceDue > 0);
  const reviewQueue = bookings.filter((booking) =>
    ["receipt_submitted", "under_review"].includes(
      booking.payment.verificationStatus.toLowerCase()
    )
  );
  const completedBookings = bookings.filter((booking) => booking.reviewUrl);
  const outstandingBalance = unpaidBookings.reduce(
    (sum, booking) => sum + booking.payment.balanceDue,
    0
  );

  const metrics = [
    summaryMetric(copy.metrics.visible, String(bookings.length), copy.metrics.visibleHint),
    summaryMetric(
      copy.metrics.balance,
      formatCurrencyAmount(outstandingBalance, "NGN", { unit: "naira", locale: moneyLocale }),
      unpaidBookings.length > 0
        ? copy.metrics.balanceHintSome.replace("{count}", String(unpaidBookings.length))
        : copy.metrics.balanceHintNone,
      unpaidBookings.length > 0 ? "warning" : "success"
    ),
    summaryMetric(
      copy.metrics.receiptQueue,
      String(reviewQueue.length),
      reviewQueue.length > 0
        ? copy.metrics.receiptQueueHintSome
        : copy.metrics.receiptQueueHintNone
    ),
    summaryMetric(
      copy.metrics.completed,
      String(completedBookings.length),
      completedBookings.length > 0
        ? copy.metrics.completedHintSome
        : copy.metrics.completedHintNone
    ),
  ];

  if (!selectedBooking) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((option) => {
          const active = activeFilter === option.id;
          return (
            <Link
              key={option.id}
              href={option.id === "all" ? "/care" : `/care?filter=${option.id}`}
              scroll={false}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                active
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                  : "border-[var(--acct-line)] bg-[var(--acct-bg-soft)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]/40"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
        <span className="ml-auto text-xs text-[var(--acct-muted)]">
          {totalFiltered} {totalFiltered === 1 ? copy.bookingSingular : copy.bookingPlural}
          {activeFilter !== "all" ? ` · ${copy.filtered}` : ""}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="acct-card p-5"
            style={
              metric.tone === "warning"
                ? { boxShadow: "inset 0 0 0 1px rgba(217, 119, 6, 0.14)" }
                : metric.tone === "success"
                  ? { boxShadow: "inset 0 0 0 1px rgba(5, 150, 105, 0.14)" }
                  : undefined
            }
          >
            <p className="acct-kicker">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">{metric.value}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="acct-kicker">{copy.linkedBookings}</p>
              <p className="mt-1 text-sm text-[var(--acct-muted)]">
                {copy.linkedBookingsDescription}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              {listBookings.length} {copy.onThisPage}
            </span>
          </div>

          <div className="space-y-3">
            {listBookings.map((booking) => {
              const active = booking.id === selectedBooking.id;
              const filterQs = activeFilter === "all" ? "" : `&filter=${activeFilter}`;
              const pageQs = page > 1 ? `&page=${page}` : "";

              return (
                <Link
                  key={booking.id}
                  href={`/care?booking=${encodeURIComponent(booking.id)}${filterQs}${pageQs}`}
                  className={`block rounded-2xl border p-4 transition-all ${
                    active
                      ? "border-transparent shadow-md"
                      : "border-[var(--acct-line)] bg-[var(--acct-surface)] hover:border-[var(--acct-gold)]/30 hover:shadow-sm"
                  }`}
                  style={active ? { backgroundColor: `${accent}10`, boxShadow: `inset 0 0 0 1px ${accent}33` } : undefined}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>
                      {booking.tracking_code}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${statusChipClasses(booking.status)}`}>
                      {getStatusLabel(locale, booking.status)}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${toneChipClasses(booking.nextAction.tone)}`}>
                      {booking.payment.verificationLabel}
                    </span>
                  </div>

                  <p className="mt-3 text-base font-semibold text-[var(--acct-ink)]">
                    {booking.service_type || copy.serviceFallback}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">
                    {booking.pickup_address || copy.addressPending} • {copy.updated} {timeAgoLocalized(booking.updated_at || booking.created_at || new Date().toISOString(), locale)}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <MetricMini label={copy.balanceDue}>
                      {formatCurrencyAmount(booking.payment.balanceDue, "NGN", {
                        unit: "naira",
                        locale: moneyLocale,
                      })}
                    </MetricMini>
                    <MetricMini label={copy.nextMove}>{booking.nextAction.label}</MetricMini>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--acct-line)] pt-4"
              aria-label={copy.paginationLabel}
            >
              <p className="text-xs text-[var(--acct-muted)]">
                {copy.pageLabel} {page} {copy.of} {totalPages} · {pageSize} {copy.perPage}
              </p>
              <div className="flex flex-wrap gap-2">
                {page > 1 ? (
                  <Link
                    href={`/care?page=${page - 1}${activeFilter === "all" ? "" : `&filter=${activeFilter}`}`}
                    className="rounded-full border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
                  >
                    {copy.previous}
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link
                    href={`/care?page=${page + 1}${activeFilter === "all" ? "" : `&filter=${activeFilter}`}`}
                    className="rounded-full border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
                  >
                    {copy.next}
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </section>

        <section className="acct-card overflow-hidden p-0">
          <div className="border-b border-[var(--acct-line)] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="acct-kicker">{copy.selectedBooking}</p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
                  {selectedBooking.service_type || copy.serviceFallback}
                </h2>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">
                  {selectedBooking.customer_name || copy.customerFallback} • {selectedBooking.tracking_code}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusChipClasses(selectedBooking.status)}`}>
                  {getStatusLabel(locale, selectedBooking.status)}
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneChipClasses(selectedBooking.nextAction.tone)}`}>
                  {selectedBooking.payment.verificationLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailCard icon={Calendar} label={copy.scheduledDate}>
                {selectedBooking.pickup_date ? formatDate(selectedBooking.pickup_date, { locale: moneyLocale }) : copy.notScheduled}
              </DetailCard>
              <DetailCard icon={Clock3} label={copy.timeWindow}>
                {selectedBooking.pickup_slot || copy.windowPending}
              </DetailCard>
              <DetailCard icon={MapPin} label={copy.pickupAddress}>
                {selectedBooking.pickup_address || copy.addressPending}
              </DetailCard>
              <DetailCard icon={MapPin} label={copy.returnAddress}>
                {selectedBooking.return_address || copy.returnAddressFallback}
              </DetailCard>
              <DetailCard icon={Truck} label={copy.trackingCode}>
                {selectedBooking.tracking_code || selectedBooking.id}
              </DetailCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[var(--acct-muted)]" />
                  <p className="acct-kicker">{copy.paymentSnapshot}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricMini label={copy.quotedTotal}>
                    {formatCurrencyAmount(Number(selectedBooking.quoted_total || 0), "NGN", {
                      unit: "naira",
                      locale: moneyLocale,
                    })}
                  </MetricMini>
                  <MetricMini label={copy.amountRecorded}>
                    {formatCurrencyAmount(selectedBooking.payment.amountPaidRecorded, "NGN", {
                      unit: "naira",
                      locale: moneyLocale,
                    })}
                  </MetricMini>
                  <MetricMini label={copy.balanceDue}>
                    {formatCurrencyAmount(selectedBooking.payment.balanceDue, "NGN", {
                      unit: "naira",
                      locale: moneyLocale,
                    })}
                  </MetricMini>
                  <MetricMini label={copy.receiptState}>
                    {selectedBooking.payment.verificationLabel}
                  </MetricMini>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-[var(--acct-muted)]" />
                  <p className="acct-kicker">{copy.receiptVisibility}</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--acct-ink)]">
                  {selectedBooking.payment.verificationMessage}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricMini label={copy.receiptsSubmitted}>
                    {String(selectedBooking.payment.receiptCount)}
                  </MetricMini>
                  <MetricMini label={copy.lastSubmission}>
                    {selectedBooking.payment.lastSubmittedAt
                      ? timeAgoLocalized(selectedBooking.payment.lastSubmittedAt, locale)
                      : copy.noReceiptYet}
                  </MetricMini>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--acct-muted)]" />
                <p className="acct-kicker">{copy.nextBestAction}</p>
              </div>
              <p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">
                {selectedBooking.nextAction.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
                {selectedBooking.nextAction.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={selectedBooking.nextAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="acct-button-primary rounded-xl"
                  style={{ backgroundColor: accent }}
                >
                  {copy.openLiveBooking} <ArrowUpRight size={14} />
                </a>
                {selectedBooking.reviewUrl ? (
                  <a
                    href={selectedBooking.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acct-button-secondary rounded-xl"
                  >
                    {copy.leaveReview} <ChevronRight size={14} />
                  </a>
                ) : null}
              </div>
            </div>

            {selectedBooking.item_summary ? (
              <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--acct-muted)]" />
                  <p className="acct-kicker">{copy.serviceSummary}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--acct-ink)]">
                  {selectedBooking.item_summary}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
      <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-3 text-sm font-medium leading-6 text-[var(--acct-ink)]">{children}</div>
    </div>
  );
}

function MetricMini({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--acct-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--acct-ink)]">{children}</p>
    </div>
  );
}
