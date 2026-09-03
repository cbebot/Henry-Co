import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CreditCard, FileCheck2, History, MessageSquare } from "lucide-react";

import { HeroCard, NextStepRow } from "@henryco/dashboard-shell/surfaces";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import { getClientPortalSnapshot } from "@/lib/portal/data";
import { shortDate } from "@/lib/portal/helpers";
import {
  buildStudioHero,
  buildStudioNextStep,
  studioDashboardStats,
  type StudioHomeInput,
  type StudioNextStepModel,
} from "@/lib/portal/studio-home";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { PortalEmptyState } from "@/components/portal/empty-state";

export const metadata: Metadata = {
  title: "Studio workspace",
};

/** Authenticated portal — never serve a cached unauthenticated render. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function nextStepIcon(iconKey: StudioNextStepModel["iconKey"]): ReactNode {
  const cls = "h-[18px] w-[18px]";
  if (iconKey === "pay") return <CreditCard className={cls} />;
  if (iconKey === "review") return <FileCheck2 className={cls} />;
  return <MessageSquare className={cls} />;
}

export default async function ClientHomePage() {
  const locale = await getStudioPublicLocale();
  const t = (value: string) => translateSurfaceLabel(locale, value);
  const viewer = await requireClientPortalViewer("/client");
  const snapshot = await getClientPortalSnapshot(viewer);

  // V3-INNER-L-ELEVATE-STUDIO — the above-the-fold answer (Q1 "what's happening
  // with my commission?" + Q2 "what next?") is derived in a pure, TDD'd model
  // (lib/portal/studio-home.ts) and rendered through the shared Register-L
  // HeroCard + NextStepRow. The masthead carries the signal, so the old manual
  // header, bespoke ActiveProjectCard, empty-state, and attention strip are all
  // folded in — remarkable through restraint, not addition.
  const input: StudioHomeInput = {
    viewer,
    projects: snapshot.projects,
    milestones: snapshot.milestones,
    invoices: snapshot.invoices,
    deliverables: snapshot.deliverables,
    messages: snapshot.messages,
  };
  const stats = studioDashboardStats(input);
  const hero = buildStudioHero(stats, t, shortDate);
  const nextStep = buildStudioNextStep(input, stats, t);

  // Server component — Date.now() is the request timestamp, deterministic for
  // the duration of this render.
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
  const otherProjects = snapshot.projects.filter((p) => p.id !== stats.activeProjectId);

  return (
    <div className="space-y-7">
      <HeroCard
        variant="paired"
        tone={hero.tone}
        eyebrow={hero.eyebrow}
        headline={hero.headline}
        blurb={hero.blurb}
        ariaLabel={hero.ariaLabel}
        ariaTilesLabel={hero.ariaTilesLabel}
        ctaPrimary={hero.ctaPrimary}
        ctaSecondary={hero.ctaSecondary}
        tiles={hero.tiles}
        side={hero.side}
        progress={hero.progress}
      />

      {nextStep ? (
        <NextStepRow
          tone={nextStep.tone}
          kicker={nextStep.kicker}
          title={nextStep.title}
          detail={nextStep.detail}
          icon={nextStepIcon(nextStep.iconKey)}
          cta={nextStep.cta}
        />
      ) : null}

      <section aria-label={t("Recent activity")} className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            {t("Recent activity")}
          </h2>
          {snapshot.projects.length > 1 ? (
            <Link
              href="/client/projects"
              className="text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              {t("View all projects")}
            </Link>
          ) : null}
        </div>

        {recentActivity.length > 0 ? (
          <ActivityFeed updates={recentActivity} projectTitleById={projectTitleById} />
        ) : (
          <PortalEmptyState
            icon={History}
            tone="muted"
            title={t("The feed is just getting started")}
            body={t(
              "Once we share files, complete milestones, or post updates, you will see the timeline build here. Replies and approvals from your side land here too.",
            )}
          />
        )}
      </section>

      {otherProjects.length > 0 ? (
        <section aria-label={t("Other projects")} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
              {t("Other projects")}
            </h2>
            <Link
              href="/client/projects"
              className="text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              {t("See all")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherProjects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className="portal-card group flex items-start justify-between gap-3 px-4 py-3.5 transition hover:border-[var(--studio-accent-ring)]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                    {project.title}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-[12px] text-[var(--studio-ink-soft)]">
                    {project.summary || t("Studio engagement")}
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
