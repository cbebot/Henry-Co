import { Cog } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import {
  viewerCanAccessOperations,
  viewerCanAccessSupport,
  viewerHasAnyFamily,
  viewerHasPermission,
} from "@/lib/roles";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { getStaffIntelligenceSnapshot } from "@/lib/intelligence-data";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const viewer = await requireStaff();
  if (!viewerCanAccessOperations(viewer)) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Operations Center" />
        <StaffEmptyState
          icon={Cog}
          title="Access restricted"
          description="Your staff role does not include operational queue access. Use your assigned division workspace instead."
        />
      </div>
    );
  }

  const canSeeRiskSignals =
    viewerHasPermission(viewer, "division.moderate") ||
    viewerHasAnyFamily(viewer, ["division_manager", "supervisor", "system_admin"]);
  const canUseSupportQueue = viewerCanAccessSupport(viewer);
  const intelligence = await getStaffIntelligenceSnapshot(
    viewer.divisions.map((item) => item.division),
    { includeSecuritySignals: canSeeRiskSignals }
  );
  const riskTasks = intelligence.riskAlerts.slice(0, 12);
  const riskHref = viewerHasPermission(viewer, "division.moderate")
    ? "/kyc"
    : canUseSupportQueue
      ? "/support?queue=support-trust"
      : "/operations";

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Operations"
        title="Operations Center"
        description="Cross-division operational queues, escalations, and workflow management."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StaffMetricCard
          label="Open support"
          value={String(intelligence.metrics.openSupport)}
          subtitle="Threads still unresolved"
          icon={Cog}
          href={canUseSupportQueue ? "/support" : "/operations"}
        />
        <StaffMetricCard
          label="Stale queue"
          value={String(intelligence.metrics.staleSupport)}
          subtitle="12h+ without movement"
          icon={Cog}
          href={canUseSupportQueue ? "/support" : "/operations"}
        />
        <StaffMetricCard
          label="Elevated risk"
          value={String(intelligence.metrics.elevatedRisk)}
          subtitle={canSeeRiskSignals ? "Security signals (medium/high)" : "Restricted by role"}
          icon={Cog}
          href={riskHref}
        />
      </div>

      <StaffPanel title="Risk and anomaly routing">
        <p className="mb-3 text-xs text-[var(--staff-muted)]">
          This view refreshes while open so risk evidence, stale support counts, and queue pressure stay current.
        </p>
        {riskTasks.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">
            No elevated risk signals to review. Continue monitoring support stale count and unread notifications to
            keep operations calm.
          </p>
        ) : (
          <div className="space-y-3">
            {riskTasks.map((alert) => (
              <a
                key={String(alert.id)}
                href={riskHref}
                className="block rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">
                    {String(alert.event_type || "Security signal")}
                  </p>
                  <StaffStatusBadge label={String(alert.risk_level || "medium")} tone="warning" />
                </div>
                <p className="mt-1 text-xs text-[var(--staff-muted)]">
                  User: {String(alert.user_id || "unknown")} · {String(alert.created_at || "")}
                </p>
              </a>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
