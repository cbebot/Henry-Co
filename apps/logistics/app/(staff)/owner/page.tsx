import {
  Panel,
  MetricCard,
} from "@henryco/dashboard-shell/components";
import { Building2, LineChart, ShieldAlert, Users } from "lucide-react";
import {
  getFinanceDashboardData,
  getDispatchDashboardData,
} from "@/lib/logistics/data";
import { createAdminSupabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/env";

export const dynamic = "force-dynamic";

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
  const [finance, dispatch, counts] = await Promise.all([
    getFinanceDashboardData(),
    getDispatchDashboardData(),
    getOwnerCounts(),
  ]);

  const monthlyVolume = dispatch.shipments.length;
  const customers = new Set(
    dispatch.shipments.map((s) => s.customerUserId).filter(Boolean),
  ).size;

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Owner suite
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Strategic
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          The monthly view. Growth, margin, top corridors, customer trust, and
          claim rate.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Volume (period)"
          value={String(monthlyVolume)}
          icon={<LineChart className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: monthlyVolume > 0 ? "up" : "flat",
            magnitude: `${customers} unique customers`,
          }}
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(finance.totals.paid, "NGN")}
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          context={{
            kind: "comparison",
            vs: "settled total",
            delta: `Margin ${formatCurrency(finance.totals.margin, "NGN")}`,
          }}
        />
        <MetricCard
          label="B2B accounts"
          value={String(counts.b2bActive)}
          icon={<Users className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: counts.b2bActive > 0 ? "up" : "flat",
            magnitude:
              counts.b2bActive > 0
                ? `${counts.b2bActive} active`
                : "Acquire first B2B account",
          }}
        />
        <MetricCard
          label="Open claims"
          value={String(counts.openClaims)}
          icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
          context={{
            kind: "trend",
            direction: counts.openClaims > 0 ? "down" : "flat",
            magnitude:
              counts.openClaims > 0 ? "Trust at risk" : "Trust intact",
          }}
        />
      </section>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            Top corridors (by volume)
          </h2>
        </header>
        <ul className="mt-4 divide-y divide-[var(--logistics-line)]">
          {Array.from(
            dispatch.shipments.reduce((map, s) => {
              const key = s.zoneLabel || "Unknown";
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
                  {total} {total === 1 ? "shipment" : "shipments"}
                </p>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
