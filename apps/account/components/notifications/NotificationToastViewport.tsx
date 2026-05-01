"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight, X } from "lucide-react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import type { ToastEntry } from "@/components/notifications/NotificationSignalProvider";
import { HenryCoBell } from "./icons/HenryCoIcons";
import { isSafeNotificationDeepLink, resolveSeverity } from "./severity-style";

const VISIBLE_LIMIT = 3;

type Props = {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
  onPin: (id: string) => void;
};

function SourceMark({
  source,
  sourceLabel,
}: {
  source: ToastEntry["notification"]["source"];
  sourceLabel: string;
}) {
  if (source.logoUrl) {
    return (
      <Image
        src={source.logoUrl}
        alt=""
        aria-hidden
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-2xl border border-[var(--acct-line)] object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[0.7rem] font-bold text-white"
      style={{ backgroundColor: source.accent }}
      aria-hidden
    >
      {sourceLabel.charAt(0).toUpperCase()}
    </div>
  );
}

export default function NotificationToastViewport({ toasts, onDismiss, onPin }: Props) {
  const router = useRouter();
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // Newest at the top of the visual stack — slice to the visible limit.
  const ordered = useMemo(() => {
    return [...toasts].sort((a, b) => b.receivedAt - a.receivedAt);
  }, [toasts]);

  const visible = ordered.slice(0, VISIBLE_LIMIT);
  const overflowCount = ordered.length - visible.length;

  if (visible.length === 0) return null;

  const navigateSafely = (href: string) => {
    if (!isSafeNotificationDeepLink(href)) {
      router.push("/notifications");
      return;
    }
    if (/^https?:\/\//i.test(href)) {
      window.location.assign(href);
      return;
    }
    router.push(href);
  };

  return (
    <div
      className="acct-signal-viewport pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 1rem, 1.25rem)",
      }}
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="false"
    >
      {visible.map((entry, index) => (
        <ToastCard
          key={entry.notification.id}
          entry={entry}
          index={index}
          onDismiss={() => onDismiss(entry.notification.id)}
          onPin={() => onPin(entry.notification.id)}
          onActivate={() => {
            const href = entry.notification.action_url || entry.notification.message_href;
            onDismiss(entry.notification.id);
            navigateSafely(href);
          }}
          locale={locale}
          t={t}
        />
      ))}

      {overflowCount > 0 ? (
        <Link
          href="/notifications"
          className="acct-signal-overflow pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)]/95 px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--acct-muted)] shadow-[0_4px_14px_rgba(17,24,39,0.10)] backdrop-blur transition hover:text-[var(--acct-ink)]"
          onClick={() => {
            // Clear the visible queue when the user opens the full feed —
            // the toast strip should not stay up after navigation.
            for (const entry of ordered) onDismiss(entry.notification.id);
          }}
        >
          <span className="text-[var(--acct-muted)]" aria-hidden>
            <HenryCoBell size={12} />
          </span>
          {t("View notifications")} ({overflowCount > 9 ? "9+" : overflowCount})
          <ChevronRight size={12} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

type ToastCardProps = {
  entry: ToastEntry;
  index: number;
  onDismiss: () => void;
  onPin: () => void;
  onActivate: () => void;
  locale: string;
  t: (text: string) => string;
};

function ToastCard({ entry, index, onDismiss, onPin, onActivate, t }: ToastCardProps) {
  const sourceLabel = entry.notification.source.label;
  const severityStyle = resolveSeverity(
    entry.notification.priority,
    entry.notification.category,
  );
  const isUrgentTier = severityStyle.severity === "urgent" || severityStyle.severity === "security";

  return (
    <div
      role={isUrgentTier ? "alert" : "status"}
      className="acct-signal-card pointer-events-auto w-full max-w-[26rem] origin-bottom rounded-[1.25rem] border bg-[var(--acct-bg-elevated)] shadow-[0_18px_44px_rgba(17,24,39,0.18)] transition will-change-transform"
      style={{
        animationDelay: `${index * 30}ms`,
        borderColor: isUrgentTier ? `color-mix(in srgb, var(${severityStyle.colorVar}) 35%, transparent)` : "var(--acct-line)",
        borderLeft: `3px solid var(${severityStyle.colorVar})`,
        backgroundColor: isUrgentTier ? `color-mix(in srgb, var(${severityStyle.softVar}) 65%, var(--acct-bg-elevated))` : undefined,
      }}
      onMouseEnter={onPin}
      onFocus={onPin}
    >
      <div className="flex items-start gap-3 px-3.5 py-3 sm:gap-4 sm:px-4">
        <SourceMark source={entry.notification.source} sourceLabel={sourceLabel} />
        <button
          type="button"
          onClick={onActivate}
          className="acct-signal-activate min-w-0 flex-1 rounded-xl text-start outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--acct-gold)]/35"
          aria-label={`${t("Open notification")}: ${entry.notification.title}`}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center"
              style={{ color: `var(${severityStyle.colorVar})` }}
              aria-label={t(severityStyle.label)}
            >
              <severityStyle.Icon size={14} />
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
              style={{
                backgroundColor: `${entry.notification.source.accent}1A`,
                color: entry.notification.source.accent,
              }}
            >
              {sourceLabel}
            </span>
            {isUrgentTier ? (
              <span
                className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: `var(${severityStyle.softVar})`,
                  color: `var(${severityStyle.colorVar})`,
                }}
              >
                {t(severityStyle.label)}
              </span>
            ) : null}
          </div>
          {/* Plain text rendering — never dangerouslySetInnerHTML. The
              publisher shim already rejects HTML/control chars in title
              and body, but this surface treats them as text in any case. */}
          <p className="mt-1.5 truncate text-sm font-semibold text-[var(--acct-ink)]">
            {entry.notification.title}
          </p>
          {entry.notification.body ? (
            <p className="mt-0.5 line-clamp-2 text-[0.825rem] leading-5 text-[var(--acct-muted)]">
              {entry.notification.body}
            </p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("Dismiss notification")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--acct-muted)] transition hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--acct-gold)]/35"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
