import type { Metadata } from "next";
import {
  Panel,
  MetricCard,
} from "@henryco/dashboard-shell/components";
import { Building2, LineChart, ShieldAlert, Users } from "lucide-react";
import {
  getLogisticsStaffOwnerCopy,
  type LogisticsStaffOwnerCopy,
} from "@henryco/i18n/server";
import {
  getFinanceDashboardData,
  getDispatchDashboardData,
} from "@/lib/logistics/data";
import { createAdminSupabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/env";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsStaffOwnerCopy(locale);
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

async function getOwnerCounts() {
  try {
    const admin = createAdminSupabase();
    const [{ count: b2bCount }, { count: claimCount }] = await Promise.all([
      admin
        .from("logistics_b2b_accounts")
        .select("id", { head: true, count: "exact" })
        .eq("status", "active"),
      admin
        .from("logistics_claims")
        .select("id", { head: true, count: "exact" })
        .neq("status", "resolved"),
    ]);
    return { b2bActive: b2bCount ?? 0, openClaims: claimCount ?? 0 };
  } catch (err) {
    console.error("[owner] count fetch failed", err);
    return { b2bActive: 0, openClaims: 0 };
  }
}

export default async function OwnerHomePage() {
  const [locale, finance, dispatch, counts] = await Promise.all([
    getLogisticsPublicLocale(),
    getFinanceDashboardData(),
    getDispatchDashboardData(),
    getOwnerCounts(),
  ]);

  const copy: LogisticsStaffOwnerCopy = getLogisticsStaffOwnerCopy(locale);

  const monthlyVolume = dispatch.shipments.length;
  const customers = new Set(
    dispatch.shipments.map((s) => s.customerUserId).filter(Boolean),
  ).size;

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
          label={copy.metrics.volumeLabel}
          value={String(monthlyVolume)}
          icon={<LineChart className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: monthlyVolume > 0 ? "up" : "flat",
            magnitude: applyTemplate(copy.metrics.volumeUniqueCustomers, {
              count: String(customers),
            }),
          }}
        />
        <MetricCard
          label={copy.metrics.revenueLabel}
          value={formatCurrency(finance.totals.paid, "NGN")}
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: copy.metrics.revenueVs,
            delta: applyTemplate(copy.metrics.revenueMargin, {
              amount: formatCurrency(finance.totals.margin, "NGN"),
            }),
          }}
        />
        <MetricCard
          label={copy.metrics.b2bLabel}
          value={String(counts.b2bActive)}
          icon={<Users className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: counts.b2bActive > 0 ? "up" : "flat",
            magnitude:
              counts.b2bActive > 0
                ? applyTemplate(copy.metrics.b2bActive, {
                    count: String(counts.b2bActive),
                  })
                : copy.metrics.b2bAcquireFirst,
          }}
        />
        <MetricCard
          label={copy.metrics.claimsLabel}
          value={String(counts.openClaims)}
          icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: counts.openClaims > 0 ? "down" : "flat",
            magnitude:
              counts.openClaims > 0
                ? copy.metrics.claimsAtRisk
                : copy.metrics.claimsIntact,
          }}
        />
      </section>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {copy.corridors.title}
          </h2>
        </header>
        <ul className="mt-4 divide-y divide-[var(--logistics-line)]">
          {Array.from(
            dispatch.shipments.reduce((map, s) => {
              const key = s.zoneLabel || copy.corridors.unknownZone;
              map.set(key, (map.get(key) ?? 0) + 1);
              return map;
            }, new Map<string, number>()),
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([zone, total]) => (
              <li
                key={zone}
                className="flex items-center justify-between py-3 text-sm"
              >
                <p className="font-semibold tracking-tight text-white">
                  {zone}
                </p>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  {total}{" "}
                  {total === 1
                    ? copy.corridors.shipmentSingular
                    : copy.corridors.shipmentPlural}
                </p>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
