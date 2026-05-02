/**
 * V2-ADDR-01 — Server-only entrypoint.
 *
 * Imports here MUST stay server-safe (no React, no DOM, no client-only deps).
 * This file is loaded via `@henryco/address-selector/server` from API routes,
 * cron handlers, and migration scripts.
 */

export {
  fetchAutocomplete,
  fetchPlaceDetails,
  newSessionToken,
  PlacesError,
  type PlacesPrediction,
  type PlacesDetailsResult,
} from "./geocode";

export {
  scoreOne as scoreKycMatch,
  scoreAgainstAll as scoreKycMatchAgainstAll,
  facetFreeformKycAddress,
  KYC_MATCH_THRESHOLDS,
  type KycMatchResult,
  type KycExtractedAddress,
} from "./kyc-match";
