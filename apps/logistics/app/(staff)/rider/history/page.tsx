import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { getLogisticsViewer } from "@/lib/logistics/auth";
import { getRiderDashboardData } from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";

/**
 * V3 PASS 21 — Rider workspace: completed legs.
 */
export const dynamic = "force-dynamic";

export default async function RiderHistoryPage() {
  const viewer = await getLogisticsViewer();
  const data = await getRiderDashboardData(viewer);
  const completed = data.riderShipments.filter(
    (s) => s.lifecycleStatus === "delivered",
  );

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          History
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Completed legs
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          Every delivery you closed. Tap a row to review the POD record we
          archived for the customer.
        </p>
      </header>

      <Panel tone="flat">
        {completed.length === 0 ? (
          <EmptyState
            kicker="No closes yet"
            headline="Your history will appear here"
            body="Every shipment you complete is auto-archived with its POD record and timestamps."
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {completed.map((shipment) => (
              <li key={shipment.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/55">
                      {shipment.trackingCode}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold tracking-tight text-white">
                      {shipment.recipientName}
                    </p>
                    <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                      {shipment.zoneLabel || "Lane TBD"} ·{" "}
                      {shipment.serviceType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      Closed
                    </p>
                    <p className="mt-1 font-semibold tracking-tight text-white">
                      {shipment.lastEventAt
                        ? new Date(shipment.lastEventAt).toLocaleDateString()
                        : "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--logistics-muted)]">
                      {formatCurrency(
                        shipment.amountQuoted,
                        shipment.pricingBreakdown.currency,
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
