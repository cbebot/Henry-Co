"use client";

/**
 * The Henry Onyx action-feedback toast bus — V3-FEEDBACK-01.
 *
 * ONE imperative singleton for the whole company: any client component,
 * server-action result branch, or plain module can acknowledge a completed
 * action with `toast.success(...)` / `toast.error(...)` and the nearest
 * mounted viewport renders it in the shared toast language.
 *
 * Lineage: this is the V3-DASH-TOAST bus (PR #255, @henryco/dashboard-shell)
 * promoted to @henryco/ui so every surface — public marketplace pages, the
 * account dashboard, division flows — speaks through the same bus.
 * @henryco/dashboard-shell re-exports it as `shellToast` for back-compat.
 *
 * Design notes (kept from #255, plus what consolidation demanded):
 *   - Module-level pub/sub (no React context): a producer never needs to be
 *     a descendant of the viewport.
 *   - A throwing listener never breaks the emit or other listeners.
 *   - RENDERER ELECTION: more than one viewport can be mounted at once (the
 *     app-wide feedback viewport + the dashboard shell's notifications
 *     viewport). Each registers with a priority; only the highest-priority
 *     registrant renders a given emit, so a toast never shows twice.
 *   - PRE-MOUNT BUFFER: emits that arrive before any viewport mounts are
 *     held briefly and flushed to the first renderer instead of being
 *     silently dropped (the failure mode that killed studio's old portal
 *     toasts).
 *   - THE ONYX CHIME: an emit may opt in with `chime: true` — reserved for
 *     genuine completion moments (order saved, top-up confirmed). Playback
 *     is decided centrally here (one policy, every surface) and degrades
 *     silently; see chime-policy.ts for the restraint rules.
 *
 * i18n: `title` / `body` / action labels MUST already be localized by the
 * caller (translateSurfaceLabel or typed copy). The CI hardcoded-text gate
 * watches `toast.*("…")` literals, so a hardcoded English string here fails
 * the build — by design.
 */

import { playActionChime } from "./chime-policy";

export type FeedbackToastTone = "success" | "error" | "info" | "warning";

export type FeedbackToastAction = {
  /** Localized label, e.g. t("View order"). */
  label: string;
  onClick: () => void;
};

export type FeedbackToastInput = {
  /** Stable id — pass one to de-dupe/replace; auto-generated otherwise. */
  id?: string;
  /** Localized title. */
  title: string;
  /** Localized supporting line. */
  body?: string | null;
  /** Optional in-app link the toast opens when clicked (safe-checked). */
  href?: string | null;
  /** Optional action pill rendered inside the toast. */
  action?: FeedbackToastAction | null;
  tone?: FeedbackToastTone;
  /**
   * ms until auto-dismiss; `null` = sticky (must be dismissed by the user).
   * Omit to use the tone default (errors are sticky so they can't be missed).
   */
  durationMs?: number | null;
  /**
   * Opt INTO the Onyx chime for this toast. Reserved for meaningful
   * completions — never navigation, validation, or informational notices.
   * The chime-policy (preference, rate limit, hidden tab) still decides.
   */
  chime?: boolean;
};

export type FeedbackToast = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  action: FeedbackToastAction | null;
  tone: FeedbackToastTone;
  durationMs: number | null;
  chime: boolean;
  createdAt: number;
};

type Listener = (toast: FeedbackToast) => void;

const listeners = new Set<Listener>();
let seq = 0;

/**
 * Per-tone auto-dismiss defaults (ms). `null` = sticky.
 *
 * ONE dwell ladder for the whole company — these are the severity-ladder
 * values from @henryco/notifications-ui (PR #243): a toast is an ambient
 * signal that should acknowledge and recede. (The old imperative bus carried
 * a second, disagreeing ladder — 3800/5000/6500 — retired here.)
 * Errors never auto-dismiss: a failure the user didn't act on must stay put.
 */
export const TONE_DEFAULT_DURATION_MS: Record<FeedbackToastTone, number | null> = {
  success: 4500,
  info: 4000,
  warning: 5500,
  error: null,
};

/** Resolve a raw input into a fully-formed toast (pure — exported for tests). */
export function resolveFeedbackToast(input: FeedbackToastInput): FeedbackToast {
  const tone: FeedbackToastTone = input.tone ?? "info";
  const id = input.id ?? `ft_${Date.now().toString(36)}_${(seq++).toString(36)}`;
  return {
    id,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    action: input.action ?? null,
    tone,
    durationMs:
      input.durationMs === undefined ? TONE_DEFAULT_DURATION_MS[tone] : input.durationMs,
    chime: input.chime === true,
    createdAt: Date.now(),
  };
}

