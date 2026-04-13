import { AlertTriangle, Cog, ExternalLink, LineChart, ShieldCheck } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import { getFinanceWorkspaceSnapshot } from "@/lib/finance-ops";
import { getStaffIntelligenceSnapshot } from "@/lib/intelligence-data";
import { getJobsOpsSnapshot } from "@/lib/jobs-ops";
import { getMarketplaceOpsSnapshot } from "@/lib/marketplace-ops";
import { getPropertyOpsSummary } from "@/lib/property-ops";
import {
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const viewer = await requireStaff();
  const [intelligence, jobsSnapshot, marketplaceSnapshot, financeSnapshot, propertySummary] =
    await Promise.all([
      getStaffIntelligenceSnapshot(viewer.divisions.map((item) => item.division)),
      getJobsOpsSnapshot(),
      getMarketplaceOpsSnapshot(),
      getFinanceWorkspaceSnapshot(),
      getPropertyOpsSummary(),
    ]);

  const profileRole = String(viewer.user?.profileRole || "").toLowerCase();
  const canSeeExecutiveSummary =
    profileRole === "owner" || profileRole === "manager" || viewer.permissions.includes("reports.view");

  const routedAlerts = [
    ...intelligence.riskAlerts.slice(0, 4).map((alert) => ({
      id: `security-${String(alert.id)}`,
      title: String(alert.event_type || "Security signal"),
      detail: `Security log still shows ${String(alert.risk_level || "medium")} risk and needs cross-division routing.`,
      tone: "critical" as const,
      href: "/support",
      meta: String(alert.created_at || ""),
    })),
    ...jobsSnapshot.alerts.slice(0, 2).map((item) => ({
      id: `jobs-${item.id}`,
      title: item.title,
      detail: item.detail,
      tone: item.tone,
      href: item.href,
      meta: item.meta || "Jobs oversight",
    })),
    ...marketplaceSnapshot.alerts.slice(0, 2).map((item) => ({
      id: `marketplace-${item.id}`,
      title: item.title,
      detail: item.detail,
      tone: item.tone,
      href: item.href,
      meta: item.meta || "Marketplace oversight",
    })),
  ].slice(0, 8);

  const commandLinks = [
    ...jobsSnapshot.links.slice(0, 2),
    ...marketplaceSnapshot.links.slice(0, 3),
    ...financeSnapshot.links.slice(0, 1),
  ];

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Operations"
        title="Operations Center"
        description="Cross-division command now combines support pressure, jobs and marketplace oversight, finance truth, and property trust signals into one live operating surface."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaffMetricCard
          label="Open support"
          value={String(intelligence.metrics.openSupport)}
          subtitle="Threads still unresolved across visible divisions."
          icon={Cog}
        />
        <StaffMetricCard
          label="Stale queue"
          value={String(intelligence.metrics.staleSupport)}
          subtitle="Support rows sitting 12h+ without movement."
          icon={AlertTriangle}
        />
        <StaffMetricCard
          label="Jobs alerts"
          value={String(jobsSnapshot.alerts.length)}
          subtitle="Recruiter neglect or alert-delivery pressure needing oversight."
          icon={ShieldCheck}
        />
        <StaffMetricCard
          label="Marketplace alerts"
          value={String(marketplaceSnapshot.alerts.length)}
          subtitle="Notification failures, stalled orders, or review-authenticity pressure."
          icon={LineChart}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <StaffPanel title="Cross-division risk and anomaly routing">
          <div className="space-y-3">
            {routedAlerts.length === 0 ? (
              <p className="text-sm text-[var(--staff-muted)]">No elevated cross-division alert is active right now.</p>
            ) : (
              routedAlerts.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--staff-ink)]">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{item.detail}</p>
                    </div>
                    <StaffStatusBadge label={item.tone} tone={item.tone} />
                  </div>
                  {item.meta ? (
                    <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">{item.meta}</p>
                  ) : null}
                </a>
              ))
            )}
          </div>
        </StaffPanel>

        <StaffPanel title="Operational truth checks">
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">Finance ledger truth</p>
                <StaffStatusBadge label={`${financeSnapshot.ledgerAlerts.length} gaps`} tone={financeSnapshot.ledgerAlerts.length ? "warning" : "success"} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">
                Invoices and subscriptions missing explicit settlement context stay visible here instead of drifting out of finance review.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">Property trust watchlist</p>
                <StaffStatusBadge label={`${propertySummary.riskRows.length} signals`} tone={propertySummary.riskRows.length ? "warning" : "success"} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">
                Duplicate-contact and regional-default mismatches remain visible to prevent silent cross-division trust leakage.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">Marketplace review authenticity</p>
                <StaffStatusBadge label={`${marketplaceSnapshot.metrics[3]?.value || "0"} pending`} tone={Number(marketplaceSnapshot.metrics[3]?.value || 0) > 0 ? "warning" : "success"} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">
                Pending unverified reviews stay in moderation instead of quietly lifting seller trust.
              </p>
            </div>
          </div>
        </StaffPanel>
      </div>

      <StaffPanel title="Command links" className="mt-6">
        <div className="grid gap-3 xl:grid-cols-2">
          {commandLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">{link.label}</p>
                <ExternalLink className="h-4 w-4 text-[var(--staff-muted)]" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{link.description}</p>
            </a>
          ))}
        </div>
      </StaffPanel>

      {canSeeExecutiveSummary ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <StaffPanel title="Daily executive summary">
            <div className="space-y-3">
              {[jobsSnapshot.dailyBriefs[0], marketplaceSnapshot.dailyBriefs[0], financeSnapshot.summary]
                .filter(Boolean)
                .map((brief) => (
                  <div
                    key={brief}
                    className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]"
                  >
                    {brief}
                  </div>
                ))}
            </div>
          </StaffPanel>

          <StaffPanel title="Weekly executive summary">
            <div className="space-y-3">
              {[jobsSnapshot.weeklyBriefs[0], marketplaceSnapshot.weeklyBriefs[0], financeSnapshot.metrics[3]?.hint]
                .filter(Boolean)
                .map((brief) => (
                  <div
                    key={brief}
                    className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]"
                  >
                    {brief}
                  </div>
                ))}
            </div>
          </StaffPanel>
        </div>
      ) : null}
    </div>
  );
}
