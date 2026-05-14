import Link from "next/link";
import { CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import {
  Panel,
  MetricCard,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import { getLogisticsViewer } from "@/lib/logistics/auth";
import { getRiderDashboardData } from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";

/**
 * V3 PASS 21 — Rider workspace home: today's queue.
 */
export const dynamic = "force-dynamic";

export default async function RiderHomePage() {
  const viewer = await getLogisticsViewer();
  const data = await getRiderDashboardData(viewer);

  const queue = data.riderShipments;
  const pendingCount = queue.filter(
    (s) =>
      s.lifecycleStatus !== "delivered" && s.lifecycleStatus !== "cancelled",
  ).length;
  const deliveredToday = queue.filter(
    (s) => s.lifecycleStatus === "delivered",
  ).length;
  const totalValue = queue.reduce((sum, s) => sum + (s.amountQuoted || 0), 0);

  return (
    <div className="space-y-8 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            Today
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your queue
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
            Assigned pickups and drop-offs in the order dispatch booked them.
            Tap any shipment to open the active-leg view.
          </p>
        </div>
      </header>

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Today metrics"
      >
        <MetricCard
          label="Pending"
          value={String(pendingCount)}
          icon={<Package className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: pendingCount === 0 ? "flat" : "up",
            magnitude:
              pendingCount === 0
                ? "Queue clear"
                : `${pendingCount} ${pendingCount === 1 ? "shipment" : "shipments"} in progress`,
          }}
        />
        <MetricCard
          label="Delivered today"
          value={String(deliveredToday)}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: deliveredToday > 0 ? "up" : "flat",
            magnitude:
              deliveredToday > 0
                ? `${deliveredToday} closed since shift start`
                : "No closes yet this shift",
          }}
        />
        <MetricCard
          label="Manifest value"
          value={formatCurrency(totalValue, "NGN")}
          icon={<Truck className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: "today's manifest",
            delta: `${queue.length} ${queue.length === 1 ? "leg" : "legs"}`,
          }}
        />
      </section>

      <Panel tone="flat">
        <header className="flex items-baseline justify-between gap-4 border-b border-[var(--logistics-line)] pb-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Queue
            </h2>
            <p className="mt-1 text-xs text-[var(--logistics-muted)]">
              {queue.length === 0
                ? "Nothing assigned right now. The dispatcher will surface new pickups here."
                : `${queue.length} ${queue.length === 1 ? "shipment" : "shipments"} on your manifest.`}
            </p>
          </div>
        </header>
        {queue.length === 0 ? (
          <EmptyState
            kicker="No assignments yet"
            headline="Queue is clear"
            body="When dispatch assigns a leg you'll see it here. Keep an ear on the alerts tab — assignments push there first."
            action={
              <Link
                href="/rider/notifications"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08]"
              >
                Open alerts
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {queue.map((shipment) => (
              <li key={shipment.id} className="py-4">
                <Link
                  href={`/rider/active?shipment=${shipment.id}`}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/55">
                      {shipment.trackingCode}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold tracking-tight text-white">
                      {shipment.recipientName}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs leading-relaxed text-[var(--logistics-muted)]">
                      <MapPin
                        className="h-3.5 w-3.5 text-[var(--logistics-accent)]"
                        aria-hidden
                      />
                      {shipment.zoneLabel || "Lane TBD"} ·{" "}
                      {shipment.urgency} ·{" "}
                      {shipment.serviceType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize tracking-tight text-white">
                      {shipment.lifecycleStatus.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-[var(--logistics-accent-soft)]">
                      Tap to open
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
