import { Headphones } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import { viewerCanAccessSupport } from "@/lib/roles";
import {
  StaffEmptyState,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { getStaffIntelligenceSnapshot } from "@/lib/intelligence-data";

export const dynamic = "force-dynamic";

type SupportSearchParams = {
  division?: string;
  queue?: string;
  thread?: string;
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<SupportSearchParams>;
}) {
  const viewer = await requireStaff();
  const params = await searchParams;

  if (!viewerCanAccessSupport(viewer)) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Support Desk" />
        <StaffEmptyState
          icon={Headphones}
          title="Access restricted"
          description="Your staff role does not include support queue access. Use your assigned division workspace instead."
        />
      </div>
    );
  }

  const intelligence = await getStaffIntelligenceSnapshot(
    viewer.divisions.map((item) => item.division)
  );
  const requestedDivision = String(params.division || "").trim().toLowerCase();
  const requestedQueue = String(params.queue || "").trim().toLowerCase();
  const requestedThread = String(params.thread || "").trim();
  const supportTasks = intelligence.tasks
    .filter((task) => task.queue.startsWith("support-"))
    .filter((task) => (requestedDivision ? task.division === requestedDivision : true))
    .filter((task) => (requestedQueue ? task.queue === requestedQueue : true))
    .filter((task) => (requestedThread ? task.id === `support:${requestedThread}` : true));
  const staleTasks = supportTasks.filter((task) => task.status === "stale").length;
  const atRiskTasks = supportTasks.filter((task) => task.status === "at_risk").length;
  const filterSummary = [
    requestedDivision ? `division ${requestedDivision}` : null,
    requestedQueue ? `queue ${requestedQueue.replace("support-", "")}` : null,
    requestedThread ? `thread ${requestedThread}` : null,
  ].filter(Boolean);

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
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
        {filterSummary.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-[var(--staff-accent)]">
            Filtered to {filterSummary.join(" · ")}.
          </p>
        ) : null}
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
