"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EnrichedNotification } from "@/lib/account-data";
import EmptyState from "@/components/layout/EmptyState";
import { Bell } from "lucide-react";
import NotificationLifecycleControls from "@/components/messages/NotificationLifecycleControls";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

function SourceMark({ notification }: { notification: EnrichedNotification }) {
  const source = notification.source;

  if (source.logoUrl) {
    return (
      <Image
        src={source.logoUrl}
        alt={source.label}
        width={40}
        height={40}
        className="rounded-2xl border border-[var(--acct-line)] object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold text-white"
      style={{ backgroundColor: source.accent }}
    >
      {source.label.charAt(0)}
    </div>
  );
}

function NotificationCard({ notification }: { notification: EnrichedNotification }) {
  return (
    <div
      className={`rounded-[1.55rem] border px-4 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md ${
        notification.is_read
          ? "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)]"
          : "border-[var(--acct-gold)]/15 bg-[var(--acct-gold-soft)]/65"
      }`}
    >
      <div className="flex items-start gap-4">
        <SourceMark notification={notification} />
        <div className="min-w-0 flex-1">
          <Link href={String(notification.message_href || "/notifications")} className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: `${notification.source.accent}18`,
                      color: notification.source.accent,
                    }}
                  >
                    {notification.source.label}
                  </span>
                  {!notification.is_read ? (
                    <span className="rounded-full bg-[var(--acct-red-soft)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-red)]">
                      Unread
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">
                  {String(notification.title || "")}
                </p>
              </div>
              <p className="shrink-0 text-[0.72rem] font-medium text-[var(--acct-muted)]">
                {timeAgo(String(notification.created_at || ""))}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
              {String(notification.body || "")}
            </p>
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={String(notification.message_href || "/notifications")}
              className="text-xs font-semibold text-[var(--acct-gold)] hover:underline"
            >
              Open message board
            </Link>
            <NotificationLifecycleControls
              notificationId={String(notification.id)}
              isRead={Boolean(notification.is_read)}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsFeed({
  notifications,
}: {
  notifications: EnrichedNotification[];
}) {
  const [selectedSource, setSelectedSource] = useState("all");
  const [mode, setMode] = useState<"all" | "unread">("all");

  const sourceOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const notification of notifications) {
      seen.set(notification.source.key, notification.source.label);
    }
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [notifications]);

  const filtered = notifications.filter((notification) => {
    const sourceMatch = selectedSource === "all" || notification.source.key === selectedSource;
    const modeMatch = mode === "all" || !notification.is_read;
    return sourceMatch && modeMatch;
  });

  const unread = filtered.filter((notification) => !notification.is_read);
  const recent = filtered.filter((notification) => notification.is_read);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              mode === "all"
                ? "bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                : "bg-[var(--acct-surface)] text-[var(--acct-muted)]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setMode("unread")}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              mode === "unread"
                ? "bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]"
                : "bg-[var(--acct-surface)] text-[var(--acct-muted)]"
            }`}
          >
            Unread
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedSource("all")}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              selectedSource === "all"
                ? "bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]"
                : "bg-[var(--acct-surface)] text-[var(--acct-muted)]"
            }`}
          >
            All sources
          </button>
          {sourceOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedSource(option.key)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                selectedSource === option.key
                  ? "bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]"
                  : "bg-[var(--acct-surface)] text-[var(--acct-muted)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications match this view"
          description="Try switching the source or state filters to bring recent notifications back into focus."
        />
      ) : (
        <div className="space-y-6">
          {unread.length > 0 ? (
            <section className="space-y-3">
              <div>
                <p className="acct-kicker">Unread</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                  Needs your attention
                </h2>
              </div>
              <div className="space-y-3">
                {unread.map((notification) => (
                  <NotificationCard key={String(notification.id)} notification={notification} />
                ))}
              </div>
            </section>
          ) : null}

          {recent.length > 0 ? (
            <section className="space-y-3">
              <div>
                <p className="acct-kicker">Recent</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                  Cleared or reviewed activity
                </h2>
              </div>
              <div className="space-y-3">
                {recent.map((notification) => (
                  <NotificationCard key={String(notification.id)} notification={notification} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
