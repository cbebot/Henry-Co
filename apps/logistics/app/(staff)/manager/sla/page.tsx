import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getDispatchDashboardData } from "@/lib/logistics/data";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function ManagerSlaPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getDispatchDashboardData();
  const byZone = new Map<string, { total: number; delivered: number }>();
  for (const shipment of data.shipments) {
    const key = shipment.zoneLabel || t("Unknown");
    const current = byZone.get(key) || { total: 0, delivered: 0 };
    current.total += 1;
    if (shipment.lifecycleStatus === "delivered") current.delivered += 1;
    byZone.set(key, current);
  }
  const rawRows = Array.from(byZone.entries()).map(([zone, stats]) => ({
    zone,
    total: stats.total,
    delivered: stats.delivered,
    pct: stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0,
  }));
  const rows = await Promise.all(
    rawRows.map(async (row) => ({
      ...row,
      zone: await resolveLocalizedDynamicField({
        record: { zone: row.zone } as Record<string, unknown>,
        field: "zone",
        locale,
        fallback: row.zone,
        machineTranslate: locale !== "en",
      }),
    })),
  );

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("SLA")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Per-corridor health")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("On-time % by zone. Lanes below 80% need a coordination meeting.")}
        </p>
      </header>

      <Panel tone="flat">
        {rows.length === 0 ? (
          <EmptyState
            kicker={t("No data")}
            headline={t("No shipments to grade yet")}
            body={t("When shipments start landing, SLA health surfaces by corridor.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {rows.map((row) => (
              <li
                key={row.zone}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {row.zone}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {row.delivered} {t("of")} {row.total} {t("delivered")}
                  </p>
                </div>
                <p
                  className={`text-base font-semibold tracking-tight ${
                    row.pct >= 90
                      ? "text-emerald-300"
                      : row.pct >= 80
                        ? "text-amber-200"
                        : "text-red-300"
                  }`}
                >
                  {row.pct}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
