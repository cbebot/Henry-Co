import {
  Panel,
  MetricCard,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import { AlertTriangle, Route, Truck, Users } from "lucide-react";
import { getDispatchDashboardData } from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";

/**
 * V3 PASS 21 — Dispatcher workspace home: live board.
 *
 * Server-rendered table that groups today's shipments into queues
 * (urgent / scheduled / blocked). The drag-and-drop dnd-kit upgrade
 * is a follow-up; the assign action posts to
 * /api/logistics/dispatch/assign via a form.
 */
export const dynamic = "force-dynamic";

export default async function DispatcherHomePage() {
  const data = await getDispatchDashboardData();

  const totalActive = data.shipments.filter(
    (s) =>
      s.lifecycleStatus !== "delivered" && s.lifecycleStatus !== "cancelled",
  ).length;
  const unassigned = data.shipments.filter(
    (s) =>
      !s.assignedRiderUserId &&
      s.lifecycleStatus !== "delivered" &&
      s.lifecycleStatus !== "cancelled",
  ).length;
  const exceptions = data.issues.filter((i) => i.status !== "resolved").length;
  const revenue = data.shipments.reduce((sum, s) => sum + s.amountPaid, 0);

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Live board
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Dispatch
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          Live ops surface. Unassigned shipments, capacity, exceptions, and
          fleet utilisation in one view.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active"
          value={String(totalActive)}
          icon={<Route className="h-4 w-4" aria-hidden />}
          context={{ kind: "trend", direction: "flat", magnitude: "Total in flight" }}
        />
        <MetricCard
          label="Unassigned"
          value={String(unassigned)}
          icon={<Users className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: unassigned > 0 ? "up" : "flat",
            magnitude: unassigned > 0 ? "Needs a rider" : "All assigned",
          }}
        />
        <MetricCard
          label="Exceptions"
          value={String(exceptions)}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: exceptions > 0 ? "up" : "flat",
            magnitude: exceptions > 0 ? "Needs attention" : "All clear",
          }}
        />
        <MetricCard
          label="Revenue today"
          value={formatCurrency(revenue, "NGN")}
          icon={<Truck className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: "today's settled total",
            delta: `${data.shipments.length} ${data.shipments.length === 1 ? "shipment" : "shipments"}`,
          }}
        />
      </section>

      {data.queues.map((queue) => (
        <Panel key={queue.id} tone="flat">
          <header className="flex items-baseline justify-between border-b border-[var(--logistics-line)] pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                {queue.title}
              </h2>
              <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                {queue.description}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] ${
                queue.tone === "critical"
                  ? "bg-red-500/15 text-red-200"
                  : queue.tone === "warning"
                    ? "bg-amber-500/15 text-amber-200"
                    : queue.tone === "success"
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-white/[0.06] text-white/80"
              }`}
            >
              {queue.shipments.length}
            </span>
          </header>
          {queue.shipments.length === 0 ? (
            <EmptyState
              kicker="No rows"
              headline="Queue empty"
              body="Shipments will appear here as soon as they qualify."
            />
          ) : (
            <ul className="divide-y divide-[var(--logistics-line)]">
              {queue.shipments.map((shipment) => (
                <li key={shipment.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                        {shipment.trackingCode}
                      </p>
                      <p className="mt-1 font-semibold tracking-tight text-white">
                        {shipment.recipientName}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--logistics-muted)]">
                        {shipment.zoneLabel || "Lane TBD"} ·{" "}
                        {shipment.urgency} ·{" "}
                        {shipment.serviceType.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                        {shipment.assignedRiderName ? "Rider" : "Status"}
                      </p>
                      <p className="mt-1 font-semibold tracking-tight text-white">
                        {shipment.assignedRiderName ||
                          shipment.lifecycleStatus.replaceAll("_", " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--logistics-accent-soft)]">
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
      ))}
    </div>
  );
}
