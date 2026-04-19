import { getSharedCookieDomain } from "./company";
import { isSupabaseAuthTokenCookie } from "./identity";

export type SupabaseCookieTuple = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export type NextCookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

export type SupabaseCookieHandlers = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: SupabaseCookieTuple[]) => void;
};

type WritableCookieOptions = Record<string, unknown>;
type CookieNameValue = { name: string; value: string };

const SUPABASE_SESSION_COOKIE_SUFFIX = "-auth-token";
const SUPABASE_BASE64_PREFIX = "base64-";
const SUPABASE_SESSION_CHUNK_REGEX = /^(.*-auth-token)(?:\.(\d+))?$/i;

function getSupabaseSessionCookieChunk(
  name?: string | null,
): { baseName: string; chunkIndex: number | null } | null {
  const cookieName = String(name || "").trim();

  if (!isSupabaseAuthTokenCookie(cookieName)) {
    return null;
  }

  const match = cookieName.match(SUPABASE_SESSION_CHUNK_REGEX);
  if (!match) {
    return null;
  }

  const baseName = match[1];
  if (!baseName.toLowerCase().endsWith(SUPABASE_SESSION_COOKIE_SUFFIX)) {
    return null;
  }

  return {
    baseName,
    chunkIndex: match[2] == null ? null : Number(match[2]),
  };
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  try {
    const bufferCtor = (
      globalThis as {
        Buffer?: {
          from: (input: string, encoding: string) => { toString: (encoding: string) => string };
        };
      }
    ).Buffer;

    if (bufferCtor) {
      return bufferCtor.from(normalized, "base64").toString("utf8");
    }

    if (typeof atob === "function") {
      const binary = atob(normalized);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
  } catch {
    return null;
  }

  return null;
}

function isWellFormedSupabaseSessionCookieValue(value: string) {
  if (!value) {
    return false;
  }

  let decoded = value;
  if (decoded.startsWith(SUPABASE_BASE64_PREFIX)) {
    decoded = decodeBase64Url(decoded.slice(SUPABASE_BASE64_PREFIX.length)) || "";
  }

  if (!decoded) {
    return false;
  }

  try {
    const parsed = JSON.parse(decoded) as unknown;
    return Boolean(parsed && typeof parsed === "object");
  } catch {
    return false;
  }
}

export function findMalformedSupabaseSessionCookieNames(cookies: CookieNameValue[]) {
  const grouped = new Map<
    string,
    Array<{ name: string; value: string; chunkIndex: number | null }>
  >();

  for (const cookie of cookies) {
    const chunk = getSupabaseSessionCookieChunk(cookie.name);
    if (!chunk) {
      continue;
    }

    const list = grouped.get(chunk.baseName) || [];
    list.push({
      name: cookie.name,
      value: cookie.value,
      chunkIndex: chunk.chunkIndex,
    });
    grouped.set(chunk.baseName, list);
  }

  const malformedNames = new Set<string>();

  for (const parts of grouped.values()) {
    const rootCookie = parts.find((part) => part.chunkIndex == null) || null;
    let serialized = rootCookie?.value || null;

    if (!serialized) {
      const chunkedParts = parts
        .filter(
          (part): part is { name: string; value: string; chunkIndex: number } =>
            part.chunkIndex != null,
        )
        .sort((left, right) => left.chunkIndex - right.chunkIndex);

      if (chunkedParts.length === 0 || chunkedParts[0].chunkIndex !== 0) {
        parts.forEach((part) => malformedNames.add(part.name));
        continue;
      }

      const combinedChunks: string[] = [];
      let expectedChunkIndex = 0;

      for (const part of chunkedParts) {
        if (part.chunkIndex !== expectedChunkIndex) {
          parts.forEach((cookie) => malformedNames.add(cookie.name));
          serialized = null;
          break;
        }

        combinedChunks.push(part.value);
        expectedChunkIndex += 1;
      }

      if (!serialized) {
        serialized = combinedChunks.join("");
      }
    }

    if (!serialized || !isWellFormedSupabaseSessionCookieValue(serialized)) {
      parts.forEach((part) => malformedNames.add(part.name));
    }
  }

  return [...malformedNames];
}

export function filterValidSupabaseSessionCookies(cookies: CookieNameValue[]) {
  const malformedNames = new Set(findMalformedSupabaseSessionCookieNames(cookies));

  if (malformedNames.size === 0) {
    return cookies;
  }

  return cookies.filter((cookie) => !malformedNames.has(cookie.name));
}

export function buildSharedCookieWriteOptions(
  options: WritableCookieOptions | undefined,
  cookieDomain: string | undefined,
): WritableCookieOptions | undefined {
  if (!options && !cookieDomain) {
    return undefined;
  }

  const merged: WritableCookieOptions = {
    ...(options || {}),
  };

  if (cookieDomain && merged.domain == null) {
    merged.domain = cookieDomain;
  }

  if (merged.path == null) {
    merged.path = "/";
  }

  if (merged.sameSite == null) {
    merged.sameSite = "lax";
  }

  if (cookieDomain && merged.secure == null) {
    merged.secure = true;
  }

  return merged;
}

/**
 * Build cookie handlers for `@supabase/ssr` server clients that *force* the
 * resolved shared cookie domain onto every cookie written.
 *
 * This exists because the `cookieOptions` passed to `createServerClient`
 * are applied inconsistently by `@supabase/ssr` across different cookie
 * writes (refresh vs. sign-in vs. recovery). Forcing the domain on the
 * `cookieStore.set` call guarantees every session cookie gets the shared
 * `.henrycogroup.com` scope so any henrycogroup.com subdomain can read
 * the session.
 */
export function buildSharedCookieHandlers(
  cookieStore: NextCookieStore,
  cookieDomain: string | undefined,
): SupabaseCookieHandlers {
  return {
    getAll() {
      return filterValidSupabaseSessionCookies(cookieStore.getAll());
    },
    setAll(cookiesToSet) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          const merged = buildSharedCookieWriteOptions(options, cookieDomain);
          cookieStore.set(name, value, merged);
        }
      } catch {
        // Read-only cookie contexts (Server Components) — safe to ignore.
      }
    },
  };
}

/**
 * Resolve the cookie domain to apply for a given request. Reads both the
 * `x-forwarded-host` header (Vercel proxy) and `host` header so the
 * detection works in production, preview deployments, and local dev.
 */
export function resolveRequestCookieDomain(
  headerGet: (name: string) => string | null | undefined,
): string | undefined {
  const host = headerGet("x-forwarded-host") || headerGet("host") || null;
  return getSharedCookieDomain(host);
}

/**
 * Build the `cookieOptions` object for `createServerClient`/`createBrowserClient`
 * based on a resolved cookie domain. Returns `undefined` when no shared
 * domain applies (localhost, IPs, unknown hosts), so Supabase falls back
 * to per-host cookies safely.
 */
export function buildSupabaseCookieOptions(
  cookieDomain: string | undefined,
): Record<string, unknown> | undefined {
  if (!cookieDomain) return undefined;
  return {
    domain: cookieDomain,
    path: "/",
    sameSite: "lax" as const,
    secure: true,
  };
}
