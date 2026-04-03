import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  PackagePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import {
  getAdminBookings,
  getAdminPricing,
  getOrderItems,
  getUrgentBookings,
} from "@/lib/admin/care-admin";
import { isServiceBookingRecord } from "@/lib/care-booking-shared";
import {
  getServiceFamilyLabel,
  getTrackingStatusLabel,
  getTrackingStatusOptions,
  inferCareServiceFamily,
  parseServiceBookingSummary,
} from "@/lib/care-tracking";
import { logProtectedPageAccess } from "@/lib/security/logger";
import {
  createOrderItemAction,
  recordPaymentAction,
  updateBookingStatusAction,
} from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manager Operations | Henry & Co. Fabric Care",
  description:
    "Intake control room for booking lookup, garment registration, urgent handling, status movement, and payment recording.",
};

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status?: string | null) {
  const key = String(status || "").toLowerCase();

  if (key === "delivered") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }

  if (key === "cancelled") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }

  if (key === "out_for_delivery") {
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  }

  if (["booked", "confirmed", "picked_up", "cleaning", "quality_check"].includes(key)) {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }

  return "border-black/10 bg-black/[0.03] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70";
}

function urgencyScore(row: {
  status?: string | null;
  pickup_date?: string | null;
}) {
  const status = String(row.status || "").toLowerCase();

  if (status === "out_for_delivery") return 100;

  if (status === "booked" || status === "confirmed") {
    if (!row.pickup_date) return 40;
    const today = new Date();
    const pickup = new Date(row.pickup_date);
    today.setHours(0, 0, 0, 0);
    pickup.setHours(0, 0, 0, 0);

    const diff = Math.round((pickup.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return 95;
    if (diff === 0) return 90;
    if (diff === 1) return 80;
    if (diff <= 3) return 60;
  }

  if (status === "picked_up") return 55;
  if (status === "quality_check") return 50;
  return 10;
}

export default async function ManagerOperationsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    booking?: string;
    q?: string;
  }>;
}) {
  await requireRoles(["owner", "manager"]);
  await logProtectedPageAccess("/manager/operations");

  const params = (await searchParams) ?? {};
  const bookingLookup = String(params.booking || "").trim();
  const q = String(params.q || "").trim().toLowerCase();

  const [bookings, urgentBookings, orderItems, pricingItems] = await Promise.all([
    getAdminBookings({ scope: "active", limit: 500 }),
    getUrgentBookings(8),
    getOrderItems({ scope: "active", limit: 500 }),
    getAdminPricing(),
  ]);

  const activePricing = pricingItems.filter((row) => row.is_active);

  const filteredBookings = q
    ? bookings.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(q)
      )
    : bookings;

  const selectedBooking =
    bookings.find(
      (row) =>
        row.id === bookingLookup ||
        row.tracking_code.toLowerCase() === bookingLookup.toLowerCase()
    ) ?? filteredBookings[0] ?? null;

  const selectedBookingItems = selectedBooking
    ? orderItems.filter((row) => row.booking_id === selectedBooking.id)
    : [];
  const selectedBookingIsService = selectedBooking
    ? isServiceBookingRecord(selectedBooking)
    : false;
  const selectedServiceSummary = parseServiceBookingSummary(selectedBooking?.item_summary);

  const itemCountByBooking = orderItems.reduce<Record<string, number>>((acc, row) => {
    acc[row.booking_id] = (acc[row.booking_id] || 0) + Number(row.quantity || 0);
    return acc;
  }, {});

  const bookingsWithoutItems = bookings
    .filter((row) => !["delivered", "cancelled"].includes(String(row.status || "").toLowerCase()))
    .filter((row) => !isServiceBookingRecord(row))
    .filter((row) => !itemCountByBooking[row.id])
    .sort((a, b) => urgencyScore(b) - urgencyScore(a))
    .slice(0, 12);

  const intakeRiskCount = bookingsWithoutItems.length;
  const totalRegisteredPieces = orderItems.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0
  );

  const estimatedBookingValue =
    selectedBookingItems.length > 0
      ? selectedBookingItems.reduce((sum, row) => sum + Number(row.line_total ?? 0), 0)
      : Number(selectedBooking?.quoted_total ?? 0);

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Manager operations room
        </div>
        <h1 className="mt-2 text-4xl font-black text-zinc-950 dark:text-white sm:text-5xl">
          Register every item. Leave no cloth outside the system.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          This is the intake command layer. Every customer booking should become a tracked digital
          record, and every cloth entering the care shop should be registered under that booking.
          Any unregistered intake creates risk.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 py-3 text-sm font-semibold text-[#07111F]"
          >
            Create walk-in booking
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/manager/expenses"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Open expenses
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/track"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Open tracking page
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ClipboardList}
          label="Active bookings"
          value={String(bookings.length)}
          note="Current live workload"
        />
        <Metric
          icon={AlertTriangle}
          label="Urgent queue"
          value={String(urgentBookings.length)}
          note="Needs quick attention"
        />
        <Metric
          icon={Tags}
          label="Registered pieces"
          value={String(totalRegisteredPieces)}
          note="Recorded item quantity"
        />
        <Metric
          icon={ShieldCheck}
          label="Bookings with zero items"
          value={String(intakeRiskCount)}
          note="Intake risk to fix fast"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          eyebrow="Booking control"
          title="Find the booking first"
          subtitle="Create a walk-in booking, or search and open an existing booking before registering clothes."
        >
          <form className="grid gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by customer, tracking code, phone, service..."
                className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
              />
            </div>
          </form>

          <div className="mt-6 grid gap-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.slice(0, 12).map((booking) => {
                const selected = selectedBooking?.id === booking.id;
                const itemCount = itemCountByBooking[booking.id] || 0;

                return (
                  <Link
                    key={booking.id}
                    href={`/manager/operations?booking=${encodeURIComponent(booking.tracking_code)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selected
                        ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10"
                        : "border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="font-mono text-sm font-bold text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]">
                        {booking.tracking_code}
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusTone(
                          booking.status
                        )}`}
                      >
                        {getTrackingStatusLabel(booking.status, inferCareServiceFamily(booking))}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                        {getServiceFamilyLabel(inferCareServiceFamily(booking))}
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                      {booking.customer_name}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                      {booking.phone || "No phone"} • {booking.service_type}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500 dark:text-white/45">
                      {formatDate(booking.pickup_date)} • {booking.pickup_slot || "No slot"}
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState text="No bookings matched your search." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Selected booking"
          title={
            selectedBooking
              ? selectedBookingIsService
                ? `Review service request ${selectedBooking.tracking_code}`
                : `Register clothes under ${selectedBooking.tracking_code}`
              : "Select a booking"
          }
          subtitle={
            selectedBooking
              ? selectedBookingIsService
                ? "Service bookings should be reviewed, dispatched, updated, and paid against the same clean booking record."
                : "Every cloth entering the shop should be registered under the correct booking before processing."
              : "Search or create a booking first, then open the correct booking."
          }
        >
          {selectedBooking ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-mono text-sm font-bold text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]">
                    {selectedBooking.tracking_code}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusTone(
                      selectedBooking.status
                    )}`}
                  >
                    {getTrackingStatusLabel(
                      selectedBooking.status,
                      inferCareServiceFamily(selectedBooking)
                    )}
                  </span>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
                    estimated value {formatMoney(estimatedBookingValue)}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Info label="Customer">{selectedBooking.customer_name}</Info>
                  <Info label="Phone">{selectedBooking.phone || "—"}</Info>
                  <Info label="Service">{selectedBooking.service_type}</Info>
                  <Info label="Pickup">
                    {formatDate(selectedBooking.pickup_date)}
                    {selectedBooking.pickup_slot ? ` • ${selectedBooking.pickup_slot}` : ""}
                  </Info>
                </div>

                <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                    Address
                  </div>
                  <div className="mt-2">{selectedBooking.pickup_address}</div>
                </div>

                <form action={updateBookingStatusAction} className="mt-4 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="id" value={selectedBooking.id} />
                  <input type="hidden" name="source_route" value="/manager/operations" />

                  <select
                    name="status"
                    defaultValue={selectedBooking.status}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                  >
                    {getTrackingStatusOptions(inferCareServiceFamily(selectedBooking)).map((status) => (
                      <option key={status} value={status}>
                        {getTrackingStatusLabel(status, inferCareServiceFamily(selectedBooking))}
                      </option>
                    ))}
                  </select>

                  <PendingSubmitButton
                    label="Update booking status"
                    pendingLabel="Updating booking"
                    className="rounded-2xl px-5 py-3 text-[#07111F]"
                  />
                </form>
              </div>

              {selectedBookingIsService ? (
                <div className="rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                      <ClipboardList className="h-5 w-5 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                        Service request summary
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-white/65">
                        This booking is service-based, so it should be dispatched and status-managed rather than item-registered.
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      selectedServiceSummary?.categoryLabel,
                      selectedServiceSummary?.serviceLabel,
                      selectedServiceSummary?.frequencyLabel,
                      selectedServiceSummary?.urgencyLabel,
                      selectedServiceSummary?.zoneLabel,
                      selectedServiceSummary?.propertyLabel,
                      selectedServiceSummary?.siteContactName,
                      ...(selectedServiceSummary?.preferredDays ?? []).map((day) => `Day: ${day}`),
                      ...(selectedServiceSummary?.addOnLabels ?? []),
                      ...(selectedServiceSummary?.highlights ?? []),
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                        >
                          {item}
                        </span>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                      <PackagePlus className="h-5 w-5 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                        Register garment / cloth item
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-white/65">
                        This is the intake registry. If it is not here, it should not enter processing.
                      </div>
                    </div>
                  </div>

                  <form action={createOrderItemAction} className="mt-6 grid gap-4">
                    <input type="hidden" name="booking_lookup" value={selectedBooking.tracking_code} />
                    <input type="hidden" name="source_route" value="/manager/operations" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <select name="pricing_id" className={inputCls}>
                        <option value="">Select pricing-backed item</option>
                        {activePricing.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.category} — {row.item_name} ({formatMoney(row.price)}/{row.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        name="garment_type"
                        placeholder="Or enter manual garment type"
                        className={inputCls}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <input name="service_type" placeholder="Service override" className={inputCls} />
                      <input name="brand" placeholder="Brand (optional)" className={inputCls} />
                      <input name="color" placeholder="Color (optional)" className={inputCls} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <input
                        name="quantity"
                        type="number"
                        min="1"
                        defaultValue="1"
                        className={inputCls}
                      />
                      <select name="treatment" defaultValue="standard" className={inputCls}>
                        <option value="standard">Standard handling</option>
                        <option value="stain">Stain treatment</option>
                        <option value="deep_stain">Deep stain rescue</option>
                        <option value="delicate">Delicate handling</option>
                      </select>
                      <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-800 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white">
                        <input type="checkbox" name="urgent" className="h-4 w-4" />
                        Mark this item as urgent
                      </label>
                    </div>

                    <textarea
                      name="notes"
                      rows={4}
                      placeholder="Condition notes, stains, missing button, damage, special handling note..."
                      className={textareaCls}
                    />

                    <PendingSubmitButton
                      label="Save item into registry"
                      pendingLabel="Saving item into registry"
                      icon={<ArrowRight className="h-4 w-4" />}
                      className="rounded-2xl px-6 py-3 text-[#07111F]"
                    />
                  </form>
                </div>
              )}

              <div className="rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                    <CreditCard className="h-5 w-5 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                      Record payment for selected booking
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-white/65">
                      Every inflow should be captured under the correct booking.
                    </div>
                  </div>
                </div>

                <form action={recordPaymentAction} className="mt-6 grid gap-4">
                  <input type="hidden" name="booking_lookup" value={selectedBooking.tracking_code} />
                  <input type="hidden" name="source_route" value="/manager/operations" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={estimatedBookingValue || 0}
                      className={inputCls}
                      placeholder="Amount"
                      required
                    />

                    <select name="payment_method" className={inputCls} required defaultValue="bank_transfer">
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="cash">Cash</option>
                      <option value="pos">POS</option>
                      <option value="mobile_transfer">Mobile transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      name="reference"
                      placeholder="Payment reference"
                      className={inputCls}
                    />
                    <input
                      name="notes"
                      placeholder="Payment note"
                      className={inputCls}
                    />
                  </div>

                  <PendingSubmitButton
                    label="Record payment"
                    pendingLabel="Recording payment"
                    icon={<ArrowRight className="h-4 w-4" />}
                    className="rounded-2xl px-6 py-3 text-[#07111F]"
                  />
                </form>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                        {selectedBookingIsService ? "Service request details" : "Registered items for this booking"}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-white/65">
                        {selectedBookingIsService
                          ? "Operational notes tied to the service booking."
                          : "Live garment registry tied to the tracking code."}
                      </div>
                    </div>

                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                    {selectedBookingItems.length} line item{selectedBookingItems.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {selectedBookingIsService ? (
                    <article className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Info label="Quoted total">{formatMoney(estimatedBookingValue)}</Info>
                        <Info label="Payment status">{selectedBooking.payment_status || "unpaid"}</Info>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          selectedServiceSummary?.categoryLabel,
                          selectedServiceSummary?.serviceLabel,
                          selectedServiceSummary?.frequencyLabel,
                          selectedServiceSummary?.urgencyLabel,
                          selectedServiceSummary?.zoneLabel,
                          selectedServiceSummary?.propertyLabel,
                          ...(selectedServiceSummary?.preferredDays ?? []).map((day) => `Day: ${day}`),
                          ...(selectedServiceSummary?.addOnLabels ?? []),
                          ...(selectedServiceSummary?.highlights ?? []),
                        ]
                          .filter(Boolean)
                          .map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                            >
                              {item}
                            </span>
                          ))}
                      </div>
                      {selectedBooking.special_instructions ? (
                        <div className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                          {selectedBooking.special_instructions}
                        </div>
                      ) : null}
                    </article>
                  ) : selectedBookingItems.length > 0 ? (
                    selectedBookingItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="font-mono text-xs font-bold text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]">
                            {item.item_tag}
                          </div>

                          {item.urgent ? (
                            <span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-100">
                              urgent
                            </span>
                          ) : null}

                          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                            qty {item.quantity}
                          </span>

                          {item.line_total != null ? (
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
                              {formatMoney(item.line_total)}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                          {item.garment_type}
                        </div>

                        <div className="mt-2 grid gap-3 md:grid-cols-4">
                          <Info label="Service">{item.service_type || "—"}</Info>
                          <Info label="Brand">{item.brand || "—"}</Info>
                          <Info label="Color">{item.color || "—"}</Info>
                          <Info label="Unit price">
                            {item.unit_price != null ? formatMoney(item.unit_price) : "—"}
                          </Info>
                        </div>

                        <div className="mt-4 text-sm text-zinc-600 dark:text-white/65">
                          <span className="font-semibold text-zinc-800 dark:text-white/80">
                            Intake status:
                          </span>{" "}
                          {item.intake_status}
                        </div>

                        <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                          {item.notes || "No additional note."}
                        </div>

                        <div className="mt-3 text-xs text-zinc-500 dark:text-white/45">
                          Registered {formatDateTime(item.created_at)}
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState text="No garment items have been registered for this booking yet. Register them before processing." />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState text="No booking selected yet. Search for one or create a walk-in booking first." />
          )}
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow="Intake risk"
          title="Garment bookings with zero registered items"
          subtitle="These are intake red flags. Service bookings are intentionally excluded from this list."
        >
          <div className="grid gap-4">
            {bookingsWithoutItems.length > 0 ? (
              bookingsWithoutItems.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-red-300/30 bg-red-500/10 p-5 text-red-700 dark:text-red-100"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-mono text-sm font-bold">{booking.tracking_code}</div>
                    <span className="rounded-full border border-red-300/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                      no items recorded
                    </span>
                  </div>

                  <div className="mt-3 text-lg font-semibold">{booking.customer_name}</div>
                  <div className="mt-1 text-sm opacity-90">
                    {booking.service_type} • {formatDate(booking.pickup_date)} •{" "}
                    {booking.pickup_slot || "No slot"}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/manager/operations?booking=${encodeURIComponent(booking.tracking_code)}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-300/30 bg-white/70 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-white/10 dark:text-red-100"
                    >
                      Open and register now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="Good. No active booking is currently missing item registration." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Priority queue"
          title="Urgent bookings"
          subtitle="Use this to catch time-sensitive work before it becomes customer dissatisfaction."
        >
          <div className="grid gap-4">
            {urgentBookings.length > 0 ? (
              urgentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="relative rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="absolute right-5 top-5 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                  </span>

                  <div className="font-mono text-sm font-bold text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]">
                    {booking.tracking_code}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                    {booking.customer_name}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                    {booking.service_type} • {formatDate(booking.pickup_date)} •{" "}
                    {booking.pickup_slot || "No slot"}
                  </div>

                  <form action={updateBookingStatusAction} className="mt-4 flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={booking.id} />
                    <input type="hidden" name="source_route" value="/manager/operations" />
                    <select
                      name="status"
                      defaultValue={booking.status}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                    >
                      {getTrackingStatusOptions(inferCareServiceFamily(booking)).map((status) => (
                        <option key={status} value={status}>
                          {getTrackingStatusLabel(status, inferCareServiceFamily(booking))}
                        </option>
                      ))}
                    </select>

                    <PendingSubmitButton
                      label="Update status"
                      pendingLabel="Updating status"
                      className="rounded-2xl px-5 py-3 text-[#07111F]"
                    />
                  </form>
                </article>
              ))
            ) : (
              <EmptyState text="No urgent bookings right now." />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Feature icon={CheckCircle2} title="Digital-first intake">
          Every cloth should enter the system before it enters processing.
        </Feature>
        <Feature icon={Sparkles} title="Tracking-linked registration">
          Item registry stays tied to the customer’s booking and tracking code.
        </Feature>
        <Feature icon={CalendarDays} title="Cleaner audit trail">
          Intake time, pricing trace, and payment capture become easier to review later.
        </Feature>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-zinc-950 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-zinc-600 dark:text-white/60">{note}</div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-zinc-600 dark:text-white/65">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-sm text-zinc-800 dark:text-white/80">{children}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
      </div>
      <div className="mt-5 text-xl font-semibold text-zinc-950 dark:text-white">{title}</div>
      <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-10 text-center text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
      {text}
    </div>
  );
}

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";
