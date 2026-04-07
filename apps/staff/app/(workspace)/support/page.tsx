import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffPanel, StaffStatusBadge } from "@/components/StaffPrimitives";
import { getStaffIntelligenceSnapshot } from "@/lib/intelligence-data";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  await requireStaff();
  const intelligence = await getStaffIntelligenceSnapshot();
  const supportTasks = intelligence.tasks.filter((task) => task.queue.startsWith("support-"));
  const staleTasks = supportTasks.filter((task) => task.status === "stale").length;
  const atRiskTasks = supportTasks.filter((task) => task.status === "at_risk").length;

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Support Desk"
        description="Cross-division support queue with triage-aware priorities and suggested next actions."
      />
      <div className="mb-5 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Queue guidance</p>
        <p className="mt-1 text-sm text-[var(--staff-muted)]">
          Handle stale and at-risk items first, then clear normal queue items. Finance and trust-tagged threads should
          be escalated through their specialist lanes.
        </p>
      </div>
      <StaffPanel title="Prioritized support queue">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--staff-info-soft)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--staff-info)]">
            {staleTasks} stale
          </span>
          <span className="rounded-full bg-[var(--staff-warning-soft)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--staff-warning)]">
            {atRiskTasks} at-risk
          </span>
          <span className="text-xs text-[var(--staff-muted)]">
            Queue is auto-prioritized from thread urgency, stale windows, and triage metadata.
          </span>
        </div>
        {supportTasks.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">No open support queue items.</p>
        ) : (
          <div className="space-y-3">
            {supportTasks.slice(0, 20).map((task) => (
              <a
                key={task.id}
                href={task.href}
                className="block rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">{task.title}</p>
                  <StaffStatusBadge
                    label={task.status}
                    tone={task.status === "stale" || task.status === "at_risk" ? "warning" : "info"}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--staff-muted)]">{task.summary}</p>
                <p className="mt-2 text-xs text-[var(--staff-muted)]">{task.suggestedAction}</p>
              </a>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
