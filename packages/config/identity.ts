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
  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name || "").trim().toLowerCase()
      : "";
  const message = authErrorMessage(error);

  if (
    code === "refresh_token_not_found" ||
    code === "refresh_token_already_used" ||
    code === "session_not_found"
  ) {
    return true;
  }

  return (
    name === "authsessionmissingerror" ||
    message.includes("auth session missing") ||
    message.includes("refresh token not found") ||
    message.includes("refresh token already used") ||
    message.includes("invalid refresh token") ||
    message.includes("jwt expired") ||
    message.includes("session from session_id claim in jwt does not exist")
  );
}

export function isSupabaseAuthTokenCookie(name?: string | null) {
  const value = String(name || "").trim().toLowerCase();
  return value.startsWith("sb-") && (value.includes("-auth-token") || value.includes("-code-verifier"));
}

type SupabaseCookieEntry = {
  name: string;
  value: string;
};

type PassiveSupabaseCookieUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type PassiveSupabaseCookieSession = {
  access_token?: string;
  expires_at?: number;
  user?: PassiveSupabaseCookieUser | null;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const base64 = `${normalized}${"=".repeat(padding)}`;

  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf8");
  }

  if (typeof atob === "function") {
    return decodeURIComponent(
      Array.from(atob(base64))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  }

  throw new Error("No base64 decoder available for Supabase session parsing.");
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readJwtPayload(accessToken?: string | null) {
  const parts = String(accessToken || "").split(".");
  if (parts.length < 2) return null;

  try {
    const decoded = decodeBase64Url(parts[1] || "");
    return parseJsonObject(decoded);
  } catch {
    return null;
  }
}

export function getSupabaseAuthCookieBaseName(supabaseUrl?: string | null) {
  const value = String(supabaseUrl || "").trim();
  if (!value) return null;

  try {
    const ref = new URL(value).hostname.split(".")[0]?.trim();
    return ref ? `sb-${ref}-auth-token` : null;
  } catch {
    return null;
  }
}

export function readPassiveSupabaseSessionFromCookies(
  cookies: SupabaseCookieEntry[],
  supabaseUrl?: string | null
) {
  const baseName = getSupabaseAuthCookieBaseName(supabaseUrl);
  if (!baseName) return null;

  const direct = cookies.find((cookie) => cookie.name === baseName)?.value || null;
  const chunkValue =
    direct ||
    cookies
      .filter((cookie) => cookie.name.startsWith(`${baseName}.`))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((cookie) => cookie.value)
      .join("");

  if (!chunkValue) {
    return null;
  }

  const encoded = chunkValue.startsWith("base64-") ? chunkValue.slice("base64-".length) : chunkValue;

  try {
    const decoded = chunkValue.startsWith("base64-") ? decodeBase64Url(encoded) : chunkValue;
    const parsed = parseJsonObject(decoded);
    return parsed as PassiveSupabaseCookieSession | null;
  } catch {
    return null;
  }
}

export function readPassiveSupabaseUserFromCookies(
  cookies: SupabaseCookieEntry[],
  supabaseUrl?: string | null,
  options?: { now?: number }
) {
  const session = readPassiveSupabaseSessionFromCookies(cookies, supabaseUrl);
  if (!session?.user || typeof session.user !== "object" || typeof session.user.id !== "string") {
    return null;
  }

  const now = options?.now ?? Date.now();
  const sessionExpiry =
    typeof session.expires_at === "number" && Number.isFinite(session.expires_at)
      ? session.expires_at * 1000
      : null;
  const jwtPayload = readJwtPayload(session.access_token);
  const jwtExpiry =
    jwtPayload && typeof jwtPayload.exp === "number" && Number.isFinite(jwtPayload.exp)
      ? jwtPayload.exp * 1000
      : null;
  const expiresAt = sessionExpiry && jwtExpiry ? Math.min(sessionExpiry, jwtExpiry) : sessionExpiry || jwtExpiry;

  if (expiresAt && expiresAt <= now) {
    return null;
  }

  return session.user;
}

/**
 * Prefer the canonical profile/customer avatar URL when set; otherwise use OAuth metadata
 * (e.g. Google `picture`, Supabase `avatar_url`) so chips show real photos without waiting on profile sync.
 */
export function resolveUserAvatarFromSources(
  profileAvatarUrl: string | null | undefined,
  userMetadata: Record<string, unknown> | null | undefined
): string | null {
  const fromProfile = cleanText(profileAvatarUrl);
  if (fromProfile) return fromProfile;

  const meta =
    userMetadata && typeof userMetadata === "object" ? (userMetadata as Record<string, unknown>) : {};
  const fromMeta =
    typeof meta.avatar_url === "string"
      ? meta.avatar_url
      : typeof meta.picture === "string"
        ? meta.picture
        : null;
  return cleanText(fromMeta);
}
