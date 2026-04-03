import type { Metadata } from "next";
import { MapPin, PackageCheck } from "lucide-react";
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
import { logProtectedPageAccess } from "@/lib/security/logger";
import { updateRiderStatusAction } from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider Pickups | Henry & Co. Fabric Care",
  description: "Pickup queue for garment collections grouped by urgency and scheduled timing.",
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

export default async function RiderPickupsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "rider"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q).toLowerCase();
  const lookup = readParam(params.booking);

  await logProtectedPageAccess("/rider/pickups", {
    q: q || null,
    booking: lookup || null,
  });

  const bookings = await getAdminBookings({ scope: "active", limit: 500 });
  const pickupQueue = bookings
    .filter((booking) => ["booked", "confirmed"].includes(String(booking.status || "").toLowerCase()))
    .filter((booking) =>
      q ? JSON.stringify(booking).toLowerCase().includes(q.toLowerCase()) : true
    );

  const groups = groupBookingsForOperations(pickupQueue).filter((group) => group.bookings.length > 0);
  const selectedBooking = findSelectedBooking(pickupQueue, lookup);

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Pickup queue"
        title="Work only the collection-ready garment jobs."
        description="This queue stays focused on pickup commitments so riders can move from route planning into confirmed collection without live deliveries competing for attention."
      />

      <BookingRailWorkspace
        groups={groups}
        selectedBooking={selectedBooking}
        buildBookingHref={(booking) =>
          `/rider/pickups?booking=${encodeURIComponent(booking.tracking_code)}${
            q ? `&q=${encodeURIComponent(q)}` : ""
          }`
        }
        emptyTitle="No pickup jobs matched this view"
        emptyText="Try a broader search or check the delivery queue if the job has already been collected."
        detail={
          selectedBooking ? (
            <WorkspacePanel
              eyebrow="Selected pickup"
              title={selectedBooking.customer_name}
              subtitle="Confirm the pickup details first, then move the job into rider control."
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedBooking.tracking_code} />
                  <WorkspaceInfoTile label="Pickup date" value={formatDate(selectedBooking.pickup_date)} />
                  <WorkspaceInfoTile label="Pickup slot" value={selectedBooking.pickup_slot || "Not set"} />
                  <WorkspaceInfoTile label="Phone" value={selectedBooking.phone || "No phone recorded"} />
                  <WorkspaceInfoTile label="Email" value={selectedBooking.email || "No email recorded"} />
                  <WorkspaceInfoTile label="Service" value={selectedBooking.service_type} />
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    <MapPin className="h-4 w-4" />
                    Pickup address
                  </div>
                  <div className="mt-3">{selectedBooking.pickup_address}</div>
                </div>

                {selectedBooking.special_instructions ? (
                  <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/68">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Customer note
                    </div>
                    <div className="mt-3">{selectedBooking.special_instructions}</div>
                  </div>
                ) : null}

                <form action={updateRiderStatusAction} className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <input type="hidden" name="id" value={selectedBooking.id} />
                  <input type="hidden" name="status" value="picked_up" />
                  <input type="hidden" name="source_route" value="/rider/pickups" />

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                        Route action
                      </div>
                      <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                        Confirm collection
                      </div>
                    </div>

                    <PendingSubmitButton
                      label="Mark picked up"
                      pendingLabel="Saving pickup..."
                      icon={<PackageCheck className="h-4 w-4" />}
                      className="rounded-2xl px-5 py-3 text-[#07111F]"
                    />
                  </div>
                </form>
              </div>
            </WorkspacePanel>
          ) : (
            <WorkspacePanel
              eyebrow="Selected pickup"
              title="Choose a pickup job"
              subtitle="Select a booking from the queue to confirm the address, timing, and next rider action."
            >
              <WorkspaceEmptyState
                title="No pickup selected"
                text="Open a booking from the pickup rail to review the route details and confirm collection."
              />
            </WorkspacePanel>
          )
        }
      />
    </div>
  );
}
