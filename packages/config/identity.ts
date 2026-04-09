function cleanEnv(value?: string | null) {
  return String(value || "")
    .replace(/\r\n|\r|\n/g, "")
    .trim();
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export function normalizeEmail(value?: string | null) {
  const email = cleanEnv(value).toLowerCase();
  return email || null;
}

export function normalizePhone(value?: string | null) {
  const raw = cleanEnv(value);
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d+]/g, "");
    return digits.length > 8 ? digits : null;
  }

  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

export function phoneSearchVariants(value?: string | null) {
  const raw = cleanEnv(value);
  const digits = raw.replace(/\D+/g, "");
  const normalized = normalizePhone(raw);

  const localNigerian =
    normalized && normalized.startsWith("+234") && normalized.length === 14
      ? `0${normalized.slice(4)}`
      : null;
  const normalizedDigits = normalized?.replace(/\D+/g, "") || null;

  return unique([
    raw,
    digits || null,
    normalized,
    normalizedDigits,
    normalized?.startsWith("+") ? normalized.slice(1) : null,
    localNigerian,
  ]);
}

export function emailsMatch(left?: string | null, right?: string | null) {
  const normalizedLeft = normalizeEmail(left);
  const normalizedRight = normalizeEmail(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function phonesMatch(left?: string | null, right?: string | null) {
  const leftVariants = new Set(phoneSearchVariants(left));
  const rightVariants = phoneSearchVariants(right);

  return rightVariants.some((variant) => leftVariants.has(variant));
}

export function isRecoverableSupabaseAuthError(error: unknown) {
  const message = String(
    (error && typeof error === "object" && "message" in error
      ? (error as { message?: string }).message
      : error) || ""
  ).toLowerCase();
  const name = String(
    (error && typeof error === "object" && "name" in error
      ? (error as { name?: string }).name
      : "") || ""
  ).toLowerCase();

  return [
    "auth session missing",
    "session from session_id claim in jwt does not exist",
    "invalid refresh token",
    "refresh token not found",
    "jwt expired",
    "session not found",
  ].some((fragment) => message.includes(fragment)) || name === "authsessionmissingerror";
}
