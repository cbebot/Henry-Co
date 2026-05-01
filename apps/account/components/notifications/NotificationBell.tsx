"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSurfaceTemplate, translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ChevronRight } from "lucide-react";
import { timeAgoLocalized } from "@/lib/format";
import { useNotificationSignalContext, type SignalNotification } from "@/lib/notification-signal";
import { HenryCoBell, MarkReadIcon, ArchiveIcon, DeleteIcon, EmptyStateGlyph } from "./icons/HenryCoIcons";
import {
  badgeColorVar,
  divisionAccentVar,
  highestSeverity,
  isSafeNotificationDeepLink,
  resolveSeverity,
  type SignalSeverity,
} from "./severity-style";

type BellNotification = SignalNotification;
type BellAction = "read" | "unread" | "archive" | "delete";

const LONG_PRESS_MS = 400;
const BADGE_PULSE_DEBOUNCE_MS = 800;

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
        className="h-8 w-8 shrink-0 rounded-xl border border-[var(--acct-line)] object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.7rem] font-bold text-white"
      style={{ backgroundColor: notification.source.accent }}
      aria-hidden
    >
      {sourceLabel.charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Pre-computes the auxiliary data each card needs (severity style, deep
 * link, division accent) so the render path stays straightforward.
 */
function useCardMeta(notifications: BellNotification[], locale: string) {
  return useMemo(() => {
    return notifications.map((notification) => {
      const severityStyle = resolveSeverity(notification.priority, notification.category);
      const sourceLabel = translateSurfaceLabel(locale, notification.source.label);
      const rawDestination = notification.action_url || notification.message_href || "/notifications";
      const safeDestination = isSafeNotificationDeepLink(rawDestination)
        ? rawDestination
        : "/notifications";
      // notification.source.key is the division identifier resolved by the
      // signal endpoint via getDivisionBrand. Map it onto the accent token.
      const divisionVar = divisionAccentVar(notification.source.key);
      return {
        notification,
        severityStyle,
        sourceLabel,
        safeDestination,
        divisionVar,
      };
    });
  }, [notifications, locale]);
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
  const cardMeta = useCardMeta(items, locale);

  // Track the highest-severity unread for the badge color and bell alert
  // state. Recomputes on every signal change. unread = items where is_read
  // is false (the signal endpoint already filters but we double-check).
  const highestUnreadSeverity = useMemo<SignalSeverity | null>(
    () => highestSeverity(items),
    [items],
  );
  const badgeColor = badgeColorVar(highestUnreadSeverity);

  // Debounced pulse: when unreadCount climbs by 1+ within 800ms of a
  // previous climb, only one pulse plays. Stays consistent with browser
  // notification stacking.
  const [pulseKey, setPulseKey] = useState(0);
  const lastPulseAtRef = useRef(0);
  const previousUnreadRef = useRef(unreadCount);
  useEffect(() => {
    const previous = previousUnreadRef.current;
    previousUnreadRef.current = unreadCount;
    if (unreadCount <= previous) return;
    const now = Date.now();
    if (now - lastPulseAtRef.current < BADGE_PULSE_DEBOUNCE_MS) return;
    lastPulseAtRef.current = now;
    setPulseKey((k) => k + 1);
  }, [unreadCount]);

  // Bell alert state plays once on mount when there is an unread backlog,
  // so the user notices the bell after a fresh page load. Subsequent
  // increments use the badge pulse, not another bell tilt.
  const [alertPlayed, setAlertPlayed] = useState(false);
  useEffect(() => {
    if (alertPlayed) return;
    if (unreadCount > 0) setAlertPlayed(true);
  }, [unreadCount, alertPlayed]);

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

  const navigateSafely = useCallback(
    (destination: string) => {
      if (!isSafeNotificationDeepLink(destination)) {
        // Hard guard: if a malicious or malformed deepLink reached this
        // far, fall back to the inbox rather than navigating to an
        // off-platform URL. The publisher already validates, but
        // defense-in-depth.
        router.push("/notifications");
        return;
      }
      if (/^https?:\/\//i.test(destination)) {
        window.location.assign(destination);
        return;
      }
      router.push(destination);
    },
    [router],
  );

  const handleItemActivate = useCallback(
    async (item: BellNotification, destination: string) => {
      if (!item.is_read) {
        notificationSignal?.markNotificationReadLocally(item.id);
        fetch(`/api/notifications/${item.id}/read`, { method: "POST" }).catch(
          () => undefined,
        );
      }
      setOpen(false);
      navigateSafely(destination);
    },
    [notificationSignal, navigateSafely],
  );

  const performInlineAction = useCallback(
    async (item: BellNotification, action: BellAction) => {
      // Optimistic local update where we can; server roundtrip drives the
      // canonical state via refreshFeed afterwards.
      if (action === "read") {
        notificationSignal?.markNotificationReadLocally(item.id);
      }

      const url =
        action === "read"
          ? `/api/notifications/${item.id}/read`
          : action === "unread"
            ? `/api/notifications/${item.id}/unread`
            : action === "archive"
              ? `/api/notifications/${item.id}/archive`
              : `/api/notifications/${item.id}`;
      const method = action === "delete" ? "DELETE" : "POST";

      try {
        const res = await fetch(url, { method, credentials: "same-origin" });
        if (!res.ok) {
          // Surface a soft inline rollback by re-fetching the canonical
          // feed; the server is the source of truth and the user's
          // optimistic state will reconcile.
          await notificationSignal?.refreshFeed();
          return;
        }
      } catch {
        await notificationSignal?.refreshFeed();
        return;
      }
      await notificationSignal?.refreshFeed();
    },
    [notificationSignal],
  );

  const unreadSummary =
    unreadCount > 0
      ? formatSurfaceTemplate(
          t(
            unreadCount === 1
              ? "{count} item needs your attention"
              : "{count} items need your attention",
          ),
          { count: unreadCount },
        )
      : t("You are caught up for now");

  const displayCount = unreadCount > 9 ? "9+" : String(unreadCount);
  const bellAriaLabel = unreadCount > 0
    ? `${t("Open notifications")} — ${unreadCount} ${unreadCount === 1 ? "unread" : "unread"}`
    : t("Open notifications");

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative rounded-xl p-2 text-[var(--acct-muted)] transition hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acct-gold)]/40 ${buttonClassName}`}
        aria-label={bellAriaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span
          className={unreadCount > 0 && !alertPlayed ? "acct-bell-alert inline-flex" : "inline-flex"}
        >
          <HenryCoBell size={18} />
        </span>
        {unreadCount > 0 ? (
          <span
            key={pulseKey}
            className="acct-bell-badge absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[0.62rem] font-bold leading-none text-white tabular-nums shadow-[0_0_0_2px_var(--acct-bg-elevated)]"
            style={{ backgroundColor: `var(${badgeColor})` }}
            aria-hidden
          >
            {displayCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("Notifications")}
          className={`acct-bell-popover absolute z-[70] mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] shadow-[0_22px_70px_rgba(17,24,39,0.18)] ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="border-b border-[var(--acct-line)] bg-[linear-gradient(135deg,rgba(201,162,39,0.10),rgba(255,255,255,0.92))] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="acct-kicker">{t("Notifications")}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--acct-ink)]">{unreadSummary}</p>
              </div>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="acct-button-ghost text-xs"
              >
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
              <PopoverEmptyState t={t} />
            ) : (
              cardMeta.map(({ notification, severityStyle, sourceLabel, safeDestination, divisionVar }) => (
                <PopoverCard
                  key={notification.id}
                  notification={notification}
                  sourceLabel={sourceLabel}
                  destination={safeDestination}
                  severityIcon={<severityStyle.Icon size={14} />}
                  severityColorVar={severityStyle.colorVar}
                  divisionVar={divisionVar}
                  onActivate={() => void handleItemActivate(notification, safeDestination)}
                  onAction={(action) => void performInlineAction(notification, action)}
                  t={t}
                  locale={locale}
                />
              ))
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

/**
 * One popover card with hover/focus reveal of inline actions and mobile
 * long-press support. The card itself is a button (activates → marks
 * read + navigates); the inline actions are nested buttons. Pointer
 * events are stopped on the inline buttons so the parent activate path
 * does not fire.
 */
function PopoverCard({
  notification,
  sourceLabel,
  destination,
  severityIcon,
  severityColorVar,
  divisionVar,
  onActivate,
  onAction,
  t,
  locale,
}: {
  notification: BellNotification;
  sourceLabel: string;
  destination: string;
  severityIcon: React.ReactNode;
  severityColorVar: string;
  divisionVar: string;
  onActivate: () => void;
  onAction: (action: BellAction) => void;
  t: (text: string) => string;
  locale: string;
}) {
  const [pressed, setPressed] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  const startLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) return;
    longPressTimerRef.current = window.setTimeout(() => {
      setPressed(true);
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const stopParent = (event: React.PointerEvent | React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
  };

  const isUnread = !notification.is_read;
  const containerStyle: React.CSSProperties = {
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    borderLeftColor: `var(${divisionVar})`,
  };

  return (
    <div
      role="presentation"
      data-pressed={pressed ? "true" : undefined}
      className={`acct-card-row relative flex w-full items-start gap-3 rounded-2xl pl-3 pr-2 py-3 text-left transition ${
        isUnread ? "bg-[var(--acct-gold-soft)]/40 hover:bg-[var(--acct-gold-soft)]" : "hover:bg-[var(--acct-surface)]"
      }`}
      style={containerStyle}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      onMouseLeave={() => setPressed(false)}
    >
      <button
        type="button"
        onClick={onActivate}
        className="flex w-full items-start gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acct-gold)]/35 rounded-xl"
        aria-label={`${t("Open notification")}: ${notification.title}`}
      >
        <SourceMark notification={notification} sourceLabel={sourceLabel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: `var(${severityColorVar})` }} aria-hidden>
              {severityIcon}
            </span>
            <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">
              {notification.title}
            </p>
            {isUnread ? (
              <span
                className="ml-auto inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: `var(${severityColorVar})` }}
                aria-hidden
              />
            ) : null}
          </div>
          {notification.body ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--acct-muted)]">
              {notification.body}
            </p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[0.7rem] font-medium" style={{ color: `var(${divisionVar})` }}>
              {sourceLabel}
            </p>
            <p className="text-[0.7rem] font-medium text-[var(--acct-muted)]">
              {timeAgoLocalized(notification.created_at, locale)}
            </p>
          </div>
        </div>
      </button>
      <div className="acct-card-actions absolute right-2 top-2 flex items-center gap-1">
        <InlineActionButton
          label={isUnread ? t("Mark as read") : t("Mark as unread")}
          onClick={(event) => {
            stopParent(event);
            onAction(isUnread ? "read" : "unread");
          }}
        >
          <MarkReadIcon size={14} />
        </InlineActionButton>
        <InlineActionButton
          label={t("Archive")}
          onClick={(event) => {
            stopParent(event);
            onAction("archive");
          }}
        >
          <ArchiveIcon size={14} />
        </InlineActionButton>
        <InlineActionButton
          label={t("Delete")}
          onClick={(event) => {
            stopParent(event);
            onAction("delete");
          }}
        >
          <DeleteIcon size={14} />
        </InlineActionButton>
      </div>
      <span aria-hidden className="sr-only">
        {destination}
      </span>
    </div>
  );
}

function InlineActionButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--acct-muted)] transition hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acct-gold)]/35"
      aria-label={label}
    >
      {children}
    </button>
  );
}

/**
 * Premium typographic empty state for the popover. Final user-facing
 * copy is owned by V2-COPY-01; the literal strings here are placeholders.
 */
function PopoverEmptyState({ t }: { t: (text: string) => string }) {
  return (
    <div className="m-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] px-6 py-10 text-center">
      <span className="text-[var(--acct-muted)]" aria-hidden>
        <EmptyStateGlyph size={44} />
      </span>
      {/* PLACEHOLDER COPY — final wording owned by V2-COPY-01 */}
      <p className="acct-display text-base text-[var(--acct-ink)]">
        {t("All caught up.")}
      </p>
      <p className="text-xs leading-6 text-[var(--acct-muted)]">
        {t("New activity from across HenryCo will arrive here.")}
      </p>
    </div>
  );
}
