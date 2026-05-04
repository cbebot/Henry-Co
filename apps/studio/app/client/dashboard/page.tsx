import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban, History, Sparkles } from "lucide-react";

import { requireClientPortalViewer } from "@/lib/portal/auth";
import {
  buildAttentionItems,
  getClientPortalSnapshot,
} from "@/lib/portal/data";
import { shortDate } from "@/lib/portal/helpers";
import { projectStatusToken } from "@/lib/portal/status";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { AttentionStrip } from "@/components/portal/attention-strip";
import { MilestoneProgress } from "@/components/portal/milestone-progress";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { StatusBadge } from "@/components/portal/status-badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

/** Authenticated portal — never serve a cached unauthenticated render.
 * Forces every request through the auth gate (CHROME-01A FIX 15). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function greetingFor(name: string | null) {
  const hour = new Date().getHours();
  const slot = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const trimmed = (name || "").trim().split(/\s+/)[0];
  return trimmed ? `${slot}, ${trimmed}` : slot;
}

export default async function ClientDashboardPage() {
  const viewer = await requireClientPortalViewer("/client/dashboard");
  const snapshot = await getClientPortalSnapshot(viewer);

  const activeProject =
    snapshot.projects.find((project) => ["active", "review", "revision", "onboarding", "in_review"].includes(project.status)) ||
    snapshot.projects[0] ||
    null;

  const milestones = activeProject
    ? snapshot.milestones.filter((milestone) => milestone.projectId === activeProject.id)
    : [];

  const attention = buildAttentionItems(snapshot);

  // Server component — Date.now() is the request timestamp, deterministic
  // for the duration of this render. The compiler's impurity guard is
  // for client renders and does not apply here.
  // eslint-disable-next-line react-hooks/purity
  const activityCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentActivity = snapshot.updates
    .filter((update) => {
      const created = new Date(update.createdAt).getTime();
      if (!Number.isFinite(created)) return false;
      return created > activityCutoff;
    })
    .slice(0, 12);

  const projectTitleById = new Map(snapshot.projects.map((p) => [p.id, p.title]));

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {greetingFor(viewer.fullName || viewer.email)}
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          Welcome to your client portal
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
          Everything about your engagement with HenryCo Studio lives here — milestones, deliverables,
          messages, and payments. We will keep this space updated as the project moves forward.
        </p>
      </header>

      {activeProject ? (
        <ActiveProjectCard project={activeProject} milestones={milestones} />
      ) : (
        <PortalEmptyState
          icon={Sparkles}
          title="Let's start your first project"
          body="Once you submit a brief and we accept the proposal, your active project will live here with milestones, files, and a direct line to the team."
          action={
            <Link href="/request" className="portal-button portal-button-primary">
              Open the brief builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      )}

      {attention.length > 0 ? <AttentionStrip items={attention} /> : null}

      <section aria-label="Recent activity" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            Recent activity
          </h2>
          {snapshot.projects.length > 1 ? (
            <Link
              href="/client/projects"
              className="text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              View all projects
            </Link>
          ) : null}
        </div>

        {recentActivity.length > 0 ? (
          <ActivityFeed updates={recentActivity} projectTitleById={projectTitleById} />
        ) : (
          <PortalEmptyState
            icon={History}
            tone="muted"
            title="The feed is just getting started"
            body="Once we share files, complete milestones, or post updates, you will see the timeline build here. Replies and approvals from your side will land here too."
          />
        )}
      </section>

      {snapshot.projects.length > 1 ? (
        <section aria-label="All projects" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
              Other projects
            </h2>
            <Link
              href="/client/projects"
              className="text-[12.5px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.projects
              .filter((p) => p.id !== activeProject?.id)
              .slice(0, 4)
              .map((project) => (
                <Link
                  key={project.id}
                  href={`/client/projects/${project.id}`}
                  className="portal-card group flex items-start justify-between gap-3 px-4 py-3 transition hover:border-[rgba(151,244,243,0.4)]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-[var(--studio-ink)]">
                      {project.title}
                    </div>
                    <div className="mt-1 text-[12px] text-[var(--studio-ink-soft)]">
                      {project.summary || "Studio engagement"}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)] transition group-hover:text-[var(--studio-ink)]" />
                </Link>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActiveProjectCard({
  project,
  milestones,
}: {
  project: import("@/types/portal").ClientProject;
  milestones: import("@/types/portal").ClientMilestone[];
}) {
  const status = projectStatusToken(project.status);

  return (
    <section className="portal-card-elev p-5 sm:p-7" aria-label="Active project">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            <FolderKanban className="h-3.5 w-3.5" />
            Active project
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-2xl">
            {project.title}
          </h2>
          {project.nextAction || project.summary ? (
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--studio-ink-soft)]">
              {project.nextAction || project.summary}
            </p>
          ) : null}
        </div>
        <StatusBadge tone={status.tone} label={status.label} />
      </div>

      <div className="portal-divider mt-5" />

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-[var(--studio-ink-soft)]">
        {project.startDate ? (
          <span>
            <span className="font-semibold uppercase tracking-[0.16em]">Started</span>{" "}
            {shortDate(project.startDate)}
          </span>
        ) : null}
        {project.estimatedCompletion ? (
          <span>
            <span className="font-semibold uppercase tracking-[0.16em]">Estimated completion</span>{" "}
            {shortDate(project.estimatedCompletion)}
          </span>
        ) : null}
        {milestones.length > 0 ? (
          <span>
            <span className="font-semibold uppercase tracking-[0.16em]">Progress</span>{" "}
            {milestones.filter((m) => ["approved", "complete"].includes(m.status)).length}/
            {milestones.length} milestones
          </span>
        ) : null}
      </div>

      {milestones.length > 0 ? (
        <div className="mt-5">
          <MilestoneProgress milestones={milestones} layout="horizontal" />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/client/projects/${project.id}`}
          className="portal-button portal-button-primary"
        >
          Open project
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/client/projects/${project.id}?tab=messages`}
          className="portal-button portal-button-secondary"
        >
          Message the team
        </Link>
      </div>
    </section>
  );
}
