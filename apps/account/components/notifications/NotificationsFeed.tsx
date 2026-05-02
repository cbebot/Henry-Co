"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { translateSurfaceLabel, useHenryCoLocale, type AppLocale } from "@henryco/i18n";
import type { EnrichedNotification } from "@/lib/account-data";
import NotificationLifecycleControls from "@/components/messages/NotificationLifecycleControls";
import { timeAgoLocalized } from "@/lib/format";
import { divisionAccentVar, resolveSeverity } from "./severity-style";
import { NotificationsFeedEmptyState } from "./NotificationsFeedEmptyState";
import { SwipeableNotificationCard } from "./SwipeableNotificationCard";

function SourceMark({ notification, sourceLabel }: { notification: EnrichedNotification; sourceLabel: string }) {
  const source = notification.source;

  if (source.logoUrl) {
    return (
      <Image
        src={source.logoUrl}
        alt={sourceLabel}
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
      {sourceLabel.charAt(0)}
    </div>
  );
}

function NotificationCard({
  notification,
  locale,
  unreadLabel,
  openMessageBoardLabel,
  swipeLabels,
}: {
  notification: EnrichedNotification;
  locale: AppLocale;
  unreadLabel: string;
  openMessageBoardLabel: string;
  swipeLabels: {
    archive: string;
    delete: string;
    markRead: string;
    markUnread: string;
  };
}) {
  const router = useRouter();
  const sourceLabel = translateSurfaceLabel(locale, notification.source.label);
  // V2-NOT-01-B-2: severity icon + division accent applied per-row.
  const severityStyle = resolveSeverity(
    (notification as { priority?: string | null }).priority,
    (notification as { category?: string | null }).category,
  );
  const divisionVar = divisionAccentVar(notification.source.key);
  const notificationId = String(notification.id);

  const runMutation = useCallback(
    async (path: string, method: "POST" | "DELETE") => {
      try {
        const res = await fetch(path, { method, credentials: "same-origin" });
        if (!res.ok) return;
      } finally {
        router.refresh();
      }
    },
    [router],
  );

  const onMarkRead = useCallback(
    () => runMutation(`/api/notifications/${notificationId}/read`, "POST"),
    [notificationId, runMutation],
  );
  const onMarkUnread = useCallback(
    () => runMutation(`/api/notifications/${notificationId}/unread`, "POST"),
    [notificationId, runMutation],
  );
  const onArchive = useCallback(
    () => runMutation(`/api/notifications/${notificationId}/archive`, "POST"),
    [notificationId, runMutation],
  );
  const onDelete = useCallback(
    () => runMutation(`/api/notifications/${notificationId}`, "DELETE"),
    [notificationId, runMutation],
  );

  return (
    <SwipeableNotificationCard
      isRead={Boolean(notification.is_read)}
      onMarkRead={onMarkRead}
      onMarkUnread={onMarkUnread}
      onArchive={onArchive}
      onDelete={onDelete}
      labels={swipeLabels}
    >
    <div
      className={`rounded-[1.55rem] border px-4 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md ${
        notification.is_read
          ? "border-[var(--acct-line)] bg-[var(--acct-bg-elevated)]"
          : "border-[var(--acct-gold)]/15 bg-[var(--acct-gold-soft)]/65"
      }`}
      style={{
        borderLeftWidth: 3,
        borderLeftStyle: "solid",
        borderLeftColor: `var(${divisionVar})`,
      }}
    >
      <div className="flex items-start gap-4">
        <SourceMark notification={notification} sourceLabel={sourceLabel} />
        <div className="min-w-0 flex-1">
          <Link href={String(notification.message_href || "/notifications")} className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: `var(${severityStyle.softVar})`,
                      color: `var(${severityStyle.colorVar})`,
                    }}
                  >
                    <span aria-hidden className="inline-flex items-center">
                      <severityStyle.Icon size={10} />
                    </span>
                    {severityStyle.label}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: `${notification.source.accent}18`,
                      color: notification.source.accent,
                    }}
                  >
                    {sourceLabel}
                  </span>
                  {!notification.is_read ? (
                    <span className="rounded-full bg-[var(--acct-red-soft)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-red)]">
                      {unreadLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">
                  {String(notification.title || "")}
                </p>
              </div>
              <p className="shrink-0 text-[0.72rem] font-medium text-[var(--acct-muted)]">
                {timeAgoLocalized(String(notification.created_at || ""), locale)}
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
              {openMessageBoardLabel}
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
    </SwipeableNotificationCard>
  );
}

export default function NotificationsFeed({
  notifications,
}: {
  notifications: EnrichedNotification[];
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [selectedSource, setSelectedSource] = useState("all");
  const [mode, setMode] = useState<"all" | "unread">("all");

  const sourceOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const notification of notifications) {
      seen.set(
        notification.source.key,
        translateSurfaceLabel(locale, notification.source.label)
      );
    }
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [locale, notifications]);

  const swipeLabels = useMemo(
    () => ({
      archive: t("Archive"),
      delete: t("Delete"),
      markRead: t("Mark as read"),
      markUnread: t("Mark as unread"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- locale-driven recomputation
    [locale],
  );

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
            {t("All")}
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
            {t("Unread")}
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
            {t("All sources")}
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
        <NotificationsFeedEmptyState variant="filter" filterLabel={t("active filter")} />
      ) : (
        <div className="space-y-6">
          {unread.length > 0 ? (
            <section className="space-y-3">
              <div>
                <p className="acct-kicker">{t("Unread")}</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                  {t("Needs your attention")}
                </h2>
              </div>
              <div className="space-y-3">
                {unread.map((notification) => (
                  <NotificationCard
                    key={String(notification.id)}
                    notification={notification}
                    locale={locale}
                    unreadLabel={t("Unread")}
                    openMessageBoardLabel={t("Open message board")}
                    swipeLabels={swipeLabels}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {recent.length > 0 ? (
            <section className="space-y-3">
              <div>
                <p className="acct-kicker">{t("Recent")}</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
                  {t("Cleared or reviewed activity")}
                </h2>
              </div>
              <div className="space-y-3">
                {recent.map((notification) => (
                  <NotificationCard
                    key={String(notification.id)}
                    notification={notification}
                    locale={locale}
                    unreadLabel={t("Unread")}
                    openMessageBoardLabel={t("Open message board")}
                    swipeLabels={swipeLabels}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
