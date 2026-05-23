/**
 * @henryco/dashboard-shell/surfaces — surface primitive barrel.
 *
 * ACCOUNT-PREMIUM-01 (Phase 2). The customer-dashboard inner-page
 * primitives. Each exposes a typed props contract; host apps pass
 * already-i18n'd strings through (the surfaces themselves contain
 * zero copy, so the V3-07 strict gate stays green).
 *
 * Usage:
 *   import { HeroCard, NextStepRow, MetricStrip, TimelineCard, EmptyStateCard, DivisionLanding }
 *     from "@henryco/dashboard-shell/surfaces";
 *   import "@henryco/dashboard-shell/surfaces.css";
 *
 * Mount the CSS once at the app root (`apps/account/app/layout.tsx`)
 * so every page that uses the primitives renders with the same look.
 */

export { HeroCard } from "./HeroCard";
export type {
  HeroCardProps,
  HeroCardCta,
  HeroCardTile,
  HeroCardSide,
  HeroCardBreakdownRow,
} from "./HeroCard";

export { NextStepRow } from "./NextStepRow";
export type { NextStepRowProps } from "./NextStepRow";

export { MetricStrip } from "./MetricStrip";
export type {
  MetricStripProps,
  MetricStripCell,
  MetricStripContext,
} from "./MetricStrip";

export { TimelineCard, TimelineRow } from "./TimelineCard";
export type {
  TimelineCardProps,
  TimelineRowProps,
  TimelineChip,
  TimelineChipTone,
} from "./TimelineCard";

export { EmptyStateCard } from "./EmptyStateCard";
export type { EmptyStateCardProps } from "./EmptyStateCard";

export { DivisionLanding } from "./DivisionLanding";
export type { DivisionLandingProps, DivisionLandingSection } from "./DivisionLanding";
