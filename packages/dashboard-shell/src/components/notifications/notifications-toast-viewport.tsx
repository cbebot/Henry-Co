"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { X } from "lucide-react";
import {
  createSeverityResolver,
  soundVariantFor,
  type SeverityResolver,
} from "@henryco/notifications-ui/severity-style";
import {
  ACCOUNT_NOTIFICATION_TOKENS,
  type SeverityTokens,
} from "@henryco/notifications-ui/tokens";
import { isSafeNotificationDeepLink } from "@henryco/notifications-ui/deep-link";
import { signalAudio } from "@henryco/notifications-ui/chime";

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

/**
 * NotificationsToastViewport — shell-wide live toast strip.
 *
 * Anchored bottom-right desktop / bottom mobile. Renders newly-arrived
 * unread signals as transient toasts.
 *
 * Interaction model (the "wonderful" pass):
 *   - Calm staggered ENTRY (fade + rise), smooth EXIT (fade + collapse) —
 *     no abrupt pop in/out.
 *   - A hairline PROGRESS BAR is the dismissal clock: its `animationend`
 *     fires the dismiss, so the bar and the timer can never desync. Hover
 *     / focus PAUSES it (and resumes on leave) — read without losing it.
 *   - Standardized, shorter dwell ladder (severity-style.autoDismissMs);
 *     security never auto-dismisses (must be seen) — it shows no bar.
 *   - Severity-aware chime + a subtle haptic on arrival, gated by the
 *     user's prefs and silenced in quiet hours. The AudioContext is
 *     unlocked once on the first page gesture (autoplay policy).
 *   - Honors prefers-reduced-motion (entry/exit collapse to an opacity
 *     fade; the functional progress indicator stays).
 *
 * Honors: in_app_toast_enabled, high_priority_only, muted_divisions,
 * muted_event_types, email_dispatched_at (dim), quiet_hours_* (dim + mute
 * sound). Tracks IDs already toasted this session so a row isn't
 * re-toasted on refresh.
 */

// At most TWO toasts are ever on screen at once — a calm cap, not a
// stack. Newer arrivals beyond the cap wait in the queue (MAX_QUEUE) and
// promote into view automatically as the visible ones dismiss, so nothing
// is lost and the corner never floods. (Was 3 → owner-flagged as too many
// popping out at once.)
const VISIBLE_LIMIT = 2;
const MAX_QUEUE = 6;
/** Exit animation window before the row is removed from state. */
const EXIT_MS = 240;

const STYLE_ID = "hc-toast-viewport-style";

const TOAST_CSS = `
@keyframes hcToastIn {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0)    scale(1);     }
}
@keyframes hcToastOut {
  from { opacity: 1; transform: translateY(0) scale(1); max-height: 16rem; }
  to   { opacity: 0; transform: translateY(4px) scale(0.985); max-height: 0; margin-bottom: -0.5rem; }
}
@keyframes hcToastFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes hcToastProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.hc-toast { will-change: transform, opacity; }
/* backwards (not both): covers the staggered entry delay without a flash, then
   releases transform/opacity to the element's own styles so the hover-lift and
   quiet-hours dim aren't frozen by the animation's fill. */
.hc-toast-in  { animation: hcToastIn 260ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.hc-toast-out { animation: hcToastOut ${EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both; }
.hc-toast-progress {
  animation-name: hcToastProgress;
  animation-timing-function: linear;
  animation-fill-mode: both;
  transform-origin: left center;
}
@media (prefers-reduced-motion: reduce) {
  .hc-toast-in  { animation: none; opacity: 1; transform: none; }
  .hc-toast-out { animation: hcToastFadeOut ${EXIT_MS}ms linear both; }
}
`;

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
  /** ms until auto-dismiss; null = persistent (security). */
  dismissMs: number | null;
  /** True once dismissal has been requested — plays the exit animation. */
  leaving: boolean;
};

