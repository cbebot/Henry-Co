import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  FlaskConical,
  Shield,
  Workflow,
} from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import DivisionBadge from "@/components/owner/DivisionBadge";
import MetricCard from "@/components/owner/MetricCard";
import { OwnerNotice, OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { formatCompactNumber, formatPercent, timeAgo } from "@/lib/format";
import { getAnalyticsCenterData } from "@/lib/owner-data";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

function formatConversionRate(value: number | null, t: (text: string) => string) {
  if (value == null) return t("No terminal conversion yet");
  return formatPercent(Number((value * 100).toFixed(1)));
}

export default async function OperationsAnalyticsPage() {
  const data = await getAnalyticsCenterData();
  const locale: AppLocale = await getHubPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <OwnerPageHeader
        eyebrow={t("Analytics Center")}
        title={t("Canonical funnel truth, integrity, and experiment readiness")}
        description={t("This owner surface reads the shared analytics model from central activity truth so conversion, friction, and experiment decisions do not drift across divisions.")}
        actions={
          <>
            <Link href="/owner/operations/alerts" className="acct-button-secondary">
              {t("Alert board")}
            </Link>
            <Link href="/owner/finance" className="acct-button-secondary">
              {t("Finance center")}
            </Link>
            <Link href="/owner/operations/approvals" className="acct-button-primary">
              {t("Approval center")}
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t("Sampled activity rows")}
          value={formatCompactNumber(data.metrics.totalActivityRows)}
          subtitle={t("Owner analytics sample from customer activity")}
          icon={BarChart3}
        />
        <MetricCard
          label={t("Canonical coverage")}
          value={formatPercent(data.metrics.canonicalCoverageRate)}
          subtitle={t("Rows resolving into the shared event contract")}
          icon={Shield}
        />
        <MetricCard
          label={t("Funnel rows")}
          value={formatCompactNumber(data.metrics.funnelRows)}
          subtitle={t("Tracked steps across conversion journeys")}
          icon={Workflow}
        />
        <MetricCard
          label={t("Blocked or failed")}
          value={formatCompactNumber(data.metrics.blockedRows)}
          subtitle={t("Outcomes showing friction, failure, or rejection")}
          icon={AlertTriangle}
        />
        <MetricCard
          label={t("Restricted experiment rows")}
          value={formatCompactNumber(data.metrics.restrictedExperimentRows)}
          subtitle={t("Trust, finance, support, or explicitly unsafe flows")}
          icon={FlaskConical}
        />
        <MetricCard
          label={t("Notification-linked rows")}
          value={formatCompactNumber(data.integrity.notificationRows)}
          subtitle={t("Lifecycle events that can support notification attribution")}
          icon={BellRing}
        />
      </div>

      <div className="grid gap-3">
        {data.notices.map((notice) => (
          <OwnerNotice key={notice.id} tone={notice.tone} title={notice.title} body={notice.body} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <OwnerPanel
          title={t("Funnel truth board")}
          description={t("Each funnel uses canonical steps so owner conversion reporting is based on shared event semantics, not per-page labels.")}
        >
          <div className="space-y-3">
            {data.funnels.map((funnel) => (
              <div
                key={funnel.key}
                className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--acct-ink)]">{funnel.label}</div>
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">{funnel.description}</p>
                  </div>
                  <DivisionBadge division={funnel.division} />
                </div>
                <div className="mt-4 grid gap-2 text-xs text-[var(--acct-muted)] md:grid-cols-3">
                  <div>{t("Participants")}: {formatCompactNumber(funnel.participants)}</div>
                  <div>{t("Terminal")}: {formatCompactNumber(funnel.terminalCount)}</div>
                  <div>{t("Conversion")}: {formatConversionRate(funnel.conversionRate, t)}</div>
                </div>
                <div className="mt-2 text-xs text-[var(--acct-muted)]">
                  {t("Bottleneck")}: {funnel.bottleneckStep || t("No major drop-off visible in sample")}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {funnel.steps.map((step) => (
                    <span
                      key={`${funnel.key}-${step.key}`}
                      className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-surface)] px-3 py-1 text-xs text-[var(--acct-muted)]"
                    >
                      {step.label}: {formatCompactNumber(step.count)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </OwnerPanel>

        <OwnerPanel
          title={t("Integrity and friction")}
          description={t("Data quality, redaction, duplicates, and cross-functional friction counts from the current owner sample.")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                {t("Event integrity")}
              </div>
              <div className="mt-3 space-y-2 text-sm text-[var(--acct-muted)]">
                <div className="flex items-center justify-between gap-3">
                  <span>{t("Canonical rows")}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">
                    {formatCompactNumber(data.integrity.canonicalRows)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t("Possible duplicates")}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">
                    {formatCompactNumber(data.integrity.possibleDuplicateRows)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t("Redacted payload rows")}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">
                    {formatCompactNumber(data.integrity.redactedRows)}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                {t("Experiment readiness")}
              </div>
              <div className="mt-3 space-y-2 text-sm text-[var(--acct-muted)]">
                <div className="flex items-center justify-between gap-3">
                  <span>{t("Safe rows")}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">
                    {formatCompactNumber(data.experimentReadiness.safeRows)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t("High-risk rows")}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">
                    {formatCompactNumber(data.experimentReadiness.highRiskRows)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t("Owner-visible safe rows")}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">
                    {formatCompactNumber(data.experimentReadiness.ownerVisibleSafeRows)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {data.frictionSummary.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{item.label}</div>
                  <span className="text-xs font-semibold text-[var(--owner-accent)]">
                    {formatCompactNumber(item.count)} {t("rows")}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">{item.description}</p>
              </Link>
            ))}
          </div>
        </OwnerPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <OwnerPanel
          title={t("Division coverage")}
          description={t("Cross-division event volume and friction concentration from the shared analytics sample.")}
        >
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Division")}</th>
                <th>{t("Rows")}</th>
                <th>{t("Funnels")}</th>
                <th>{t("Blocked")}</th>
                <th>{t("Trust + Finance")}</th>
              </tr>
            </thead>
            <tbody>
              {data.divisionSummary.map((division) => (
                <tr key={division.division}>
                  <td>
                    <div className="flex items-center gap-2">
                      <DivisionBadge division={division.division} />
                      <span>{division.label}</span>
                    </div>
                  </td>
                  <td>{formatCompactNumber(division.eventCount)}</td>
                  <td>{formatCompactNumber(division.funnelRows)}</td>
                  <td>{formatCompactNumber(division.blockedRows)}</td>
                  <td>
                    {formatCompactNumber(division.trustRows)} / {formatCompactNumber(division.financeRows)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OwnerPanel>

        <OwnerPanel
          title={t("Coverage gaps")}
          description={t("Funnels with no recent observable rows in the current owner sample.")}
        >
          <div className="space-y-3">
            {data.coverageGaps.length ? (
              data.coverageGaps.map((gap) => (
                <div
                  key={gap.key}
                  className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--acct-ink)]">{gap.label}</div>
                    <DivisionBadge division={gap.division} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{gap.reason}</p>
                </div>
              ))
            ) : (
              <OwnerNotice
                tone="good"
                title={t("Recent sample coverage is complete")}
                body={t("Every tracked funnel currently has recent observable rows in the owner analytics sample.")}
              />
            )}
          </div>
        </OwnerPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <OwnerPanel
          title={t("Experiment guardrails")}
          description={t("Only safe boundaries should be randomized. Trust, finance, and support lifecycle flows stay locked down.")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {data.experimentReadiness.guardrails.map((guardrail) => (
              <div
                key={guardrail.boundary}
                className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{guardrail.label}</div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      guardrail.allowed
                        ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
                        : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
                    }`}
                  >
                    {guardrail.allowed ? t("allowed") : t("restricted")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                  {guardrail.restrictedReason || guardrail.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">
              {t("Most restricted divisions in sample")}
            </div>
            <div className="mt-3 space-y-2">
              {data.experimentReadiness.divisions.slice(0, 6).map((division) => (
                <div key={division.division} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DivisionBadge division={division.division} />
                    <span className="text-[var(--acct-ink)]">{division.division}</span>
                  </div>
                  <span className="text-[var(--acct-muted)]">
                    {formatCompactNumber(division.restrictedRows)} {t("restricted")} /{" "}
                    {formatCompactNumber(division.safeRows)} {t("safe")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </OwnerPanel>

        <OwnerPanel
          title={t("Recent canonical activity")}
          description={t("Latest cross-division rows after normalization into the shared event contract.")}
        >
          <div className="space-y-3">
            {data.recentActivity.map((item) => (
              <div
                key={`${item.id}-${item.canonicalName}`}
                className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--acct-ink)]">{item.canonicalName}</div>
                  <DivisionBadge division={item.division} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                  {item.classification.replace("_", " ")} · {item.outcome}
                </div>
                <div className="mt-2 text-sm text-[var(--acct-muted)]">
                  {item.funnelLabel || item.entityType || item.activityType}
                </div>
                <div className="mt-2 text-xs text-[var(--acct-muted)]">
                  {item.createdAt ? timeAgo(item.createdAt) : t("Unknown time")}
                </div>
              </div>
            ))}
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
