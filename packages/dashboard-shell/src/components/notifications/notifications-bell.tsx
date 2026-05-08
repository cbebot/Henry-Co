"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HenryCoBell } from "@henryco/notifications-ui/icons";
import {
  createSeverityResolver,
  type SeverityResolver,
} from "@henryco/notifications-ui/severity-style";
import {
  ACCOUNT_NOTIFICATION_TOKENS,
  type SeverityTokens,
} from "@henryco/notifications-ui/tokens";
import { isSafeNotificationDeepLink } from "@henryco/notifications-ui/deep-link";

import {
  useNotificationSignal,
  useRealtime,
  useUnreadCount,
} from "../../shell/realtime-hooks";
import type {
  RealtimeSignal,
  SignalAudience,
} from "../../shell/realtime-types";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";
import { NotificationCard } from "./notification-card";

/**
 * NotificationsBell — shell-wide bell + popover.
 *
 * Promotes the audience-agnostic primitives (V2-NOT-02-A) into a
 * shell-level surface that any app can mount via the IdentityBar's
 * trailing slot. Closes audit §A.3-1 / §C.10 #6: the bell is no longer
 * locked inside `apps/account/components/notifications`.
 *
 * The bell consumes `useNotificationSignal()` + `useUnreadCount()` —
 * NEVER subscribes to Realtime directly (anti-pattern #9). The host
 * app supplies the Supabase client + viewer to the parent
 * SupabaseRealtimeProvider; the bell just reads.
 */

export type NotificationsBellProps = {
  /** Customer or staff. Defaults to customer. */
  audience?: SignalAudience;
  /** Token scheme (apps/account passes ACCOUNT_NOTIFICATION_TOKENS). */
  tokens?: SeverityTokens;
  /** Where the "View all" link points. Default: `/notifications`. */
  viewAllHref?: string;
  /** Where the "Recently deleted" link points. */
  recentlyDeletedHref?: string;
  /** Where the "Manage preferences" link points. */
  preferencesHref?: string;
  /** Pop-over alignment. Default: right. */
  align?: "left" | "right";
  /**
   * Lifecycle action endpoint factory. Default builds
   * `/api/notifications/{id}/{action}` matching apps/account.
   */
  actionEndpoint?: (id: string, action: "read" | "unread" | "archive" | "delete") => string;
  /** Optional translation function for visible strings. */
  t?: (key: string) => string;
};

const DEFAULT_ENDPOINT: NonNullable<NotificationsBellProps["actionEndpoint"]> = (id, action) => {
  return action === "delete"
    ? `/api/notifications/${encodeURIComponent(id)}`
    : `/api/notifications/${encodeURIComponent(id)}/${action}`;
};

