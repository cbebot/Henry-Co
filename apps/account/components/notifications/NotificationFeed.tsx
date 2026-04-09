"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { divisionColor, divisionLabel, timeAgo } from "@/lib/format";
import { isExternalHref } from "@/lib/account-links";

export type NotificationRecord = {
  id: string;
  title: string;
  body?: string | null;
  category?: string | null;
  division?: string | null;
  created_at: string;
  is_read: boolean;
  action_url?: string | null;
  action_label?: string | null;
};

        function NotificationLink({
          href,
          className,
          children,
        }: {
          href?: string | null;
          className: string;
          children: ReactNode;
        }) {
  if (!href) {
    return <div className={className}>{children}</div>;
  }

  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function NotificationFeed({
  initialNotifications,
}: {
  initialNotifications: NotificationRecord[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const unreadIdsOnLoad = useMemo(
    () => initialNotifications.filter((item) => !item.is_read).map((item) => item.id),
    [initialNotifications]
  );

  useEffect(() => {
    if (unreadIdsOnLoad.length === 0) {
      return;
    }

    let cancelled = false;
    setNotifications((current) =>
      current.map((item) =>
        unreadIdsOnLoad.includes(item.id)
          ? {
              ...item,
              is_read: true,
            }
          : item
      )
    );

    void fetch("/api/notifications/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: unreadIdsOnLoad, isRead: true }),
    }).then((response) => {
      if (response.ok || cancelled) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          unreadIdsOnLoad.includes(item.id)
            ? {
                ...item,
                is_read: false,
              }
            : item
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, [unreadIdsOnLoad]);

  async function toggleRead(notificationId: string, nextRead: boolean) {
    const snapshot = notifications;
    setPendingIds((current) => [...current, notificationId]);
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              is_read: nextRead,
            }
          : item
      )
    );

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: nextRead }),
      });

      if (!response.ok) {
        throw new Error("Unable to update notification state.");
      }
    } catch {
      setNotifications(snapshot);
    } finally {
      setPendingIds((current) => current.filter((item) => item !== notificationId));
    }
  }

  return (
    <div className="acct-card divide-y divide-[var(--acct-line)]">
      {notifications.map((notification) => {
        const isPending = pendingIds.includes(notification.id);
        const division = notification.division || notification.category || "general";
        const hasDivisionBadge = division && division !== "general";

        return (
          <div
            key={notification.id}
            className={`flex items-start gap-4 px-5 py-4 ${
              !notification.is_read ? "bg-[var(--acct-gold-soft)]/50" : ""
            }`}
          >
            {hasDivisionBadge ? (
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: divisionColor(division) }}
              >
                {divisionLabel(division).charAt(0)}
              </div>
            ) : (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--acct-gold-soft)]">
                <Bell size={14} className="text-[var(--acct-gold)]" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <NotificationLink
                  href={notification.action_url}
                  className="min-w-0 flex-1 rounded-2xl outline-none transition-colors hover:text-[var(--acct-gold)] focus-visible:text-[var(--acct-gold)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !notification.is_read ? "font-semibold" : "font-medium"
                      } text-[var(--acct-ink)]`}
                    >
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--acct-gold)]" />
                    )}
                  </div>
                  {notification.body ? (
                    <p className="mt-0.5 text-sm text-[var(--acct-muted)] line-clamp-2">
                      {notification.body}
                    </p>
                  ) : null}
                </NotificationLink>

                <button
                  type="button"
                  onClick={() => toggleRead(notification.id, !notification.is_read)}
                  disabled={isPending}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--acct-line)] px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--acct-muted)] transition hover:border-[var(--acct-gold)]/30 hover:text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                  {notification.is_read ? "Mark unread" : "Keep unread"}
                </button>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {hasDivisionBadge ? (
                  <span className="acct-chip acct-chip-gold text-[0.6rem]">
                    {divisionLabel(division)}
                  </span>
                ) : null}
                {notification.action_url ? (
                  <span className="text-[0.65rem] font-medium text-[var(--acct-gold)]">
                    {notification.action_label || "Open notification"}
                  </span>
                ) : null}
                <span className="text-[0.65rem] text-[var(--acct-muted)]">
                  {timeAgo(notification.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
