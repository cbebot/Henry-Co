import {
  Panel,
  MetricCard,
} from "@henryco/dashboard-shell/components";
import {
  Banknote,
  ClipboardCheck,
  TrendingUp,
  Truck,
} from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import {
  getFinanceDashboardData,
  getDispatchDashboardData,
} from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";

/**
 * V3 PASS 21 — Manager workspace home.
 *
 * Operations overview: today's volume, on-time %, exception count,
 * revenue, and fleet utilization.
 */
export const dynamic = "force-dynamic";

export default async function ManagerHomePage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [finance, dispatch] = await Promise.all([
    getFinanceDashboardData(),
    getDispatchDashboardData(locale),
  ]);

  const totalShipments = dispatch.shipments.length;
  const delivered = dispatch.shipments.filter(
    (s) => s.lifecycleStatus === "delivered",
  ).length;
  const onTimePct =
    totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 0;
  const exceptions = dispatch.issues.filter((i) => i.status !== "resolved")
    .length;

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Operations")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Today")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Volume, on-time %, exceptions, revenue, and fleet utilisation. Click a metric for the per-corridor breakdown.")}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("Volume")}
          value={String(totalShipments)}
          icon={<Truck className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: totalShipments > 0 ? "up" : "flat",
            magnitude: `${totalShipments} ${totalShipments === 1 ? t("shipment") : t("shipments")}`,
          }}
        />
        <MetricCard
          label={t("On-time")}
          value={`${onTimePct}%`}
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: t("delivered / total"),
            delta: `${delivered} ${t("delivered")}`,
          }}
        />
        <MetricCard
          label={t("Exceptions")}
          value={String(exceptions)}
          icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: exceptions > 0 ? "down" : "flat",
            magnitude:
              exceptions > 0 ? t("Investigate") : t("Clean run"),
          }}
        />
        <MetricCard
          label={t("Revenue")}
          value={formatCurrency(finance.totals.paid, "NGN")}
          icon={<Banknote className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: t("settled total"),
            delta: `${t("Quoted")} ${formatCurrency(finance.totals.quoted, "NGN")}`,
          }}
        />
      </section>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {t("Margin posture")}
          </h2>
        </header>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {t("Quoted")}
            </dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight text-white">
              {formatCurrency(finance.totals.quoted, "NGN")}
            </dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {t("Paid")}
            </dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight text-white">
              {formatCurrency(finance.totals.paid, "NGN")}
            </dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {t("Margin")}
            </dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight text-white">
              {formatCurrency(finance.totals.margin, "NGN")}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
