/**
 * @henryco/observability/redaction — PII redactor.
 *
 * Walks log payloads and replaces values whose KEYS match the redact
 * list with `"[redacted]"`. Conservative — never modifies the structure,
 * only the values. Idempotent — running twice is safe.
 *
 * Used by both the structured logger (every emit) and the Sentry
 * `beforeSend` hook (every error). One redactor implementation; two
 * call sites.
 */

/**
 * Default keys whose values are always redacted regardless of context.
 *
 * The list is conservative: anything that consistently identifies a
 * person or carries credential material. Application-specific extra
 * keys are added via `createRedactor({ extra: [...] })`.
 */
export const DEFAULT_REDACT_KEYS = new Set([
  "email",
  "emailAddress",
  "email_address",
  "normalizedEmail",
  "normalized_email",
  "phone",
  "phoneNumber",
  "phone_number",
  "address",
  "street",
  "postalCode",
  "postal_code",
  "zip",
  "ssn",
  "nin",
  "bvn",
  "passportNumber",
  "passport_number",
  "token",
  "refreshToken",
  "refresh_token",
  "accessToken",
  "access_token",
  "secret",
  "apiKey",
  "api_key",
  "password",
  "passcode",
  "pin",
  "otp",
  "creditCard",
  "credit_card",
  "cardNumber",
  "card_number",
  "cvv",
  "iban",
  "accountNumber",
  "account_number",
]);

export type Redactor = (payload: unknown) => unknown;

/**
 * Build a redactor with optional extra keys. The redactor walks the
 * payload depth-first and replaces values where the parent key is in
 * the redact set.
 *
 * Cycle protection: the walker carries a WeakSet so circular
 * references resolve to a `"[circular]"` marker instead of overflowing
 * the stack.
 */
export function createRedactor(opts: { extra?: ReadonlyArray<string> } = {}): Redactor {
  const keys = new Set([...DEFAULT_REDACT_KEYS, ...(opts.extra ?? [])]);

  function walk(value: unknown, seen: WeakSet<object>): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;
    if (seen.has(value as object)) return "[circular]";
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map((v) => walk(v, seen));
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (keys.has(k)) {
        out[k] = v === null || v === undefined ? v : "[redacted]";
      } else {
        out[k] = walk(v, seen);
      }
    }
    return out;
  }

  return (payload) => walk(payload, new WeakSet());
}

/**
 * Default redactor — no extras. Most call sites use this.
 */
export const defaultRedactor = createRedactor();
