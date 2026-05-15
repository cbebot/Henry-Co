/**
 * @henryco/care — portal-flavoured editorial primitives.
 *
 * Scoped to apps/care/ public + tracking surfaces. Mirrors the
 * apps/logistics/components/portal/* template (Wave B3) so every
 * division portal shares the same editorial bar without touching the
 * shared dashboard-shell primitives.
 *
 * V3 Wave B1 — Care portal editorial rebuild.
 */
export {
  PortalHero,
  PortalCapabilityStrip,
  type PortalCapabilityMetric,
  type PortalHeroCta,
} from "./PortalHero";
export {
  PortalSection,
  PortalDividedList,
  PortalLaneGrid,
  type PortalDividedListItem,
  type PortalLaneCard,
} from "./PortalSection";
export { PortalLiveStrip } from "./PortalLiveStrip";
