"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
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
  useSignalRenderState,
} from "../../shell/realtime-hooks";
import type {
  RealtimeSignal,
  SignalAudience,
} from "../../shell/realtime-types";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";
import { MOTION_PRESET } from "../../tokens/motion";

/**
 * NotificationsToastViewport — shell-wide live toast strip.
 *
 * Anchored bottom-right desktop / bottom mobile (audit §A.8 + master
 * §C.10 #9 — mobile = different layout). Renders newly-arrived
 * unread signals as transient toasts that auto-dismiss after a
 * severity-aware delay.
 *
 * Honors:
 *   - in_app_toast_enabled (master toggle off → no toasts)
 *   - high_priority_only   (only urgent + security toast)
 *   - muted_divisions / muted_event_types (suppress per source)
 *   - email_dispatched_at  (dim if email already sent)
 *   - quiet_hours_*        (dim toast styling, do not suppress)
 *
 * Tracks IDs already toasted in this session so the same row isn't
 * re-toasted on every refresh.
 */

const VISIBLE_LIMIT = 3;
const MAX_QUEUE = 6;

export type NotificationsToastViewportProps = {
  /** Customer or staff. Defaults to customer. */
  audience?: SignalAudience;
  /** Token scheme — default ACCOUNT_NOTIFICATION_TOKENS. */
  tokens?: SeverityTokens;
  /** Optional translation function. */
  t?: (key: string) => string;
};

type ActiveToast = {
  signal: RealtimeSignal;
  receivedAt: number;
  pinned: boolean;
};

export function NotificationsToastViewport({
  audience = "customer",
  tokens = ACCOUNT_NOTIFICATION_TOKENS,
  t = (s) => s,
}: NotificationsToastViewportProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const resolver = createSeverityResolver(tokens);
  const { signals } = useNotificationSignal({
    audience,
    visibleOnly: true,
    unreadOnly: true,
    limit: 8,
  });
  const [active, setActive] = useState<ActiveToast[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  // Mark all initially-known signals as already seen on first render so
  // the backlog (rows that existed before this tab loaded) doesn't toast
  // on mount.
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      for (const s of signals) seenRef.current.add(s.id);
      hasMountedRef.current = true;
      return;
    }
    setActive((current) => {
      const additions: ActiveToast[] = [];
      for (const s of signals) {
        if (seenRef.current.has(s.id)) continue;
        seenRef.current.add(s.id);
        additions.push({ signal: s, receivedAt: Date.now(), pinned: false });
      }
      if (additions.length === 0) return current;
      const merged = [...current];
      for (const a of additions) {
        if (merged.some((m) => m.signal.id === a.signal.id)) continue;
        merged.push(a);
      }
      return merged.slice(-MAX_QUEUE);
    });
  }, [signals]);

  // Auto-dismiss schedule per toast.
  useEffect(() => {
    const timers: number[] = [];
    for (const toast of active) {
      if (toast.pinned) continue;
      const sev = resolver.resolveSeverity(toast.signal.priority, toast.signal.category);
      const dismissMs = resolver.autoDismissMs(sev.severity);
      if (dismissMs === null) continue;
      const elapsed = Date.now() - toast.receivedAt;
      const remaining = Math.max(0, dismissMs - elapsed);
      const id = window.setTimeout(() => {
        setActive((current) => current.filter((t) => t.signal.id !== toast.signal.id));
      }, remaining);
      timers.push(id);
    }
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [active, resolver]);

  const dismiss = useCallback((id: string) => {
    setActive((current) => current.filter((t) => t.signal.id !== id));
  }, []);

  const pin = useCallback((id: string) => {
    setActive((current) =>
      current.map((t) => (t.signal.id === id ? { ...t, pinned: true } : t)),
    );
  }, []);

  const ordered = useMemo(
    () => [...active].sort((a, b) => b.receivedAt - a.receivedAt),
    [active],
  );
  const visible = ordered.slice(0, VISIBLE_LIMIT);

  if (visible.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={tt("New activity")}
      style={{
        position: "fixed",
        zIndex: 80,
        right: "1rem",
        bottom: "1rem",
        left: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.5rem",
        pointerEvents: "none",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 0.5rem, 0.5rem)",
      }}
    >
      {visible.map((toast, index) => (
        <ToastCard
          key={toast.signal.id}
          toast={toast}
          index={index}
          resolver={resolver}
          onDismiss={() => dismiss(toast.signal.id)}
          onPin={() => pin(toast.signal.id)}
          t={tt}
        />
      ))}
    </div>
  );
}

