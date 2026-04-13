import { Briefcase, ExternalLink, ShieldCheck, Siren, Users } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { getJobsOpsSnapshot } from "@/lib/jobs-ops";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

const JOBS_LANES = [
  { id: "all", label: "All queues" },
  { id: "recruiter", label: "Recruiter" },
  { id: "moderation", label: "Moderation" },
  { id: "alerts", label: "Owner alerts" },
] as const;

function QueueCard({
  title,
  items,
}: {
  title: string;
  items: Awaited<ReturnType<typeof getJobsOpsSnapshot>>["recruiterQueue"];
}) {
  return (
    <StaffPanel title={title}>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">No queue items are currently visible in this lane.</p>
        ) : (
          items.map((item) => (
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
                <StaffStatusBadge label={item.statusLabel} tone={item.tone} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                <span>{item.ownerRole}</span>
                <span>{item.actionLabel}</span>
                {item.meta ? <span>{item.meta}</span> : null}
              </div>
            </a>
          ))
        )}
      </div>
    </StaffPanel>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ lane?: string }>;
}) {
  const viewer = await requireStaff();
  const laneValue = (await searchParams).lane || "all";
  const lane = JOBS_LANES.some((item) => item.id === laneValue) ? laneValue : "all";
  const profileRole = String(viewer.user?.profileRole || "").toLowerCase();
  const hasJobsDivision = viewer.divisions.some((division) => division.division === "jobs");
  const canOperateJobs = hasJobsDivision || profileRole === "owner" || profileRole === "manager";

  if (!canOperateJobs) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Jobs Operations" />
        <StaffEmptyState
          icon={Briefcase}
          title="Access restricted"
          description="Jobs operations now stays role-scoped. This workspace is available to owner, manager, or explicit Jobs staff memberships only."
        />
      </div>
    );
  }

  const snapshot = await getJobsOpsSnapshot();
  const showRecruiter = lane === "all" || lane === "recruiter";
  const showModeration = lane === "all" || lane === "moderation";
  const showAlerts = lane === "all" || lane === "alerts";

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Jobs Operations"
        description="Recruiter flow, employer verification, post moderation, and owner-visible trust alerts now route through live HenryJobs workflows instead of a passive shell."
      />

      <div className="mb-6 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Operational model</p>
          <StaffStatusBadge label="Role-scoped" tone="warning" />
          <StaffStatusBadge label="Audit-backed" tone="info" />
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--staff-muted)]">{snapshot.summary}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <StaffMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtitle={metric.hint}
            icon={Briefcase}
          />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {JOBS_LANES.map((item) => {
          const active = item.id === lane;
          return (
            <a
              key={item.id}
              href={item.id === "all" ? "/jobs" : `/jobs?lane=${item.id}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--staff-gold-soft)] text-[var(--staff-ink)]"
                  : "border border-[var(--staff-line)] bg-[var(--staff-surface)] text-[var(--staff-muted)] hover:border-[var(--staff-gold)]/35"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {showRecruiter ? <QueueCard title="Recruiter action queue" items={snapshot.recruiterQueue} /> : null}
        {showModeration ? <QueueCard title="Moderation and verification" items={snapshot.moderationQueue} /> : null}
      </div>

      {showAlerts ? (
        <StaffPanel title="Owner-visible alerts" className="mt-6">
          <div className="space-y-3">
            {snapshot.alerts.length === 0 ? (
              <p className="text-sm text-[var(--staff-muted)]">No owner-visible jobs alerts are active right now.</p>
            ) : (
              snapshot.alerts.map((item) => (
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
                    <StaffStatusBadge label={item.statusLabel} tone={item.tone} />
                  </div>
                  {item.meta ? (
                    <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">{item.meta}</p>
                  ) : null}
                </a>
              ))
            )}
          </div>
        </StaffPanel>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <StaffPanel title="Daily owner summary">
          <div className="space-y-3">
            {snapshot.dailyBriefs.map((brief) => (
              <div key={brief} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]">
                {brief}
              </div>
            ))}
          </div>
        </StaffPanel>

        <StaffPanel title="Weekly owner summary">
          <div className="space-y-3">
            {snapshot.weeklyBriefs.map((brief) => (
              <div key={brief} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]">
                {brief}
              </div>
            ))}
          </div>
        </StaffPanel>
      </div>

      <StaffPanel title="Exact workflows" className="mt-6">
        <div className="grid gap-3 xl:grid-cols-2">
          {snapshot.links.map((link) => (
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--staff-accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Role ownership</p>
              <p className="text-xs text-[var(--staff-muted)]">Recruiter owns movement. Moderation owns trust gates. Owner sees neglect and weak seriousness.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--staff-warning)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Boundary rule</p>
              <p className="text-xs text-[var(--staff-muted)]">Jobs HQ no longer assumes recruiter or moderator power from broad support/staff profiles.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <Siren className="h-5 w-5 text-[var(--staff-critical)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Escalation posture</p>
              <p className="text-xs text-[var(--staff-muted)]">Alert delivery failures, stale threads, and note-free shortlist moves stay visible to owner oversight.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
