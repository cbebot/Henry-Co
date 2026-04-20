"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSurfaceTemplate, translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { Bell, ChevronRight, Loader2 } from "lucide-react";
import { timeAgoLocalized } from "@/lib/format";
import { useNotificationSignalContext, type SignalNotification } from "@/lib/notification-signal";

type BellNotification = SignalNotification;

function SourceMark({
  notification,
  sourceLabel,
}: {
  notification: BellNotification;
  sourceLabel: string;
}) {
  if (notification.source.logoUrl) {
    return (
      <Image
        src={notification.source.logoUrl}
        alt={sourceLabel}
        width={32}
        height={32}
        className="rounded-xl border border-[var(--acct-line)] object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-xl text-[0.7rem] font-bold text-white"
      style={{ backgroundColor: notification.source.accent }}
    >
      {sourceLabel.charAt(0)}
    </div>
  );
}

export default function NotificationBell({
  align = "right",
  buttonClassName = "",
}: {
  align?: "left" | "right";
  buttonClassName?: string;
}) {
  const notificationSignal = useNotificationSignalContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const unreadCount = notificationSignal?.unreadCount ?? 0;
  const items = notificationSignal?.recentNotifications ?? [];
  const loading = notificationSignal?.loading ?? false;
  const error = notificationSignal?.error;

  useEffect(() => {
    if (!open) return;
    void notificationSignal?.refreshFeed();
  }, [notificationSignal, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleItemClick = async (item: BellNotification) => {
    if (!item.is_read) {
      notificationSignal?.markNotificationReadLocally(item.id);
      fetch(`/api/notifications/${item.id}/read`, { method: "POST" }).catch(() => undefined);
    }

    setOpen(false);

    const destination = item.related_url || item.message_href || "/notifications";
    if (/^https?:\/\//i.test(destination)) {
      window.location.assign(destination);
      return;
    }

    router.push(destination);
  };

  const unreadSummary =
    unreadCount > 0
      ? formatSurfaceTemplate(
          t(
            unreadCount === 1
              ? "{count} item needs your attention"
              : "{count} items need your attention"
          ),
          { count: unreadCount },
        )
      : t("You are caught up for now");

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative rounded-xl p-2 text-[var(--acct-muted)] transition hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] ${buttonClassName}`}
        aria-label={t("Open notifications")}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--acct-red)] px-1 text-[0.55rem] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={`absolute z-[70] mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] shadow-[0_22px_70px_rgba(17,24,39,0.18)] ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="border-b border-[var(--acct-line)] bg-[linear-gradient(135deg,rgba(201,162,39,0.12),rgba(255,255,255,0.92))] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="acct-kicker">{t("Notifications")}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--acct-ink)]">{unreadSummary}</p>
              </div>
              <Link href="/notifications" onClick={() => setOpen(false)} className="acct-button-ghost text-xs">
                {t("View all")} <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto px-2 py-2 acct-scrollbar">
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex animate-pulse gap-3 rounded-2xl bg-[var(--acct-surface)] px-3 py-3">
                    <div className="h-8 w-8 rounded-xl bg-[var(--acct-line)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded-full bg-[var(--acct-line)]" />
                      <div className="h-3 w-full rounded-full bg-[var(--acct-line)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="m-2 rounded-2xl bg-[var(--acct-red-soft)] px-4 py-4 text-sm text-[var(--acct-red)]">
                {t(error)}
              </div>
            ) : items.length === 0 ? (
              <div className="m-2 rounded-2xl border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-8 text-center">
                <p className="text-sm font-medium text-[var(--acct-ink)]">{t("No recent alerts")}</p>
                <p className="mt-1 text-xs leading-6 text-[var(--acct-muted)]">
                  {t("Order updates, project activity, and account alerts will collect here.")}
                </p>
              </div>
            ) : (
              items.map((notification) => {
                const sourceLabel = translateSurfaceLabel(locale, notification.source.label);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleItemClick(notification)}
                    className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      notification.is_read
                        ? "hover:bg-[var(--acct-surface)]"
                        : "border border-[var(--acct-gold)]/15 bg-[var(--acct-gold-soft)]/70 hover:bg-[var(--acct-gold-soft)]"
                    }`}
                  >
                    <SourceMark notification={notification} sourceLabel={sourceLabel} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs font-medium" style={{ color: notification.source.accent }}>
                            {sourceLabel}
                          </p>
                        </div>
                        {!notification.is_read ? (
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--acct-gold)]" />
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--acct-muted)]">
                        {notification.body}
                      </p>
                      <p className="mt-2 text-[0.7rem] font-medium text-[var(--acct-muted)]">
                        {timeAgoLocalized(notification.created_at, locale)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {!loading ? (
            <div className="border-t border-[var(--acct-line)] px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-2xl bg-[var(--acct-surface)] px-4 py-3 text-sm font-semibold text-[var(--acct-ink)] transition hover:bg-[var(--acct-bg)]"
                >
                  <Loader2 size={0} className="hidden" />
                  {t("View all notifications")} <ChevronRight size={14} />
                </Link>
                <Link
                  href="/settings#notification-signal-preferences"
                  onClick={() => setOpen(false)}
                  className="text-xs font-semibold text-[var(--acct-muted)] transition hover:text-[var(--acct-ink)] hover:underline"
                >
                  {t("Manage notification preferences")}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
