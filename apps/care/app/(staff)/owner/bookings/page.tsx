import type { Metadata } from "next";
import { CircleDollarSign, FolderArchive, Search, TriangleAlert } from "lucide-react";
import BookingRailWorkspace from "@/components/dashboard/BookingRailWorkspace";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspaceMetricCard,
  WorkspacePanel,
  WorkspaceEmptyState,
} from "@/components/dashboard/WorkspacePrimitives";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import {
  getAdminBookings,
  getUrgentBookings,
  monthArchiveNote,
} from "@/lib/admin/care-admin";
import {
  getServiceFamilyLabel,
  getTrackingStatusLabel,
  getTrackingStatusOptions,
  inferCareServiceFamily,
} from "@/lib/care-tracking";
import { findSelectedBooking, groupBookingsForOperations } from "@/lib/dashboard-queues";
import { logProtectedPageAccess } from "@/lib/security/logger";
import {
  recordPaymentAction,
  updateBookingStatusAction,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Bookings | Henry & Co. Fabric Care",
  description:
    "Owner-level booking oversight with grouped queue rails, selected-detail review, status control, and payment capture.",
};

const STATUS_OPTIONS = Array.from(
  new Set([
    ...getTrackingStatusOptions("garment"),
    ...getTrackingStatusOptions("home"),
    ...getTrackingStatusOptions("office"),
    "confirmed",
  ])
);

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

export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; scope?: string; status?: string; booking?: string }>;
}) {
  await requireRoles(["owner"]);
  const params = (await searchParams) ?? {};
  const q = String(params.q || "").trim();
  const scope = (String(params.scope || "active").trim() || "active") as
    | "active"
    | "archive"
    | "all";
  const status = String(params.status || "").trim();
  const bookingLookup = String(params.booking || "").trim();

  await logProtectedPageAccess("/owner/bookings", {
    q: q || null,
    scope,
    status: status || null,
    booking: bookingLookup || null,
  });

  const [bookings, urgentBookings] = await Promise.all([
    getAdminBookings({
      scope,
      q,
      status,
      limit: 500,
    }),
    getUrgentBookings(8),
  ]);

  const groups = groupBookingsForOperations(bookings).filter((group) => group.bookings.length > 0);
  const selectedBooking = findSelectedBooking(bookings, bookingLookup);
  const family = selectedBooking ? inferCareServiceFamily(selectedBooking) : null;

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Owner booking oversight"
        title="Review the entire booking pipeline without stacked clutter."
        description="Bookings are now grouped into priority rails so the owner can focus on what needs attention first, open one record at a time, and still keep payment capture and status control close at hand."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <WorkspaceMetricCard
          icon={TriangleAlert}
          label="Urgent bookings"
          value={String(urgentBookings.length)}
          note="Time-sensitive work that should stay visible to ownership."
        />
        <WorkspaceMetricCard
          icon={FolderArchive}
          label="Visible records"
          value={String(bookings.length)}
          note={`Filtered by ${scope} scope${status ? ` and ${status}` : ""}.`}
        />
        <WorkspaceMetricCard
          icon={CircleDollarSign}
          label="Archive policy"
          value="30 days"
          note={monthArchiveNote()}
        />
      </section>

      <WorkspacePanel
        eyebrow="Queue controls"
        title="Search and scope the booking rails"
        subtitle="Filter the booking operation before opening the selected detail view."
      >
        <form className="grid gap-4 xl:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search customer, phone, tracking code, address..."
              className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            />
          </div>

          <select
            name="scope"
            defaultValue={scope}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="active">Active only</option>
            <option value="archive">Archive only</option>
            <option value="all">All records</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 text-sm font-semibold text-[#07111F]"
          >
            Filter queue
          </button>
        </form>
      </WorkspacePanel>

      <BookingRailWorkspace
        groups={groups}
        selectedBooking={selectedBooking}
        buildBookingHref={(booking) => {
          const next = new URLSearchParams();
          if (q) next.set("q", q);
          if (scope && scope !== "active") next.set("scope", scope);
          if (status) next.set("status", status);
          next.set("booking", booking.tracking_code);
          return `/owner/bookings?${next.toString()}`;
        }}
        emptyTitle="No bookings matched this filter"
        emptyText="Try a broader filter or switch scope to review archive and active records together."
        detail={
          selectedBooking && family ? (
            <WorkspacePanel
              eyebrow="Selected booking"
              title={selectedBooking.customer_name}
              subtitle="The selected detail panel keeps payment capture and status control focused on one booking at a time."
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedBooking.tracking_code} />
                  <WorkspaceInfoTile label="Service family" value={getServiceFamilyLabel(family)} />
                  <WorkspaceInfoTile label="Current stage" value={getTrackingStatusLabel(selectedBooking.status, family)} />
                  <WorkspaceInfoTile label="Phone" value={selectedBooking.phone || "—"} />
                  <WorkspaceInfoTile label="Email" value={selectedBooking.email || "—"} />
                  <WorkspaceInfoTile label="Service" value={selectedBooking.service_type} />
                  <WorkspaceInfoTile label="Pickup date" value={formatDate(selectedBooking.pickup_date)} />
                  <WorkspaceInfoTile label="Pickup slot" value={selectedBooking.pickup_slot || "—"} />
                  <WorkspaceInfoTile label="Quoted total" value={`₦${Number(selectedBooking.quoted_total || 0).toLocaleString()}`} />
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
                  {selectedBooking.pickup_address}
                </div>

                {selectedBooking.item_summary ? (
                  <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/68">
                    {selectedBooking.item_summary}
                  </div>
                ) : null}

                {selectedBooking.special_instructions ? (
                  <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/68">
                    {selectedBooking.special_instructions}
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <form action={updateBookingStatusAction} className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <input type="hidden" name="id" value={selectedBooking.id} />
                    <input type="hidden" name="source_route" value="/owner/bookings" />

                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Booking stage
                    </div>
                    <div className="mt-4 grid gap-3">
                      <select
                        name="status"
                        defaultValue={String(selectedBooking.status || "").toLowerCase()}
                        className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                      >
                        {getTrackingStatusOptions(family).map((item) => (
                          <option key={item} value={item}>
                            {getTrackingStatusLabel(item, family)}
                          </option>
                        ))}
                      </select>

                      <PendingSubmitButton
                        label="Save stage"
                        pendingLabel="Saving stage..."
                        className="h-12 rounded-2xl px-5 text-[#07111F]"
                      />
                    </div>
                  </form>

                  <form action={recordPaymentAction} className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <input type="hidden" name="booking_lookup" value={selectedBooking.tracking_code} />
                    <input type="hidden" name="source_route" value="/owner/bookings" />

                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Quick payment
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                        required
                      />
                      <input
                        name="payment_method"
                        placeholder="Cash / Transfer / POS"
                        className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                        required
                      />
                      <input
                        name="reference"
                        placeholder="Reference"
                        className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                      />
                      <textarea
                        name="notes"
                        placeholder="Payment note"
                        className="min-h-[100px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                      />

                      <PendingSubmitButton
                        label="Record payment"
                        pendingLabel="Recording payment..."
                        variant="secondary"
                        className="h-12 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-5 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </WorkspacePanel>
          ) : (
            <WorkspacePanel
              eyebrow="Selected booking"
              title="Choose a booking"
              subtitle="Select a booking from the rail to inspect it, update the service stage, or record a payment."
            >
              <WorkspaceEmptyState
                title="No booking selected"
                text="Open a booking from the grouped queue to inspect the record and take action."
              />
            </WorkspacePanel>
          )
        }
      />
    </div>
  );
}
