import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Inbox,
  Search,
} from "lucide-react";
import {
  StaffEmptyState,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import type {
  WorkspaceInsight,
  WorkspaceListFilters,
  WorkspaceMetric,
  WorkspaceQueueOption,
  WorkspaceRecord,
} from "@/lib/types";

function buildHref(basePath: string, input: Partial<WorkspaceListFilters>) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.queue && input.queue !== "all") params.set("queue", input.queue);
  if (input.record) params.set("record", input.record);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function formatRelative(value: string | null) {
  if (!value) return "No recent movement";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 36e5);

  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diff / 6e4));
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function metricToneClasses(tone?: WorkspaceMetric["tone"]) {
  if (tone === "critical") {
    return "border-[var(--staff-critical)]/25 bg-[var(--staff-critical-soft)]";
  }
  if (tone === "warning") {
    return "border-[var(--staff-warning)]/25 bg-[var(--staff-warning-soft)]";
  }
  if (tone === "success") {
    return "border-[var(--staff-success)]/25 bg-[var(--staff-success-soft)]";
  }
  if (tone === "info") {
    return "border-[var(--staff-info)]/25 bg-[var(--staff-info-soft)]";
  }
  return "border-[var(--staff-line)] bg-[var(--staff-surface)]";
}

function actionClasses(tone: WorkspaceRecord["actions"][number]["tone"]) {
  if (tone === "primary") {
    return "bg-[var(--staff-accent)] text-white";
  }
  if (tone === "critical") {
    return "bg-[var(--staff-critical)] text-white";
  }
  if (tone === "warning") {
    return "bg-[var(--staff-warning)] text-[var(--staff-ink)]";
  }
  return "border border-[var(--staff-line)] bg-white text-[var(--staff-ink)]";
}

