"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BellRing, ExternalLink, X } from "lucide-react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { useNotificationSignalContext, type PreviewToastItem } from "./NotificationSignalProvider";
import { isHighPriorityNotification, isSecurityNotification } from "./notification-signal-rules";

const AUTO_DISMISS_MS = 6_000;
const MAX_VISIBLE_TOASTS = 2;

function SourceMark({
  notification,
  sourceLabel,
}: {
  notification: PreviewToastItem;
  sourceLabel: string;
}) {
  if (notification.source.logoUrl) {
    return (
      <Image
        src={notification.source.logoUrl}
        alt={sourceLabel}
        width={24}
        height={24}
        className="rounded-lg border border-[var(--acct-line)] object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-lg text-[0.55rem] font-bold text-white"
      style={{ backgroundColor: notification.source.accent }}
    >
      {sourceLabel.charAt(0)}
    </div>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: PreviewToastItem;
  onDismiss: () => void;
}) {
  const locale = useHenryCoLocale();
  const router = useRouter();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const sourceLabel = translateSurfaceLabel(locale, item.source.label);
  const actionHref = item.related_url || item.message_href || "/notifications";
  const isExternal = /^https?:\/\//i.test(actionHref);
  const isUrgent = isSecurityNotification(item) || isHighPriorityNotification(item);
  const [paused, setPaused] = useState(false);
  const remainingMsRef = useRef(AUTO_DISMISS_MS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const pauseTimer = () => {
    if (paused) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
    }

    setPaused(true);
  };

  const resumeTimer = () => {
    if (!paused) return;
    setPaused(false);
  };

  useEffect(() => {
    if (paused) {
      return;
    }

    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      onDismiss();
    }, remainingMsRef.current);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [onDismiss, paused]);

  const handleOpen = () => {
    onDismiss();

    if (isExternal) {
      window.location.assign(actionHref);
      return;
    }

    router.push(actionHref);
  };

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      className="pointer-events-auto relative overflow-hidden rounded-[1.35rem] border border-[var(--acct-line)] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(248,245,236,0.98))] shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl transition motion-reduce:transition-none dark:bg-[linear-gradient(145deg,rgba(18,24,33,0.96),rgba(24,30,41,0.98))]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--acct-line)]/60 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--acct-gold-soft)] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-gold)]">
              <BellRing size={10} />
              {t("New notification")}
            </span>
            {item.priorityBadge ? (
              <span className="rounded-full bg-[var(--acct-surface)] px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-ink)]">
                {item.priorityBadge}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <SourceMark notification={item} sourceLabel={sourceLabel} />
            <span
              className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em]"
              style={{ color: item.source.accent }}
            >
              {sourceLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--acct-muted)] transition hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
          aria-label={t("Dismiss")}
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-3.5 py-3">
        <p className="line-clamp-1 text-sm font-semibold text-[var(--acct-ink)]">
          {item.title}
        </p>
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--acct-muted)]">
          {item.body}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--acct-line)]/40 px-3.5 py-3">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--acct-surface)] px-3 py-2 text-xs font-semibold text-[var(--acct-ink)] transition hover:border-[var(--acct-gold)]/30 hover:bg-[var(--acct-gold-soft)]"
        >
          {t("Open")}
          <ExternalLink size={11} />
        </button>
        <Link
          href="/notifications"
          className="text-[0.72rem] font-semibold text-[var(--acct-muted)] transition hover:text-[var(--acct-ink)] hover:underline"
          onClick={onDismiss}
        >
          {t("View notifications")}
        </Link>
      </div>
    </div>
  );
}

function OverflowCard({ count }: { count: number }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <Link
      href="/notifications"
      className="pointer-events-auto flex items-center justify-between gap-3 rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)]/95 px-4 py-3 text-sm font-semibold text-[var(--acct-ink)] shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl"
    >
      <span>{t("View notifications")}</span>
      <span className="rounded-full bg-[var(--acct-gold-soft)] px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--acct-gold)]">
        +{count}
      </span>
    </Link>
  );
}

export function NotificationPreviewToastStack() {
  const context = useNotificationSignalContext();
  if (!context || context.previewToasts.length === 0) return null;

  const visibleToasts = context.previewToasts.slice(-MAX_VISIBLE_TOASTS).reverse();
  const overflowCount = Math.max(0, context.previewToasts.length - MAX_VISIBLE_TOASTS);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-[80] mx-auto flex max-w-[1480px] justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] sm:bottom-4 sm:justify-end sm:px-6 xl:px-8"
      dir="auto"
    >
      <div className="flex w-full max-w-sm flex-col-reverse gap-3">
        {visibleToasts.map((item) => (
          <ToastCard
            key={item.toastId}
            item={item}
            onDismiss={() => context.dismissToast(item.toastId)}
          />
        ))}
        {overflowCount > 0 ? <OverflowCard count={overflowCount} /> : null}
      </div>
    </div>
  );
}
