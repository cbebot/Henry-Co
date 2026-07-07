/**
 * @henryco/interactions — the ten interaction Engines from the
 * Public-Pages Interaction & Earning Doctrine (Part IV).
 *
 * Every public surface across the ecosystem consumes these so that the
 * same interaction behavior ships in marketplace, care, jobs, learn,
 * logistics, studio, property, hub, and the V3 showcase.
 *
 * Architecture: each engine is a pure, DOM-free logic core (unit-tested
 * with `tsx --test`) plus a thin `"use client"` React wrapper. The
 * package injects telemetry, i18n labels, currency formatting, and
 * persistence at the edges (React context) — it hard-imports none of
 * them. See docs/superpowers/specs/2026-07-06-interactions-engines-design.md.
 */

// Telemetry (doctrine Part VI)
export type {
  InteractionEvent,
  InteractionEventName,
  InteractionTelemetrySink,
} from "./telemetry";
export { noopSink, createConsoleSink, createCollectingSink } from "./telemetry";

// Motion + copy + currency utilities
export { MOTION, useReducedMotion } from "./motion";
export { interpolate } from "./labels";
export { defaultCurrencyFormatter, type CurrencyFormatter } from "./pricing";

// Dependency-injection edge (providers + hooks)
export {
  InteractionTelemetryProvider,
  useInteractionTelemetry,
  CurrencyProvider,
  useCurrencyFormatter,
} from "./context";

// Engine 1 — CTA
export { CtaButton } from "./engines/cta";
export type { CtaButtonProps, CtaVariant, CtaLabels } from "./engines/cta";
export {
  resolveCtaState,
  initialCtaState,
  SUCCESS_MS,
  CONFIRM_WINDOW_MS,
} from "./engines/cta";
export type { CtaState, CtaEvent, CtaPhase, CtaOptions } from "./engines/cta";

// Engine 3 — Trust Reveal
export {
  TrustStair,
  TrustOutcome,
  TrustQuote,
  TrustSafetyNet,
  TrustPaymentMarks,
  useTrustStage,
  resolveVisibleStage,
  stageIndex,
  TRUST_STAGES,
} from "./engines/trust-reveal";
export type { TrustStairProps, TrustStage, TrustPosition } from "./engines/trust-reveal";

// Engine 8 — Pricing Reveal
export { PriceReveal, PlatformFeeTooltip, breakdownPrice, annualSavingMinor } from "./engines/pricing-reveal";
export type {
  PriceRevealProps,
  PriceRevealLabels,
  PriceBreakdown,
  FxDisclosure,
} from "./engines/pricing-reveal";

// Engine 5 — Joy
export { JoyState, joyContentFor, JOY_ENVELOPE_MS } from "./engines/joy";
export type {
  JoyStateProps,
  JoyNextAction,
  JoyVariant,
  JoyOutcome,
  JoyLabels,
  JoyContent,
} from "./engines/joy";
