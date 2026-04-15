import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Inbox,
  Mail,
  Search,
  UserRound,
} from "lucide-react";
import { StaffEmptyState, StaffMetricCard, StaffPanel, StaffStatusBadge } from "@/components/StaffPrimitives";
import ThreadReadMarker from "@/components/support/ThreadReadMarker";
import SupportThreadActions from "@/components/support/SupportThreadActions";
import {
  STAFF_SUPPORT_MAILBOX_OPTIONS,
  STAFF_SUPPORT_STATUS_OPTIONS,
  type StaffSupportFilters,
  type StaffSupportThread,
} from "@/lib/support-desk";

function buildHref(input: {
  q?: string;
  status?: string;
  mailbox?: string;
  division?: string;
  thread?: string | null;
}) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.mailbox && input.mailbox !== "active") params.set("mailbox", input.mailbox);
  if (input.division && input.division !== "all") params.set("division", input.division);
  if (input.thread) params.set("thread", input.thread);
  const query = params.toString();
  return query ? `/support?${query}` : "/support";
}

function formatRelative(value: string | null) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diff / 6e4));
    return `${minutes}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
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

function statusTone(status: string): "info" | "success" | "warning" | "critical" {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "awaiting_reply" || status === "pending_customer") return "warning";
  if (status === "open") return "critical";
  return "info";
}

function priorityTone(priority: string): "info" | "warning" | "critical" {
  if (priority === "urgent") return "critical";
  if (priority === "high") return "warning";
  return "info";
}

function detailTile(label: string, value: string, note?: string | null) {
  return (
    <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">{value}</div>
      {note ? <div className="mt-1 text-xs text-[var(--staff-muted)]">{note}</div> : null}
    </div>
  );
}

export default function SharedSupportDesk({
  filters,
  divisions,
  metrics,
  threads,
  selectedThreadId,
  viewerId,
}: {
  filters: StaffSupportFilters;
  divisions: Array<{ value: string; label: string }>;
  metrics: {
    active: number;
    unread: number;
    unassigned: number;
    stale: number;
    archived: number;
  };
  threads: StaffSupportThread[];
  selectedThreadId: string;
  viewerId: string;
}) {
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;
  const hasSelection = Boolean(selectedThread);
  const backHref = buildHref({
    q: filters.q,
    status: filters.status,
    mailbox: filters.mailbox,
    division: filters.division,
    thread: null,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StaffMetricCard
          label="Active threads"
          value={String(metrics.active)}
          subtitle="Shared cross-division support queue"
          icon={Inbox}
        />
        <StaffMetricCard
          label="Unread"
          value={String(metrics.unread)}
          subtitle="Customer or system movement not yet acknowledged"
          icon={Mail}
        />
        <StaffMetricCard
          label="Unassigned"
          value={String(metrics.unassigned)}
          subtitle="Needs staff ownership"
          icon={UserRound}
        />
        <StaffMetricCard
          label="Stale"
          value={String(metrics.stale)}
          subtitle="Quiet for 12+ hours"
          icon={AlertTriangle}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STAFF_SUPPORT_MAILBOX_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={buildHref({
              q: filters.q,
              status: filters.status,
              mailbox: option.value,
              division: filters.division,
              thread: null,
            })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filters.mailbox === option.value
                ? "bg-[var(--staff-accent-soft)] text-[var(--staff-accent)]"
                : "border border-[var(--staff-line)] bg-[var(--staff-surface)] text-[var(--staff-muted)] hover:text-[var(--staff-ink)]"
            }`}
          >
            {option.label}
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className={hasSelection ? "hidden space-y-4 lg:block" : "space-y-4"}>
          <StaffPanel>
            <form method="get" className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.75fr))]">
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
                    placeholder="Subject, customer, phone, division"
                    className="h-11 w-full rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] pl-10 pr-3 text-sm text-[var(--staff-ink)] outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="h-11 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 text-sm text-[var(--staff-ink)] outline-none"
                >
                  {STAFF_SUPPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  Mailbox
                </span>
                <select
                  name="mailbox"
                  defaultValue={filters.mailbox}
                  className="h-11 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 text-sm text-[var(--staff-ink)] outline-none"
                >
                  {STAFF_SUPPORT_MAILBOX_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  Division
                </span>
                <select
                  name="division"
                  defaultValue={filters.division}
                  className="h-11 rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 text-sm text-[var(--staff-ink)] outline-none"
                >
                  {divisions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 xl:col-span-4">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-[var(--staff-accent)] px-4 text-sm font-semibold text-white"
                >
                  Apply filters
                </button>
                <Link
                  href="/support"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 text-sm font-semibold text-[var(--staff-ink)]"
                >
                  Clear
                </Link>
              </div>
            </form>
          </StaffPanel>

          <StaffPanel title="Support queue">
            {threads.length === 0 ? (
              <StaffEmptyState
                icon={Inbox}
                title="No support threads matched this view"
                description="Widen the filters or switch to Archive if you are looking for a resolved conversation."
              />
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => {
                  const href = buildHref({
                    q: filters.q,
                    status: filters.status,
                    mailbox: filters.mailbox,
                    division: filters.division,
                    thread: thread.id,
                  });

                  return (
                    <Link
                      key={thread.id}
                      href={href}
                      className={`block rounded-[1.6rem] border px-4 py-4 transition ${
                        selectedThread?.id === thread.id
                          ? "border-[var(--staff-accent)] bg-[var(--staff-accent-soft)]"
                          : "border-[var(--staff-line)] bg-[var(--staff-surface)] hover:border-[var(--staff-accent)]/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {thread.isUnread ? (
                              <Circle className="h-2.5 w-2.5 fill-[var(--staff-accent)] text-[var(--staff-accent)]" />
                            ) : null}
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                              {thread.divisionLabel}
                            </span>
                            <StaffStatusBadge
                              label={thread.status.replaceAll("_", " ")}
                              tone={statusTone(thread.status)}
                            />
                            <StaffStatusBadge
                              label={thread.priority}
                              tone={priorityTone(thread.priority)}
                            />
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">
                            {thread.subject}
                          </p>
                          <p className="mt-1 text-xs text-[var(--staff-muted)]">
                            {thread.customerName}
                            {thread.customerPhone ? ` • ${thread.customerPhone}` : ""}
                            {thread.assignedToName ? ` • ${thread.assignedToName}` : " • Unassigned"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs text-[var(--staff-muted)]">
                            {formatRelative(thread.updatedAt)}
                          </p>
                          <ArrowRight className="mt-1 ml-auto h-3.5 w-3.5 text-[var(--staff-muted)]" />
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[var(--staff-muted)]">
                        {thread.lastMessagePreview}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                        <span className="rounded-full bg-[var(--staff-surface)] px-2.5 py-1 text-[var(--staff-muted)] ring-1 ring-[var(--staff-line)]">
                          {thread.unreadCount} unread
                        </span>
                        <span className="rounded-full bg-[var(--staff-surface)] px-2.5 py-1 text-[var(--staff-muted)] ring-1 ring-[var(--staff-line)]">
                          {thread.category}
                        </span>
                        {thread.isStale ? (
                          <span className="rounded-full bg-[var(--staff-warning-soft)] px-2.5 py-1 text-[var(--staff-warning)]">
                            stale
                          </span>
                        ) : null}
                        {thread.needsReply ? (
                          <span className="rounded-full bg-[var(--staff-info-soft)] px-2.5 py-1 text-[var(--staff-info)]">
                            customer waiting
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </StaffPanel>
        </div>

        <div className={hasSelection ? "block" : "hidden lg:block"}>
          <StaffPanel className="space-y-5">
            {selectedThread ? (
              <>
                <ThreadReadMarker threadId={selectedThread.id} enabled={selectedThread.isUnread} />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                      Thread detail
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[var(--staff-ink)]">
                      {selectedThread.subject}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--staff-muted)]">
                      {selectedThread.customerName}
                      {selectedThread.customerEmail ? ` • ${selectedThread.customerEmail}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StaffStatusBadge
                      label={selectedThread.status.replaceAll("_", " ")}
                      tone={statusTone(selectedThread.status)}
                    />
                    <StaffStatusBadge
                      label={selectedThread.priority}
                      tone={priorityTone(selectedThread.priority)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {detailTile("Division", selectedThread.divisionLabel, selectedThread.category)}
                  {detailTile(
                    "Assigned to",
                    selectedThread.assignedToName || "Unassigned",
                    selectedThread.assignedToRole || "No owner yet"
                  )}
                  {detailTile(
                    "Unread state",
                    selectedThread.isUnread ? "Unread" : "Read",
                    selectedThread.isUnread
                      ? `${selectedThread.unreadCount} incoming update(s)`
                      : `Last viewed ${formatRelative(selectedThread.staffLastReadAt)}`
                  )}
                  {detailTile("Latest activity", formatDateTime(selectedThread.updatedAt), formatRelative(selectedThread.updatedAt))}
                  {detailTile(
                    "Customer read",
                    formatDateTime(selectedThread.customerLastReadAt),
                    selectedThread.customerLastReadAt ? formatRelative(selectedThread.customerLastReadAt) : "Not recorded yet"
                  )}
                  {detailTile(
                    "Stale pressure",
                    selectedThread.isStale ? "Needs a move" : "Within active window",
                    selectedThread.isStale ? "Quiet for 12+ hours" : "Recently updated"
                  )}
                </div>

                <div className="rounded-[1.6rem] border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--staff-ink)]">
                      <Mail className="h-4 w-4 text-[var(--staff-accent)]" />
                      {selectedThread.customerEmail || "No customer email available"}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--staff-ink)]">
                      <Clock3 className="h-4 w-4 text-[var(--staff-accent)]" />
                      Opened {formatDateTime(selectedThread.createdAt)}
                    </div>
                  </div>
                </div>

                <SupportThreadActions
                  key={selectedThread.id}
                  threadId={selectedThread.id}
                  assignedToId={selectedThread.assignedToId}
                  viewerId={viewerId}
                  priority={selectedThread.priority}
                  status={selectedThread.status}
                />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--staff-accent)]">
                    <Inbox className="h-4 w-4" />
                    Conversation timeline
                  </div>

                  <div className="space-y-3">
                    {selectedThread.messages.map((message) => (
                      <article
                        key={message.id}
                        className={`rounded-[1.5rem] border px-4 py-4 ${
                          message.senderType === "agent"
                            ? "border-[var(--staff-info)]/20 bg-[var(--staff-info-soft)]"
                            : message.senderType === "system"
                              ? "border-[var(--staff-line)] bg-[var(--staff-surface)]"
                              : "border-[var(--staff-warning)]/25 bg-[var(--staff-warning-soft)]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--staff-ink)]">
                              {message.senderLabel}
                            </p>
                            <p className="mt-1 text-xs text-[var(--staff-muted)]">
                              {formatDateTime(message.createdAt)}
                            </p>
                          </div>

                          <StaffStatusBadge
                            label={message.senderType}
                            tone={
                              message.senderType === "agent"
                                ? "info"
                                : message.senderType === "system"
                                  ? "success"
                                  : "warning"
                            }
                          />
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--staff-ink)]">
                          {message.body}
                        </p>

                        {message.attachments.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.attachments.map((attachment) =>
                              attachment.url ? (
                                <a
                                  key={`${message.id}-${attachment.name}`}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-[var(--staff-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--staff-ink)]"
                                >
                                  {attachment.name}
                                </a>
                              ) : (
                                <span
                                  key={`${message.id}-${attachment.name}`}
                                  className="rounded-full border border-[var(--staff-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--staff-muted)]"
                                >
                                  {attachment.name}
                                </span>
                              )
                            )}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16">
                <StaffEmptyState
                  icon={CheckCircle2}
                  title="Choose a support thread"
                  description="Select a conversation from the queue to claim ownership, reply, escalate, or resolve it from Staff HQ."
                />
              </div>
            )}
          </StaffPanel>
        </div>
      </div>
    </div>
  );
}
