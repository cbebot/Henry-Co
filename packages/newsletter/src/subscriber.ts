import { createHmac, timingSafeEqual } from "node:crypto";

import type { NewsletterDivision } from "./types";

const PREFERENCE_SCOPE = "newsletter-preferences";
const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export type PreferenceTokenPayload = {
  v: typeof TOKEN_VERSION;
  e: string;
  sid: string;
  iat: number;
  exp: number;
};

export type BuildPreferenceTokenInput = {
  secret: string;
  email: string;
  subscriberId: string;
  now?: Date;
};

export type VerifyPreferenceTokenInput = {
  secret: string;
  token: string;
  now?: Date;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function hmacBase64Url(secret: string, data: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  return hmac.digest("base64url");
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = String(input).trim().toLowerCase();
  const match = trimmed.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0] : null;
}

export function normalizeLocale(input: string | null | undefined): string {
  if (!input) return "en-NG";
  const raw = String(input).trim();
  if (!raw) return "en-NG";
  const parts = raw.replace("_", "-").split("-");
  const lang = (parts[0] ?? "en").toLowerCase();
  const region = parts[1] ? parts[1].toUpperCase() : null;
  return region ? `${lang}-${region}` : lang;
}

export function normalizeCountry(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(raw)) return null;
  return raw;
}

function assertSecret(secret: string): void {
  if (!secret || secret.length < 16) {
    throw new Error("Newsletter preference secret missing or too short (require >= 16 chars)");
  }
}

export function buildPreferenceToken(input: BuildPreferenceTokenInput): string {
  assertSecret(input.secret);
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Cannot sign preference token for invalid email");
  if (!input.subscriberId) throw new Error("Cannot sign preference token without subscriber id");
  const now = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  const payload: PreferenceTokenPayload = {
    v: TOKEN_VERSION,
    e: email,
    sid: input.subscriberId,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signed = hmacBase64Url(input.secret, `${PREFERENCE_SCOPE}.${encodedPayload}`);
  return `${encodedPayload}.${signed}`;
}

export type VerifyPreferenceTokenResult =
  | { ok: true; payload: PreferenceTokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "version" };

export function verifyPreferenceToken(input: VerifyPreferenceTokenInput): VerifyPreferenceTokenResult {
  assertSecret(input.secret);
  if (!input.token || typeof input.token !== "string") {
    return { ok: false, reason: "malformed" };
  }
  const parts = input.token.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "malformed" };
  }
  const [encodedPayload, signature] = parts;
  const expected = hmacBase64Url(input.secret, `${PREFERENCE_SCOPE}.${encodedPayload}`);
  const sigBuf = Buffer.from(signature, "base64url");
  const expectedBuf = Buffer.from(expected, "base64url");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, reason: "bad_signature" };
  }
  let decoded: PreferenceTokenPayload;
  try {
    decoded = JSON.parse(base64UrlDecode(encodedPayload)) as PreferenceTokenPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (decoded.v !== TOKEN_VERSION) {
    return { ok: false, reason: "version" };
  }
  const now = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  if (decoded.exp <= now) {
    return { ok: false, reason: "expired" };
  }
  if (!decoded.e || !decoded.sid) {
    return { ok: false, reason: "malformed" };
  }
  return { ok: true, payload: decoded };
}

export type SubscriptionInput = {
  email: string;
  userId?: string | null;
  locale?: string | null;
  country?: string | null;
  sourceSurface?: string | null;
  sourceDivision?: NewsletterDivision | null;
  topicKeys: string[];
};

export type NormalizedSubscriptionInput = {
  email: string;
  userId: string | null;
  locale: string;
  country: string | null;
  sourceSurface: string | null;
  sourceDivision: NewsletterDivision | null;
  topicKeys: string[];
};

export type NormalizationFailure = {
  field: "email" | "topicKeys" | "sourceDivision" | "locale" | "country";
  reason: string;
};

export type NormalizationResult =
  | { ok: true; value: NormalizedSubscriptionInput }
  | { ok: false; errors: NormalizationFailure[] };

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "trashmail.com",
  "yopmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "dispostable.com",
]);

const ROLE_LOCAL_PARTS = new Set([
  "postmaster",
  "abuse",
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "webmaster",
  "hostmaster",
  "root",
  "admin",
  "administrator",
  "mailer-daemon",
]);

export function isDisposableEmail(email: string): boolean {
  const at = email.indexOf("@");
  if (at < 0) return false;
  return DISPOSABLE_DOMAINS.has(email.slice(at + 1).toLowerCase());
}

export function isRoleEmail(email: string): boolean {
  const at = email.indexOf("@");
  if (at < 0) return false;
  return ROLE_LOCAL_PARTS.has(email.slice(0, at).toLowerCase());
}

export function normalizeSubscriptionInput(
  input: SubscriptionInput,
  options: { allowedTopicKeys: ReadonlySet<string> }
): NormalizationResult {
  const errors: NormalizationFailure[] = [];
  const email = normalizeEmail(input.email);
  if (!email) {
    errors.push({ field: "email", reason: "Email address is not valid" });
  } else if (isDisposableEmail(email)) {
    errors.push({ field: "email", reason: "Disposable mail addresses are not accepted" });
  } else if (isRoleEmail(email)) {
    errors.push({ field: "email", reason: "Role-based addresses are not accepted" });
  }

  const locale = normalizeLocale(input.locale ?? undefined);
  const country = normalizeCountry(input.country ?? undefined);
  const rawTopics = Array.isArray(input.topicKeys) ? input.topicKeys : [];
  const topicSet = new Set<string>();
  for (const topic of rawTopics) {
    if (typeof topic !== "string") continue;
    const trimmed = topic.trim();
    if (!trimmed) continue;
    if (!options.allowedTopicKeys.has(trimmed)) continue;
    topicSet.add(trimmed);
  }
  if (topicSet.size === 0) {
    errors.push({ field: "topicKeys", reason: "Select at least one topic" });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      email: email!,
      userId: input.userId ?? null,
      locale,
      country,
      sourceSurface: input.sourceSurface ?? null,
      sourceDivision: input.sourceDivision ?? null,
      topicKeys: Array.from(topicSet).sort(),
    },
  };
}
