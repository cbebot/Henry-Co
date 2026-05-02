/**
 * Cross-audience validation primitives.
 *
 * customer-side validate.ts (validatePublishInput) and staff-side
 * staff-validate.ts (validateStaffPublishInput) both apply the same
 * shape gates on title/body/actionLabel/payload/deepLink/relatedId/
 * requestId. Centralizing them here means a security tightening (e.g.
 * adding a new control character to the deny-list, narrowing the
 * HenryCo host suffix list) lands once and propagates to every
 * publish path.
 */

const TITLE_MAX = 80;
const BODY_MAX = 240;
const ACTION_LABEL_MAX = 32;
const DEEP_LINK_MAX = 512;
const REQUEST_ID_MAX = 64;
const PAYLOAD_MAX_KEYS = 20;
const PAYLOAD_MAX_DEPTH = 3;
const RELATED_TYPE_MAX = 64;
const PUBLISHER_MAX = 64;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x1F\x7F]/;
const PHONE_RE = /(?:\+\d{1,3}[\s\-]?)?(?:\d[\s\-]?){7,}/;
const RELATED_TYPE_RE = /^[a-z0-9_]+$/;

const HENRYCO_HOST_SUFFIXES: readonly string[] = [
  "henrycogroup.com",
  "henryco.local",
];

export const SHARED_LIMITS = {
  TITLE_MAX,
  BODY_MAX,
  ACTION_LABEL_MAX,
  DEEP_LINK_MAX,
  REQUEST_ID_MAX,
  PAYLOAD_MAX_KEYS,
  PAYLOAD_MAX_DEPTH,
  RELATED_TYPE_MAX,
  PUBLISHER_MAX,
} as const;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isPlainText(value: string): boolean {
  if (CONTROL_CHARS_RE.test(value)) return false;
  if (value.includes("<") || value.includes(">")) return false;
  return true;
}

export function looksLikePii(value: string): boolean {
  if (value.includes("@")) return true;
  if (PHONE_RE.test(value)) return true;
  return false;
}

export function payloadDepth(value: unknown, depth = 0): number {
  if (depth > PAYLOAD_MAX_DEPTH) return depth;
  if (!value || typeof value !== "object") return depth;
  if (Array.isArray(value)) {
    return value.reduce<number>((acc, child) => Math.max(acc, payloadDepth(child, depth + 1)), depth);
  }
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (acc, child) => Math.max(acc, payloadDepth(child, depth + 1)),
    depth,
  );
}

function isSafeRelativePath(value: string): boolean {
  if (value.length === 0 || value.length > DEEP_LINK_MAX) return false;
  if (value[0] !== "/") return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (CONTROL_CHARS_RE.test(value)) return false;
  if (value.includes("<") || value.includes(">") || value.includes('"')) return false;
  return true;
}

function isSafeHenryCoUrl(value: string): boolean {
  if (value.length === 0 || value.length > DEEP_LINK_MAX) return false;
  if (CONTROL_CHARS_RE.test(value)) return false;
  if (value.includes("<") || value.includes(">") || value.includes('"')) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  for (const suffix of HENRYCO_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return true;
  }
  return false;
}

export function isSafeDeepLink(value: string): boolean {
  return isSafeRelativePath(value) || isSafeHenryCoUrl(value);
}

export function isControlCharFree(value: string): boolean {
  return !CONTROL_CHARS_RE.test(value);
}

export function isValidRelatedType(value: string): boolean {
  if (value.length === 0 || value.length > RELATED_TYPE_MAX) return false;
  return RELATED_TYPE_RE.test(value);
}
