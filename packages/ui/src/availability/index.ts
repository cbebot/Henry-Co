/**
 * V3-38 — local-availability surfaces (Phase E). Presentational, copy-blind,
 * token-only: hosts resolve localized copy via `@henryco/i18n`
 * (`getAvailabilityCopy`) and availability via the server-only resolver in
 * `@henryco/intelligence` — nothing here touches data or ships coverage logic.
 */
export {
  AvailabilityBadge,
  type AvailabilityBadgeProps,
  type AvailabilityBadgeStatus,
} from "./availability-badge";
export { UnavailableState, type UnavailableStateProps } from "./unavailable-state";
export { FindSimilarCta, type FindSimilarCtaProps } from "./find-similar-cta";
