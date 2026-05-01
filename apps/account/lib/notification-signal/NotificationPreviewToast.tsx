"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { useNotificationSignalContext, type PreviewToastItem } from "./NotificationSignalProvider";
import { HenryCoBell } from "@/components/notifications/icons/HenryCoIcons";
import {
  autoDismissMs,
  isSafeNotificationDeepLink,
  resolveSeverity,
} from "@/components/notifications/severity-style";

// V2-NOT-01-B-2: Stack policy now allows 3 visible toasts. Auto-dismiss
// duration varies by severity (info/success/warning = 6s, urgent = 12s,
// security = never; user must explicitly dismiss). The deepLink target
// is validated against isSafeNotificationDeepLink before navigation —
// even though the publisher rejects unsafe URLs at insert time, the
// toast surface treats incoming Realtime data as untrusted.
const MAX_VISIBLE_TOASTS = 3;

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
  const rawActionHref = item.related_url || item.message_href || "/notifications";
  // Defense-in-depth: even though the publisher rejects unsafe deepLinks
  // at insert time, the toast treats Realtime payloads as untrusted.
  // If the URL is not safe, route to the inbox instead of off-platform.
  const safeActionHref = isSafeNotificationDeepLink(rawActionHref) ? rawActionHref : "/notifications";
  const isExternal = /^https?:\/\//i.test(safeActionHref);

  const severityStyle = resolveSeverity(item.priority, item.category);
  const dismissPolicy = autoDismissMs(severityStyle.severity);
  const isUrgentTier = severityStyle.severity === "urgent" || severityStyle.severity === "security";

  const [paused, setPaused] = useState(false);
  const remainingMsRef = useRef(dismissPolicy ?? Number.POSITIVE_INFINITY);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const pauseTimer = () => {
    if (paused) return;
    if (dismissPolicy === null) return;

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
    // Severity 'security' never auto-dismisses — the user must explicitly
    // dismiss. Skip the timeout entirely.
    if (dismissPolicy === null) return;
    if (paused) return;

    // Capturing the wall clock here is the whole point of an effect — pause/
    // resume math reads against this anchor. react-hooks/purity overreaches
    // when it flags Date.now() inside an effect body; documented escape.
    // eslint-disable-next-line react-hooks/purity
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
  }, [onDismiss, paused, dismissPolicy]);

  const handleOpen = () => {
    onDismiss();

    if (isExternal) {
      window.location.assign(safeActionHref);
      return;
    }

    router.push(safeActionHref);
  };

  return (
    <div
      role={isUrgentTier ? "alert" : "status"}
      aria-live={isUrgentTier ? "assertive" : "polite"}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      className="acct-signal-card pointer-events-auto relative overflow-hidden rounded-[1.35rem] border bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(248,245,236,0.98))] shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl transition motion-reduce:transition-none dark:bg-[linear-gradient(145deg,rgba(18,24,33,0.96),rgba(24,30,41,0.98))]"
      style={{
        borderColor: isUrgentTier
          ? `color-mix(in srgb, var(${severityStyle.colorVar}) 35%, transparent)`
          : "var(--acct-line)",
        borderLeft: `3px solid var(${severityStyle.colorVar})`,
        backgroundColor: isUrgentTier
          ? `color-mix(in srgb, var(${severityStyle.softVar}) 55%, var(--acct-bg-elevated))`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--acct-line)]/60 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: `var(${severityStyle.softVar})`,
                color: `var(${severityStyle.colorVar})`,
              }}
            >
              <span className="inline-flex items-center" aria-label={t(severityStyle.label)}>
                <severityStyle.Icon size={10} />
              </span>
              {t(severityStyle.label)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--acct-gold-soft)] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-gold)]">
              <span className="inline-flex items-center" aria-hidden>
                <HenryCoBell size={10} />
              </span>
              {t("New")}
            </span>
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

      {/* Plain-text rendering only — never dangerouslySetInnerHTML.
          The publisher rejects HTML/control chars at insert time, but the
          toast treats incoming data as untrusted text. */}
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
