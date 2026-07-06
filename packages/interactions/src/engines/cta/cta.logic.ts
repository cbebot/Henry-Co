/**
 * CTA Engine — pure state machine (doctrine Engine 1 / Owner Principles 2-5).
 *
 * Encodes the owner's three-state button plus success/failure/destructive
 * behavior, with NO DOM and NO clock: `tick` events carry `at` so the
 * caller owns time and the machine stays deterministic + unit-testable.
 *
 *   idle ──press──▶ pressed ──release──▶ idle
 *   idle ──press(destructive)──▶ confirm ──confirm──▶ inflight
 *                                confirm ──cancel/timeout──▶ idle
 *   * ──submitStart──▶ inflight ──submitOk──▶ success ──(1.5s)──▶ idle
 *                      inflight ──submitErr──▶ error ──retry──▶ inflight
 *
 * The component width-locks across every phase (Owner Principle 2): the
 * label changes to an active verb but the box never reflows.
 */

export type CtaPhase = "idle" | "pressed" | "confirm" | "inflight" | "success" | "error";

export interface CtaState {
  phase: CtaPhase;
  /** True only in `error`: the failure is retryable inline (Owner Principle 3). */
  retryable: boolean;
  errorClass?: string;
  /** Wall-clock (ms) the success state began — drives auto-collapse. */
  successAt?: number;
  /** Wall-clock (ms) the confirm window opened — drives auto-cancel. */
  confirmAt?: number;
}

export type CtaEvent =
  | { type: "press"; at?: number }
  | { type: "release" }
  | { type: "submitStart" }
  | { type: "submitOk"; at: number }
  | { type: "submitErr"; errorClass: string }
  | { type: "retry" }
  | { type: "tick"; at: number }
  | { type: "confirm" }
  | { type: "cancel" };

export interface CtaOptions {
  /** Destructive actions get an inline two-step confirm, never a modal (Owner Principle 4). */
  destructive?: boolean;
}

/** Success confirmation dwell (Owner Principle 3): 1.5s, then collapse to idle. */
export const SUCCESS_MS = 1500;
/** Inline destructive cancel window (Owner Principle 4): 3s. */
export const CONFIRM_WINDOW_MS = 3000;

export const initialCtaState: CtaState = { phase: "idle", retryable: false };

const idle = (): CtaState => ({ phase: "idle", retryable: false });

export function resolveCtaState(prev: CtaState, event: CtaEvent, opts: CtaOptions): CtaState {
  switch (event.type) {
    case "press":
      if (prev.phase !== "idle") return prev;
      return opts.destructive
        ? { phase: "confirm", retryable: false, confirmAt: event.at ?? 0 }
        : { phase: "pressed", retryable: false };

    case "release":
      return prev.phase === "pressed" ? idle() : prev;

    case "submitStart":
      return prev.phase === "inflight" ? prev : { phase: "inflight", retryable: false };

    case "submitOk":
      return prev.phase === "inflight"
        ? { phase: "success", retryable: false, successAt: event.at }
        : prev;

    case "submitErr":
      return prev.phase === "inflight"
        ? { phase: "error", retryable: true, errorClass: event.errorClass }
        : prev;

    case "retry":
      return prev.phase === "error" ? { phase: "inflight", retryable: false } : prev;

    case "confirm":
      return prev.phase === "confirm" ? { phase: "inflight", retryable: false } : prev;

    case "cancel":
      return prev.phase === "confirm" ? idle() : prev;

    case "tick":
      if (prev.phase === "success" && prev.successAt != null && event.at - prev.successAt >= SUCCESS_MS) {
        return idle();
      }
      if (prev.phase === "confirm" && prev.confirmAt != null && event.at - prev.confirmAt >= CONFIRM_WINDOW_MS) {
        return idle();
      }
      return prev;

    default:
      return prev;
  }
}
