import type { Metadata } from "next";
import {
  Panel,
  MetricCard,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import { AlertTriangle, Route, Truck, Users } from "lucide-react";
import {
  getLogisticsStaffDispatcherCopy,
  type LogisticsStaffDispatcherCopy,
} from "@henryco/i18n/server";
import { getDispatchDashboardData } from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

/**
 * V3 PASS 21 — Dispatcher workspace home: live board.
 *
 * Server-rendered table that groups today's shipments into queues
 * (urgent / scheduled / blocked). The drag-and-drop dnd-kit upgrade
 * is a follow-up; the assign action posts to
 * /api/logistics/dispatch/assign via a form.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsStaffDispatcherCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : `{${key}}`,
  );
}

function resolveQueueCopy(
  copy: LogisticsStaffDispatcherCopy,
  queueId: string,
  fallbackTitle: string,
  fallbackDescription: string,
): { title: string; description: string } {
  switch (queueId) {
    case "unassigned":
      return {
        title: copy.queueGroups.unassignedTitle,
        description: copy.queueGroups.unassignedDescription,
      };
    case "delayed":
      return {
        title: copy.queueGroups.delayedTitle,
        description: copy.queueGroups.delayedDescription,
      };
    case "stale":
      return {
        title: copy.queueGroups.staleTitle,
        description: copy.queueGroups.staleDescription,
      };
    case "active":
      return {
        title: copy.queueGroups.activeTitle,
        description: copy.queueGroups.activeDescription,
      };
    default:
      return { title: fallbackTitle, description: fallbackDescription };
  }
}

export default async function DispatcherHomePage() {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsStaffDispatcherCopy(locale);
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

  const shipmentCount = data.shipments.length;
  const deltaTemplate =
    shipmentCount === 1
      ? copy.metrics.revenueDeltaOne
      : copy.metrics.revenueDeltaMany;
  const revenueDelta = applyTemplate(deltaTemplate, {
    count: String(shipmentCount),
  });

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {copy.hero.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {copy.hero.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {copy.hero.body}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={copy.metrics.activeLabel}
          value={String(totalActive)}
          icon={<Route className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: "flat",
            magnitude: copy.metrics.activeTrend,
          }}
        />
        <MetricCard
          label={copy.metrics.unassignedLabel}
          value={String(unassigned)}
          icon={<Users className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: unassigned > 0 ? "up" : "flat",
            magnitude:
              unassigned > 0
                ? copy.metrics.unassignedTrendNeeds
                : copy.metrics.unassignedTrendClear,
          }}
        />
        <MetricCard
          label={copy.metrics.exceptionsLabel}
          value={String(exceptions)}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: exceptions > 0 ? "up" : "flat",
            magnitude:
              exceptions > 0
                ? copy.metrics.exceptionsTrendNeeds
                : copy.metrics.exceptionsTrendClear,
          }}
        />
        <MetricCard
          label={copy.metrics.revenueLabel}
          value={formatCurrency(revenue, "NGN")}
          icon={<Truck className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: copy.metrics.revenueComparisonVs,
            delta: revenueDelta,
          }}
        />
      </section>

      {data.queues.map((queue) => {
        const queueCopy = resolveQueueCopy(
          copy,
          queue.id,
          queue.title,
          queue.description,
        );
        return (
          <Panel key={queue.id} tone="flat">
            <header className="flex items-baseline justify-between border-b border-[var(--logistics-line)] pb-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">
                  {queueCopy.title}
                </h2>
                <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                  {queueCopy.description}
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
                kicker={copy.empty.kicker}
                headline={copy.empty.headline}
                body={copy.empty.body}
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
                          {shipment.zoneLabel || copy.row.laneTbd} ·{" "}
                          {shipment.urgency} ·{" "}
                          {shipment.serviceType.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          {shipment.assignedRiderName
                            ? copy.row.riderLabel
                            : copy.row.statusLabel}
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
        );
      })}
    </div>
  );
}
