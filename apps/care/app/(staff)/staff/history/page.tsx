import type { Metadata } from "next";
import { CalendarDays, Clock3 } from "lucide-react";
import BookingRailWorkspace from "@/components/dashboard/BookingRailWorkspace";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspacePanel,
  WorkspaceEmptyState,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/admin/care-admin";
import { isServiceBookingRecord } from "@/lib/care-booking-shared";
import { findSelectedBooking, groupBookingsForOperations } from "@/lib/dashboard-queues";
import {
  getServiceFamilyLabel,
  getTrackingStatusLabel,
  inferCareServiceFamily,
  isRecurringService,
  parseServiceBookingSummary,
} from "@/lib/care-tracking";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff History | Henry & Co. Fabric Care",
  description: "Completed visit history for home and office service execution.",
};

type PageSearchParams = {
  q?: string | string[];
  booking?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StaffHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "staff"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q).toLowerCase();
  const lookup = readParam(params.booking);

  await logProtectedPageAccess("/staff/history", {
    q: q || null,
    booking: lookup || null,
  });

  const bookings = await getAdminBookings({ scope: "all", limit: 500 });
  const historyQueue = bookings
    .filter((booking) => isServiceBookingRecord(booking))
    .filter((booking) =>
      ["customer_confirmed", "inspection_completed", "service_completed", "supervisor_signoff", "cancelled"].includes(
        String(booking.status || "").toLowerCase()
      )
    )
    .filter((booking) =>
      q ? JSON.stringify(booking).toLowerCase().includes(q.toLowerCase()) : true
    );

  const groups = groupBookingsForOperations(historyQueue).filter((group) => group.bookings.length > 0);
  const selectedBooking = findSelectedBooking(historyQueue, lookup);
  const family = selectedBooking ? inferCareServiceFamily(selectedBooking) : null;
  const summary = selectedBooking ? parseServiceBookingSummary(selectedBooking.item_summary) : null;

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Visit history"
        title="Keep completed service work searchable and out of the live queue."
        description="History is where staff can review finished home and office visits, recurring cadence, and customer context without crowding active assignments."
      />

      <BookingRailWorkspace
        groups={groups}
        selectedBooking={selectedBooking}
        buildBookingHref={(booking) =>
          `/staff/history?booking=${encodeURIComponent(booking.tracking_code)}${
            q ? `&q=${encodeURIComponent(q)}` : ""
          }`
        }
        emptyTitle="No completed visits matched this view"
        emptyText="Completed and cancelled service visits will appear here as execution history builds up."
        detail={
          selectedBooking && family ? (
            <WorkspacePanel
              eyebrow="Selected history record"
              title={selectedBooking.customer_name}
              subtitle="Use the archive detail to confirm how the visit closed and preserve service context for future follow-up."
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedBooking.tracking_code} />
                  <WorkspaceInfoTile label="Service family" value={getServiceFamilyLabel(family)} />
                  <WorkspaceInfoTile label="Final stage" value={getTrackingStatusLabel(selectedBooking.status, family)} />
                  <WorkspaceInfoTile label="Visit date" value={formatDate(selectedBooking.pickup_date)} />
                  <WorkspaceInfoTile label="Updated" value={formatDateTime(selectedBooking.updated_at)} />
                  <WorkspaceInfoTile label="Quoted total" value={`₦${Number(selectedBooking.quoted_total || 0).toLocaleString()}`} />
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap gap-2">
                    {[
                      summary?.categoryLabel,
                      summary?.serviceLabel,
                      summary?.zoneLabel,
                      summary?.urgencyLabel,
                      summary?.propertyLabel,
                      summary?.siteContactName,
                      ...(summary?.preferredDays ?? []).map((day) => `Day: ${day}`),
                      ...(summary?.addOnLabels ?? []),
                      ...(summary?.highlights ?? []),
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
                    {summary && isRecurringService(summary) ? (
                      <span className="rounded-full border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[color:var(--accent)]">
                        {summary.frequencyLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 text-sm leading-7 text-zinc-700 dark:text-white/68">
                    {selectedBooking.pickup_address}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      <CalendarDays className="h-4 w-4" />
                      Service notes
                    </div>
                    <div className="mt-3 text-sm leading-7 text-zinc-700 dark:text-white/68">
                      {selectedBooking.special_instructions || "No additional service notes were recorded for this visit."}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      <Clock3 className="h-4 w-4" />
                      Visit completion context
                    </div>
                    <div className="mt-3 text-sm leading-7 text-zinc-700 dark:text-white/68">
                      This record remains here for follow-through, recurring planning, and owner or support visibility if the customer reaches out again.
                    </div>
                  </div>
                </div>
              </div>
            </WorkspacePanel>
          ) : (
            <WorkspacePanel
              eyebrow="Selected history record"
              title="Choose a completed visit"
              subtitle="Select a visit from the queue to inspect the closing stage and preserved service context."
            >
              <WorkspaceEmptyState
                title="No visit selected"
                text="Open a completed booking from the queue to review its history."
              />
            </WorkspacePanel>
          )
        }
      />
    </div>
  );
}
