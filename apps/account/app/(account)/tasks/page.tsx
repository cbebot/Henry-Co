import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import {
  getDashboardSummary,
  getSupportThreads,
  getWalletFundingContext,
} from "@/lib/account-data";
import { buildAccountTasks } from "@/lib/intelligence-rollout";
import { getAccountTrustProfile } from "@/lib/trust";
import {
  getLocalizedTrustRequirements,
  localizeAccountTask,
} from "@/lib/account-localization";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/tasks/styles.css";
import { TasksList } from "@/components/tasks/TasksList";
import {
  heroState as taskHeroState,
  taskStats,
  type TaskRow,
} from "@/components/tasks/helpers";

export const dynamic = "force-dynamic";

/**
 * Tasks landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2C). Lifts TasksHero into the shared
 * HeroCard primitive and surfaces the top blocking task via NextStepRow.
 */
export default async function TasksPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
  const tasksCopy = copy.tasks;
  const [data, funding, trust, supportThreads] = await Promise.all([
    getDashboardSummary(user.id, locale),
    getWalletFundingContext(user.id),
    getAccountTrustProfile(user.id),
    getSupportThreads(user.id),
  ]);
  const openSupportCount = (supportThreads as Array<Record<string, unknown>>).filter(
    (thread) => {
      const status = String(thread.status || "");
      return status !== "resolved" && status !== "closed";
    },
  ).length;
  const trustRequirements = getLocalizedTrustRequirements(copy, trust);

  const rawTasks = buildAccountTasks({
    userId: user.id,
    unreadNotificationCount: data.unreadNotificationCount,
    pendingFundingKobo: funding.pending_kobo,
    openSupportCount,
    trust,
  }).map((task) => localizeAccountTask(copy, task, trustRequirements));

  const tasks: TaskRow[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    sourceDivision: String(t.sourceDivision || "account"),
    deeplinkTemplate: t.deeplinkTemplate,
    priority:
      t.priority === "urgent" || t.priority === "high" || t.priority === "normal" || t.priority === "low"
        ? t.priority
        : "normal",
    blocking: Boolean(t.blocking),
  }));
  const stats = taskStats(tasks);
  const state = taskHeroState(stats);

  // ── Headline + blurb from slice ──────────────────────────────────
  const headline =
    state === "empty"
      ? tasksCopy.headlineEmpty
      : state === "risk"
        ? stats.blocking > 0
          ? formatAccountTemplate(
              stats.blocking === 1
                ? tasksCopy.headlineBlockerSingular
                : tasksCopy.headlineBlockerPlural,
              { count: stats.blocking },
            )
          : formatAccountTemplate(
              stats.urgent === 1
                ? tasksCopy.headlineUrgentSingular
                : tasksCopy.headlineUrgentPlural,
              { count: stats.urgent },
            )
        : state === "active"
          ? formatAccountTemplate(
              stats.total === 1
                ? tasksCopy.headlineActiveSingular
                : tasksCopy.headlineActivePlural,
              { count: stats.total },
            )
          : formatAccountTemplate(
              stats.total === 1
                ? tasksCopy.headlineCalmSingular
                : tasksCopy.headlineCalmPlural,
              { count: stats.total },
            );

  const blurb =
    state === "empty"
      ? tasksCopy.blurbEmpty
      : state === "risk"
        ? tasksCopy.blurbRisk
        : tasksCopy.blurbActive;

  // ── Tiles ────────────────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: tasksCopy.blocking,
      value: stats.blocking,
      foot:
        stats.blocking === 0
          ? tasksCopy.nothingBlocking
          : tasksCopy.resolveBlockers,
      tone: stats.blocking > 0 ? "warning" : "default",
    },
    {
      label: tasksCopy.priorityLabels.urgent,
      value: stats.urgent,
      foot: `${stats.high} ${tasksCopy.priorityLabels.high} · ${stats.normal + stats.low} ${tasksCopy.routine}`,
      tone: stats.urgent > 0 ? "warning" : "default",
    },
    {
      label: tasksCopy.openTotalLabel,
      value: stats.total,
      foot: formatAccountTemplate(
        stats.divisions.length === 1
          ? tasksCopy.divisionRepresentedSingular
          : tasksCopy.divisionRepresentedPlural,
        { count: stats.divisions.length },
      ),
    },
  ];

  const breakdown: ReadonlyArray<HeroCardBreakdownRow> = stats.divisions.map((d) => ({
    label: d.label,
    count: d.count,
    color: d.color,
  }));

  // ── NextStepRow: top blocking, otherwise top urgent ──────────────
  let nextStep: React.ReactNode = null;
  const topBlocker =
    tasks.find((t) => t.blocking && t.priority === "urgent") ??
    tasks.find((t) => t.blocking) ??
    tasks.find((t) => t.priority === "urgent");
  if (topBlocker) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={topBlocker.blocking ? tasksCopy.blocking : tasksCopy.priorityLabels.urgent}
        title={topBlocker.title}
        detail={topBlocker.description}
        cta={
          topBlocker.deeplinkTemplate
            ? { label: tasksCopy.priorityFallback.high, href: topBlocker.deeplinkTemplate }
            : undefined
        }
      />
    );
  }

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "risk"
        ? "attention"
        : state === "active"
          ? "active"
          : "calm";

  return (
    <DivisionLanding
      className="acct-tsk acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={tasksCopy.eyebrow}
          headline={headline}
          blurb={blurb}
          ariaLabel={tasksCopy.overviewAria}
          ariaTilesLabel={tasksCopy.volumeAria}
          tiles={tiles}
          side={{
            kicker: tasksCopy.sideAria,
            title: tasksCopy.queueTitle,
            body: tasksCopy.queueBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: tasksCopy.bySource,
                    rows: breakdown,
                    ariaLabel: tasksCopy.sideAria,
                  }
                : undefined,
          }}
        />
      }
      nextStep={nextStep}
      sections={[
        {
          id: "acct-tsk-list",
          title: tasksCopy.queueTitle,
          meta:
            tasks.length === 0
              ? tasksCopy.metaEmpty
              : formatAccountTemplate(tasksCopy.metaCount, { count: tasks.length }),
          content:
            tasks.length === 0 ? (
              <EmptyStateCard
                kicker={tasksCopy.eyebrow}
                title={tasksCopy.emptyTitle}
                body={tasksCopy.emptyDescription}
              />
            ) : (
              <TasksList
                tasks={tasks}
                priorityLabel={(priority) =>
                  tasksCopy.priorityLabels[priority] || priority
                }
                blockingLabel={tasksCopy.blocking}
                sourceLabel={copy.common.source || "Source"}
              />
            ),
        },
      ]}
      footer={<RouteLiveRefresh intervalMs={12000} />}
    />
  );
}
