/**
 * @henryco/kyc — KYC PII minimization + redaction.
 *
 * Two strengths, by sensitivity:
 *   - `minimizeVerdictJson` (ALLOWLIST) — for the PERSISTED verdict result JSON.
 *     Keeps ONLY known-safe signal keys and DROPS everything else, so unknown
 *     vendor fields (where value-embedded PII hides) never persist. This is the
 *     strongest minimization posture and the default for anything stored.
 *   - `redactKycPayload` (DENYLIST, case-insensitive) — for diagnostic payloads
 *     where keys are known-safe-by-construction (e.g. audit metadata). Composes
 *     the `@henryco/observability` key list, adds KYC keys, and matches
 *     case-insensitively (fixing the shared redactor's case-sensitivity).
 *
 * Both scrub long digit-runs out of retained string VALUES (catches BVN/NIN/
 * phone/account numbers embedded in free text — the key-name layer cannot).
 *
 * Pure + client-safe.
 */
import { DEFAULT_REDACT_KEYS } from "@henryco/observability/redaction";

/** Keys beyond the observability default set that a KYC payload may carry. */
export const KYC_EXTRA_REDACT_KEYS: ReadonlyArray<string> = [
  "firstName", "first_name", "lastName", "last_name", "middleName", "middle_name",
  "fullName", "full_name", "name", "dob", "dateOfBirth", "date_of_birth",
  "documentNumber", "document_number", "idNumber", "id_number",
  "driversLicense", "drivers_license", "voterCard", "voter_card",
  "nationalId", "national_id", "selfie", "selfieImage", "selfie_image",
  "faceImage", "face_image", "photo", "image", "imageData", "image_data",
  "rawResult", "raw_result", "raw", "gender", "nationality",
];

/** Safe, non-PII SIGNAL keys retained by the verdict minimizer (lowercased match). */
const SAFE_VERDICT_KEYS = new Set(
  [
    "decision", "level", "achievedlevel", "achieved_level", "status",
    "confidence", "score", "similarity", "liveness", "match", "matched",
    "country", "reasoncodes", "reason_codes", "reasons", "reason", "checks",
    "passed", "valid", "ok", "vendor", "provider", "code", "result",
  ].map((k) => k.toLowerCase()),
);

const REDACT_KEYS_LC = new Set(
  [...DEFAULT_REDACT_KEYS, ...KYC_EXTRA_REDACT_KEYS].map((k) => k.toLowerCase()),
);

const REDACTED = "[redacted]";
// 9+ digits, optionally grouped by a single space / dot / hyphen (catches
// "22212345678" AND "123-456-789"). The separator class excludes ':' and 'T',
// so ISO timestamps (e.g. 2026-06-21T05:46:00) are NOT masked.
const DIGIT_RUN = /\d(?:[ .\-]?\d){8,}/g;

/** Mask long digit sequences (BVN/NIN/phone/account/passport numbers) in free text. */
export function scrubText(value: string): string {
  return value.replace(DIGIT_RUN, "[redacted-digits]");
}

function scrubScalar(value: unknown): unknown {
  return typeof value === "string" ? scrubText(value) : value;
}

/** DENYLIST deep-redact (case-insensitive) + value scrub. */
export function redactKycPayload(payload: unknown): Record<string, unknown> {
  const out = denyWalk(payload ?? {}, new WeakSet());
  return (out && typeof out === "object" && !Array.isArray(out) ? out : {}) as Record<string, unknown>;
}

function denyWalk(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return scrubScalar(value);
  if (seen.has(value as object)) return "[circular]";
  seen.add(value as object);
  if (Array.isArray(value)) return value.map((v) => denyWalk(v, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS_LC.has(k.toLowerCase())) {
      out[k] = v === null || v === undefined ? v : REDACTED;
    } else {
      out[k] = denyWalk(v, seen);
    }
  }
  return out;
}

/** ALLOWLIST deep-minimize: keep ONLY safe signal keys; drop everything else; scrub values. */
export function minimizeVerdictJson(payload: unknown): Record<string, unknown> {
  const out = allowWalk(payload ?? {}, new WeakSet());
  return (out && typeof out === "object" && !Array.isArray(out) ? out : {}) as Record<string, unknown>;
}

function allowWalk(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return scrubScalar(value);
  if (seen.has(value as object)) return "[circular]";
  seen.add(value as object);
  if (Array.isArray(value)) {
    return value.map((v) => (v !== null && typeof v === "object" ? allowWalk(v, seen) : scrubScalar(v)));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_VERDICT_KEYS.has(k.toLowerCase())) continue; // DROP non-allowlisted keys entirely
    out[k] = v !== null && typeof v === "object" ? allowWalk(v, seen) : scrubScalar(v);
  }
  return out;
}
