import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  History,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { getStudioClientPagesCopy } from "@henryco/i18n";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import { getStudioPublicLocale } from "@/lib/locale-server";
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
  title: "Studio workspace",
};

/** Authenticated portal — never serve a cached unauthenticated render. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function greetingFor(
  name: string | null,
  copy: ReturnType<typeof getStudioClientPagesCopy>["home"],
): string {
  const hour = new Date().getHours();
  const slot =
    hour < 12 ? copy.goodMorning : hour < 18 ? copy.goodAfternoon : copy.goodEvening;
  const trimmed = (name || "").trim().split(/\s+/)[0];
  return trimmed ? `${slot}, ${trimmed}` : slot;
}

export default async function ClientHomePage() {
  const viewer = await requireClientPortalViewer("/client");
  const snapshot = await getClientPortalSnapshot(viewer);
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale).home;

  const activeProject =
    snapshot.projects.find((project) =>
      ["active", "review", "revision", "onboarding", "in_review"].includes(project.status),
    ) ||
    snapshot.projects[0] ||
    null;

  const milestones = activeProject
    ? snapshot.milestones.filter((milestone) => milestone.projectId === activeProject.id)
    : [];

  const attention = buildAttentionItems(snapshot);

  // Server component — Date.now() is the request timestamp, deterministic
  // for the duration of this render.
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
  const otherProjects = snapshot.projects.filter((p) => p.id !== activeProject?.id);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {greetingFor(viewer.fullName || viewer.email, copy)}
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
          {copy.body}
        </p>
      </header>

      {activeProject ? (
        <ActiveProjectCard project={activeProject} milestones={milestones} copy={copy} />
      ) : (
        <PortalEmptyState
          icon={Sparkles}
          title={copy.startFirstTitle}
          body={copy.startFirstBody}
          action={
            <Link href="/request" className="portal-button portal-button-primary">
              {copy.openBriefBuilder}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      )}

      {attention.length > 0 ? <AttentionStrip items={attention} /> : null}

      <section aria-label={copy.recentActivity} className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            {copy.recentActivity}
          </h2>
          {snapshot.projects.length > 1 ? (
            <Link
              href="/client/projects"
              className="text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              {copy.viewAllProjects}
            </Link>
          ) : null}
        </div>

        {recentActivity.length > 0 ? (
          <ActivityFeed updates={recentActivity} projectTitleById={projectTitleById} />
        ) : (
          <PortalEmptyState
            icon={History}
            tone="muted"
            title={copy.feedStartedTitle}
            body={copy.feedStartedBody}
          />
        )}
      </section>

      {otherProjects.length > 0 ? (
        <section aria-label={copy.otherProjects} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
              {copy.otherProjects}
            </h2>
            <Link
              href="/client/projects"
              className="text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              {copy.seeAll}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherProjects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className="portal-card group flex items-start justify-between gap-3 px-4 py-3.5 transition hover:border-[rgba(151,244,243,0.4)]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                    {project.title}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-[12px] text-[var(--studio-ink-soft)]">
                    {project.summary || copy.studioEngagement}
                  </div>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)] transition group-hover:text-[var(--studio-ink)]" />
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
  copy,
}: {
  project: import("@/types/portal").ClientProject;
  milestones: import("@/types/portal").ClientMilestone[];
  copy: ReturnType<typeof getStudioClientPagesCopy>["home"];
}) {
  const status = projectStatusToken(project.status);
  const completed = milestones.filter((m) => ["approved", "complete"].includes(m.status)).length;

  return (
    <section className="portal-card-elev p-5 sm:p-7" aria-label={copy.activeProject}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            <FolderKanban className="h-3.5 w-3.5" />
            {copy.activeProject}
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[1.5rem]">
            {project.title}
          </h2>
          {project.nextAction || project.summary ? (
            <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
              {project.nextAction || project.summary}
            </p>
          ) : null}
        </div>
        <StatusBadge tone={status.tone} label={status.label} />
      </div>

      <hr className="portal-divider mt-5" />

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[var(--studio-ink-soft)]">
        {project.startDate ? (
          <span>
            <span className="font-semibold uppercase tracking-[0.16em]">{copy.started}</span>{" "}
            {shortDate(project.startDate)}
          </span>
        ) : null}
        {project.estimatedCompletion ? (
          <span>
            <span className="font-semibold uppercase tracking-[0.16em]">{copy.estimatedCompletion}</span>{" "}
            {shortDate(project.estimatedCompletion)}
          </span>
        ) : null}
        {milestones.length > 0 ? (
          <span>
            <span className="font-semibold uppercase tracking-[0.16em]">{copy.progress}</span>{" "}
            {completed}/{milestones.length} {copy.milestones}
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
          {copy.openProject}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/client/projects/${project.id}/messages`}
          className="portal-button portal-button-secondary"
        >
          <MessageSquare className="h-4 w-4" />
          {copy.messageTeam}
        </Link>
      </div>
    </section>
  );
}
