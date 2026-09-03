"use client";

import { useState, type FocusEvent, type MouseEvent } from "react";
import { X } from "lucide-react";
import {
  SeverityInfoIcon,
  SeveritySuccessIcon,
  SeverityUrgentIcon,
  SeverityWarningIcon,
} from "@henryco/notifications-ui/icons";
import { isSafeNotificationDeepLink } from "@henryco/notifications-ui/deep-link";

import type { FeedbackToast, FeedbackToastTone } from "./toast-bus";
import { useToastSwipe } from "./use-toast-swipe";

/**
 * The Henry Onyx action-feedback toast card — V3-FEEDBACK-01.
 *
 * ONE card for every surface. The interaction model is the shipped #243/#255
 * standard: calm staggered entry, two-phase exit, a hairline progress bar AS
 * the dismissal clock (animationend fires the dismiss so bar and timer can
 * never desync), hover/focus pause with a gentle lift, swipe-to-dismiss,
 * reduced-motion collapse.
 *
 * Colour comes ENTIRELY from the --hc-* vocabulary, so the card is correct
 * in both themes and wears each division's soul automatically:
 *   - success / info  → the division accent rail (var(--hc-accent) — every
 *     app re-souls it: marketplace brass, studio teal, account gold…). The
 *     brand acknowledges the moment; the glyph carries the tone.
 *   - warning / error → the semantic tokens (--hc-warn / --hc-danger).
 *     Danger always outranks brand.
 * One hue per card — icon, rail and progress bar agree.
 *
 * a11y: role=alert + assertive for errors, role=status + polite otherwise;
 * tone is never conveyed by colour alone (distinct glyph per tone + the
 * text itself). All strings arrive pre-localized.
 */

const TONE_ICON: Record<FeedbackToastTone, typeof SeveritySuccessIcon> = {
  success: SeveritySuccessIcon,
  info: SeverityInfoIcon,
  warning: SeverityWarningIcon,
  error: SeverityUrgentIcon,
};

/** Rail / icon / progress colour per tone (one hue per card). */
const TONE_COLOR_VAR: Record<FeedbackToastTone, string> = {
  success: "--hc-accent",
  info: "--hc-accent",
  warning: "--hc-warn",
  error: "--hc-danger",
};

export const FEEDBACK_TOAST_EXIT_MS = 240;

export type FeedbackToastCardProps = {
  toast: FeedbackToast;
  /** Position in the visible stack — staggers the entry animation. */
  index: number;
  /** True once dismissal has been requested — plays the exit animation. */
  leaving: boolean;
  onDismiss: () => void;
  /** Translator for the card's own built-in labels (Dismiss …). */
  t: (key: string) => string;
};

