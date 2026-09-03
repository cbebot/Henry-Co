import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { getDispatchDashboardData } from "@/lib/logistics/data";

export const dynamic = "force-dynamic";

export default async function DispatcherExceptionsPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getDispatchDashboardData(locale);
  const openIssues = data.issues.filter((i) => i.status !== "resolved");

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Exceptions")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Needs attention")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Delayed and failed shipments. Each entry has a recommended action and owner.")}
        </p>
      </header>

      <Panel tone="flat">
        {openIssues.length === 0 ? (
          <EmptyState
            kicker={t("All clear")}
            headline={t("No exceptions today")}
            body={t("When a shipment slips its SLA or fails a delivery attempt, it appears here with a recommended next action.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {openIssues.map((issue) => (
              <li key={issue.id} className="py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                      {issue.severity} · {issue.status}
                    </p>
                    <p className="mt-1 font-semibold tracking-tight text-white">
                      {issue.summary}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--logistics-muted)]">
                      {issue.details}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      {t("Opened")}
                    </p>
                    <p className="mt-1 font-semibold tracking-tight text-white">
                      {new Date(issue.createdAt).toLocaleDateString()}
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
