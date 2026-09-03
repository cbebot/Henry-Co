/**
 * V3-38 — local availability (Phase E, Wave E.2). A deterministic, DB-less
 * resolver over injected coverage rows + the coarse viewer-location split
 * (saved address beats IP; IP is coarse + advisory + disclosed) + the shared
 * framework-agnostic batch-route handler.
 */
export {
  normalizeAreaName,
  resolveAvailabilityBatch,
  type AvailabilityBatchResult,
  type AvailabilityLocation,
  type AvailabilityLocationSource,
  type AvailabilityScope,
  type AvailabilityStatus,
  type OfferingAvailability,
  type ResolveAvailabilityBatchInput,
  type ServiceAreaCoverageRow,
} from "./engine";
export {
  describeLocationArea,
  normalizeCountryCode,
  resolveViewerLocation,
  type IpGeoHeadersInput,
  type SavedAddressLocationInput,
} from "./location";
export {
  AVAILABILITY_EVENT_NAMES,
  createAvailabilityRateLimiter,
  handleAvailabilityRequest,
  type AvailabilityCoverageGap,
  type AvailabilityEventName,
  type AvailabilityHandlerDeps,
  type AvailabilityHandlerResult,
  type AvailabilityTelemetryEvent,
} from "./handler";
