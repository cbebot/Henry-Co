import { getAccountCopy } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";

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
import { TasksHero } from "@/components/tasks/TasksHero";
import { TasksList } from "@/components/tasks/TasksList";
import {
  taskStats,
  type TaskRow,
} from "@/components/tasks/helpers";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale);
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

  return (
    <div className="acct-tsk acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <TasksHero
        stats={stats}
        eyebrow="Action queue · live"
        guidanceKicker={copy.tasks.queueTitle}
        guidanceTitle="One queue, every division."
        guidanceBody={copy.tasks.queueBody}
        labels={{
          blocking: copy.tasks.blocking || "Blocking",
          urgent: copy.tasks.priorityLabels.urgent || "Urgent",
          high: copy.tasks.priorityLabels.high || "high",
          total: "Open total",
        }}
      />
      <section aria-labelledby="acct-tsk-list">
        <div className="acct-tsk__section-head">
          <h2 id="acct-tsk-list" className="acct-tsk__section-title">
            {copy.tasks.queueTitle || "Open tasks"}
          </h2>
          <span className="acct-tsk__section-meta">
            {tasks.length === 0
              ? "You're clear. Anything new will appear here as it arrives."
              : `${tasks.length} open · sorted by priority and blocking state.`}
          </span>
        </div>
        {tasks.length === 0 ? (
          <div className="acct-tsk__empty">
            <strong>{copy.tasks.emptyTitle}</strong>
            {copy.tasks.emptyDescription}
          </div>
        ) : (
          <TasksList
            tasks={tasks}
            priorityLabel={(priority) => copy.tasks.priorityLabels[priority] || priority}
            blockingLabel={copy.tasks.blocking || "Blocking"}
            sourceLabel={copy.common.source || "Source"}
          />
        )}
      </section>
    </div>
  );
}
