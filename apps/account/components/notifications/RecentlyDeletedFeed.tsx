"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatSurfaceTemplate,
  translateSurfaceLabel,
  useHenryCoLocale,
  type AppLocale,
} from "@henryco/i18n";
import {
  DeleteForeverIcon,
  EmptyStateGlyph,
  RestoreIcon,
} from "@henryco/notifications-ui";
import type { EnrichedNotification } from "@/lib/account-data";
import { timeAgoLocalized } from "@/lib/format";
import { divisionAccentVar, resolveSeverity } from "./severity-style";

const PURGE_AFTER_DAYS = 30;

type ActionState =
  | { kind: "idle" }
  | { kind: "pending"; id: string; action: "restore" | "purge" }
  | { kind: "confirm-purge"; id: string }
  | { kind: "error"; id: string; message: string };

function daysUntilPurge(deletedAtIso: string | null | undefined): number | null {
  if (!deletedAtIso) return null;
  const deletedAt = new Date(deletedAtIso).getTime();
  if (!Number.isFinite(deletedAt)) return null;
  const now = Date.now();
  const elapsedDays = (now - deletedAt) / (1000 * 60 * 60 * 24);
  const remaining = Math.max(0, PURGE_AFTER_DAYS - Math.floor(elapsedDays));
  return remaining;
}

