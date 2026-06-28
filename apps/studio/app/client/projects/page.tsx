import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";

import { getStudioClientPagesCopy } from "@henryco/i18n";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import { getClientPortalSnapshot } from "@/lib/portal/data";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { shortDate } from "@/lib/portal/helpers";
import { projectStatusToken } from "@/lib/portal/status";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { StatusBadge } from "@/components/portal/status-badge";

type StudioClientPagesCopy = ReturnType<typeof getStudioClientPagesCopy>;

export const metadata: Metadata = {
  title: "Projects",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVE_STATUSES = new Set([
  "active",
  "review",
  "revision",
  "onboarding",
  "in_review",
]);

export default async function ClientProjectsPage() {
  const viewer = await requireClientPortalViewer("/client/projects");
  const snapshot = await getClientPortalSnapshot(viewer);
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale);

  const active = snapshot.projects.filter((p) => ACTIVE_STATUSES.has(p.status));
  const completed = snapshot.projects.filter(
    (p) => p.status === "complete" || p.status === "delivered" || p.actualCompletion,
  );
  const other = snapshot.projects.filter(
    (p) => !ACTIVE_STATUSES.has(p.status) && !completed.includes(p),
  );

  if (snapshot.projects.length === 0) {
    return (
      <div className="space-y-6">
        <Header copy={copy} />
        <PortalEmptyState
          icon={FolderKanban}
          title={copy.projects.emptyTitle}
          body={copy.projects.emptyBody}
          action={
            <Link href="/request" className="portal-button portal-button-primary">
              {copy.projects.submitBrief}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  const milestoneIndex = new Map<string, number>();
  const milestoneCompleted = new Map<string, number>();
  for (const milestone of snapshot.milestones) {
    milestoneIndex.set(
      milestone.projectId,
      (milestoneIndex.get(milestone.projectId) ?? 0) + 1,
    );
    if (["approved", "complete"].includes(milestone.status)) {
      milestoneCompleted.set(
        milestone.projectId,
        (milestoneCompleted.get(milestone.projectId) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="space-y-7">
      <Header copy={copy} />

      {active.length > 0 ? (
        <ProjectsGroup
          label={copy.projects.groupActive}
          projects={active}
          milestoneTotal={milestoneIndex}
          milestoneCompleted={milestoneCompleted}
          copy={copy}
        />
      ) : null}

      {other.length > 0 ? (
        <ProjectsGroup
          label={copy.projects.groupInProgress}
          projects={other}
          milestoneTotal={milestoneIndex}
          milestoneCompleted={milestoneCompleted}
          copy={copy}
        />
      ) : null}

      {completed.length > 0 ? (
        <ProjectsGroup
          label={copy.projects.groupDelivered}
          projects={completed}
          milestoneTotal={milestoneIndex}
          milestoneCompleted={milestoneCompleted}
          copy={copy}
        />
      ) : null}
    </div>
  );
}

function Header({ copy }: { copy: StudioClientPagesCopy }) {
  return (
    <header>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
        {copy.projects.kicker}
      </div>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
        {copy.projects.title}
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
        {copy.projects.body}
      </p>
    </header>
  );
}

function ProjectsGroup({
  label,
  projects,
  milestoneTotal,
  milestoneCompleted,
  copy,
}: {
  label: string;
  projects: import("@/types/portal").ClientProject[];
  milestoneTotal: Map<string, number>;
  milestoneCompleted: Map<string, number>;
  copy: StudioClientPagesCopy;
}) {
  return (
    <section className="space-y-3" aria-label={label}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
          {label} · {projects.length}
        </h2>
      </div>
      {/* TODO(wave1): multi-row client projects list. project.title /
          project.summary are Supabase-row text fields — translate each via
          Promise.all + resolveLocalizedDynamicField in a follow-up wave.
          The single-row detail page at /client/projects/[projectId] is
          already wrapped through the cached DeepL pipeline. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => {
          const status = projectStatusToken(project.status);
          const total = milestoneTotal.get(project.id) ?? 0;
          const done = milestoneCompleted.get(project.id) ?? 0;
          return (
            <Link
              key={project.id}
              href={`/client/projects/${project.id}`}
              className="portal-card group flex flex-col gap-3 px-5 py-4 transition hover:border-[rgba(151,244,243,0.4)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                    {project.title}
                  </div>
                  {project.summary ? (
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                      {project.summary}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone={status.tone} label={status.label} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--studio-ink-soft)]">
                {project.startDate ? (
                  <span>{copy.projects.startedPrefix} {shortDate(project.startDate)}</span>
                ) : null}
                {project.estimatedCompletion ? (
                  <span>{copy.projects.duePrefix} {shortDate(project.estimatedCompletion)}</span>
                ) : null}
                {total > 0 ? (
                  <span>
                    {done}/{total} {copy.projects.milestones}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[var(--studio-signal)]">
                {copy.projects.openProject}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
