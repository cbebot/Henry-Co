import Link from "next/link";
import { ListTodo } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getDashboardSummary, getSupportThreads, getWalletFundingContext } from "@/lib/account-data";
import { buildAccountTasks } from "@/lib/intelligence-rollout";
import { getAccountTrustProfile } from "@/lib/trust";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireAccountUser();
  const [data, funding, trust, supportThreads] = await Promise.all([
    getDashboardSummary(user.id),
    getWalletFundingContext(user.id),
    getAccountTrustProfile(user.id),
    getSupportThreads(user.id),
  ]);
  const openSupportCount = supportThreads.filter((thread: Record<string, unknown>) => {
    const status = String(thread.status || "");
    return status !== "resolved" && status !== "closed";
  }).length;

  const tasks = buildAccountTasks({
    userId: user.id,
    unreadNotificationCount: data.unreadNotificationCount,
    pendingFundingKobo: funding.pending_kobo,
    openSupportCount,
    trust,
  });

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <PageHeader
        title="Tasks"
        description="Prioritized actions across account, trust, wallet, and support."
        icon={ListTodo}
      />
      <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--acct-muted)]">How this queue works</p>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          Blocking tasks can prevent access to important workflows. High-priority items are next-best actions to
          keep your account healthy and avoid delays.
        </p>
      </div>
      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No active tasks"
          description="You’re currently clear. Tasks will appear here when action is needed."
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={task.deeplinkTemplate || "/"}
              className="block px-5 py-4 transition hover:bg-[var(--acct-bg-elevated)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{task.title}</p>
                <span className="acct-chip acct-chip-blue text-[0.65rem]">
                  {task.blocking ? "blocking" : task.priority}
                </span>
              </div>
              {task.description ? (
                <p className="mt-1 text-sm text-[var(--acct-muted)]">{task.description}</p>
              ) : null}
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                Source: {task.sourceDivision}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

