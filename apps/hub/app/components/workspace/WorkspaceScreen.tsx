import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Bot,
  Building2,
  ChartColumn,
  CircleAlert,
  Clock3,
  ExternalLink,
  History,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  ListTodo,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type WorkspaceSectionKey,
  getWorkspaceSectionTitle,
} from "@/app/lib/workspace/navigation";
import type {
  DivisionWorkspaceModule,
  WorkspaceDivision,
  WorkspaceNavSection,
  WorkspaceSnapshot,
  WorkspaceTask,
  WorkspaceViewer,
} from "@/app/lib/workspace/types";
import type { HubWorkspaceCopy } from "@henryco/i18n";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ListTodo,
  Inbox,
  BadgeCheck,
  KanbanSquare,
  History,
  ChartColumn,
  Settings2,
  Building2,
};

function taskStatusClasses(status: WorkspaceTask["status"]) {
  switch (status) {
    case "at_risk":
      return "border-red-200 bg-red-50 text-red-700";
    case "stale":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "blocked":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "new":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function insightToneClasses(tone: DivisionWorkspaceModule["insights"][number]["tone"]) {
  switch (tone) {
    case "critical":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "success":
      return "border-emerald-200 bg-emerald-50";
    default:
      return "border-sky-200 bg-sky-50";
  }
}

function metricToneClasses(
  tone?: DivisionWorkspaceModule["metrics"][number]["tone"]
) {
  switch (tone) {
    case "critical":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "success":
      return "border-emerald-200 bg-emerald-50";
    case "info":
      return "border-sky-200 bg-sky-50";
    default:
      return "border-white/70 bg-white/80";
  }
}

function sectionIntro(
  key: WorkspaceSectionKey,
  copy: HubWorkspaceCopy["workspaceScreen"],
  division?: WorkspaceDivision
) {
  switch (key) {
    case "overview":
      return copy.introOverview;
    case "tasks":
      return copy.introTasks;
    case "inbox":
      return copy.introInbox;
    case "approvals":
      return copy.introApprovals;
    case "queues":
      return copy.introQueues;
    case "archive":
      return copy.introArchive;
    case "reports":
      return copy.introReports;
    case "settings":
      return copy.introSettings;
    case "division":
      return division
        ? copy.introDivisionTemplate.replace("{shortName}", getDivisionConfig(division).shortName)
        : copy.introDivisionFallback;
    default:
      return copy.introDivisionFallback;
  }
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-white">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: DivisionWorkspaceModule["metrics"][number]) {
  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${metricToneClasses(
        tone
      )}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

function InsightCard({
  insight,
  copy,
}: {
  insight: WorkspaceSnapshot["insights"][number];
  copy: HubWorkspaceCopy["workspaceScreen"];
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${insightToneClasses(
        insight.tone
      )}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {copy.helperInsightLabel}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{insight.title}</h3>
        </div>
        <Bot className="mt-1 h-5 w-5 text-slate-500" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{insight.summary}</p>
      {insight.evidence.length > 0 ? (
        <div className="mt-4 space-y-2">
          {insight.evidence.slice(0, 3).map((evidence) => (
            <div
              key={evidence}
              className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-600"
            >
              {evidence}
            </div>
          ))}
        </div>
      ) : null}
      {insight.href ? (
        <Link
          href={insight.href}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          {copy.insightOpenLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function TaskCard({ task, copy }: { task: WorkspaceTask; copy: HubWorkspaceCopy["workspaceScreen"] }) {
  return (
    <Link
      href={task.href}
      className="group block rounded-[26px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${taskStatusClasses(
                task.status
              )}`}
            >
              {task.status.replace("_", " ")}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {task.division}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {task.title}
          </h3>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:text-slate-800" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{task.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">{task.queue}</span>
        {task.ownerLabel ? <span className="rounded-full bg-slate-100 px-3 py-1">{task.ownerLabel}</span> : null}
        {task.dueLabel ? <span className="rounded-full bg-slate-100 px-3 py-1">{task.dueLabel}</span> : null}
      </div>
      <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
        <span className="font-semibold">{copy.suggestedNextAction}</span> {task.suggestedAction}
      </div>
      {task.evidence.length > 0 ? (
        <div className="mt-4 space-y-2">
          {task.evidence.slice(0, 3).map((evidence) => (
            <div key={evidence} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {evidence}
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function InboxCard({
  item,
  copy,
}: {
  item: WorkspaceSnapshot["inbox"][number];
  copy: HubWorkspaceCopy["workspaceScreen"];
}) {
  return (
    <Link
      href={item.href}
      className="block rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {item.kind}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {item.division}
            </span>
            {item.unread ? (
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                {copy.unreadBadge}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
        </div>
        <BellRing className="mt-1 h-5 w-5 text-slate-400" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
      <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">{item.createdAt}</div>
    </Link>
  );
}

function QueueLaneCard({
  lane,
  copy,
}: {
  lane: DivisionWorkspaceModule["queueLanes"][number];
  copy: HubWorkspaceCopy["workspaceScreen"];
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{lane.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{lane.description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
          {lane.items.length}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {lane.items.length > 0 ? (
          lane.items.map((task) => (
            <div key={task.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{task.summary}</div>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${taskStatusClasses(
                    task.status
                  )}`}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            {copy.queueLaneEmpty}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleCard({
  module,
  href,
  copy,
}: {
  module: DivisionWorkspaceModule;
  href: string;
  copy: HubWorkspaceCopy["workspaceScreen"];
}) {
  const config = getDivisionConfig(module.division);

  return (
    <div
      className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${config.accentStrong} 0%, rgba(255,255,255,0.96) 40%, rgba(255,255,255,0.92) 100%)`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
              {module.division}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
              {module.readiness}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
              {module.sourceMode === "structured"
                ? copy.sourceModeStructured
                : module.sourceMode === "shared-signals"
                  ? copy.sourceModeSharedSignals
                  : copy.sourceModePlanned}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {module.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{module.tagline}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{module.sourceSummary}</p>
        </div>
        <Building2 className="h-8 w-8 text-slate-500" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {module.metrics.slice(0, 4).map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-white/80 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {metric.label}
            </div>
            <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          {copy.openModuleLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={module.externalUrl}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900"
        >
          {copy.openDivisionAppLabel}
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function NavigationRail({
  nav,
  currentHref,
}: {
  nav: WorkspaceNavSection[];
  currentHref: string;
}) {
  const flatItems = nav.flatMap((section) => section.items);

  return (
    <>
      <aside className="hidden xl:block xl:w-[280px]">
        <div className="sticky top-6 space-y-5">
          {nav.map((section) => (
            <div
              key={section.label}
              className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)]"
            >
              <div className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                {section.label}
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon] || LayoutDashboard;
                  const active = currentHref === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition ${
                        active
                          ? "bg-slate-950 text-white"
                          : "bg-white/80 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="xl:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {flatItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const active = currentHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-white/70 bg-white/85 text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function WorkspaceScreen({
  viewer,
  snapshot,
  nav,
  currentKey,
  currentHref,
  currentDivision,
  workspaceUrl,
  preferredWorkspaceUrl,
  divisionHrefs,
  copy,
}: {
  viewer: WorkspaceViewer;
  snapshot: WorkspaceSnapshot;
  nav: WorkspaceNavSection[];
  currentKey: WorkspaceSectionKey;
  currentHref: string;
  currentDivision?: WorkspaceDivision;
  workspaceUrl: string;
  preferredWorkspaceUrl: string;
  divisionHrefs: Partial<Record<WorkspaceDivision, string>>;
  copy: HubWorkspaceCopy["workspaceScreen"];
}) {
  const selectedModule =
    currentKey === "division" && currentDivision
      ? snapshot.modules.find((module) => module.division === currentDivision) || null
      : null;

  const helperCards = snapshot.insights.slice(0, 4);
  const priorityTasks = snapshot.tasks.slice(0, 8);
  const approvals = snapshot.approvals.slice(0, 12);

  const renderContent = () => {
    if (!viewer.user || snapshot.modules.length === 0) {
      return (
        <EmptyState
          title={copy.accessPendingTitle}
          description={copy.accessPendingDescription}
        />
      );
    }

    switch (currentKey) {
      case "overview":
        return (
          <div className="space-y-8">
            <section className="grid gap-5 lg:grid-cols-4">
              {snapshot.summaryMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    <Bot className="h-4 w-4" />
                    {copy.operationsHelperLabel}
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {copy.operationsHelperTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    {copy.operationsHelperDescription}
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {priorityTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-950">{task.title}</div>
                        <div className="mt-2 text-sm text-slate-600">{task.suggestedAction}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  {snapshot.modules.map((module) => (
                    <ModuleCard
                      key={module.division}
                      module={module}
                      href={divisionHrefs[module.division] || "#"}
                      copy={copy}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {helperCards.length > 0 ? (
                  helperCards.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} copy={copy} />
                  ))
                ) : (
                  <EmptyState
                    title={copy.noHelperSignalsTitle}
                    description={copy.noHelperSignalsDescription}
                  />
                )}
              </div>
            </section>
          </div>
        );

      case "tasks":
        return priorityTasks.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {priorityTasks.map((task) => (
              <TaskCard key={task.id} task={task} copy={copy} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={copy.noActiveTasksTitle}
            description={copy.noActiveTasksDescription}
          />
        );

      case "inbox":
        return snapshot.inbox.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {snapshot.inbox.map((item) => (
              <InboxCard key={item.id} item={item} copy={copy} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={copy.inboxCalmTitle}
            description={copy.inboxCalmDescription}
          />
        );

      case "approvals":
        return approvals.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {approvals.map((task) => (
              <TaskCard key={task.id} task={task} copy={copy} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={copy.noApprovalsTitle}
            description={copy.noApprovalsDescription}
          />
        );

      case "queues":
        return (
          <div className="space-y-8">
            {snapshot.modules.map((module) => (
              <section key={module.division} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {module.label}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                    {module.readiness}
                  </span>
                </div>
                <div className="grid gap-5 xl:grid-cols-3">
                  {module.queueLanes.map((lane) => (
                    <QueueLaneCard key={lane.id} lane={lane} copy={copy} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        );

      case "archive":
        return snapshot.history.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {snapshot.history.map((task) => (
              <TaskCard key={task.id} task={task} copy={copy} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={copy.noHistoryTitle}
            description={copy.noHistoryDescription}
          />
        );

      case "reports":
        return (
          <div className="space-y-8">
            <section className="grid gap-5 xl:grid-cols-3">
              {snapshot.trends.map((trend) => (
                <div
                  key={trend.label}
                  className="rounded-[26px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {trend.label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {trend.current}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {copy.previousWindowLabel} {trend.previous}
                  </div>
                  <div
                    className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      trend.delta > 0
                        ? "bg-amber-100 text-amber-700"
                        : trend.delta < 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {copy.deltaLabel} {trend.delta > 0 ? "+" : ""}
                    {trend.delta}
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              {snapshot.modules.map((module) => (
                <div
                  key={module.division}
                  className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {module.label}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                      {module.readiness}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {module.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {metric.label}
                        </div>
                        <div className="mt-2 text-xl font-semibold text-slate-950">{metric.value}</div>
                        <div className="mt-2 text-sm text-slate-600">{metric.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        );

      case "settings":
        return (
          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                {copy.staffIdentityLabel}
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {viewer.user?.fullName || copy.unnamedStaffAccount}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{viewer.user?.email || copy.noEmailAddress}</p>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span className="font-semibold">{copy.profileRoleLabel}</span>{" "}
                  {viewer.user?.profileRole || copy.notAssigned}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span className="font-semibold">{copy.primaryDivisionLabel}</span>{" "}
                  {viewer.defaultDivision || copy.noPrimaryDivision}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <span className="font-semibold">{copy.currentAccessRouteLabel}</span> {workspaceUrl}
                </div>
                {workspaceUrl !== preferredWorkspaceUrl ? (
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    <span className="font-semibold">{copy.preferredWorkspaceHostLabel}</span> {preferredWorkspaceUrl}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                  {copy.permissionScopeLabel}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {viewer.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  <BookOpenCheck className="h-4 w-4" />
                  {copy.divisionMembershipsLabel}
                </div>
                <div className="mt-5 space-y-3">
                  {viewer.divisions.map((membership) => (
                    <div key={membership.division} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{membership.division}</span>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                          {membership.readiness}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                          {membership.source}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {membership.roles.map((role) => (
                          <span key={role} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "division":
        return selectedModule ? (
          <div className="space-y-8">
            <section className="grid gap-5 lg:grid-cols-4">
              {selectedModule.metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </section>
            <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-5">
                {selectedModule.insights.length > 0 ? (
                  selectedModule.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} copy={copy} />
                  ))
                ) : (
                  <EmptyState
                    title={copy.divisionCalmTitle.replace("{label}", selectedModule.label)}
                    description={copy.divisionCalmDescription}
                  />
                )}
                <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    <Sparkles className="h-4 w-4" />
                    {copy.dataModeLabel}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
                      {selectedModule.readiness}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                      {selectedModule.sourceMode === "structured"
                        ? copy.sourceModeStructured
                        : selectedModule.sourceMode === "shared-signals"
                          ? copy.sourceModeSharedSignals
                          : copy.sourceModePlanned}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{selectedModule.sourceSummary}</p>
                </div>
              </div>
              <div className="space-y-5">
                {selectedModule.tasks.length > 0 ? (
                  <div className="grid gap-5 xl:grid-cols-2">
                    {selectedModule.tasks.map((task) => (
                      <TaskCard key={task.id} task={task} copy={copy} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={copy.noTaskWorkloadTitle}
                    description={copy.noTaskWorkloadDescription}
                  />
                )}
                {selectedModule.approvals.length > 0 ? (
                  <div className="grid gap-5 xl:grid-cols-2">
                    {selectedModule.approvals.map((task) => (
                      <TaskCard key={task.id} task={task} copy={copy} />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
            {selectedModule.queueLanes.length > 0 ? (
              <section className="grid gap-5 xl:grid-cols-3">
                {selectedModule.queueLanes.map((lane) => (
                  <QueueLaneCard key={lane.id} lane={lane} copy={copy} />
                ))}
              </section>
            ) : (
              <EmptyState
                title={copy.noQueueLanesTitle}
                description={copy.noQueueLanesDescription}
              />
            )}
          </div>
        ) : (
          <EmptyState
            title={copy.moduleUnavailableTitle}
            description={copy.moduleUnavailableDescription}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f6f2eb_42%,#f7fafc_100%)] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,124,134,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(176,108,62,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(201,162,39,0.18),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/70 bg-white/55 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <header className="rounded-[30px] bg-slate-950 px-5 py-5 text-white sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
                  <Route className="h-4 w-4" />
                  {copy.headerEyebrow}
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  {getWorkspaceSectionTitle(currentKey, currentDivision)}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
                  {sectionIntro(currentKey, copy, currentDivision)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                    {copy.activeStaffProfileLabel}
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {viewer.user?.fullName || viewer.user?.email || copy.notAssigned}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    {viewer.families.join(" • ") || copy.noWorkspaceFamilies}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                    {copy.helperModeLabel}
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {copy.helperModeValue}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    {copy.helperModeDescription}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6 xl:flex xl:gap-6">
            <NavigationRail nav={nav} currentHref={currentHref} />

            <main className="mt-5 min-w-0 flex-1 xl:mt-0">
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  {copy.badgeLiveSignals}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {copy.badgeSharedAuth}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                  <CircleAlert className="h-3.5 w-3.5" />
                  {copy.badgeRoleModules}
                </div>
                {workspaceUrl !== preferredWorkspaceUrl ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                    <CircleAlert className="h-3.5 w-3.5" />
                    {copy.badgeFallbackRoute}
                  </div>
                ) : null}
              </div>

              {workspaceUrl !== preferredWorkspaceUrl ? (
                <div className="mb-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
                  Shared login now returns to the reachable live deployment at{" "}
                  <span className="font-semibold">{workspaceUrl}</span>{" "}
                  until the preferred workspace host at{" "}
                  <span className="font-semibold">{preferredWorkspaceUrl}</span>{" "}
                  is attached on Vercel.
                </div>
              ) : null}

              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
