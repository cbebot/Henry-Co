import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Send } from "lucide-react";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { getSupportThreads } from "@/lib/support/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Outbox | Henry & Co. Fabric Care",
  description: "View sent replies and outbound communication history.",
};

function formatRelative(value?: string | null) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return value;
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
  if (key === "resolved" || key === "sent") return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  if (key === "failed") return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
}

export default async function SupportOutboxPage() {
  await requireRoles(["owner", "manager", "support"]);
  await logProtectedPageAccess("/support/outbox");

  const threads = await getSupportThreads({ limit: 300 });

  // Filter to only threads that have at least one outbound reply
  const repliedThreads = threads.filter((t) => t.replyCount > 0);

  // Build outbound entries from thread timelines
  const outboundMessages = repliedThreads.flatMap((thread) =>
    thread.timeline
      .filter((entry) => entry.emailStatus || entry.whatsappStatus)
      .map((entry) => ({
        threadId: thread.threadId,
        threadRef: thread.threadRef,
        customerName: thread.customerName,
        customerEmail: thread.customerEmail,
        subject: thread.subject,
        status: thread.status,
        urgency: thread.urgency,
        entryId: entry.id,
        title: entry.title,
        body: entry.body,
        createdAt: entry.createdAt,
        actorName: entry.actorName,
        emailStatus: entry.emailStatus,
        whatsappStatus: entry.whatsappStatus,
        whatsappReason: entry.whatsappReason,
      }))
  );

  // Sort by most recent first
  outboundMessages.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            <Send className="h-3.5 w-3.5" />
            Sent messages
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-3xl">
            Outbox
          </h2>
          <p className="mt-1 hidden text-sm text-zinc-500 dark:text-white/50 sm:block">
            All outbound replies, channel delivery status, and communication outcomes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            {outboundMessages.length} sent
          </span>
          <Link
            href="/support/inbox"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          >
            <Inbox className="h-3 w-3" />
            Inbox
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="max-h-[calc(100vh-14rem)] divide-y divide-black/[0.06] overflow-y-auto dark:divide-white/[0.06]">
          {outboundMessages.length > 0 ? (
            outboundMessages.map((msg) => (
              <Link
                key={msg.entryId}
                href={`/support/inbox?thread=${msg.threadId}`}
                className="block px-5 py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                        {msg.threadRef}
                      </span>
                      {msg.emailStatus ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClasses(msg.emailStatus)}`}>
                          Email {msg.emailStatus}
                        </span>
                      ) : null}
                      {msg.whatsappStatus ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClasses(msg.whatsappStatus)}`}>
                          WA {msg.whatsappStatus}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 truncate text-[15px] font-semibold leading-snug text-zinc-950 dark:text-white">
                      To: {msg.customerName}
                      {msg.customerEmail ? ` (${msg.customerEmail})` : ""}
                    </div>
                    <div className="mt-0.5 truncate text-sm text-zinc-500 dark:text-white/48">
                      {msg.subject}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-zinc-500 dark:text-white/45">
                      {formatRelative(msg.createdAt)}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400 dark:text-white/30">
                      {msg.actorName || "System"}
                    </div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-white/56">
                  {msg.body}
                </p>
              </Link>
            ))
          ) : (
            <div className="px-5 py-16 text-center">
              <Send className="mx-auto h-8 w-8 text-zinc-300 dark:text-white/20" />
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
                No outbound messages yet
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-white/50">
                Sent replies will appear here with delivery status for each channel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
