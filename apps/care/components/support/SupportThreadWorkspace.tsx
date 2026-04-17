import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Inbox,
  Mail,
  MessageSquareText,
  Paperclip,
  Phone,
  Search,
  Send,
  Timer,
  UserCog,
} from "lucide-react";
import ThreadQuickActions from "@/components/support/ThreadQuickActions";
import ThreadReadMarker from "@/components/support/ThreadReadMarker";
import {
  WorkspaceEmptyState,
  WorkspaceInfoTile,
} from "@/components/dashboard/WorkspacePrimitives";
import type { SupportAgent, SupportThread, SupportTimelineEntry } from "@/lib/support/data";
import {
  SUPPORT_THREAD_STATUSES,
  formatSupportContactMethodLabel,
  formatSupportServiceCategoryLabel,
  formatSupportThreadStatusLabel,
  formatSupportUrgencyLabel,
} from "@/lib/support/shared";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function staleDuration(lastActivityAt?: string | null) {
  if (!lastActivityAt) return null;
  const diff = Date.now() - new Date(lastActivityAt).getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 12) return null;
  if (hours < 24) return `${hours}h without reply`;
  return `${Math.floor(hours / 24)}d without reply`;
}

function formatDateTime(value?: string | null) {
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

function formatRelative(value?: string | null) {
  if (!value) return "No activity yet";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return formatDateTime(value);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `${minutes}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function statusClasses(status?: string | null) {
  const key = String(status || "").toLowerCase();

  if (key === "resolved" || key === "approved" || key === "sent" || key === "paid") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }

  if (key === "rejected" || key === "failed") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }

  if (key === "pending_customer" || key === "receipt_submitted") {
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  }

  if (
    key === "open" ||
    key === "new" ||
    key === "pending" ||
    key === "queued" ||
    key === "awaiting_receipt" ||
    key === "under_review" ||
    key === "awaiting_corrected_proof"
  ) {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }

  return "border-black/10 bg-black/[0.03] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/72";
}

function urgencyClasses(urgency?: string | null) {
  const key = String(urgency || "").toLowerCase();
  if (key === "urgent") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }
  if (key === "priority") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }
  return "border-black/10 bg-black/[0.03] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/72";
}

function buildHref(input: {
  basePath: string;
  q?: string | null;
  status?: string | null;
  assignee?: string | null;
  mailbox?: string | null;
  thread?: string | null;
}) {
  const params = new URLSearchParams();

  if (input.q) params.set("q", input.q);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.assignee && input.assignee !== "all") params.set("assignee", input.assignee);
  if (input.mailbox && input.mailbox !== "all") params.set("mailbox", input.mailbox);
  if (input.thread) params.set("thread", input.thread);

  const query = params.toString();
  return query ? `${input.basePath}?${query}` : input.basePath;
}

function isImageAttachment(
  attachment: NonNullable<NonNullable<SupportTimelineEntry["inboundEmail"]>["attachments"]>[number]
) {
  return String(attachment.mimeType || "").startsWith("image/");
}

import { formatMoney } from "@/lib/format";

function labelText(value?: string | null, fallback = "—") {
  const normalized = String(value || "")
    .trim()
    .replaceAll("_", " ");

  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function TimelineEntryCard({ entry }: { entry: SupportTimelineEntry }) {
  return (
    <article className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-zinc-950 dark:text-white">{entry.title}</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
            {entry.actorName || "System"}
            {entry.actorRole ? ` • ${entry.actorRole}` : ""} • {formatDateTime(entry.createdAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {entry.emailStatus ? (
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(entry.emailStatus)}`}
            >
              Email {entry.emailStatus}
            </span>
          ) : null}
          {entry.whatsappStatus ? (
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(entry.whatsappStatus)}`}
            >
              WhatsApp {entry.whatsappStatus}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-white/66">
        {entry.body}
      </p>

      {entry.inboundEmail ? (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <WorkspaceInfoTile label="Email subject" value={entry.inboundEmail.subject || "No subject"} />
            <WorkspaceInfoTile label="Sender" value={entry.inboundEmail.sender || "Unknown sender"} />
            <WorkspaceInfoTile
              label="Received"
              value={formatDateTime(entry.inboundEmail.receivedAt)}
            />
            <WorkspaceInfoTile
              label="Recipients"
              value={
                entry.inboundEmail.recipients.length > 0
                  ? entry.inboundEmail.recipients.join(", ")
                  : "Inbox only"
              }
            />
          </div>

          {entry.inboundEmail.preview ? (
            <div className="rounded-[1.3rem] border border-black/10 bg-white/75 px-4 py-3 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/66">
              {entry.inboundEmail.preview}
            </div>
          ) : null}

          {entry.inboundEmail.attachments.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {entry.inboundEmail.attachments.map((attachment, index) => (
                <div
                  key={`${entry.id}-${attachment.fileName || attachment.url || index}`}
                  className="overflow-hidden rounded-[1.3rem] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  {isImageAttachment(attachment) && attachment.url ? (
                    <Image
                      src={attachment.url}
                      alt={attachment.fileName || "Inbound attachment"}
                      width={840}
                      height={520}
                      unoptimized
                      className="h-36 w-full rounded-[1rem] object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-[1rem] border border-dashed border-black/10 bg-black/[0.03] text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
                      <Paperclip className="mr-2 h-4 w-4" />
                      {attachment.mimeType === "application/pdf" ? "PDF attachment" : "Attachment"}
                    </div>
                  )}

                  <div className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
                    {attachment.fileName || "Attachment"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                    {attachment.mimeType || "Unknown type"}
                  </div>

                  {attachment.url ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                    >
                      Open attachment
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {entry.whatsappReason ? (
        <div className="mt-3 rounded-[1.2rem] border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-700 dark:text-amber-100">
          WhatsApp detail: {entry.whatsappReason}
        </div>
      ) : null}
    </article>
  );
}

export default function SupportThreadWorkspace({
  title,
  subtitle,
  basePath,
  threads,
  agents,
  selectedThreadId,
  q,
  status,
  assignee,
  mailbox,
  whatsappConfigured,
  whatsappReason,
  allowStatusFilter = true,
  emptyTitle,
  emptyText,
}: {
  title: string;
  subtitle: string;
  basePath: string;
  threads: SupportThread[];
  agents: SupportAgent[];
  selectedThreadId?: string | null;
  q?: string;
  status?: string;
  assignee?: string;
  mailbox?: string;
  whatsappConfigured: boolean;
  whatsappReason: string;
  allowStatusFilter?: boolean;
  emptyTitle: string;
  emptyText: string;
}) {
  const selectedThread =
    threads.find((thread) => thread.threadId === selectedThreadId) ?? null;
  const hasSelection = Boolean(selectedThread);
  const staleCount = threads.filter((thread) => thread.isStale).length;
  const urgentCount = threads.filter((thread) => thread.urgency === "urgent").length;
  const unassignedCount = threads.filter((thread) => !thread.assignedTo?.userId).length;
  const unreadCount = threads.filter((thread) => !thread.isRead).length;
  const unrepliedCount = threads.filter((thread) => thread.replyCount === 0).length;

  const backHref = buildHref({
    basePath,
    q,
    status: allowStatusFilter ? status || "all" : null,
    assignee: assignee || "all",
    mailbox: mailbox || "all",
    thread: null,
  });

  const inputCls =
    "h-11 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            <Inbox className="h-3.5 w-3.5" />
            Support workflow
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 hidden text-sm text-zinc-500 dark:text-white/50 sm:block">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            {threads.length} threads
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            {unreadCount} unread
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            {unrepliedCount} pending reply
          </span>
          {urgentCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-100">
              {urgentCount} urgent
            </span>
          ) : null}
          {staleCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-100">
              <Timer className="h-3 w-3" />
              {staleCount} stale
            </span>
          ) : null}
          {unassignedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-100">
              {unassignedCount} unassigned
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/support/inbox"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition",
            basePath === "/support/inbox"
              ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
              : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          )}
        >
          <Inbox className="h-3.5 w-3.5" />
          Inbox
        </Link>
        <Link
          href="/support/outbox"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition",
            basePath === "/support/outbox"
              ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
              : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          )}
        >
          <Send className="h-3.5 w-3.5" />
          Outbox
        </Link>
        <Link
          href="/support/archive"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition",
            basePath === "/support/archive"
              ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
              : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          )}
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </Link>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold",
            whatsappConfigured
              ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
              : "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
          )}
        >
          {whatsappConfigured ? "WhatsApp live" : "WhatsApp diagnostics"}
        </span>
        {!whatsappConfigured ? (
          <span className="text-xs text-zinc-500 dark:text-white/45">{whatsappReason}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Unread", value: "unread", count: unreadCount },
          { label: "Read", value: "read" },
          { label: "Unreplied", value: "unreplied", count: unrepliedCount },
          { label: "Replied", value: "replied" },
          { label: "Stale", value: "stale", count: staleCount },
        ].map((item) => (
          <Link
            key={item.value}
            href={buildHref({
              basePath,
              q,
              status: allowStatusFilter ? status || "all" : null,
              assignee: assignee || "all",
              mailbox: item.value,
              thread: null,
            })}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              (mailbox || "all") === item.value
                ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                : "border-black/10 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] dark:bg-white/10">
                {item.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {/* Mobile back button - visible only when a thread is selected on small screens */}
      {hasSelection ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to conversations
        </Link>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Left column: Filters + Thread List (hidden on mobile when thread is selected) */}
        <div className={cn(
          "space-y-4",
          hasSelection ? "hidden lg:block" : "block"
        )}>
          {/* Compact inline filter bar */}
          <form
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Search
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Customer, subject, code..."
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
              </label>
            </div>

            {allowStatusFilter ? (
              <label className="grid gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Status
                </span>
                <select name="status" defaultValue={status || "all"} className={inputCls}>
                  <option value="all">All</option>
                  {SUPPORT_THREAD_STATUSES.filter((item) => item !== "resolved").map((item) => (
                    <option key={item} value={item}>
                      {formatSupportThreadStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="grid gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Assignee
              </span>
              <select name="assignee" defaultValue={assignee || "all"} className={inputCls}>
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Mailbox
              </span>
              <select name="mailbox" defaultValue={mailbox || "all"} className={inputCls}>
                <option value="all">All conversations</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="unreplied">Unreplied</option>
                <option value="replied">Replied</option>
                <option value="stale">Stale</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-11 rounded-xl bg-[color:var(--accent)] px-4 text-sm font-semibold text-[#07111F] transition hover:brightness-110"
              >
                Filter
              </button>
              <Link
                href={basePath}
                className="inline-flex h-11 items-center rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
              >
                Clear
              </Link>
            </div>
          </form>

          {/* Thread list */}
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="max-h-[calc(100vh-16rem)] divide-y divide-black/[0.06] overflow-y-auto dark:divide-white/[0.06]">
              {threads.length > 0 ? (
                threads.map((thread) => {
                  const active = selectedThread?.threadId === thread.threadId;
                  const href = buildHref({
                    basePath,
                    q,
                    status: allowStatusFilter ? status || "all" : null,
                    assignee: assignee || "all",
                    mailbox: mailbox || "all",
                    thread: thread.threadId,
                  });
                  const staleLabel = staleDuration(thread.lastActivityAt);

                  return (
                    <Link
                      key={thread.threadId}
                      href={href}
                      className={cn(
                        "block px-5 py-4 transition-colors",
                        active
                          ? "bg-[color:var(--accent)]/[0.08] dark:bg-[color:var(--accent)]/[0.12]"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!thread.isRead ? (
                              <Circle className="h-2.5 w-2.5 fill-[color:var(--accent)] text-[color:var(--accent)]" />
                            ) : null}
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                              {thread.threadRef}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClasses(thread.status)}`}
                            >
                              {formatSupportThreadStatusLabel(thread.status)}
                            </span>
                          </div>
                          <div className="mt-1.5 truncate text-[15px] font-semibold leading-snug text-zinc-950 dark:text-white">
                            {thread.subject}
                          </div>
                          <div className="mt-0.5 truncate text-sm text-zinc-500 dark:text-white/48">
                            {thread.customerName}
                            {thread.customerEmail ? ` — ${thread.customerEmail}` : ""}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-zinc-500 dark:text-white/45">
                            {formatRelative(thread.lastActivityAt)}
                          </div>
                          <ArrowRight className="mt-1 ml-auto h-3.5 w-3.5 text-zinc-400 dark:text-white/30" />
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-white/56">
                        {thread.lastPreview || thread.initialMessage}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            thread.isRead
                              ? "border-black/10 bg-black/[0.03] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                              : "border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                          )}
                        >
                          {thread.isRead ? "Read" : "Unread"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            thread.replyCount > 0
                              ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                              : "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                          )}
                        >
                          {thread.replyCount > 0 ? "Replied" : "Needs reply"}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${urgencyClasses(thread.urgency)}`}
                        >
                          {formatSupportUrgencyLabel(thread.urgency)}
                        </span>
                        {thread.isStale ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700 dark:text-red-100">
                            <Timer className="h-2.5 w-2.5" />
                            {staleLabel || "Stale"}
                          </span>
                        ) : null}
                        {thread.trackingCode ? (
                          <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                            {thread.trackingCode}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                          {thread.replyCount} repl{thread.replyCount === 1 ? "y" : "ies"}
                        </span>
                        <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                          {thread.assignedTo?.fullName || "Unassigned"}
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="px-5 py-10">
                  <WorkspaceEmptyState title={emptyTitle} text={emptyText} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Thread detail (hidden on mobile when no thread selected) */}
        <div className={cn(
          hasSelection ? "block" : "hidden lg:block"
        )}>
          <div className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
            {selectedThread ? (
              <div className="space-y-6">
                <ThreadReadMarker threadId={selectedThread.threadId} enabled={!selectedThread.isRead} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Thread detail
                    </div>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-2xl">
                      {selectedThread.customerName}
                    </h3>
                    <p className="mt-1.5 text-sm leading-7 text-zinc-600 dark:text-white/64">
                      {selectedThread.subject}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(selectedThread.status)}`}
                    >
                      {formatSupportThreadStatusLabel(selectedThread.status)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${urgencyClasses(selectedThread.urgency)}`}
                    >
                      {formatSupportUrgencyLabel(selectedThread.urgency)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Contact preference" value={formatSupportContactMethodLabel(selectedThread.preferredContactMethod)} />
                  <WorkspaceInfoTile label="Service category" value={formatSupportServiceCategoryLabel(selectedThread.serviceCategory)} />
                  <WorkspaceInfoTile label="Tracking code" value={selectedThread.trackingCode || "Not linked"} />
                  <WorkspaceInfoTile label="Assigned to" value={selectedThread.assignedTo?.fullName || "Not assigned"} note={selectedThread.assignedTo?.role || "Needs routing"} />
                  <WorkspaceInfoTile label="First received" value={formatDateTime(selectedThread.createdAt)} />
                  <WorkspaceInfoTile label="Latest activity" value={formatDateTime(selectedThread.lastActivityAt)} note={formatRelative(selectedThread.lastActivityAt)} />
                  <WorkspaceInfoTile
                    label="Mailbox state"
                    value={selectedThread.isRead ? "Read" : "Unread"}
                    note={
                      selectedThread.isRead
                        ? `Last viewed ${formatRelative(selectedThread.lastViewedAt)}`
                        : "A customer update still needs acknowledgement."
                    }
                  />
                  <WorkspaceInfoTile
                    label="Customer update"
                    value={formatDateTime(selectedThread.lastCustomerActivityAt)}
                    note={
                      selectedThread.lastCustomerActivityAt
                        ? formatRelative(selectedThread.lastCustomerActivityAt)
                        : "No customer reply after the opening message."
                    }
                  />
                  <WorkspaceInfoTile
                    label="SLA pressure"
                    value={selectedThread.isStale ? "Needs a move now" : "Within active window"}
                    note={selectedThread.isStale ? staleDuration(selectedThread.lastActivityAt) || "Stale for 12+ hours" : "Within the expected response window."}
                  />
                  <WorkspaceInfoTile
                    label="Email delivery"
                    value={selectedThread.latestEmailStatus || "No email sent yet"}
                    note="Latest outbound delivery state."
                  />
                  <WorkspaceInfoTile
                    label="WhatsApp delivery"
                    value={selectedThread.latestWhatsAppStatus || "No attempt yet"}
                    note={selectedThread.latestWhatsAppReason || "No provider detail recorded."}
                  />
                </div>

                {selectedThread.bookingContext ? (
                  <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      <CheckCircle2 className="h-4 w-4" />
                      Linked booking and payment context
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <WorkspaceInfoTile
                        label="Booking status"
                        value={labelText(selectedThread.bookingContext.bookingStatus)}
                      />
                      <WorkspaceInfoTile
                        label="Service type"
                        value={labelText(selectedThread.bookingContext.serviceType)}
                      />
                      <WorkspaceInfoTile
                        label="Payment status"
                        value={labelText(selectedThread.bookingContext.paymentStatus)}
                      />
                      <WorkspaceInfoTile
                        label="Balance due"
                        value={formatMoney(selectedThread.bookingContext.balanceDue)}
                        note={
                          selectedThread.bookingContext.latestPaymentRequestStatus
                            ? `Latest request ${labelText(selectedThread.bookingContext.latestPaymentRequestStatus)}`
                            : "No recent payment request on record."
                        }
                      />
                      <WorkspaceInfoTile
                        label="Pickup date"
                        value={selectedThread.bookingContext.pickupDate || "Not scheduled"}
                      />
                      <WorkspaceInfoTile
                        label="Pickup window"
                        value={selectedThread.bookingContext.pickupSlot || "Not set"}
                      />
                      <WorkspaceInfoTile
                        label="Tracking reference"
                        value={selectedThread.bookingContext.trackingCode}
                      />
                      <WorkspaceInfoTile
                        label="Booking updated"
                        value={formatDateTime(selectedThread.bookingContext.updatedAt)}
                        note={
                          selectedThread.bookingContext.latestPaymentRequestCreatedAt
                            ? `Payment request ${formatRelative(selectedThread.bookingContext.latestPaymentRequestCreatedAt)}`
                            : "No recent payment request timestamp."
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {/* Customer contact + original message */}
                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                      <Mail className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                      {selectedThread.customerEmail || "No email"}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                      <Phone className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                      {selectedThread.customerPhone || "No phone"}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                      <Clock3 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                      {selectedThread.noteCount} note{selectedThread.noteCount === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-black/10 bg-white/75 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/68">
                    {selectedThread.initialMessage}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/support/inbox/reply?thread=${selectedThread.threadId}`}
                    className="care-button-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                  >
                    <Send className="h-4 w-4" />
                    Reply
                  </Link>
                  <Link
                    href={`/support/inbox/assign?thread=${selectedThread.threadId}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  >
                    <UserCog className="h-4 w-4" />
                    Assign
                  </Link>
                  <ThreadQuickActions threadId={selectedThread.threadId} currentStatus={selectedThread.status} statuses={SUPPORT_THREAD_STATUSES} />
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    <MessageSquareText className="h-4 w-4" />
                    Conversation timeline ({selectedThread.timeline.length})
                  </div>

                  <div className="max-h-[42rem] space-y-3 overflow-y-auto pr-1">
                    {selectedThread.timeline.length > 0 ? (
                      selectedThread.timeline.map((entry) => (
                        <TimelineEntryCard key={entry.id} entry={entry} />
                      ))
                    ) : (
                      <WorkspaceEmptyState
                        title="No timeline events yet"
                        text="New replies, notes, assignments, and status changes will appear here."
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center">
                <WorkspaceEmptyState
                  title="Choose a conversation"
                  text="Select a thread from the list to review the full customer history and take action."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