export function FeedbackToastCard({
  toast,
  index,
  leaving,
  onDismiss,
  t,
}: FeedbackToastCardProps) {
  const [paused, setPaused] = useState(false);
  const swipe = useToastSwipe(onDismiss, !leaving);
  const tone = toast.tone;
  const Icon = TONE_ICON[tone];
  const colorVar = TONE_COLOR_VAR[tone];
  const isError = tone === "error";
  const safeHref =
    toast.href && isSafeNotificationDeepLink(toast.href) ? toast.href : null;

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

  const content = (
    <>
      <p className="hc-fb-toast-title">{toast.title}</p>
      {toast.body ? <p className="hc-fb-toast-body">{toast.body}</p> : null}
    </>
  );

  return (
    <div
      className={`hc-fb-toast ${leaving ? "hc-fb-toast-out" : "hc-fb-toast-in"}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="false"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      {...swipe.handlers}
      style={{
        borderLeft: `3px solid var(${colorVar})`,
        transform: paused && !leaving ? "translateY(-1px)" : undefined,
        animationDelay: leaving ? "0ms" : `${index * 40}ms`,
        ...swipe.style,
      }}
    >
      <div className="hc-fb-toast-row">
        <span aria-hidden className="hc-fb-toast-icon" style={{ color: `var(${colorVar})` }}>
          <Icon size={16} />
        </span>
        {safeHref ? (
          <a
            href={safeHref}
            onClick={onDismiss}
            className="hc-fb-toast-content hc-fb-toast-link"
            aria-label={`${t("Open")}: ${toast.title}`}
          >
            {content}
          </a>
        ) : (
          <div className="hc-fb-toast-content">{content}</div>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("Dismiss notification")}
          className="hc-fb-toast-close"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      {toast.action ? (
        <div className="hc-fb-toast-actions">
          <button
            type="button"
            className="hc-fb-toast-action"
            onClick={() => {
              try {
                toast.action?.onClick();
              } finally {
                onDismiss();
              }
            }}
          >
            {toast.action.label}
          </button>
        </div>
      ) : null}
      {toast.durationMs !== null && !leaving ? (
        <span
          aria-hidden
          className="hc-fb-toast-progress"
          onAnimationEnd={onDismiss}
          style={{
            backgroundColor: `var(${colorVar})`,
            animationDuration: `${toast.durationMs}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * The card's stylesheet — injected once by the viewport. Kept as CSS (not
 * inline styles) for :focus-visible, hover and the reduced-motion media
 * query; every colour resolves through --hc-* so both themes and all ten
 * division souls come for free.
 */
export const FEEDBACK_TOAST_CSS = `
@keyframes hcFbToastIn {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0)    scale(1);     }
}
@keyframes hcFbToastOut {
  from { opacity: 1; transform: translateY(0) scale(1); max-height: 16rem; }
  to   { opacity: 0; transform: translateY(4px) scale(0.985); max-height: 0; margin-bottom: -0.5rem; }
}
@keyframes hcFbToastFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes hcFbToastProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.hc-fb-toast {
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  width: min(92vw, 26rem);
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0.85rem;
  border-radius: var(--hc-radius-lg, 1.25rem);
  border: 1px solid var(--hc-line, rgba(24, 24, 27, 0.08));
  background-color: var(--hc-surface-elevated, var(--hc-surface, #ffffff));
  color: var(--hc-ink, #18181b);
  box-shadow: var(--hc-elevation-3, 0 20px 48px -8px rgba(15, 23, 42, 0.16));
  will-change: transform, opacity;
  transition: box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.hc-fb-toast-in  { animation: hcFbToastIn 260ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.hc-fb-toast-out { animation: hcFbToastOut ${FEEDBACK_TOAST_EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both; }
.hc-fb-toast-row { display: flex; align-items: flex-start; gap: 0.65rem; }
.hc-fb-toast-icon { display: inline-flex; padding-top: 0.15rem; flex-shrink: 0; }
.hc-fb-toast-content { flex: 1; min-width: 0; color: var(--hc-ink, #18181b); }
.hc-fb-toast-link { text-decoration: none; }
.hc-fb-toast-title {
  margin: 0;
  font-size: var(--hc-text-md, 15px);
  line-height: var(--hc-text-md-line, 24px);
  font-weight: var(--hc-weight-semibold, 600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-fb-toast-body {
  margin: 0.25rem 0 0;
  font-size: var(--hc-text-sm, 13px);
  line-height: var(--hc-text-sm-line, 20px);
  color: var(--hc-ink-soft, rgba(24, 24, 27, 0.72));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hc-fb-toast-close {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--hc-ink-soft, rgba(24, 24, 27, 0.72));
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 160ms linear;
}
.hc-fb-toast-close:hover { background: var(--hc-surface-sunken, var(--hc-paper, #f4f4f5)); }
.hc-fb-toast-actions { display: flex; margin: 0.45rem 0 0; padding-left: 1.7rem; }
/* Quiet outline pill in the card's own ink: --hc-accent-text/--hc-accent-soft
   pair differently per division soul (on dark-souled apps both resolve pale
   gold → invisible text), so the action never borrows accent tokens. The
   ink-on-surface pair is the card's AA-proven contrast. */
.hc-fb-toast-action {
  border: 1px solid var(--hc-line-strong, rgba(24, 24, 27, 0.14));
  background: transparent;
  color: var(--hc-ink, #18181b);
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  font-size: var(--hc-text-sm, 13px);
  font-weight: var(--hc-weight-semibold, 600);
  cursor: pointer;
  transition: background 160ms linear;
}
.hc-fb-toast-action:hover { background: var(--hc-state-hover-overlay, rgba(24, 24, 27, 0.04)); }
.hc-fb-toast :focus-visible {
  outline: 2px solid var(--hc-focus-ring, var(--hc-accent, #C9A227));
  outline-offset: 2px;
  border-radius: 0.4rem;
}
.hc-fb-toast-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  opacity: 0.5;
  animation-name: hcFbToastProgress;
  animation-timing-function: linear;
  animation-fill-mode: both;
  transform-origin: left center;
}
@media (prefers-reduced-motion: reduce) {
  .hc-fb-toast-in  { animation: none; opacity: 1; transform: none; }
  .hc-fb-toast-out { animation: hcFbToastFadeOut ${FEEDBACK_TOAST_EXIT_MS}ms linear both; }
}
`;
