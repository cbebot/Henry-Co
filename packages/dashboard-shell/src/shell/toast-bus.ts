"use client";

/**
 * Imperative toast bus — lets ANY client component surface a transient toast
 * (success / error / info / warning) in the shell's live toast viewport,
 * alongside the realtime notification signals.
 *
 * Why this exists (V3-DASH-TOAST): before this, the only thing that could
 * raise an in-app toast was an arriving realtime notification. Action results
 * — "Withdrawal PIN updated", "Couldn't save preference" — had nowhere to go,
 * so screens fell back to an inline message at the TOP of the page. On a long
 * page the user never sees it and can't tell whether the action silently
 * failed. This bus gives those results the same prominent, transient toast the
 * notification system already uses.
 *
 * Design notes:
 *   - A module-level pub/sub (no React context) so a producer never needs to
 *     be a descendant of the viewport, and `shellToast.*` is callable from
 *     event handlers, server-action result branches, even non-React code.
 *   - The viewport is the single subscriber in practice; multiple are fine.
 *   - Pure + dependency-free so the decision/shape is unit-testable without a
 *     React testing library (mirrors `handleSupabaseAuthEvent`).
 */

export type ShellToastTone = "success" | "error" | "info" | "warning";

export type ShellToastInput = {
  /** Stable id — pass one to de-dupe/replace; auto-generated otherwise. */
  id?: string;
  title: string;
  body?: string | null;
  /** Optional in-app link the toast opens when clicked. */
  href?: string | null;
  tone?: ShellToastTone;
  /**
   * ms until auto-dismiss; `null` = sticky (must be dismissed by the user).
   * Omit to use the tone default (errors are sticky so they can't be missed).
   */
  durationMs?: number | null;
};

export type ShellToast = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  tone: ShellToastTone;
  durationMs: number | null;
  createdAt: number;
};

type Listener = (toast: ShellToast) => void;

const listeners = new Set<Listener>();
let seq = 0;

/** Per-tone auto-dismiss defaults (ms). `null` = sticky. */
export const TONE_DEFAULT_DURATION_MS: Record<ShellToastTone, number | null> = {
  success: 3800,
  info: 5000,
  warning: 6500,
  // Errors never auto-dismiss: a failure the user didn't act on must stay put.
  error: null,
};

/** Resolve a raw input into a fully-formed toast (pure — exported for tests). */
export function resolveShellToast(input: ShellToastInput): ShellToast {
  const tone: ShellToastTone = input.tone ?? "info";
  const id =
    input.id ?? `st_${Date.now().toString(36)}_${(seq++).toString(36)}`;
  return {
    id,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    tone,
    durationMs:
      input.durationMs === undefined ? TONE_DEFAULT_DURATION_MS[tone] : input.durationMs,
    createdAt: Date.now(),
  };
}

export function emitShellToast(input: ShellToastInput): string {
  const toast = resolveShellToast(input);
  for (const fn of listeners) {
    // A throwing listener must never break the emit or other listeners.
    try {
      fn(toast);
    } catch {
      /* ignore */
    }
  }
  return toast.id;
}

export function subscribeShellToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

type ToneShortcut = (
  title: string,
  opts?: Omit<ShellToastInput, "title" | "tone">,
) => string;

const toneShortcut =
  (tone: ShellToastTone): ToneShortcut =>
  (title, opts) =>
    emitShellToast({ ...opts, title, tone });

/**
 * Imperative singleton — import and call from anywhere:
 *   shellToast.success("Withdrawal PIN updated");
 *   shellToast.error("Couldn't update your PIN", { body: "Try again." });
 */
export const shellToast = {
  show: (input: ShellToastInput) => emitShellToast(input),
  success: toneShortcut("success"),
  error: toneShortcut("error"),
  info: toneShortcut("info"),
  warning: toneShortcut("warning"),
};

export type ShellToastApi = typeof shellToast;
