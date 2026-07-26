/**
 * @henryco/dashboard-shell/personalization — V3-34 home-layout projection.
 *
 * The deterministic floor of the Phase E personalization fabric: a pure,
 * explainable `computeHomeLayout` that re-orders registered modules by the
 * user's explicit preference first, then by opaque signal scores, with a
 * clean default fallback. No IO, no clock read, no AI.
 */
export {
  computeHomeLayout,
  type HomeLayoutInput,
  type HomeLayoutPreference,
  type LayoutModuleInput,
  type LayoutReasonCode,
  type HomeLayoutEntry,
  type HomeLayoutResult,
} from "./compute-layout";