// ── Pre-mount buffer ───────────────────────────────────────────────────────
// Holds emits until the first viewport subscribes, so feedback fired during
// hydration (or from a surface whose layout mounts the viewport late) is
// shown rather than silently dropped. Small and short-lived on purpose.
const BUFFER_LIMIT = 6;
const BUFFER_TTL_MS = 8_000;
let buffer: FeedbackToast[] = [];

function pruneBuffer(now: number): void {
  buffer = buffer.filter((t) => now - t.createdAt <= BUFFER_TTL_MS);
  if (buffer.length > BUFFER_LIMIT) buffer = buffer.slice(-BUFFER_LIMIT);
}

// ── Renderer election ──────────────────────────────────────────────────────
// The app-wide feedback viewport registers at priority 0; richer hosts (the
// dashboard shell's notifications viewport, which merges action toasts with
// realtime signals into one calm strip) register higher and win. Exactly one
// renderer shows a given emit.
type RendererRegistration = { id: number; priority: number };

const renderers: RendererRegistration[] = [];
const rendererListeners = new Set<() => void>();
let rendererSeq = 0;

function activeRendererId(): number | null {
  if (renderers.length === 0) return null;
  let best = renderers[0];
  for (const r of renderers) {
    // Ties go to the later registrant — the more deeply nested host.
    if (r.priority >= best.priority) best = r;
  }
  return best.id;
}

function notifyRendererChange(): void {
  for (const fn of rendererListeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Register a toast renderer (a mounted viewport). Returns the registration
 * handle used to check election and to release on unmount.
 */
export function registerToastRenderer(priority: number): {
  id: number;
  release: () => void;
} {
  const id = ++rendererSeq;
  renderers.push({ id, priority });
  notifyRendererChange();
  return {
    id,
    release: () => {
      const at = renderers.findIndex((r) => r.id === id);
      if (at !== -1) renderers.splice(at, 1);
      notifyRendererChange();
    },
  };
}

/** Is this registration currently the elected renderer? */
export function isActiveToastRenderer(id: number): boolean {
  return activeRendererId() === id;
}

/** Subscribe to election changes (a viewport re-checks its standing). */
export function subscribeToastRendererChange(fn: () => void): () => void {
  rendererListeners.add(fn);
  return () => {
    rendererListeners.delete(fn);
  };
}

// ── Emit / subscribe ───────────────────────────────────────────────────────

export function emitFeedbackToast(input: FeedbackToastInput): string {
  const resolved = resolveFeedbackToast(input);

  // The Onyx chime is decided centrally at emit time — one policy for every
  // surface — and only when a viewport is live (sound never plays without
  // its toast). All failure paths inside are silent.
  if (resolved.chime && listeners.size > 0) {
    playActionChime(resolved.tone);
  }

  if (listeners.size === 0) {
    pruneBuffer(resolved.createdAt);
    buffer.push(resolved);
    if (buffer.length > BUFFER_LIMIT) buffer = buffer.slice(-BUFFER_LIMIT);
    return resolved.id;
  }

  for (const fn of listeners) {
    // A throwing listener must never break the emit or other listeners.
    try {
      fn(resolved);
    } catch {
      /* ignore */
    }
  }
  return resolved.id;
}

export function subscribeFeedbackToast(fn: Listener): () => void {
  const wasEmpty = listeners.size === 0;
  listeners.add(fn);
  if (wasEmpty && buffer.length > 0) {
    pruneBuffer(Date.now());
    const pending = buffer;
    buffer = [];
    // Buffered emits flush WITHOUT a chime: they are page-load feedback, not
    // the immediate echo of a user's action.
    for (const t of pending) {
      try {
        fn(t);
      } catch {
        /* ignore */
      }
    }
  }
  return () => {
    listeners.delete(fn);
  };
}

type ToneShortcut = (
  title: string,
  opts?: Omit<FeedbackToastInput, "title" | "tone">,
) => string;

const toneShortcut =
  (tone: FeedbackToastTone): ToneShortcut =>
  (title, opts) =>
    emitFeedbackToast({ ...opts, title, tone });

/**
 * The imperative singleton — import and call from anywhere:
 *   toast.success(t("Saved to wishlist"), { chime: true });
 *   toast.error(t("Couldn't save that item."));
 */
export const toast = {
  show: (input: FeedbackToastInput) => emitFeedbackToast(input),
  success: toneShortcut("success"),
  error: toneShortcut("error"),
  info: toneShortcut("info"),
  warning: toneShortcut("warning"),
};

export type FeedbackToastApi = typeof toast;
