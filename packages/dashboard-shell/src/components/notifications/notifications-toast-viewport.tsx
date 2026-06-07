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
import {
  initialToastBaselineState,
  reduceToastBaseline,
  type ToastBaselineState,
} from "./toast-selection";
import {
  subscribeShellToast,
  type ShellToast,
  type ShellToastTone,
} from "../../shell/toast-bus";
import { useToastSwipe } from "./use-toast-swipe";

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

/** An imperative toast (from `shellToast.*`) currently on screen. */
type ImperativeActive = {
  toast: ShellToast;
  receivedAt: number;
  dismissMs: number | null;
  leaving: boolean;
};

/**
 * Map an imperative tone onto the shared 5-tier severity vocabulary so
 * imperative toasts reuse the EXACT colours + icons + dwell of the realtime
 * signal toasts (visual consistency is the whole point — one toast language).
 */
const TONE_SEVERITY: Record<ShellToastTone, string> = {
  success: "success",
  warning: "warning",
  info: "info",
  error: "urgent",
};

export function NotificationsToastViewport({
  audience = "customer",
  tokens = ACCOUNT_NOTIFICATION_TOKENS,
  t = (s) => s,
}: NotificationsToastViewportProps) {
  const tt = (key: string) => (typeof t === "function" ? t(key) : key);
  const resolver = useMemo(() => createSeverityResolver(tokens), [tokens]);
  const { signals, loading } = useNotificationSignal({
    audience,
    visibleOnly: true,
    unreadOnly: true,
    // No tight limit on purpose: the "already seen" baseline must cover the
    // FULL retained unread backlog. With a small window, an older unread row
    // sliding into view later (after a newer one is read) would be mistaken
    // for a fresh arrival and toast spuriously.
  });
  const [active, setActive] = useState<ActiveToast[]>([]);
  const baselineRef = useRef<ToastBaselineState>(initialToastBaselineState());
  const exitTimers = useRef<Map<string, number>>(new Map());
  // Imperative toasts (shellToast.*) — a parallel queue so action feedback
  // (success / error / micro-interactions) shares this viewport without
  // entangling the realtime-signal path.
  const [busActive, setBusActive] = useState<ImperativeActive[]>([]);
  const impExitTimers = useRef<Map<string, number>>(new Map());

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

  // Decide which signals are genuine post-baseline arrivals to toast. The
  // pre-existing unread backlog is captured the moment the first hydration
  // SETTLES (`loading` true→false) — never at first render, when `signals` is
  // still the provider's empty pre-fetch state. That timing bug re-toasted the
  // whole backlog on every (re)mount; see `reduceToastBaseline`.
  useEffect(() => {
    const ids = signals.map((s) => s.id);
    const { state, toast } = reduceToastBaseline(baselineRef.current, {
      loading,
      signalIds: ids,
    });
    baselineRef.current = state;
    if (toast.length === 0) return;
    setActive((current) => {
      const byId = new Map(signals.map((s) => [s.id, s] as const));
      const merged = [...current];
      for (const id of toast) {
        if (merged.some((m) => m.signal.id === id)) continue;
        const signal = byId.get(id);
        if (!signal) continue;
        const sev = resolver.resolveSeverity(signal.priority, signal.category);
        merged.push({
          signal,
          receivedAt: Date.now(),
          dismissMs: resolver.autoDismissMs(sev.severity),
          leaving: false,
        });
      }
      return merged.slice(-MAX_QUEUE);
    });
  }, [signals, loading, resolver]);

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

  // ── Imperative toasts (shellToast.*) ─────────────────────────────────
  const removeImp = useCallback((id: string) => {
    setBusActive((current) => current.filter((t) => t.toast.id !== id));
    const timer = impExitTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      impExitTimers.current.delete(id);
    }
  }, []);

  const requestDismissImp = useCallback(
    (id: string) => {
      if (impExitTimers.current.has(id)) return;
      setBusActive((current) =>
        current.map((t) => (t.toast.id === id ? { ...t, leaving: true } : t)),
      );
      const timer = window.setTimeout(() => removeImp(id), EXIT_MS);
      impExitTimers.current.set(id, timer);
    },
    [removeImp],
  );

  // Subscribe to the imperative toast bus once. New emits append (capped);
  // re-emitting the same id replaces its content in place.
  useEffect(() => {
    return subscribeShellToast((toast) => {
      setBusActive((current) => {
        const existing = current.findIndex((t) => t.toast.id === toast.id);
        if (existing !== -1) {
          const next = current.slice();
          next[existing] = {
            toast,
            receivedAt: Date.now(),
            dismissMs: toast.durationMs,
            leaving: false,
          };
          return next;
        }
        return [
          ...current,
          { toast, receivedAt: Date.now(), dismissMs: toast.durationMs, leaving: false },
        ].slice(-MAX_QUEUE);
      });
    });
  }, []);

  // Clear imperative exit timers on unmount.
  useEffect(() => {
    const timers = impExitTimers.current;
    return () => {
      for (const id of timers.values()) window.clearTimeout(id);
      timers.clear();
    };
  }, []);

  // Merge realtime-signal toasts + imperative toasts into one ordered, capped
  // strip so the corner shows a calm maximum of VISIBLE_LIMIT total.
  const ordered = useMemo(() => {
    const merged: Array<
      | { kind: "signal"; key: string; receivedAt: number; item: ActiveToast }
      | { kind: "imperative"; key: string; receivedAt: number; item: ImperativeActive }
    > = [
      ...active.map((a) => ({
        kind: "signal" as const,
        key: `sig:${a.signal.id}`,
        receivedAt: a.receivedAt,
        item: a,
      })),
      ...busActive.map((b) => ({
        kind: "imperative" as const,
        key: `imp:${b.toast.id}`,
        receivedAt: b.receivedAt,
        item: b,
      })),
    ];
    return merged.sort((a, b) => b.receivedAt - a.receivedAt);
  }, [active, busActive]);
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
        {visible.map((entry, index) =>
          entry.kind === "signal" ? (
            <ToastCard
              key={entry.key}
              toast={entry.item}
              index={index}
              resolver={resolver}
              onDismiss={() => requestDismiss(entry.item.signal.id)}
              t={tt}
            />
          ) : (
            <ImperativeToastCard
              key={entry.key}
              toast={entry.item}
              index={index}
              resolver={resolver}
              onDismiss={() => requestDismissImp(entry.item.toast.id)}
              t={tt}
            />
          ),
        )}
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
  const swipe = useToastSwipe(onDismiss, !toast.leaving);
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
      {...swipe.handlers}
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
        ...swipe.style,
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