function SourceMark({
  notification,
  sourceLabel,
}: {
  notification: EnrichedNotification;
  sourceLabel: string;
}) {
  const source = notification.source;
  if (source.logoUrl) {
    return (
      <Image
        src={source.logoUrl}
        alt={sourceLabel}
        width={36}
        height={36}
        className="rounded-2xl border border-[var(--acct-line)] object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-bold text-white"
      style={{ backgroundColor: source.accent }}
      aria-hidden
    >
      {sourceLabel.charAt(0).toUpperCase()}
    </div>
  );
}

function RecentlyDeletedRow({
  notification,
  locale,
  state,
  onRestore,
  onConfirmPurge,
  onCancelPurge,
  onPurge,
  t,
}: {
  notification: EnrichedNotification;
  locale: AppLocale;
  state: ActionState;
  onRestore: (id: string) => void;
  onConfirmPurge: (id: string) => void;
  onCancelPurge: () => void;
  onPurge: (id: string) => void;
  t: (text: string) => string;
}) {
  const sourceLabel = translateSurfaceLabel(locale, notification.source.label);
  const severityStyle = resolveSeverity(
    (notification as { priority?: string | null }).priority,
    (notification as { category?: string | null }).category,
  );
  const divisionVar = divisionAccentVar(notification.source.key);
  const id = String(notification.id);
  const deletedAt = (notification as { deleted_at?: string | null }).deleted_at;
  const purgeIn = daysUntilPurge(deletedAt);
  const pendingHere =
    state.kind === "pending" && state.id === id ? state.action : null;
  const showConfirm = state.kind === "confirm-purge" && state.id === id;
  const errorHere =
    state.kind === "error" && state.id === id ? state.message : null;

  return (
    <article
      className="rounded-[1.55rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-4 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md"
      style={{
        borderLeftWidth: 3,
        borderLeftStyle: "solid",
        borderLeftColor: `var(${divisionVar})`,
      }}
    >
      <div className="flex items-start gap-4">
        <SourceMark notification={notification} sourceLabel={sourceLabel} />
        <div className="min-w-0 flex-1 space-y-3">
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
            <span className="ml-auto text-[0.7rem] font-medium text-[var(--acct-muted)]">
              {deletedAt
                ? formatSurfaceTemplate(t("Deleted {when}"), {
                    when: timeAgoLocalized(deletedAt, locale),
                  })
                : t("Recently deleted")}
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--acct-ink)]">
            {String(notification.title || "")}
          </p>
          {notification.body ? (
            <p className="text-sm leading-6 text-[var(--acct-muted)]">
              {String(notification.body)}
            </p>
          ) : null}
          {purgeIn !== null ? (
            <p className="text-xs text-[var(--acct-muted)]">
              {purgeIn === 0
                ? t("Will be permanently removed in the next purge cycle.")
                : formatSurfaceTemplate(
                    t(
                      purgeIn === 1
                        ? "Permanently removed in {days} day."
                        : "Permanently removed in {days} days.",
                    ),
                    { days: purgeIn },
                  )}
            </p>
          ) : null}
          {errorHere ? (
            <p className="rounded-2xl bg-[var(--acct-red-soft)] px-3 py-2 text-xs font-semibold text-[var(--acct-red)]">
              {errorHere}
            </p>
          ) : null}
          {showConfirm ? (
            <div
              role="alertdialog"
              aria-label={t("Confirm permanent deletion")}
              className="flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--acct-red-soft)] px-3 py-3"
            >
              <p className="text-xs font-semibold text-[var(--acct-red)]">
                {t("Permanently delete this notification? This cannot be undone.")}
              </p>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => onCancelPurge()}
                  className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-1.5 text-[0.7rem] font-semibold text-[var(--acct-ink)] transition hover:bg-[var(--acct-surface)]"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => onPurge(id)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--acct-red)] px-3 py-1.5 text-[0.7rem] font-semibold text-white transition hover:bg-[var(--acct-red)]/90"
                >
                  <DeleteForeverIcon size={12} /> {t("Delete forever")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onRestore(id)}
                disabled={pendingHere !== null}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--acct-muted)] transition hover:border-[var(--acct-gold)]/30 hover:text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RestoreIcon size={13} />
                {pendingHere === "restore" ? t("Restoring...") : t("Restore")}
              </button>
              <button
                type="button"
                onClick={() => onConfirmPurge(id)}
                disabled={pendingHere !== null}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--acct-red)] transition hover:border-[var(--acct-red)]/30 hover:bg-[var(--acct-red-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <DeleteForeverIcon size={13} />
                {pendingHere === "purge" ? t("Removing...") : t("Delete forever")}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function RecentlyDeletedFeed({
  notifications,
}: {
  notifications: EnrichedNotification[];
}) {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ kind: "idle" });

  const sortedNotifications = useMemo(() => notifications, [notifications]);

  const localizeError = useCallback(
    (message: string) => {
      const candidate = String(message || "").trim();
      if (!candidate) return t("Notification update failed.");
      const translated = t(candidate);
      return translated !== candidate ? translated : t("Notification update failed.");
    },
    [t],
  );

  const onRestore = useCallback(
    async (id: string) => {
      setState({ kind: "pending", id, action: "restore" });
      try {
        const response = await fetch(
          `/api/notifications/${encodeURIComponent(id)}/restore`,
          { method: "POST", credentials: "same-origin" },
        );
        if (!response.ok) {
          const payload = (await response
            .json()
            .catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Unable to restore notification.");
        }
        setState({ kind: "idle" });
        router.refresh();
      } catch (error) {
        setState({
          kind: "error",
          id,
          message: localizeError(
            error instanceof Error ? error.message : "Unable to restore notification.",
          ),
        });
      }
    },
    [localizeError, router],
  );

  const onPurge = useCallback(
    async (id: string) => {
      setState({ kind: "pending", id, action: "purge" });
      try {
        const response = await fetch(
          `/api/notifications/${encodeURIComponent(id)}/purge`,
          { method: "POST", credentials: "same-origin" },
        );
        if (!response.ok) {
          const payload = (await response
            .json()
            .catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Unable to permanently remove notification.");
        }
        setState({ kind: "idle" });
        router.refresh();
      } catch (error) {
        setState({
          kind: "error",
          id,
          message: localizeError(
            error instanceof Error
              ? error.message
              : "Unable to permanently remove notification.",
          ),
        });
      }
    },
    [localizeError, router],
  );

  const onConfirmPurge = useCallback(
    (id: string) => setState({ kind: "confirm-purge", id }),
    [],
  );
  const onCancelPurge = useCallback(() => setState({ kind: "idle" }), []);

  if (sortedNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[1.6rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-8 py-14 text-center">
        <span className="text-[var(--acct-muted)]" aria-hidden>
          <EmptyStateGlyph size={56} />
        </span>
        <p className="acct-display text-base text-[var(--acct-ink)]">
          {t("Nothing in recently deleted.")}
        </p>
        <p className="max-w-sm text-xs leading-6 text-[var(--acct-muted)]">
          {t(
            "Notifications you delete from your inbox land here for 30 days before being permanently removed.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedNotifications.map((notification) => (
        <RecentlyDeletedRow
          key={String(notification.id)}
          notification={notification}
          locale={locale}
          state={state}
          onRestore={onRestore}
          onConfirmPurge={onConfirmPurge}
          onCancelPurge={onCancelPurge}
          onPurge={onPurge}
          t={t}
        />
      ))}
    </div>
  );
}
