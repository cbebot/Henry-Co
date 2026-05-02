/**
 * V2-ADDR-01 — KYC ↔ user_addresses match algorithm.
 *
 * INPUT:  An address string extracted from a KYC document (utility bill,
 *         national ID address line, business cert, etc.) plus the user's
 *         saved user_addresses rows.
 *
 * OUTPUT: For each saved address, a score in [0, 1] indicating how well
 *         the KYC-extracted address matches it, and the recommended action:
 *           >= 0.85  → auto kyc_verified = true
 *           >= 0.65  → flag for staff review
 *           <  0.65  → no auto-verify, no review flag
 *
 * ALGORITHM:
 *   We compute a weighted average of similarity over four facets:
 *     - country (weight 0.10)  — must usually be exact match or "high"
 *     - state   (weight 0.20)  — admin region
 *     - city    (weight 0.25)  — most discriminating beyond street
 *     - street  (weight 0.45)  — line 1, where the discriminator usually is
 *
 *   When facets are missing on either side, that facet is skipped and the
 *   remaining weights are renormalized.
 *
 *   We also apply a hard rule: if country is set on both sides and they
 *   don't match (after normalizing 2-letter vs full-name), we cap the
 *   final score at 0.40 regardless of facet similarity. A different
 *   country is a hard signal that this is a different address.
 *
 *   We accept either:
 *     (a) a structured kyc address object (preferred — extracted from OCR
 *         or manual transcription), or
 *     (b) a free-form address string, which we attempt to facet by simple
 *         comma-splitting heuristics (last comma-segment = country, etc.).
 *
 *   The free-form path is intentionally conservative: it can score lower
 *   than the structured path even on identical inputs, because the splitter
 *   may misalign facets.
 */

import { similarity, normalizeForCompare } from "../validate";
import type { UserAddressRecord } from "../types";

export interface KycExtractedAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  raw_text?: string | null;
}

export interface KycMatchResult {
  address_id: string;
  score: number; // 0..1
  facet_scores: {
    country: number | null;
    state: number | null;
    city: number | null;
    street: number | null;
  };
  recommendation: "auto_verify" | "manual_review" | "no_action";
  capped_by_country_mismatch: boolean;
}

const FACET_WEIGHTS = {
  country: 0.1,
  state: 0.2,
  city: 0.25,
  street: 0.45,
} as const;

const AUTO_VERIFY_THRESHOLD = 0.85;
const MANUAL_REVIEW_THRESHOLD = 0.65;
const COUNTRY_MISMATCH_CAP = 0.4;

const COUNTRY_ALIASES: Record<string, string> = {
  ng: "nigeria",
  nigeria: "nigeria",
  uk: "united kingdom",
  gb: "united kingdom",
  "united kingdom": "united kingdom",
  us: "united states",
  usa: "united states",
  "united states": "united states",
  "united states of america": "united states",
  ca: "canada",
  canada: "canada",
};

function canonicalCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  const norm = value.trim().toLowerCase();
  if (!norm) return null;
  return COUNTRY_ALIASES[norm] ?? norm;
}

function rawSimilarity(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  return similarity(a, b);
}

/**
 * Heuristic: facet a free-form KYC address into best-effort components.
 * Naive comma-split. Last segment = country, second-last = state/region,
 * third-last = city, the rest joined = street.
 */
export function facetFreeformKycAddress(raw: string): KycExtractedAddress {
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return { raw_text: raw };
  if (parts.length === 1) return { street: parts[0], raw_text: raw };
  if (parts.length === 2) return { street: parts[0], city: parts[1], raw_text: raw };
  if (parts.length === 3)
    return { street: parts[0], city: parts[1], country: parts[2], raw_text: raw };
  return {
    street: parts.slice(0, parts.length - 3).join(", "),
    city: parts[parts.length - 3],
    state: parts[parts.length - 2],
    country: parts[parts.length - 1],
    raw_text: raw,
  };
}

/**
 * Score one KYC address against one saved user_addresses row.
 */
export function scoreOne(
  kyc: KycExtractedAddress,
  saved: Pick<UserAddressRecord, "id" | "street" | "city" | "state" | "country" | "postal_code">
): KycMatchResult {
  const facets: KycMatchResult["facet_scores"] = {
    country: rawSimilarity(canonicalCountry(kyc.country), canonicalCountry(saved.country)),
    state: rawSimilarity(kyc.state, saved.state),
    city: rawSimilarity(kyc.city, saved.city),
    street: rawSimilarity(kyc.street, saved.street),
  };

  let totalWeight = 0;
  let weightedSum = 0;
  if (facets.country !== null) {
    weightedSum += facets.country * FACET_WEIGHTS.country;
    totalWeight += FACET_WEIGHTS.country;
  }
  if (facets.state !== null) {
    weightedSum += facets.state * FACET_WEIGHTS.state;
    totalWeight += FACET_WEIGHTS.state;
  }
  if (facets.city !== null) {
    weightedSum += facets.city * FACET_WEIGHTS.city;
    totalWeight += FACET_WEIGHTS.city;
  }
  if (facets.street !== null) {
    weightedSum += facets.street * FACET_WEIGHTS.street;
    totalWeight += FACET_WEIGHTS.street;
  }

  let score = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Hard cap on country mismatch
  let cappedByCountryMismatch = false;
  const kycCountry = canonicalCountry(kyc.country);
  const savedCountry = canonicalCountry(saved.country);
  if (kycCountry && savedCountry && kycCountry !== savedCountry && (facets.country ?? 0) < 0.5) {
    if (score > COUNTRY_MISMATCH_CAP) {
      score = COUNTRY_MISMATCH_CAP;
      cappedByCountryMismatch = true;
    }
  }

  // Postal code bonus: if both sides have it and they normalize-match, bump 5pt
  if (kyc.postal_code && saved.postal_code) {
    if (normalizeForCompare(kyc.postal_code) === normalizeForCompare(saved.postal_code)) {
      score = Math.min(1, score + 0.05);
    }
  }

  let recommendation: KycMatchResult["recommendation"];
  if (score >= AUTO_VERIFY_THRESHOLD) recommendation = "auto_verify";
  else if (score >= MANUAL_REVIEW_THRESHOLD) recommendation = "manual_review";
  else recommendation = "no_action";

  return {
    address_id: saved.id,
    score: Math.round(score * 1000) / 1000,
    facet_scores: facets,
    recommendation,
    capped_by_country_mismatch: cappedByCountryMismatch,
  };
}

/**
 * Score one KYC address against ALL of a user's saved addresses.
 * Returns rows sorted by score descending.
 */
export function scoreAgainstAll(
  kyc: KycExtractedAddress,
  saved: Array<
    Pick<UserAddressRecord, "id" | "street" | "city" | "state" | "country" | "postal_code">
  >
): KycMatchResult[] {
  return saved
    .map((row) => scoreOne(kyc, row))
    .sort((a, b) => b.score - a.score);
}

export const KYC_MATCH_THRESHOLDS = {
  AUTO_VERIFY: AUTO_VERIFY_THRESHOLD,
  MANUAL_REVIEW: MANUAL_REVIEW_THRESHOLD,
  COUNTRY_MISMATCH_CAP,
} as const;
