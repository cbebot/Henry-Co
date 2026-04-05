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
import { divisionColor, formatCurrencyAmount, formatDate, timeAgo } from "@/lib/format";

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

function humanize(value?: string | null, fallback = "Booked") {
  const normalized = String(value || "").trim().replace(/[_-]+/g, " ");
  if (!normalized) return fallback;
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function summaryMetric(label: string, value: string, hint: string, tone?: string) {
  return { label, value, hint, tone };
}

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "unpaid", label: "Balance due" },
  { id: "receipt", label: "Receipt / review" },
  { id: "active", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "issue", label: "Issues" },
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

export default function CareBookingsDashboard({
  bookings,
  listBookings,
  selectedBookingId,
  activeFilter,
  page,
  totalPages,
  pageSize,
  totalFiltered,
}: {
  bookings: LinkedCareBooking[];
  /** Paginated subset for the left-hand list (metrics use full `bookings`). */
  listBookings: LinkedCareBooking[];
  selectedBookingId?: string | null;
  activeFilter: CareBookingFilterId;
  page: number;
  totalPages: number;
  pageSize: number;
  totalFiltered: number;
}) {
  const accent = divisionColor("care");
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
    summaryMetric("Visible bookings", String(bookings.length), "Real Care bookings linked to this account."),
    summaryMetric(
      "Outstanding balance",
      formatCurrencyAmount(outstandingBalance, "NGN", { unit: "naira" }),
      unpaidBookings.length > 0
        ? `${unpaidBookings.length} booking${unpaidBookings.length === 1 ? "" : "s"} still need payment follow-up.`
        : "No unpaid Care balance is currently open.",
      unpaidBookings.length > 0 ? "warning" : "success"
    ),
    summaryMetric(
      "Receipt queue",
      String(reviewQueue.length),
      reviewQueue.length > 0
        ? "Bookings with submitted receipts still waiting for verification."
        : "No receipt-verification backlog is linked to this account."
    ),
    summaryMetric(
      "Completed",
      String(completedBookings.length),
      completedBookings.length > 0
        ? "Completed bookings that can move into review follow-up."
        : "Completed Care bookings will appear here once service closes."
    ),
  ];

  if (!selectedBooking) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const active = activeFilter === opt.id;
          return (
            <Link
              key={opt.id}
              href={opt.id === "all" ? "/care" : `/care?filter=${opt.id}`}
              scroll={false}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                active
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                  : "border-[var(--acct-line)] bg-[var(--acct-bg-soft)] text-[var(--acct-muted)] hover:border-[var(--acct-gold)]/40"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
        <span className="ml-auto text-xs text-[var(--acct-muted)]">
          {totalFiltered} booking{totalFiltered === 1 ? "" : "s"}
          {activeFilter !== "all" ? ` · filtered` : ""}
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
              <p className="acct-kicker">Linked Care bookings</p>
              <p className="mt-1 text-sm text-[var(--acct-muted)]">
                Your Care bookings, payment status, and upcoming actions.
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              {listBookings.length} on this page
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
                      {humanize(booking.status)}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${toneChipClasses(booking.nextAction.tone)}`}>
                      {booking.payment.verificationLabel}
                    </span>
                  </div>

                  <p className="mt-3 text-base font-semibold text-[var(--acct-ink)]">
                    {booking.service_type || "Care service"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">
                    {booking.pickup_address || "Address pending"} • Updated {timeAgo(booking.updated_at || booking.created_at || new Date().toISOString())}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <MetricMini label="Balance due">
                      {formatCurrencyAmount(booking.payment.balanceDue, "NGN", { unit: "naira" })}
                    </MetricMini>
                    <MetricMini label="Next move">{booking.nextAction.label}</MetricMini>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--acct-line)] pt-4"
              aria-label="Care bookings pagination"
            >
              <p className="text-xs text-[var(--acct-muted)]">
                Page {page} of {totalPages} · {pageSize} per page
              </p>
              <div className="flex flex-wrap gap-2">
                {page > 1 ? (
                  <Link
                    href={`/care?page=${page - 1}${activeFilter === "all" ? "" : `&filter=${activeFilter}`}`}
                    className="rounded-full border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
                  >
                    Previous
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link
                    href={`/care?page=${page + 1}${activeFilter === "all" ? "" : `&filter=${activeFilter}`}`}
                    className="rounded-full border border-[var(--acct-line)] px-3 py-1.5 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
                  >
                    Next
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
                <p className="acct-kicker">Selected booking</p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--acct-ink)]">
                  {selectedBooking.service_type || "Care service"}
                </h2>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">
                  {selectedBooking.customer_name || "Customer"} • {selectedBooking.tracking_code}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusChipClasses(selectedBooking.status)}`}>
                  {humanize(selectedBooking.status)}
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneChipClasses(selectedBooking.nextAction.tone)}`}>
                  {selectedBooking.payment.verificationLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailCard icon={Calendar} label="Scheduled date">
                {selectedBooking.pickup_date ? formatDate(selectedBooking.pickup_date) : "Not scheduled yet"}
              </DetailCard>
              <DetailCard icon={Clock3} label="Time window">
                {selectedBooking.pickup_slot || "Window pending"}
              </DetailCard>
              <DetailCard icon={MapPin} label="Pickup address">
                {selectedBooking.pickup_address || "Address pending"}
              </DetailCard>
              <DetailCard icon={Truck} label="Tracking code">
                {selectedBooking.tracking_code || selectedBooking.id}
              </DetailCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[var(--acct-muted)]" />
                  <p className="acct-kicker">Payment snapshot</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricMini label="Quoted total">
                    {formatCurrencyAmount(Number(selectedBooking.quoted_total || 0), "NGN", {
                      unit: "naira",
                    })}
                  </MetricMini>
                  <MetricMini label="Amount recorded">
                    {formatCurrencyAmount(selectedBooking.payment.amountPaidRecorded, "NGN", {
                      unit: "naira",
                    })}
                  </MetricMini>
                  <MetricMini label="Balance due">
                    {formatCurrencyAmount(selectedBooking.payment.balanceDue, "NGN", {
                      unit: "naira",
                    })}
                  </MetricMini>
                  <MetricMini label="Receipt state">
                    {selectedBooking.payment.verificationLabel}
                  </MetricMini>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-[var(--acct-muted)]" />
                  <p className="acct-kicker">Receipt visibility</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--acct-ink)]">
                  {selectedBooking.payment.verificationMessage}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricMini label="Receipts submitted">
                    {String(selectedBooking.payment.receiptCount)}
                  </MetricMini>
                  <MetricMini label="Last submission">
                    {selectedBooking.payment.lastSubmittedAt
                      ? timeAgo(selectedBooking.payment.lastSubmittedAt)
                      : "No receipt yet"}
                  </MetricMini>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--acct-muted)]" />
                <p className="acct-kicker">Next best action</p>
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
                  Open live booking <ArrowUpRight size={14} />
                </a>
                {selectedBooking.reviewUrl ? (
                  <a
                    href={selectedBooking.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acct-button-secondary rounded-xl"
                  >
                    Leave review <ChevronRight size={14} />
                  </a>
                ) : null}
              </div>
            </div>

            {selectedBooking.item_summary ? (
              <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--acct-muted)]" />
                  <p className="acct-kicker">Service summary</p>
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
