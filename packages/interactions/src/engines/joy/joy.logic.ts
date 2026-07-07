/**
 * Joy Engine — pure content builder (doctrine Engine 5 / Principle 15).
 *
 * "Joy is conversion." The success state is deliberately small: a confident
 * check, a ≤600ms envelope, and a single 10ms haptic — never confetti, never
 * a second modal. Copy is injected (a localized template with {subject}/
 * {when}/{ref} tokens); the variant lets a division tune icon + next-action.
 */

import { interpolate } from "../../labels";

export type JoyVariant =
  | "care"
  | "marketplace"
  | "jobs"
  | "learn"
  | "logistics"
  | "property"
  | "studio"
  | "generic";

export interface JoyOutcome {
  /** The person/thing the outcome is about, e.g. a provider name or order ref. */
  subject?: string;
  /** A human time, e.g. "Saturday 10am". */
  when?: string;
  /** A reference, e.g. order number / application id. */
  ref?: string;
}

export interface JoyLabels {
  /** Localized template, e.g. "Booked with {subject} for {when} — we'll text reminders". */
  detailTemplate: string;
}

export interface JoyContent {
  detail: string;
  /** A single short tap. Never long. */
  hapticMs: 10;
  /** Total animation envelope in ms. */
  envelopeMs: number;
}

/** The joy envelope ceiling: 600ms total (doctrine Principle 15). */
export const JOY_ENVELOPE_MS = 600;

export function joyContentFor(
  variant: JoyVariant,
  outcome: JoyOutcome,
  labels: JoyLabels,
): JoyContent {
  void variant; // reserved for per-division icon/next-action tuning in the component
  return {
    detail: interpolate(labels.detailTemplate, {
      subject: outcome.subject ?? "",
      when: outcome.when ?? "",
      ref: outcome.ref ?? "",
    }),
    hapticMs: 10,
    envelopeMs: JOY_ENVELOPE_MS,
  };
}
