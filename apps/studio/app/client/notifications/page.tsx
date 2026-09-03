import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  History,
  MessageSquare,
} from "lucide-react";

import { requireClientPortalViewer } from "@/lib/portal/auth";
import {
  buildAttentionItems,
  getClientPortalSnapshot,
  unreadMessageCount,
} from "@/lib/portal/data";
import { formatKobo, relativeTime, shortDate } from "@/lib/portal/helpers";
import { invoiceStatusToken } from "@/lib/portal/status";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { PortalEmptyState } from "@/components/portal/empty-state";
import { StatusBadge } from "@/components/portal/status-badge";

export const metadata: Metadata = {
  title: "Notifications",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * /client/notifications — the bell target. Shows everything the viewer
 * should act on right now (overdue invoices, files awaiting approval,
 * unread team messages) followed by the recent-activity feed for the
 * project workspace.
 *
 * The bell in the mobile header used to link to /client (the home);
 * this page gives notifications a real surface and keeps the
 * attention items separate from the workspace overview.
 */
export default async function ClientNotificationsPage() {
  const viewer = await requireClientPortalViewer("/client/notifications");
  const snapshot = await getClientPortalSnapshot(viewer);
  const attention = buildAttentionItems(snapshot);
  const unread = unreadMessageCount(snapshot);
  const projectTitleById = new Map(snapshot.projects.map((p) => [p.id, p.title]));
  const recent = snapshot.updates.slice(0, 12);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          <Bell className="h-3.5 w-3.5" />
          Activity & alerts
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
          Notifications
        </h1>
        <p className="max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
          Items that need your action sit at the top. The activity timeline below shows the
          last few updates the team has posted on your projects.
        </p>
      </header>

      <section className="space-y-3" aria-label="Needs your attention">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
            Needs your attention · {attention.length}
          </h2>
          {unread > 0 ? (
            <Link
              href="/client/messages"
              className="text-[12px] font-semibold text-[var(--studio-signal)] hover:underline"
            >
              {unread} unread message{unread === 1 ? "" : "s"}
            </Link>
          ) : null}
        </div>

        {attention.length === 0 ? (
          <PortalEmptyState
            icon={CheckCircle2}
            tone="muted"
            title="You're all caught up"
            body="When something needs your action — an overdue invoice, a deliverable awaiting approval, or a new team message — it will appear here first."
          />
        ) : (
          <ul className="space-y-2.5">
            {attention.map((item, idx) => {
              if (item.kind === "invoice") {
                const status = invoiceStatusToken(item.invoice.status);
                return (
                  <li key={`invoice-${item.invoice.id}-${idx}`}>
                    <Link
                      href={`/client/payment/${item.invoice.id}`}
                      className="portal-card group flex items-start gap-3 px-4 py-3.5 transition hover:border-[var(--studio-accent-ring)]"
                    >
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-red-soft)] text-[var(--studio-red-ink)]">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                            {item.invoice.invoiceNumber}
                            {item.invoice.dueDate ? ` · Due ${shortDate(item.invoice.dueDate)}` : ""}
                          </span>
                          <StatusBadge tone={status.tone} label={status.label} size="sm" />
                        </div>
                        <div className="mt-0.5 truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                          {item.invoice.description || "Studio invoice"}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[var(--studio-ink-soft)]">
                          {item.projectTitle} · {formatKobo(item.invoice.amountKobo, item.invoice.currency)}
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)] transition group-hover:translate-x-0.5 group-hover:text-[var(--studio-ink)]" />
                    </Link>
                  </li>
                );
              }

              if (item.kind === "deliverable") {
                return (
                  <li key={`deliverable-${item.deliverable.id}-${idx}`}>
                    <Link
                      href={`/client/projects/${item.deliverable.projectId}?tab=files`}
                      className="portal-card group flex items-start gap-3 px-4 py-3.5 transition hover:border-[var(--studio-accent-ring)]"
                    >
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-green-soft)] text-[var(--studio-green-ink)]">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                          New deliverable awaiting your review
                        </div>
                        <div className="mt-0.5 truncate text-[13.5px] font-semibold text-[var(--studio-ink)]">
                          {item.deliverable.title}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[var(--studio-ink-soft)]">
                          {item.projectTitle}
                          {item.deliverable.sharedAt
                            ? ` · Shared ${relativeTime(item.deliverable.sharedAt)}`
                            : ""}
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)] transition group-hover:translate-x-0.5 group-hover:text-[var(--studio-ink)]" />
                    </Link>
                  </li>
                );
              }

              return (
                <li key={`message-${item.message.id}-${idx}`}>
                  <Link
                    href={`/client/projects/${item.message.projectId}/messages`}
                    className="portal-card group flex items-start gap-3 px-4 py-3.5 transition hover:border-[var(--studio-accent-ring)]"
                  >
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-accent-soft)] text-[var(--studio-signal)]">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[13.5px] font-semibold text-[var(--studio-ink)]">
                          {item.message.senderName}
                        </span>
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                          {relativeTime(item.message.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                        {item.message.body}
                      </p>
                      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                        {item.projectTitle}
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--studio-ink-soft)] transition group-hover:translate-x-0.5 group-hover:text-[var(--studio-ink)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label="Recent activity">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
            Recent activity
          </h2>
        </div>
        {recent.length > 0 ? (
          <ActivityFeed updates={recent} projectTitleById={projectTitleById} />
        ) : (
          <PortalEmptyState
            icon={History}
            tone="muted"
            title="No activity yet"
            body="Once we share files, complete milestones, or post project updates, they will show on the timeline here."
          />
        )}
      </section>
    </div>
  );
}
