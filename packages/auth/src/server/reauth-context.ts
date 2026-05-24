import "server-only";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  filterValidSupabaseSessionCookies,
  getSharedCookieDomain,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";

import type { AuthMethodSubject } from "../auth-method";

export const HC_REAUTH_CONTEXT_COOKIE = "hc_reauth_context";

const REAUTH_CONTEXT_MAX_AGE_SECONDS = 5 * 60;
const SUPABASE_BASE64_PREFIX = "base64-";
const SUPABASE_SESSION_CHUNK_REGEX = /^(.*-auth-token)(?:\.(\d+))?$/i;

type CookieNameValue = { name: string; value: string };

export type ReauthContext = AuthMethodSubject & {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type SupabaseSessionPayload = {
  access_token?: unknown;
  user?: unknown;
};

type JwtClaims = {
  email?: unknown;
  app_metadata?: unknown;
  user_metadata?: unknown;
};

export function extractReauthContextFromSupabaseCookies(
  cookiesToRead: CookieNameValue[],
): ReauthContext | null {
  const authCookies = filterValidSupabaseSessionCookies(cookiesToRead).filter((cookie) =>
    isSupabaseAuthTokenCookie(cookie.name),
  );
  const groups = groupSupabaseAuthCookieChunks(authCookies);

  for (const group of groups.values()) {
    const serialized = serializeCookieChunks(group);
    if (!serialized) continue;

    const session = decodeSupabaseSessionCookie(serialized);
    if (!session) continue;

    const user = objectRecord(Array.isArray(session) ? null : session.user);
    const claims = decodeJwtClaims(accessTokenFor(session));
    const email = stringValue(user?.email) ?? stringValue(claims?.email);
    if (!email) continue;

    const appMetadata =
      pickProviderMetadata(user?.app_metadata) ?? pickProviderMetadata(claims?.app_metadata);
    const userMetadata =
      pickViewerMetadata(user?.user_metadata) ?? pickViewerMetadata(claims?.user_metadata);

    return {
      email,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
      displayName:
        stringValue(userMetadata?.full_name) ??
        stringValue(userMetadata?.name) ??
        null,
      avatarUrl:
        stringValue(userMetadata?.avatar_url) ??
        stringValue(userMetadata?.picture) ??
        null,
    };
  }

  return null;
}

export function writeReauthContextCookie(
  req: NextRequest,
  res: NextResponse,
  context: ReauthContext | null,
): void {
  if (!context) return;

  const domain = getSharedCookieDomain(req.nextUrl.hostname);
  res.cookies.set({
    name: HC_REAUTH_CONTEXT_COOKIE,
    value: encodeReauthContextCookieValue(context),
    path: "/",
    maxAge: REAUTH_CONTEXT_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:" || Boolean(domain),
    domain,
  });
}

export async function readReauthContext(): Promise<ReauthContext | null> {
  const jar = await cookies();
  const raw = jar.get(HC_REAUTH_CONTEXT_COOKIE)?.value;
  return raw ? decodeReauthContextCookieValue(raw) : null;
}

export function encodeReauthContextCookieValue(context: ReauthContext): string {
  return encodeBase64Url(JSON.stringify(context));
}

export function decodeReauthContextCookieValue(value: string): ReauthContext | null {
  const decoded = decodeBase64Url(value);
  if (!decoded) return null;

  try {
    const parsed = objectRecord(JSON.parse(decoded));
    if (!parsed) return null;

    const email = stringValue(parsed.email);
    if (!email) return null;

    const userMetadata = pickViewerMetadata(parsed.user_metadata);
    return {
      email,
      app_metadata: pickProviderMetadata(parsed.app_metadata),
      user_metadata: userMetadata,
      displayName:
        stringValue(parsed.displayName) ??
        stringValue(userMetadata?.full_name) ??
        stringValue(userMetadata?.name) ??
        null,
      avatarUrl:
        stringValue(parsed.avatarUrl) ??
        stringValue(userMetadata?.avatar_url) ??
        stringValue(userMetadata?.picture) ??
        null,
    };
  } catch {
    return null;
  }
}

function groupSupabaseAuthCookieChunks(cookiesToGroup: CookieNameValue[]) {
  const grouped = new Map<
    string,
    Array<{ value: string; chunkIndex: number | null }>
  >();

  for (const cookie of cookiesToGroup) {
    const match = cookie.name.match(SUPABASE_SESSION_CHUNK_REGEX);
    if (!match?.[1]) continue;

    const list = grouped.get(match[1]) ?? [];
    list.push({
      value: cookie.value,
      chunkIndex: match[2] == null ? null : Number(match[2]),
    });
    grouped.set(match[1], list);
  }

  return grouped;
}

function serializeCookieChunks(
  chunks: Array<{ value: string; chunkIndex: number | null }>,
): string | null {
  const root = chunks.find((chunk) => chunk.chunkIndex == null);
  if (root) return root.value;

  const ordered = chunks
    .filter(
      (chunk): chunk is { value: string; chunkIndex: number } =>
        chunk.chunkIndex != null,
    )
    .sort((left, right) => left.chunkIndex - right.chunkIndex);

  if (!ordered.length || ordered[0]?.chunkIndex !== 0) return null;
  return ordered.map((chunk) => chunk.value).join("");
}

function decodeSupabaseSessionCookie(
  value: string,
): SupabaseSessionPayload | unknown[] | null {
  const decoded = value.startsWith(SUPABASE_BASE64_PREFIX)
    ? decodeBase64Url(value.slice(SUPABASE_BASE64_PREFIX.length))
    : value;

  if (!decoded) return null;

  try {
    return JSON.parse(decoded) as SupabaseSessionPayload | unknown[];
  } catch {
    try {
      return JSON.parse(decodeURIComponent(decoded)) as SupabaseSessionPayload | unknown[];
    } catch {
      return null;
    }
  }
}

function accessTokenFor(session: SupabaseSessionPayload | unknown[]): string | null {
  if (Array.isArray(session)) {
    return stringValue(session[0]);
  }

  return stringValue(session.access_token);
}

function decodeJwtClaims(accessToken: string | null): JwtClaims | null {
  if (!accessToken) return null;
  const payload = accessToken.split(".")[1];
  if (!payload) return null;

  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;

  try {
    return objectRecord(JSON.parse(decoded)) as JwtClaims | null;
  } catch {
    return null;
  }
}

function pickProviderMetadata(value: unknown): Record<string, unknown> | null {
  const metadata = objectRecord(value);
  if (!metadata) return null;

  const provider = stringValue(metadata.provider);
  const providers = Array.isArray(metadata.providers)
    ? metadata.providers
        .map((item) => stringValue(item))
        .filter((item): item is string => Boolean(item))
    : undefined;

  if (!provider && !providers?.length) return null;
  return {
    ...(provider ? { provider } : {}),
    ...(providers?.length ? { providers } : {}),
  };
}

function pickViewerMetadata(value: unknown): Record<string, unknown> | null {
  const metadata = objectRecord(value);
  if (!metadata) return null;

  const fullName = stringValue(metadata.full_name);
  const name = stringValue(metadata.name);
  const avatarUrl = stringValue(metadata.avatar_url);
  const picture = stringValue(metadata.picture);

  if (!fullName && !name && !avatarUrl && !picture) return null;
  return {
    ...(fullName ? { full_name: fullName } : {}),
    ...(name ? { name } : {}),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    ...(picture ? { picture } : {}),
  };
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function encodeBase64Url(value: string): string {
  const encoded =
    typeof btoa === "function"
      ? btoa(String.fromCharCode(...new TextEncoder().encode(value)))
      : Buffer.from(value, "utf8").toString("base64");

  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string | null {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  try {
    if (typeof atob === "function") {
      const binary = atob(normalized);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return null;
  }
}
