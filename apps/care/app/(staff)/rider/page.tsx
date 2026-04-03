import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Package, ReceiptText, Route, Truck } from "lucide-react";
import {
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspacePanel,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/admin/care-admin";
import { inferCareServiceFamily, getTrackingStatusLabel } from "@/lib/care-tracking";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider Overview | Henry & Co. Fabric Care",
  description: "Routing overview for garment pickup volume, return delivery movement, and completed route history.",
};

function formatDate(value?: string | null) {
  if (!value) return "No date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RiderOverviewPage() {
  await requireRoles(["owner", "manager", "rider"]);
  await logProtectedPageAccess("/rider");

  const bookings = await getAdminBookings({ scope: "all", limit: 500 });
  const garmentBookings = bookings.filter((booking) => inferCareServiceFamily(booking) === "garment");
  const pickupQueue = garmentBookings.filter((booking) =>
    ["booked", "confirmed"].includes(String(booking.status || "").toLowerCase())
  );
  const deliveryQueue = garmentBookings.filter((booking) =>
    ["picked_up", "quality_check", "out_for_delivery"].includes(
      String(booking.status || "").toLowerCase()
    )
  );
  const historyQueue = garmentBookings.filter((booking) =>
    ["delivered", "cancelled"].includes(String(booking.status || "").toLowerCase())
  );

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Rider routing"
        title="Keep garment movement clear from pickup to final handoff."
        description="Rider work is now split into dedicated pickup, delivery, and route-history views. This overview shows the live route picture first, so riders can open the right queue without digging through mixed responsibilities."
        actions={
          <>
            <Link
              href="/rider/pickups"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 py-3 text-sm font-semibold text-[#07111F]"
            >
              Open pickups
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rider/deliveries"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open deliveries
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rider/expenses"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open expenses
              <ReceiptText className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-3">
        <WorkspaceMetricCard
          icon={Package}
          label="Pickup queue"
          value={String(pickupQueue.length)}
          note="Garment requests waiting for collection."
        />
        <WorkspaceMetricCard
          icon={Truck}
          label="Delivery queue"
          value={String(deliveryQueue.length)}
          note="Orders already moving toward return handoff."
        />
        <WorkspaceMetricCard
          icon={Route}
          label="Route history"
          value={String(historyQueue.length)}
          note="Completed garment movement kept for traceability."
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <WorkspacePanel
          eyebrow="Pickups"
          title="Next collection commitments"
          subtitle="Open the pickup queue to move jobs into rider control as soon as collection happens."
        >
          <div className="grid gap-4">
            {pickupQueue.slice(0, 4).map((booking) => (
              <Link
                key={booking.id}
                href={`/rider/pickups?booking=${encodeURIComponent(booking.tracking_code)}`}
                className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                  {booking.tracking_code}
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  {booking.customer_name}
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-white/64">
                  {formatDate(booking.pickup_date)}
                  {booking.pickup_slot ? ` • ${booking.pickup_slot}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Deliveries"
          title="Live return movement"
          subtitle="Use the dedicated delivery queue for route progression and completion confirmation."
        >
          <div className="grid gap-4">
            {deliveryQueue.slice(0, 4).map((booking) => (
              <Link
                key={booking.id}
                href={`/rider/deliveries?booking=${encodeURIComponent(booking.tracking_code)}`}
                className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                  {booking.tracking_code}
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  {booking.customer_name}
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-white/64">
                  {getTrackingStatusLabel(booking.status, "garment")}
                </div>
              </Link>
            ))}
          </div>
        </WorkspacePanel>
      </section>

      <WorkspacePanel
        eyebrow="History"
        title="Completed route archive"
        subtitle="Delivered and cancelled garment movement is separated into its own history page so live work stays clean."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {historyQueue.slice(0, 3).map((booking) => (
            <Link
              key={booking.id}
              href={`/rider/history?booking=${encodeURIComponent(booking.tracking_code)}`}
              className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                {booking.tracking_code}
              </div>
              <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                {booking.customer_name}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-white/64">
                <Clock3 className="h-4 w-4 text-[color:var(--accent)]" />
                {getTrackingStatusLabel(booking.status, "garment")}
              </div>
            </Link>
          ))}
        </div>
      </WorkspacePanel>
    </div>
  );
}
