function cleanText(value?: string | null) {
  const text = String(value || "").trim();
  return text || null;
}

export function normalizeEmail(value?: string | null) {
  const text = cleanText(value);
  return text ? text.toLowerCase() : null;
}

export function normalizePhone(
  value?: string | null,
  options?: { defaultCountryCode?: string }
) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return null;

  const defaultCountryCode = String(options?.defaultCountryCode || "234").replace(/\D+/g, "");
  const countryCode = defaultCountryCode || "234";
  const normalized = digits.startsWith("00") ? digits.slice(2) : digits;

  if (normalized.startsWith(countryCode) && normalized.length === countryCode.length + 10) {
    return normalized;
  }

  if (normalized.startsWith("0") && normalized.length === 11) {
    return `${countryCode}${normalized.slice(1)}`;
  }

  if (normalized.length === 10) {
    return `${countryCode}${normalized}`;
  }

  return normalized;
}

export function phoneSearchVariants(
  value?: string | null,
  options?: { defaultCountryCode?: string }
) {
  const normalized = normalizePhone(value, options);
  if (!normalized) return [] as string[];

  const defaultCountryCode = String(options?.defaultCountryCode || "234").replace(/\D+/g, "");
  const countryCode = defaultCountryCode || "234";
  const variants = new Set<string>([normalized]);

  if (normalized.startsWith(countryCode) && normalized.length === countryCode.length + 10) {
    const local = normalized.slice(countryCode.length);
    variants.add(local);
    variants.add(`0${local}`);
  }

  return [...variants];
}

export function emailsMatch(left?: string | null, right?: string | null) {
  const normalizedLeft = normalizeEmail(left);
  const normalizedRight = normalizeEmail(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function phonesMatch(
  left?: string | null,
  right?: string | null,
  options?: { defaultCountryCode?: string }
) {
  const normalizedLeft = normalizePhone(left, options);
  const normalizedRight = normalizePhone(right, options);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const leftVariants = new Set(phoneSearchVariants(normalizedLeft, options));
  const rightVariants = new Set(phoneSearchVariants(normalizedRight, options));

  return (
    leftVariants.has(normalizedRight) ||
    rightVariants.has(normalizedLeft) ||
    [...leftVariants].some((variant) => rightVariants.has(variant))
  );
}

function authErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const value = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  return value.trim().toLowerCase();
}

function authErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const value = "message" in error ? String((error as { message?: unknown }).message || "") : "";
  return value.trim().toLowerCase();
}

export function isRecoverableSupabaseAuthError(error: unknown) {
  const code = authErrorCode(error);
  const message = authErrorMessage(error);

  if (
    code === "refresh_token_not_found" ||
    code === "refresh_token_already_used" ||
    code === "session_not_found"
  ) {
    return true;
  }

  return (
    message.includes("refresh token not found") ||
    message.includes("refresh token already used") ||
    message.includes("invalid refresh token")
  );
}

export function isSupabaseAuthTokenCookie(name?: string | null) {
  const value = String(name || "").trim().toLowerCase();
  return value.startsWith("sb-") && (value.includes("-auth-token") || value.includes("-code-verifier"));
}
