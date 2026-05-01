/**
 * Boundary that maps raw provider error strings (Resend / Brevo) to
 * user-safe phrases — so end customers never see "You have reached your
 * daily email sending quota" or other operator-only phrases.
 *
 * Staff/owner contexts can opt into the raw string for triage by passing
 * `audience: "staff"`.
 */

export type ErrorAudience = "user" | "staff";

const QUOTA_PATTERNS = [
  /daily email sending quota/i,
  /quota.*exceeded/i,
  /rate limit/i,
  /too many requests/i,
  /you have reached/i,
];

const AUTH_PATTERNS = [
  /api key/i,
  /unauthorized/i,
  /forbidden/i,
  /401/,
  /403/,
];

const VALIDATION_PATTERNS = [
  /invalid email/i,
  /invalid recipient/i,
  /bounce/i,
  /domain not verified/i,
  /unverified/i,
];

const NETWORK_PATTERNS = [
  /timeout/i,
  /econn/i,
  /network/i,
  /enotfound/i,
];

/**
 * Returns a user-safe message. For "staff" audience, returns the raw
 * error truncated.
 */
export function localizeEmailError(
  rawError: string | null | undefined,
  audience: ErrorAudience = "user",
): string {
  const safe = (rawError ?? "").toString().trim();

  if (audience === "staff") {
    return safe ? safe.slice(0, 280) : "Email dispatch failed (no provider detail).";
  }

  // Default user-safe fallback — never leak provider, quota, or key state.
  if (!safe) {
    return "We couldn't send that email right now. Please try again in a moment.";
  }

  if (QUOTA_PATTERNS.some((re) => re.test(safe))) {
    return "We're temporarily unable to send that email. Please try again shortly.";
  }
  if (AUTH_PATTERNS.some((re) => re.test(safe))) {
    return "Our messaging service is being checked. Please try again shortly.";
  }
  if (VALIDATION_PATTERNS.some((re) => re.test(safe))) {
    return "That email address couldn't be reached. Please verify it and try again.";
  }
  if (NETWORK_PATTERNS.some((re) => re.test(safe))) {
    return "Connection hiccup while sending. Please try again.";
  }

  return "We couldn't send that email right now. Please try again in a moment.";
}

/**
 * Convenience: classify whether the raw error is an operator-only signal
 * we want to log loudly but never surface to end users.
 */
export function isOperatorOnlyEmailError(rawError: string | null | undefined): boolean {
  const safe = (rawError ?? "").toString();
  return (
    QUOTA_PATTERNS.some((re) => re.test(safe)) ||
    AUTH_PATTERNS.some((re) => re.test(safe))
  );
}
