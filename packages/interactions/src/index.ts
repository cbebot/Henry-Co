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

// Engine 4 — Abandonment Recovery
export {
  shouldTriggerRecovery,
  shouldTriggerExitRecovery,
  IDLE_MS,
  RECOVERY_CAP_MS,
  useAbandonmentRecovery,
} from "./engines/abandonment-recovery";
export type {
  RecoveryTrigger,
  RecoveryAdapter,
  UseAbandonmentRecoveryOptions,
  AbandonmentRecoveryHandle,
} from "./engines/abandonment-recovery";

// Engine 6 — Earn-With-Us
export { shouldShowInvite, EarnWithUs } from "./engines/earn-with-us";
export type { EarnWithUsProps, EarnWithUsLabels } from "./engines/earn-with-us";

// Engine 7 — Newsletter Earn
export {
  shouldSurfaceCapture,
  SCROLL_THRESHOLD_PCT,
  ASK_COOLDOWN_MS,
  NewsletterEarn,
} from "./engines/newsletter-earn";
export type { NewsletterMoment, NewsletterEarnProps, NewsletterEarnLabels } from "./engines/newsletter-earn";

// Engine 9 — Concierge Handoff
export {
  resolveHandoffTrigger,
  LINGER_MS,
  BOUNCE_THRESHOLD,
  ConciergeHandoff,
} from "./engines/concierge-handoff";
export type { HandoffTrigger, ConciergeHandoffProps, ConciergeHandoffLabels } from "./engines/concierge-handoff";

// Engine 10 — Local Boost
export { projectBoost, PromotedLabel, BoostControls } from "./engines/local-boost";
export type {
  BoostBaseline,
  BoostProjection,
  PromotedLabelProps,
  BoostControlsProps,
  BoostControlsLabels,
} from "./engines/local-boost";

// Engine 2 — Micro-Commitment
export {
  nextOffer,
  tierIndex,
  COMMITMENT_TIERS,
  WEEK_MS,
  useCommitmentTier,
  CommitmentGate,
} from "./engines/micro-commitment";
export type {
  CommitmentTier,
  CommitmentOffer,
  OfferRecord,
  CommitmentAdapter,
  CommitmentState,
  CommitmentGateProps,
} from "./engines/micro-commitment";

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