type ImperativeToastCardProps = {
  toast: ImperativeActive;
  index: number;
  resolver: SeverityResolver;
  onDismiss: () => void;
  t: (key: string) => string;
};

/**
 * Imperative action toast (success / error / info / warning). Reuses the
 * severity resolver (via TONE_SEVERITY) so it wears the SAME colour + icon as
 * the realtime-signal toasts, plus the shared swipe-to-dismiss. No realtime
 * concerns (mark-read, quiet-hours dim, email label) — just clear feedback.
 */
function ImperativeToastCard({ toast, index, resolver, onDismiss, t }: ImperativeToastCardProps) {
  const [paused, setPaused] = useState(false);
  const swipe = useToastSwipe(onDismiss, !toast.leaving);
  const { tone, title, body, href } = toast.toast;
  const sev = resolver.resolveSeverity(TONE_SEVERITY[tone]);
  const isUrgent = tone === "error";
  const safeDest = href && isSafeNotificationDeepLink(href) ? href : null;

  const pause = () => setPaused(true);
  const resume = (e: FocusEvent | MouseEvent) => {
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

  const body0 = (
    <>
      <p
        style={{
          ...typeStyle("bodyStrong"),
          margin: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </p>
      {body ? (
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
          {body}
        </p>
      ) : null}
    </>
  );

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
      {...swipe.handlers}
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
        ...swipe.style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
        <span
          aria-hidden
          style={{ color: `var(${sev.colorVar})`, display: "inline-flex", paddingTop: "0.15rem" }}
        >
          <sev.Icon size={16} />
        </span>
        {safeDest ? (
          <a
            href={safeDest}
            onClick={onDismiss}
            style={{
              flex: 1,
              minWidth: 0,
              color: `var(${CSS_VARS.ink})`,
              textDecoration: "none",
              ...focusVisibleStyle(),
            }}
            aria-label={`${t("Open")}: ${title}`}
          >
            {body0}
          </a>
        ) : (
          <div style={{ flex: 1, minWidth: 0, color: `var(${CSS_VARS.ink})` }}>{body0}</div>
        )}
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