export default function OperationalWorkspace({
  basePath,
  filters,
  queues,
  metrics,
  insights,
  records,
  selectedRecordId,
  emptyTitle,
  emptyDescription,
  focusNote,
}: {
  basePath: string;
  filters: WorkspaceListFilters;
  queues: WorkspaceQueueOption[];
  metrics: WorkspaceMetric[];
  insights: WorkspaceInsight[];
  records: WorkspaceRecord[];
  selectedRecordId: string;
  emptyTitle: string;
  emptyDescription: string;
  focusNote?: string;
}) {
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? null;
  const hasSelection = Boolean(selectedRecord);
  const backHref = buildHref(basePath, {
    q: filters.q,
    queue: filters.queue,
    record: "",
  });

  return (
    <div className="space-y-6">
      {metrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={`${metric.label}:${metric.value}`}
              className={`rounded-[1.8rem] border px-5 py-4 ${metricToneClasses(metric.tone)}`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                {metric.label}
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--staff-ink)]">
                {metric.value}
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--staff-muted)]">{metric.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      {focusNote ? (
        <div className="rounded-[1.8rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Operational focus
          </div>
          <p className="mt-2 text-sm leading-7 text-[var(--staff-muted)]">{focusNote}</p>
        </div>
      ) : null}

      {insights.length > 0 ? (
        <StaffPanel title="Live oversight">
          <div className="grid gap-3 xl:grid-cols-2">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-[1.5rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--staff-ink)]">
                    {insight.title}
                  </div>
                  <StaffStatusBadge label={insight.tone} tone={insight.tone} />
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--staff-muted)]">
                  {insight.summary}
                </p>
                {insight.evidence.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {insight.evidence.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--staff-line)] bg-white px-3 py-1 text-xs text-[var(--staff-muted)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
                {insight.href ? (
                  <Link
                    href={insight.href}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--staff-accent)]"
                  >
                    Open workflow
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </StaffPanel>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {queues.map((queue) => (
          <Link
            key={queue.value}
            href={buildHref(basePath, {
              q: filters.q,
              queue: queue.value,
              record: "",
            })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filters.queue === queue.value
                ? "bg-[var(--staff-accent-soft)] text-[var(--staff-accent)]"
                : "border border-[var(--staff-line)] bg-[var(--staff-surface)] text-[var(--staff-muted)] hover:text-[var(--staff-ink)]"
            }`}
          >
            {queue.label}{" "}
            <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">
              {queue.count}
            </span>
          </Link>
        ))}
      </div>

      {hasSelection ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--staff-ink)] lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <div className={hasSelection ? "hidden space-y-4 lg:block" : "space-y-4"}>
          <StaffPanel>
            <form method="get" className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto]">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  Search
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--staff-muted)]" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Queue item, reason, status, owner"
                    className="h-11 w-full rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] pl-10 pr-3 text-sm text-[var(--staff-ink)] outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  Queue
                </span>
                <select
                  name="queue"
                  defaultValue={filters.queue}
                  className="h-11 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 text-sm text-[var(--staff-ink)] outline-none"
                >
                  {queues.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 xl:self-end">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-[var(--staff-accent)] px-4 text-sm font-semibold text-white"
                >
                  Apply filters
                </button>
                <Link
                  href={basePath}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 text-sm font-semibold text-[var(--staff-ink)]"
                >
                  Clear
                </Link>
              </div>
            </form>
          </StaffPanel>

          <StaffPanel title="Queue detail">
            {records.length === 0 ? (
              <StaffEmptyState
                icon={Inbox}
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <Link
                    key={record.id}
                    href={buildHref(basePath, {
                      q: filters.q,
                      queue: filters.queue,
                      record: record.id,
                    })}
                    className={`block rounded-[1.6rem] border px-4 py-4 transition ${
                      selectedRecord?.id === record.id
                        ? "border-[var(--staff-accent)] bg-[var(--staff-accent-soft)]"
                        : "border-[var(--staff-line)] bg-[var(--staff-surface)] hover:border-[var(--staff-accent)]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                            {record.queueLabel}
                          </span>
                          <StaffStatusBadge
                            label={record.statusLabel}
                            tone={record.statusTone}
                          />
                          <StaffStatusBadge
                            label={record.priorityLabel}
                            tone={record.priorityTone}
                          />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">
                          {record.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--staff-muted)]">
                          {record.summary}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--staff-muted)]">
                          <span>{record.division}</span>
                          {record.ownerLabel ? <span>Owner: {record.ownerLabel}</span> : null}
                          {record.amountLabel ? <span>{record.amountLabel}</span> : null}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-[var(--staff-muted)]">
                          {formatRelative(record.updatedAt)}
                        </p>
                        <ArrowRight className="mt-1 ml-auto h-3.5 w-3.5 text-[var(--staff-muted)]" />
                      </div>
                    </div>

                    {record.evidence.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {record.evidence.slice(0, 2).map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[var(--staff-muted)] ring-1 ring-[var(--staff-line)]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </StaffPanel>
        </div>

        <div className={hasSelection ? "block" : "hidden lg:block"}>
          <StaffPanel className="space-y-5">
            {selectedRecord ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                      Selected record
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[var(--staff-ink)]">
                      {selectedRecord.title}
                    </h2>
                    <p className="mt-1 text-sm leading-7 text-[var(--staff-muted)]">
                      {selectedRecord.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StaffStatusBadge
                      label={selectedRecord.statusLabel}
                      tone={selectedRecord.statusTone}
                    />
                    <StaffStatusBadge
                      label={selectedRecord.priorityLabel}
                      tone={selectedRecord.priorityTone}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {selectedRecord.details.map((detail) => (
                    <div
                      key={`${detail.label}:${detail.value}`}
                      className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                        {detail.label}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">
                        {detail.value}
                      </div>
                      {detail.note ? (
                        <div className="mt-1 text-xs text-[var(--staff-muted)]">
                          {detail.note}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.6rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                        Source workflow
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">
                        {selectedRecord.sourceLabel}
                      </div>
                      <div className="mt-1 text-xs text-[var(--staff-muted)]">
                        Updated {formatDateTime(selectedRecord.updatedAt)}
                      </div>
                    </div>
                    <a
                      href={selectedRecord.sourceHref}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--staff-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--staff-ink)]"
                    >
                      Open source workflow
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {selectedRecord.actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.actions.map((action) => (
                      <a
                        key={`${action.label}:${action.href}`}
                        href={action.href}
                        target={action.external ? "_blank" : undefined}
                        rel={action.external ? "noreferrer" : undefined}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${actionClasses(
                          action.tone
                        )}`}
                      >
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                ) : null}

                {selectedRecord.evidence.length > 0 ? (
                  <div className="rounded-[1.6rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                      <AlertTriangle className="h-4 w-4" />
                      Evidence and pressure
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedRecord.evidence.map((item) => (
                        <p key={item} className="text-sm leading-7 text-[var(--staff-muted)]">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedRecord.notes.length > 0 ? (
                  <div className="rounded-[1.6rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                      Notes and handoff
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedRecord.notes.map((item) => (
                        <p key={item} className="text-sm leading-7 text-[var(--staff-muted)]">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="py-16">
                <StaffEmptyState
                  icon={Inbox}
                  title="Choose a record"
                  description="Select a live queue item to inspect the context, pressure signals, and exact workflow actions."
                />
              </div>
            )}
          </StaffPanel>
        </div>
      </div>
    </div>
  );
}
