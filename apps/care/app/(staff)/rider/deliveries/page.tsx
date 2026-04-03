import type { Metadata } from "next";
import { ArrowRight, MapPin, Truck } from "lucide-react";
import BookingRailWorkspace from "@/components/dashboard/BookingRailWorkspace";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspacePanel,
  WorkspaceEmptyState,
} from "@/components/dashboard/WorkspacePrimitives";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/admin/care-admin";
import { findSelectedBooking, groupBookingsForOperations } from "@/lib/dashboard-queues";
import { getTrackingStatusLabel } from "@/lib/care-tracking";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { updateRiderStatusAction } from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider Deliveries | Henry & Co. Fabric Care",
  description: "Delivery queue for garment returns that are already moving toward final handoff.",
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

export default async function RiderDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "rider"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q).toLowerCase();
  const lookup = readParam(params.booking);

  await logProtectedPageAccess("/rider/deliveries", {
    q: q || null,
    booking: lookup || null,
  });

  const bookings = await getAdminBookings({ scope: "active", limit: 500 });
  const deliveryQueue = bookings
    .filter((booking) =>
      ["picked_up", "quality_check", "out_for_delivery"].includes(
        String(booking.status || "").toLowerCase()
      )
    )
    .filter((booking) =>
      q ? JSON.stringify(booking).toLowerCase().includes(q.toLowerCase()) : true
    );

  const groups = groupBookingsForOperations(deliveryQueue).filter((group) => group.bookings.length > 0);
  const selectedBooking = findSelectedBooking(deliveryQueue, lookup);

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Delivery queue"
        title="Move return deliveries without pickup clutter."
        description="This view isolates garment jobs that are already in rider custody or close to final handoff, so route progression and proof of completion remain simple to manage."
      />

      <BookingRailWorkspace
        groups={groups}
        selectedBooking={selectedBooking}
        buildBookingHref={(booking) =>
          `/rider/deliveries?booking=${encodeURIComponent(booking.tracking_code)}${
            q ? `&q=${encodeURIComponent(q)}` : ""
          }`
        }
        emptyTitle="No delivery jobs matched this view"
        emptyText="Try a broader search or check route history if the booking has already been delivered."
        detail={
          selectedBooking ? (
            <WorkspacePanel
              eyebrow="Selected delivery"
              title={selectedBooking.customer_name}
              subtitle="Track the return stage and confirm delivery only when the handoff is complete."
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedBooking.tracking_code} />
                  <WorkspaceInfoTile label="Current stage" value={getTrackingStatusLabel(selectedBooking.status, "garment")} />
                  <WorkspaceInfoTile label="Pickup date" value={formatDate(selectedBooking.pickup_date)} />
                  <WorkspaceInfoTile label="Pickup slot" value={selectedBooking.pickup_slot || "Not set"} />
                  <WorkspaceInfoTile label="Phone" value={selectedBooking.phone || "No phone recorded"} />
                  <WorkspaceInfoTile label="Email" value={selectedBooking.email || "No email recorded"} />
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    <MapPin className="h-4 w-4" />
                    Delivery address
                  </div>
                  <div className="mt-3">{selectedBooking.pickup_address}</div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <form action={updateRiderStatusAction} className="rounded-[1.5rem] border border-cyan-300/30 bg-cyan-500/10 p-5">
                    <input type="hidden" name="id" value={selectedBooking.id} />
                    <input type="hidden" name="status" value="out_for_delivery" />
                    <input type="hidden" name="source_route" value="/rider/deliveries" />

                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-100">
                      Route action
                    </div>
                    <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                      Confirm route departure
                    </div>
                    <div className="mt-2 text-sm leading-7 text-zinc-700 dark:text-white/70">
                      Use this when the item has left the facility and is on the final route.
                    </div>

                    <div className="mt-4">
                      <PendingSubmitButton
                        label="Mark out for delivery"
                        pendingLabel="Saving route..."
                        variant="secondary"
                        icon={<ArrowRight className="h-4 w-4" />}
                        className="rounded-2xl border-cyan-300/30 bg-cyan-500/10 px-5 py-3 text-cyan-700 dark:text-cyan-100"
                      />
                    </div>
                  </form>

                  <form action={updateRiderStatusAction} className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-500/10 p-5">
                    <input type="hidden" name="id" value={selectedBooking.id} />
                    <input type="hidden" name="status" value="delivered" />
                    <input type="hidden" name="source_route" value="/rider/deliveries" />

                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-100">
                      Completion action
                    </div>
                    <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                      Confirm final handoff
                    </div>
                    <div className="mt-2 text-sm leading-7 text-zinc-700 dark:text-white/70">
                      Use this only after the customer has received the item and the return is complete.
                    </div>

                    <div className="mt-4">
                      <PendingSubmitButton
                        label="Mark delivered"
                        pendingLabel="Saving delivery..."
                        variant="secondary"
                        icon={<Truck className="h-4 w-4" />}
                        className="rounded-2xl border-emerald-300/30 bg-emerald-500/10 px-5 py-3 text-emerald-700 dark:text-emerald-100"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </WorkspacePanel>
          ) : (
            <WorkspacePanel
              eyebrow="Selected delivery"
              title="Choose a delivery job"
              subtitle="Select a booking from the queue to review the address, status, and completion actions."
            >
              <WorkspaceEmptyState
                title="No delivery selected"
                text="Open a booking from the delivery rail to review the route stage and completion controls."
              />
            </WorkspacePanel>
          )
        }
      />
    </div>
  );
}
