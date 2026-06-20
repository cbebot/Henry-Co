import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { COMPANY } from "@henryco/config";
import type { ActingContext } from "../types";
import { createAdminSupabase } from "../_internal/admin-supabase";

export type { ActingContext };

/**
 * V3-57 S2 — acting-context layer.
 *
 * A member of a business can "act as" that business. The acting context is
 * ADVISORY for surface display + audit attribution only — it NEVER widens RLS.
 * Every business-scoped mutation independently re-checks `business_members`
 * server-side; this module just resolves which identity the surface should
 * present and attribute actions to.
 *
 * The signed `henryco_acting_ctx` cookie carries INTENT, not AUTHORITY: it
 * records only `{ sub, businessId, ts }`. The role is NEVER trusted from the
 * cookie — it is re-derived from `business_members` on every resolve. Defenses:
 *   - Tampering: HMAC over SUPABASE_JWT_SECRET (same secret/idiom as
 *     reauth-cookie.ts) — a forged `businessId` fails the signature check.
 *   - Cross-user replay: `sub` is compared against the current authenticated
 *     user; a lifted cookie on another session is ignored.
 *   - Stale membership: membership is re-verified against `business_members`
 *     every call; a removed member silently drops back to personal.
 *   - Fail-closed: if the membership check cannot run (admin env missing), the
 *     business context is denied and the caller stays personal.
 */

export const HENRYCO_ACTING_CONTEXT_COOKIE = "henryco_acting_ctx";

/** 30-day TTL — the active context is a durable preference, re-verified each read. */
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type ActingCookiePayload = {
  sub: string;
  businessId: string;
  ts: number;
};

type BusinessRole = "owner" | "admin" | "member";

function base64UrlEncode(input: Buffer): string {
  return input.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(normalized, "base64");
}

function loadSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SUPABASE_JWT_SECRET must be configured (>=16 chars) — acting-context cannot sign henryco_acting_ctx without it.",
    );
  }
  return secret;
}

function signPayload(payload: ActingCookiePayload): string {
  const encoded = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const hmac = createHmac("sha256", loadSecret()).update(encoded).digest();
  return `${encoded}.${base64UrlEncode(hmac)}`;
}

/** Verify the signed cookie and bind it to `expectedSub`. Null on any failure. */
function verifyCookieValue(
  cookieValue: string | undefined | null,
  expectedSub: string,
): ActingCookiePayload | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0 || dot === cookieValue.length - 1) return null;

  const payloadPart = cookieValue.slice(0, dot);
  const signaturePart = cookieValue.slice(dot + 1);

  let secret: string;
  try {
    secret = loadSecret();
  } catch {
    return null;
  }

  const expected = createHmac("sha256", secret).update(payloadPart).digest();
  const provided = base64UrlDecode(signaturePart);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  let payload: ActingCookiePayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8")) as ActingCookiePayload;
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    typeof payload.businessId !== "string" ||
    typeof payload.ts !== "number"
  ) {
    return null;
  }
  if (payload.sub !== expectedSub) return null;
  return payload;
}

function cookieDomainForRequest(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  return `.${COMPANY.group.baseDomain}`;
}

/** Resolve the current authenticated user id from the supabase-cookies middleware header. */
async function resolveCurrentUserId(req?: Request): Promise<string | null> {
  const raw = req?.headers.get("x-supabase-user") ?? (await headers()).get("x-supabase-user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: string };
    return typeof parsed.id === "string" && parsed.id ? parsed.id : null;
  } catch {
    return null;
  }
}

/**
 * Re-verify membership against `business_members` (service-role, bypasses RLS)
 * and return the live role, or null if not a member / cannot verify (fail-closed).
 */
async function readMemberRole(businessId: string, userId: string): Promise<BusinessRole | null> {
  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return null; // admin env missing -> deny business context
  }
  const { data, error } = await admin
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const role = (data as { role?: string }).role;
  return role === "owner" || role === "admin" || role === "member" ? role : null;
}

/**
 * Resolve the caller's active context from the signed `henryco_acting_ctx`
 * cookie, falling back to personal. Re-verifies membership on every call —
 * never trusts the cookie alone. Usable from both RSC (no arg) and route
 * handlers (pass the Request).
 */
export async function resolveActingContext(req?: Request): Promise<ActingContext> {
  const userId = await resolveCurrentUserId(req);
  if (!userId) return { kind: "personal", userId: "" };
  return resolveActingContextForUser(userId);
}

/**
 * Resolve the acting context for an ALREADY-AUTHENTICATED user id — the same
 * signed-cookie verification + live `business_members` re-check as
 * resolveActingContext, but with the user resolved by the caller (e.g. via the
 * SSR session `supabase.auth.getUser()`) rather than the `x-supabase-user`
 * middleware header. For divisions that authenticate through the SSR client and
 * do not inject the header (e.g. jobs). The cookie is HMAC-bound to `userId`, so
 * a lifted cookie on another user still fails; membership is re-derived every
 * call (fail-closed to personal).
 */
export async function resolveActingContextForUser(userId: string): Promise<ActingContext> {
  if (!userId) return { kind: "personal", userId: "" };

  const jar = await cookies();
  const raw = jar.get(HENRYCO_ACTING_CONTEXT_COOKIE)?.value;
  const payload = verifyCookieValue(raw, userId);
  if (!payload) return { kind: "personal", userId };

  const role = await readMemberRole(payload.businessId, userId);
  if (!role) return { kind: "personal", userId };

  return { kind: "business", userId, businessId: payload.businessId, role };
}

/**
 * Switch context. Verifies membership server-side, writes the signed cookie,
 * returns the new context. Throws if the user is not a member of the target
 * business (the caller surfaces a 403). Switching to "personal" clears the cookie.
 *
 * MUST be called from a route handler / server action (mutates the cookie jar).
 */
export async function setActingContext(
  userId: string,
  target: { businessId: string } | "personal",
): Promise<ActingContext> {
  const jar = await cookies();

  if (target === "personal") {
    jar.set({
      name: HENRYCO_ACTING_CONTEXT_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      domain: cookieDomainForRequest(),
    });
    return { kind: "personal", userId };
  }

  const role = await readMemberRole(target.businessId, userId);
  if (!role) {
    throw new Error("not a member of the target business");
  }

  const value = signPayload({ sub: userId, businessId: target.businessId, ts: Date.now() });
  jar.set({
    name: HENRYCO_ACTING_CONTEXT_COOKIE,
    value,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: cookieDomainForRequest(),
  });

  return { kind: "business", userId, businessId: target.businessId, role };
}

/** Internal — exposed for tests so they can build valid + tampered cookies. */
export const _internal = {
  signPayload,
  verifyCookieValue,
  base64UrlEncode,
  base64UrlDecode,
};