export function NotificationsToastViewport({
  audience = "customer",
  tokens = ACCOUNT_NOTIFICATION_TOKENS,
  t = (s) => s,
}: NotificationsToastViewportProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const resolver = useMemo(() => createSeverityResolver(tokens), [tokens]);
  const { signals } = useNotificationSignal({
    audience,
    visibleOnly: true,
    unreadOnly: true,
    limit: 8,
  });
  const [active, setActive] = useState<ActiveToast[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const hasMountedRef = useRef(false);
  const exitTimers = useRef<Map<string, number>>(new Map());

  // Unlock the AudioContext on the first page gesture (Chrome/Safari autoplay
  // policy) so the very first real chime can sound. Once is enough.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let done = false;
    const cleanup = () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
    const handler = () => {
      if (done) return;
      done = true;
      void signalAudio.unlock();
      cleanup();
    };
    window.addEventListener("pointerdown", handler, { once: true, passive: true });
    window.addEventListener("keydown", handler, { once: true });
    return cleanup;
  }, []);

  // Mark the initial backlog as already-seen so it doesn't toast on mount.
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
        const sev = resolver.resolveSeverity(s.priority, s.category);
        additions.push({
          signal: s,
          receivedAt: Date.now(),
          dismissMs: resolver.autoDismissMs(sev.severity),
          leaving: false,
        });
      }
      if (additions.length === 0) return current;
      const merged = [...current];
      for (const a of additions) {
        if (merged.some((m) => m.signal.id === a.signal.id)) continue;
        merged.push(a);
      }
      return merged.slice(-MAX_QUEUE);
    });
  }, [signals, resolver]);

  // Clear any pending exit timers on unmount.
  useEffect(() => {
    const timers = exitTimers.current;
    return () => {
      for (const id of timers.values()) window.clearTimeout(id);
      timers.clear();
    };
  }, []);

  const remove = useCallback((id: string) => {
    setActive((current) => current.filter((toast) => toast.signal.id !== id));
    const timer = exitTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      exitTimers.current.delete(id);
    }
  }, []);

  // Two-phase dismissal: mark leaving (plays the exit animation), then remove
  // once the animation window has elapsed.
  const requestDismiss = useCallback(
    (id: string) => {
      if (exitTimers.current.has(id)) return; // already leaving
      setActive((current) =>
        current.map((toast) =>
          toast.signal.id === id ? { ...toast, leaving: true } : toast,
        ),
      );
      const timer = window.setTimeout(() => remove(id), EXIT_MS);
      exitTimers.current.set(id, timer);
    },
    [remove],
  );

  const ordered = useMemo(
    () => [...active].sort((a, b) => b.receivedAt - a.receivedAt),
    [active],
  );
  const visible = ordered.slice(0, VISIBLE_LIMIT);

  if (visible.length === 0) return null;

  return (
    <>
      <style id={STYLE_ID} dangerouslySetInnerHTML={{ __html: TOAST_CSS }} />
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
            onDismiss={() => requestDismiss(toast.signal.id)}
            t={tt}
          />
        ))}
      </div>
    </>
  );
}

type ToastCardProps = {
  toast: ActiveToast;
  index: number;
  resolver: SeverityResolver;
  onDismiss: () => void;
  t: (key: string) => string;
};

function ToastCard({ toast, index, resolver, onDismiss, t }: ToastCardProps) {
  const renderState = useSignalRenderState(toast.signal);
  const { markReadLocally, preferences } = useRealtime();
  // Pointer/keyboard dwell: pauses the progress clock AND lifts the card.
  const [paused, setPaused] = useState(false);
  const sev = resolver.resolveSeverity(toast.signal.priority, toast.signal.category);
  const isUrgent = sev.severity === "urgent" || sev.severity === "security";

  // Arrival feedback — once per toast, only when it actually shows and not in
  // quiet hours. Chime + a subtle haptic, each behind its own preference.
  useEffect(() => {
    if (renderState.toastSuppressed || renderState.inQuiet) return;
    if (preferences.notification_sound_enabled) {
      signalAudio.playChime(soundVariantFor(sev.severity));
    }
    if (
      preferences.notification_vibration_enabled &&
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      navigator.vibrate(isUrgent ? [12, 60, 24] : 14);
    }
    // Mount-only: a toast mounts once per signal id (stable key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (renderState.toastSuppressed) {
    return null;
  }

  const safeDest = isSafeNotificationDeepLink(
    toast.signal.action_url || toast.signal.message_href || "",
  )
    ? toast.signal.action_url || toast.signal.message_href
    : "/notifications";

  const pause = () => setPaused(true);
  const resume = (e: FocusEvent | MouseEvent) => {
    // Keep paused while focus/pointer is still inside the card (e.g. tabbing
    // from the link to the close button).
    if (
      "relatedTarget" in e &&
      e.currentTarget instanceof Node &&
      e.relatedTarget instanceof Node &&
      e.currentTarget.contains(e.relatedTarget)
    ) {
      return;
    }
    setPaused(false);
  };

  return (
    <div
      className={`hc-toast ${toast.leaving ? "hc-toast-out" : "hc-toast-in"}`}
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      aria-atomic="false"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      style={{
        position: "relative",
        overflow: "hidden",
        pointerEvents: "auto",
        width: "min(92vw, 26rem)",
        display: "flex",
        flexDirection: "column",
        padding: "0.75rem 0.85rem",
        borderRadius: RADIUS.lg,
        border: `1px solid var(${CSS_VARS.hairline})`,
        borderLeft: `3px solid var(${sev.colorVar})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
        boxShadow: paused
          ? "0 24px 56px rgba(17,24,39,0.24)"
          : "0 18px 44px rgba(17,24,39,0.18)",
        transform: paused && !toast.leaving ? "translateY(-1px)" : "translateY(0)",
        transition:
          "box-shadow 180ms cubic-bezier(0.22,1,0.36,1), transform 180ms cubic-bezier(0.22,1,0.36,1)",
        animationDelay: toast.leaving ? "0ms" : `${index * 40}ms`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.65rem",
          // Quiet hours / already-emailed → recede, without the entry animation
          // (which controls card opacity) fighting it.
          opacity: renderState.dim ? 0.82 : 1,
        }}
      >
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
            background: paused ? `var(${CSS_VARS.surfaceSunken})` : "transparent",
            color: `var(${CSS_VARS.inkSoft})`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 160ms linear",
            ...focusVisibleStyle(),
          }}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      {toast.dismissMs !== null && !toast.leaving ? (
        <span
          aria-hidden
          className="hc-toast-progress"
          onAnimationEnd={onDismiss}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "2px",
            backgroundColor: `var(${sev.colorVar})`,
            opacity: 0.5,
            animationDuration: `${toast.dismissMs}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      ) : null}
    </div>
  );
}