type ToastCardProps = {
  toast: ActiveToast;
  index: number;
  resolver: SeverityResolver;
  onDismiss: () => void;
  onPin: () => void;
  t: (key: string) => string;
};

function ToastCard({ toast, index, resolver, onDismiss, onPin, t }: ToastCardProps) {
  const renderState = useSignalRenderState(toast.signal);
  const { markReadLocally } = useRealtime();
  const sev = resolver.resolveSeverity(toast.signal.priority, toast.signal.category);
  const isUrgent = sev.severity === "urgent" || sev.severity === "security";

  if (renderState.toastSuppressed) {
    return null;
  }

  const safeDest = isSafeNotificationDeepLink(
    toast.signal.action_url || toast.signal.message_href || "",
  )
    ? toast.signal.action_url || toast.signal.message_href
    : "/notifications";

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      aria-atomic="false"
      onMouseEnter={onPin}
      onFocus={onPin}
      style={{
        pointerEvents: "auto",
        width: "min(92vw, 26rem)",
        display: "flex",
        flexDirection: "column",
        padding: "0.75rem 0.85rem",
        borderRadius: RADIUS.lg,
        border: `1px solid var(${CSS_VARS.hairline})`,
        borderLeft: `3px solid var(${sev.colorVar})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
        boxShadow: "0 18px 44px rgba(17,24,39,0.18)",
        transform: `translateY(0)`,
        animationDelay: `${index * 30}ms`,
        animation: `${MOTION_PRESET.surfaceEntry.keyframes} ${MOTION_PRESET.surfaceEntry.duration}ms ${MOTION_PRESET.surfaceEntry.easing}`,
        opacity: renderState.dim ? 0.85 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
        <span
          aria-hidden
          style={{
            color: `var(${sev.colorVar})`,
            display: "inline-flex",
            paddingTop: "0.15rem",
          }}
        >
          <sev.Icon size={16} />
        </span>
        <a
          href={safeDest}
          onClick={() => {
            if (!toast.signal.is_read) markReadLocally(toast.signal.id);
            onDismiss();
          }}
          style={{
            flex: 1,
            minWidth: 0,
            color: `var(${CSS_VARS.ink})`,
            textDecoration: "none",
            ...focusVisibleStyle(),
          }}
          aria-label={`${t("Open notification")}: ${toast.signal.title}`}
        >
          <p
            style={{
              ...typeStyle("bodyStrong"),
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {toast.signal.title}
          </p>
          {toast.signal.body ? (
            <p
              style={{
                ...typeStyle("small"),
                margin: "0.25rem 0 0",
                color: `var(${CSS_VARS.inkSoft})`,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {toast.signal.body}
            </p>
          ) : null}
          {toast.signal.email_dispatched_at ? (
            <p
              style={{
                ...typeStyle("small"),
                margin: "0.25rem 0 0",
                color: `var(${CSS_VARS.inkSoft})`,
                fontSize: "0.62rem",
                opacity: 0.7,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {t("Email also sent")}
            </p>
          ) : null}
        </a>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("Dismiss notification")}
          style={{
            width: "1.6rem",
            height: "1.6rem",
            borderRadius: RADIUS.pill,
            border: "none",
            background: "transparent",
            color: `var(${CSS_VARS.inkSoft})`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            ...focusVisibleStyle(),
          }}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
