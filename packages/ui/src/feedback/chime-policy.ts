"use client";

/**
 * Onyx chime policy — V3-FEEDBACK-01. The premium is the restraint.
 *
 * The chime itself (synthesis, character) is the canonical signalAudio in
 * @henryco/notifications-ui/chime — one chime, one place. This module owns
 * WHEN an action chime may play:
 *
 *   1. Only for success / error tones — info and warning never sound.
 *   2. Only when the call site opted in (`chime: true` — reserved for
 *      genuine completion moments; the type system can't know which click
 *      mattered, so the contract is explicit at the call site).
 *   3. Only when "Interface sounds" is on (device preference, default ON,
 *      read at play time so a settings flip applies to the very next action).
 *   4. Never more than once per CHIME_MIN_GAP_MS — rapid saves never
 *      machine-gun; the first sound stands for the burst.
 *   5. Never when the tab is hidden — feedback for a screen you're looking
 *      at, not a beacon for one you're not.
 *   6. Silent degradation everywhere: no AudioContext, locked autoplay,
 *      playback failure — the toast still shows, the console stays clean
 *      (signalAudio already swallows its own errors).
 *
 * `planActionChime` is the pure decision (unit-testable, injected clock);
 * `playActionChime` is the thin impure shell around it.
 */

import { signalAudio, type ChimeVariant } from "@henryco/notifications-ui/chime";

import type { FeedbackToastTone } from "./toast-bus";
import { loadInterfaceSoundsEnabled } from "./sound-preference";

/** Minimum spacing between action chimes (restraint rule 4). */
export const CHIME_MIN_GAP_MS = 2_000;

export type ActionChimePlanInput = {
  tone: FeedbackToastTone;
  /** Device preference snapshot. */
  soundsEnabled: boolean;
  /** `document.visibilityState` snapshot (undefined = assume visible). */
  visibility: DocumentVisibilityState | undefined;
  /** ms epoch now (injected). */
  now: number;
  /** ms epoch of the last chime that actually played (0 = never). */
  lastChimeAt: number;
};

export type ActionChimePlan =
  | { play: false }
  | { play: true; variant: Extract<ChimeVariant, "action-success" | "action-error"> };

/** PURE — decide whether this action may sound, and with which voicing. */
export function planActionChime(input: ActionChimePlanInput): ActionChimePlan {
  if (input.tone !== "success" && input.tone !== "error") return { play: false };
  if (!input.soundsEnabled) return { play: false };
  if (input.visibility === "hidden") return { play: false };
  if (input.now - input.lastChimeAt < CHIME_MIN_GAP_MS) return { play: false };
  return {
    play: true,
    variant: input.tone === "success" ? "action-success" : "action-error",
  };
}

let lastChimeAt = 0;

/**
 * Play the Onyx action chime for a tone, subject to the policy above.
 * Returns true only if a sound was actually scheduled.
 */
export function playActionChime(tone: FeedbackToastTone): boolean {
  if (typeof window === "undefined") return false;
  try {
    const plan = planActionChime({
      tone,
      soundsEnabled: loadInterfaceSoundsEnabled(),
      visibility: typeof document !== "undefined" ? document.visibilityState : undefined,
      now: Date.now(),
      lastChimeAt,
    });
    if (!plan.play) return false;
    // Reserve the rate-limit slot SYNCHRONOUSLY so two near-simultaneous
    // emits can't both pass the plan while playback is still resolving.
    lastChimeAt = Date.now();
    // Toasts follow user actions, so we are usually inside a gesture's call
    // stack — resume the context opportunistically, then play. If the
    // context is still locked this round, playChime returns false and the
    // viewport's first-gesture unlock covers the next one.
    void signalAudio.unlock().then(() => {
      signalAudio.playChime(plan.variant);
    });
    return true;
  } catch {
    return false;
  }
}

/** Test seam — reset the rate limiter between unit tests. */
export function resetActionChimeLimiter(): void {
  lastChimeAt = 0;
}
