import { Cog } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffMetricCard, StaffPageHeader, StaffPanel, StaffStatusBadge } from "@/components/StaffPrimitives";
import { getStaffIntelligenceSnapshot } from "@/lib/intelligence-data";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await requireStaff();
  const intelligence = await getStaffIntelligenceSnapshot();
  const riskTasks = intelligence.riskAlerts.slice(0, 12);

  return (
    <div className="staff-fade-in">
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
        />
        <StaffMetricCard
          label="Stale queue"
          value={String(intelligence.metrics.staleSupport)}
          subtitle="12h+ without movement"
          icon={Cog}
        />
        <StaffMetricCard
          label="Elevated risk"
          value={String(intelligence.metrics.elevatedRisk)}
          subtitle="Security signals (medium/high)"
          icon={Cog}
        />
      </div>

      <StaffPanel title="Risk and anomaly routing">
        {riskTasks.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">
            No elevated risk signals to review. Continue monitoring support stale count and unread notifications to
            keep operations calm.
          </p>
        ) : (
          <div className="space-y-3">
            {riskTasks.map((alert) => (
              <div
                key={String(alert.id)}
                className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
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
              </div>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
