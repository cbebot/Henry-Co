import type { Metadata } from "next";
import { Clock3, MapPin } from "lucide-react";
import BookingRailWorkspace from "@/components/dashboard/BookingRailWorkspace";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspacePanel,
  WorkspaceEmptyState,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/admin/care-admin";
import { findSelectedBooking, groupBookingsForOperations } from "@/lib/dashboard-queues";
import { getTrackingStatusLabel } from "@/lib/care-tracking";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider History | Henry & Co. Fabric Care",
  description: "Completed rider route history for delivered and cancelled garment movement.",
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

export default async function RiderHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "rider"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q).toLowerCase();
  const lookup = readParam(params.booking);

  await logProtectedPageAccess("/rider/history", {
    q: q || null,
    booking: lookup || null,
  });

  const bookings = await getAdminBookings({ scope: "all", limit: 500 });
  const historyQueue = bookings
    .filter((booking) => ["delivered", "cancelled"].includes(String(booking.status || "").toLowerCase()))
    .filter((booking) =>
      q ? JSON.stringify(booking).toLowerCase().includes(q.toLowerCase()) : true
    );

  const groups = groupBookingsForOperations(historyQueue).filter((group) => group.bookings.length > 0);
  const selectedBooking = findSelectedBooking(historyQueue, lookup);

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Route history"
        title="Keep finished movement searchable without crowding live work."
        description="Completed and cancelled garment movement now lives in a dedicated history space, so riders can review past routes without slowing down pickup and delivery operations."
      />

      <BookingRailWorkspace
        groups={groups}
        selectedBooking={selectedBooking}
        buildBookingHref={(booking) =>
          `/rider/history?booking=${encodeURIComponent(booking.tracking_code)}${
            q ? `&q=${encodeURIComponent(q)}` : ""
          }`
        }
        emptyTitle="No route history matched this view"
        emptyText="Delivered and cancelled garment movement will appear here as route history builds over time."
        detail={
          selectedBooking ? (
            <WorkspacePanel
              eyebrow="Selected history record"
              title={selectedBooking.customer_name}
              subtitle="Use the detail panel to confirm how the route closed and preserve customer context."
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedBooking.tracking_code} />
                  <WorkspaceInfoTile label="Final status" value={getTrackingStatusLabel(selectedBooking.status, "garment")} />
                  <WorkspaceInfoTile label="Pickup date" value={formatDate(selectedBooking.pickup_date)} />
                  <WorkspaceInfoTile label="Updated" value={formatDateTime(selectedBooking.updated_at)} />
                  <WorkspaceInfoTile label="Phone" value={selectedBooking.phone || "No phone recorded"} />
                  <WorkspaceInfoTile label="Email" value={selectedBooking.email || "No email recorded"} />
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    <MapPin className="h-4 w-4" />
                    Route address
                  </div>
                  <div className="mt-3">{selectedBooking.pickup_address}</div>
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/68">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    <Clock3 className="h-4 w-4" />
                    Route notes
                  </div>
                  <div className="mt-3">
                    {selectedBooking.special_instructions || "No additional route note was recorded for this booking."}
                  </div>
                </div>
              </div>
            </WorkspacePanel>
          ) : (
            <WorkspacePanel
              eyebrow="Selected history record"
              title="Choose a route record"
              subtitle="Select a completed booking to inspect the customer details, closing status, and stored route notes."
            >
              <WorkspaceEmptyState
                title="No route record selected"
                text="Open a completed booking from the history rail to review the stored route context."
              />
            </WorkspacePanel>
          )
        }
      />
    </div>
  );
}
