import { Activity, AlertOctagon, Clock, TrendingDown, Users } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  LIFECYCLE_PILLARS,
  LIFECYCLE_PILLAR_LABEL,
  LIFECYCLE_STAGE_LABEL,
  type LifecyclePillar,
  type LifecycleStage,
} from "@henryco/lifecycle";
import { requireStaff } from "@/lib/staff-auth";
import {
  viewerCanAccessOperations,
  viewerCanAccessSupport,
  viewerHasAnyFamily,
} from "@/lib/roles";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import {
  getStaffLifecycleSnapshot,
  type LifecycleRow,
} from "@/lib/customer-lifecycle";

export const dynamic = "force-dynamic";

function priorityTone(priority: LifecycleRow["priority"]): "critical" | "warning" | "info" | "success" {
  switch (priority) {
    case "critical":
      return "critical";
    case "high":
      return "warning";
    case "normal":
      return "info";
    default:
      return "success";
  }
}

function formatLastActive(value: string | null): string {
  if (!value) return "no activity";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "no activity";
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CohortList({
  title,
  description,
  rows,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: LifecycleRow[];
  emptyMessage: string;
}) {
  return (
    <StaffPanel title={title}>
      <p className="mb-3 text-xs text-[var(--staff-muted)]">{description}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--staff-muted)]">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={`${row.userId}-${row.pillar}-${index}`}
              className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StaffStatusBadge
                  label={LIFECYCLE_PILLAR_LABEL[row.pillar]}
                  tone={priorityTone(row.priority)}
                />
                <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  {LIFECYCLE_STAGE_LABEL[row.stage]}
                </span>
                <span className="ml-auto text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  {formatLastActive(row.lastActiveAt)}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">
                {row.status || LIFECYCLE_STAGE_LABEL[row.stage]}
              </p>
              <p className="mt-1 text-xs text-[var(--staff-muted)]">
                Customer <span className="font-mono">{row.userId.slice(0, 8)}…</span>
                {row.blockerReason ? ` · blocker: ${row.blockerReason}` : ""}
                {row.referenceType ? ` · ref: ${row.referenceType}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </StaffPanel>
  );
}

export default async function StaffLifecyclePage() {
  const viewer = await requireStaff();
  const canRead =
    viewerCanAccessOperations(viewer) ||
    viewerCanAccessSupport(viewer) ||
    viewerHasAnyFamily(viewer, ["division_manager", "supervisor", "system_admin"]);

  if (!canRead) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Lifecycle" title="Customer lifecycle" />
        <StaffEmptyState
          icon={Users}
          title="Access restricted"
          description="Your staff role does not include customer lifecycle visibility. Contact operations if you need access for a specific workflow."
        />
      </div>
    );
  }

  const snapshot = await getStaffLifecycleSnapshot();
  const totalStalled =
    snapshot.stageCounts.awaiting_business + snapshot.stageCounts.awaiting_user;
  const totalReengage =
    snapshot.stageCounts.dormant + snapshot.stageCounts.reengagement_candidate;

  const topPillars = (Object.entries(snapshot.pillarCounts) as Array<[LifecyclePillar, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const stageOrder: LifecycleStage[] = [
    "blocked",
    "awaiting_user",
    "awaiting_business",
    "in_progress",
    "reengagement_candidate",
    "dormant",
    "churn_risk",
    "retained",
  ];

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={20000} />
      <StaffPageHeader
        eyebrow="Lifecycle"
        title="Customer lifecycle"
        description="Cross-division view of where customers are in their HenryCo journey — blocking items, stalled reviews, and re-engagement candidates. Derived from customer_lifecycle_snapshots."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaffMetricCard
          label="Tracked customers"
          value={String(snapshot.distinctUsers)}
          subtitle={`${snapshot.totalRows} lifecycle rows on record`}
          icon={Users}
        />
        <StaffMetricCard
          label="Blocked"
          value={String(snapshot.stageCounts.blocked)}
          subtitle="Customer or business hard blockers"
          icon={AlertOctagon}
        />
        <StaffMetricCard
          label="Stalled"
          value={String(totalStalled)}
          subtitle="Awaiting user or awaiting business"
          icon={Clock}
        />
        <StaffMetricCard
          label="Re-engagement candidates"
          value={String(totalReengage)}
          subtitle={`${snapshot.stageCounts.churn_risk} in churn risk`}
          icon={TrendingDown}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <StaffPanel title="Stage distribution">
          <div className="space-y-2">
            {stageOrder.map((stage) => {
              const count = snapshot.stageCounts[stage] ?? 0;
              return (
                <div key={stage} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[var(--staff-ink)]">{LIFECYCLE_STAGE_LABEL[stage]}</span>
                  <span className="font-mono text-xs text-[var(--staff-muted)]">{count}</span>
                </div>
              );
            })}
          </div>
        </StaffPanel>

        <StaffPanel title="Top pillars by rows">
          {topPillars.length === 0 ? (
            <p className="text-sm text-[var(--staff-muted)]">No lifecycle rows yet.</p>
          ) : (
            <div className="space-y-2">
              {topPillars.map(([pillar, count]) => (
                <div key={pillar} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-[var(--staff-ink)]">{LIFECYCLE_PILLAR_LABEL[pillar]}</span>
                  <span className="font-mono text-xs text-[var(--staff-muted)]">{count}</span>
                </div>
              ))}
              {LIFECYCLE_PILLARS.length > topPillars.length ? (
                <p className="pt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  + {LIFECYCLE_PILLARS.length - topPillars.length} more pillars tracked
                </p>
              ) : null}
            </div>
          )}
        </StaffPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CohortList
          title="Blocked"
          description="Customer journeys currently blocked by hard constraints or disputes. These need manual intervention before the customer can resume."
          rows={snapshot.blockedRows}
          emptyMessage="No blocked customers on file right now."
        />
        <CohortList
          title="Awaiting business"
          description="Customers waiting on HenryCo — verification review, finance approvals, employer actions, or studio staff follow-up."
          rows={snapshot.stalledBusinessRows}
          emptyMessage="No stalled business-side reviews."
        />
        <CohortList
          title="Re-engagement candidates"
          description="Customers whose activity has gone quiet but have not yet hit churn risk. Target these cohorts with honest, relevant prompts only."
          rows={snapshot.reengagementRows}
          emptyMessage="No re-engagement candidates yet."
        />
        <CohortList
          title="Churn risk"
          description="Customers who have gone dark for long enough to be considered at risk. Review before any outreach — do not spam."
          rows={snapshot.churnRiskRows}
          emptyMessage="No customers currently in churn-risk window."
        />
      </div>

      <StaffPanel title="Source of truth" className="mt-6">
        <p className="text-xs text-[var(--staff-muted)]">
          This page reads <span className="font-mono">customer_lifecycle_snapshots</span>, a
          derived summary layer — not a duplicate of transactional state. Snapshots are
          recomputed whenever the owning customer visits their account overview, so the
          data refreshes as customers engage with HenryCo. The underlying transactional
          tables (orders, bookings, support threads, wallet movements, verification
          submissions) remain the authoritative source.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--staff-muted)]">
          <Activity size={14} />
          <span>Governed under data_retention_policies: identity_account / DERIVED SUMMARY.</span>
        </div>
      </StaffPanel>
    </div>
  );
}