export function NotificationsBell(props: NotificationsBellProps) {
  const {
    audience = "customer",
    tokens = ACCOUNT_NOTIFICATION_TOKENS,
    viewAllHref = "/notifications",
    recentlyDeletedHref = "/notifications/recently-deleted",
    preferencesHref = "/settings#notification-signal-preferences",
    align = "right",
    actionEndpoint = DEFAULT_ENDPOINT,
    t = (s: string) => s,
  } = props;

  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const resolver: SeverityResolver = createSeverityResolver(tokens);
  const { signals, loading } = useNotificationSignal({
    audience,
    visibleOnly: true,
    limit: 8,
  });
  const unreadCount = useUnreadCount(audience);
  const { markReadLocally, refresh } = useRealtime();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const highest = resolver.highestSeverity(
    signals.map((s) => ({
      priority: s.priority,
      category: s.category,
      is_read: s.is_read,
    })),
  );
  const badgeColor = resolver.badgeColorVar(highest);
  const displayCount = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const performAction = useCallback(
    async (signal: RealtimeSignal, action: "read" | "unread" | "archive" | "delete") => {
      if (action === "read") markReadLocally(signal.id);
      const url = actionEndpoint(signal.id, action);
      const method = action === "delete" ? "DELETE" : "POST";
      try {
        await fetch(url, { method, credentials: "same-origin" });
      } finally {
        await refresh();
      }
    },
    [actionEndpoint, markReadLocally, refresh],
  );

  const handleActivate = useCallback(
    (signal: RealtimeSignal) => {
      const dest = signal.action_url || signal.message_href || viewAllHref;
      const safeDest = isSafeNotificationDeepLink(dest) ? dest : viewAllHref;
      if (!signal.is_read) {
        markReadLocally(signal.id);
        fetch(actionEndpoint(signal.id, "read"), { method: "POST" }).catch(() => undefined);
      }
      setOpen(false);
      if (typeof window !== "undefined") {
        if (/^https?:\/\//i.test(safeDest)) window.location.assign(safeDest);
        else window.location.href = safeDest;
      }
    },
    [markReadLocally, actionEndpoint, viewAllHref],
  );

  const summary =
    unreadCount > 0
      ? unreadCount === 1
        ? tt("1 item needs your attention")
        : `${unreadCount} ${tt("items need your attention")}`
      : tt("You are caught up for now");

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `${tt("Notifications")} — ${unreadCount} ${tt("unread")}`
            : tt("Notifications")
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: RADIUS.pill,
          background: "transparent",
          border: `1px solid var(${CSS_VARS.hairline})`,
          color: `var(${CSS_VARS.ink})`,
          cursor: "pointer",
          ...focusVisibleStyle(),
        }}
      >
        <HenryCoBell size={18} />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "-0.3rem",
              right: "-0.3rem",
              minWidth: "18px",
              height: "18px",
              padding: "0 5px",
              borderRadius: "9999px",
              backgroundColor: `var(${badgeColor})`,
              color: "#fff",
              fontSize: "0.62rem",
              fontWeight: 700,
              lineHeight: "18px",
              textAlign: "center",
              boxShadow: `0 0 0 2px var(${CSS_VARS.surface})`,
            }}
          >
            {displayCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={tt("Notifications")}
          style={{
            position: "absolute",
            zIndex: 200,
            top: "calc(100% + 0.5rem)",
            ...(align === "left" ? { left: 0 } : { right: 0 }),
            width: "min(92vw, 24rem)",
            maxHeight: "32rem",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: RADIUS.lg,
            border: `1px solid var(${CSS_VARS.hairline})`,
            backgroundColor: `var(${CSS_VARS.surface})`,
            boxShadow: "0 22px 70px rgba(17,24,39,0.18)",
          }}
        >
          <div
            style={{
              padding: "0.9rem 1rem",
              borderBottom: `1px solid var(${CSS_VARS.hairline})`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div>
              <p
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.inkSoft})`,
                  margin: 0,
                }}
              >
                {tt("Notifications")}
              </p>
              <p
                style={{
                  ...typeStyle("bodyStrong"),
                  color: `var(${CSS_VARS.ink})`,
                  margin: "0.2rem 0 0",
                }}
              >
                {summary}
              </p>
            </div>
            <a
              href={viewAllHref}
              onClick={() => setOpen(false)}
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: `var(${CSS_VARS.inkSoft})`,
                textDecoration: "none",
              }}
            >
              {tt("View all")}
            </a>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {loading && signals.length === 0 ? (
              <BellLoading />
            ) : signals.length === 0 ? (
              <BellEmptyState t={tt} />
            ) : (
              signals.map((signal) => (
                <NotificationCard
                  key={signal.id}
                  signal={signal}
                  tokens={tokens}
                  onActivate={() => handleActivate(signal)}
                  onAction={(action) => performAction(signal, action)}
                  t={tt}
                />
              ))
            )}
          </div>

          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: `1px solid var(${CSS_VARS.hairline})`,
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <a
              href={recentlyDeletedHref}
              onClick={() => setOpen(false)}
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: `var(${CSS_VARS.inkSoft})`,
                textDecoration: "none",
              }}
            >
              {tt("Recently deleted")}
            </a>
            <a
              href={preferencesHref}
              onClick={() => setOpen(false)}
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: `var(${CSS_VARS.inkSoft})`,
                textDecoration: "none",
              }}
            >
              {tt("Preferences")}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BellLoading() {
  return (
    <div style={{ padding: "1rem 0.5rem" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.65rem 0.5rem",
            borderRadius: RADIUS.lg,
            backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
            opacity: 0.5,
            marginBottom: "0.4rem",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: RADIUS.md,
              backgroundColor: `var(${CSS_VARS.hairline})`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 8,
                width: "50%",
                borderRadius: 4,
                backgroundColor: `var(${CSS_VARS.hairline})`,
              }}
            />
            <div
              style={{
                marginTop: 6,
                height: 8,
                width: "90%",
                borderRadius: 4,
                backgroundColor: `var(${CSS_VARS.hairline})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BellEmptyState({ t }: { t: (s: string) => string }) {
  return (
    <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
      <p
        style={{
          ...typeStyle("kicker"),
          color: `var(${CSS_VARS.inkSoft})`,
          margin: 0,
        }}
      >
        {/* TODO V2-COPY-01: review */}
        {t("Inbox")}
      </p>
      <p
        style={{
          ...typeStyle("bodyStrong"),
          color: `var(${CSS_VARS.ink})`,
          margin: "0.5rem 0 0",
        }}
      >
        {t("Nothing's waiting")}
      </p>
      <p
        style={{
          ...typeStyle("small"),
          color: `var(${CSS_VARS.inkSoft})`,
          margin: "0.35rem 0 0",
        }}
      >
        {t("Activity from across HenryCo surfaces here.")}
      </p>
    </div>
  );
}
