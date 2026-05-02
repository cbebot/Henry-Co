/**
 * V2-ADDR-01 — Address validation.
 *
 * Shared between client (cheap pre-flight) and server (authoritative).
 * Server MUST always re-validate even if client passed; client is just a UX
 * accelerator.
 *
 * Rejection rules (anti-pattern: reject obvious garbage):
 *   - empty fields where required
 *   - single-word streets ("here", "home", "address" etc.)
 *   - cities shorter than 2 chars
 *   - countries shorter than 2 chars
 *   - unverified addresses (no google_place_id)
 *   - coordinates out of range or not finite
 */

import type { UserAddressInput, UserAddressAnyLabel } from "./types";
import { USER_ADDRESS_LABELS, USER_ADDRESS_LEGACY_LABELS } from "./types";

export type ValidationError = {
  field: keyof UserAddressInput | "_root";
  code: string;
  message: string;
};

const KNOWN_LABELS = new Set<UserAddressAnyLabel>([
  ...USER_ADDRESS_LABELS,
  ...USER_ADDRESS_LEGACY_LABELS,
]);

const GARBAGE_STREET_PATTERNS = [
  /^[a-z\s]{0,3}$/i, // 0-3 chars including just whitespace
  /^(?:home|here|address|street|n\/a|none|test|asdf|qwerty)$/i,
];

export function validateAddressInput(input: UserAddressInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!KNOWN_LABELS.has(input.label)) {
    errors.push({
      field: "label",
      code: "invalid_label",
      message: `Label must be one of: ${[...KNOWN_LABELS].join(", ")}`,
    });
  }

  const street = (input.street ?? "").trim();
  if (street.length < 4) {
    errors.push({
      field: "street",
      code: "street_too_short",
      message: "Street address is too short — please enter a full street and number.",
    });
  } else if (GARBAGE_STREET_PATTERNS.some((pat) => pat.test(street))) {
    errors.push({
      field: "street",
      code: "street_garbage",
      message: "Please enter a real street address.",
    });
  } else if (!/\s/.test(street)) {
    // Single token street — almost always missing the number or city
    errors.push({
      field: "street",
      code: "street_single_word",
      message: "Street should include a name and number (e.g. \"12 Awolowo Road\").",
    });
  }

  const city = (input.city ?? "").trim();
  if (city.length < 2) {
    errors.push({
      field: "city",
      code: "city_required",
      message: "City is required.",
    });
  }

  const country = (input.country ?? "").trim();
  if (country.length < 2) {
    errors.push({
      field: "country",
      code: "country_required",
      message: "Country is required.",
    });
  }

  if (!input.google_place_id || input.google_place_id.trim().length === 0) {
    errors.push({
      field: "google_place_id",
      code: "place_id_required",
      message: "Please pick the address from the autocomplete suggestions.",
    });
  }

  if (!input.formatted_address || input.formatted_address.trim().length === 0) {
    errors.push({
      field: "formatted_address",
      code: "formatted_address_required",
      message: "Address must be confirmed via the suggestion list.",
    });
  }

  if (!Number.isFinite(input.coordinates_lat) || input.coordinates_lat < -90 || input.coordinates_lat > 90) {
    errors.push({
      field: "coordinates_lat",
      code: "lat_out_of_range",
      message: "Latitude is invalid.",
    });
  }
  if (!Number.isFinite(input.coordinates_lng) || input.coordinates_lng < -180 || input.coordinates_lng > 180) {
    errors.push({
      field: "coordinates_lng",
      code: "lng_out_of_range",
      message: "Longitude is invalid.",
    });
  }

  if (input.phone && !/^\+?[0-9\s\-().]{6,24}$/.test(input.phone)) {
    errors.push({
      field: "phone",
      code: "phone_invalid",
      message: "Phone number looks invalid.",
    });
  }

  return errors;
}

export function isValid(input: UserAddressInput): boolean {
  return validateAddressInput(input).length === 0;
}

/**
 * Normalize an address for comparison/dedup.
 * Lowercases, trims, collapses whitespace, strips punctuation.
 */
export function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lightweight Levenshtein for KYC fuzzy match. Operates on normalized strings.
 * Returns a number in [0, max(a.length, b.length)].
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev: number[] = new Array(b.length + 1);
  const curr: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * Similarity in [0, 1]. 1 = identical. 0 = totally different.
 */
export function similarity(a: string, b: string): number {
  const n1 = normalizeForCompare(a);
  const n2 = normalizeForCompare(b);
  if (!n1 && !n2) return 1;
  if (!n1 || !n2) return 0;
  const longest = Math.max(n1.length, n2.length);
  return 1 - levenshtein(n1, n2) / longest;
}
