import { DIVISIONS, SEVERITIES, type Division, type PublishInput, type Severity } from "./types";
import { getEventTypeSpec } from "./event-types";

const TITLE_MAX = 80;
const BODY_MAX = 240;
const ACTION_LABEL_MAX = 32;
const DEEP_LINK_MAX = 512;
const REQUEST_ID_MAX = 64;
const PAYLOAD_MAX_KEYS = 20;
const PAYLOAD_MAX_DEPTH = 3;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x1F\x7F]/;
const PHONE_RE = /(?:\+\d{1,3}[\s\-]?)?(?:\d[\s\-]?){7,}/;

export type ValidationFailure = { code: "validation"; field: string };

export type ValidatedInput = {
  userId: string;
  division: Division;
  eventType: string;
  severity: Severity;
  title: string;
  body: string | null;
  deepLink: string;
  actionLabel: string | null;
  payload: Record<string, unknown> | null;
  actorUserId: string | null;
  relatedId: string | null;
  relatedType: string | null;
  requestId: string | null;
  publisher: string;
};

function isPlainText(value: string): boolean {
  if (CONTROL_CHARS_RE.test(value)) return false;
  if (value.includes("<") || value.includes(">")) return false;
  return true;
}

function looksLikePii(value: string): boolean {
  if (value.includes("@")) return true;
  if (PHONE_RE.test(value)) return true;
  return false;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function isDivision(value: unknown): value is Division {
  return typeof value === "string" && (DIVISIONS as readonly string[]).includes(value);
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && (SEVERITIES as readonly string[]).includes(value);
}

function payloadDepth(value: unknown, depth = 0): number {
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
  // Rule out protocol-relative URLs like "//evil.com/foo" which browsers
  // resolve against the current origin's protocol but route off-site.
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (CONTROL_CHARS_RE.test(value)) return false;
  if (value.includes("<") || value.includes(">") || value.includes('"')) return false;
  return true;
}

// Cross-division deep links use absolute URLs because the user navigates
// across domains (account.henrycogroup.com -> marketplace.henrycogroup.com).
// Allow https:// URLs whose host is on a HenryCo-controlled TLD; reject
// everything else. The TLD list is intentionally narrow — adding a host
// here is a deliberate change.
const HENRYCO_HOST_SUFFIXES: readonly string[] = [
  "henrycogroup.com",
  "henryco.local", // dev/preview hostnames in CI
];

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
  // No userinfo (https://user:pass@host) — those are phishing carriers.
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  for (const suffix of HENRYCO_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return true;
  }
  return false;
}

function isSafeDeepLink(value: string): boolean {
  return isSafeRelativePath(value) || isSafeHenryCoUrl(value);
}

export function validatePublishInput(input: PublishInput): ValidationFailure | ValidatedInput {
  if (!isUuid(input.userId)) return { code: "validation", field: "userId" };
  if (!isDivision(input.division)) return { code: "validation", field: "division" };

  const spec = getEventTypeSpec(input.eventType);
  if (!spec) return { code: "validation", field: "eventType" };

  let severity: Severity;
  if (input.severity === undefined) {
    severity = spec.defaultSeverity;
  } else if (!isSeverity(input.severity)) {
    return { code: "validation", field: "severity" };
  } else {
    severity = input.severity;
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length === 0 || title.length > TITLE_MAX) return { code: "validation", field: "title" };
  if (!isPlainText(title)) return { code: "validation", field: "title" };
  if (looksLikePii(title)) return { code: "validation", field: "title" };

  let body: string | null = null;
  if (input.body !== undefined && input.body !== null) {
    const trimmed = String(input.body).trim();
    if (trimmed.length > BODY_MAX) return { code: "validation", field: "body" };
    if (trimmed.length > 0) {
      if (!isPlainText(trimmed)) return { code: "validation", field: "body" };
      if (looksLikePii(trimmed)) return { code: "validation", field: "body" };
      body = trimmed;
    }
  }

  const deepLink = typeof input.deepLink === "string" ? input.deepLink.trim() : "";
  if (!isSafeDeepLink(deepLink)) return { code: "validation", field: "deepLink" };

  let actionLabel: string | null = null;
  if (input.actionLabel !== undefined && input.actionLabel !== null) {
    const trimmed = String(input.actionLabel).trim();
    if (trimmed.length > 0) {
      if (trimmed.length > ACTION_LABEL_MAX) return { code: "validation", field: "actionLabel" };
      if (!isPlainText(trimmed)) return { code: "validation", field: "actionLabel" };
      if (looksLikePii(trimmed)) return { code: "validation", field: "actionLabel" };
      actionLabel = trimmed;
    }
  }

  let payload: Record<string, unknown> | null = null;
  if (input.payload !== undefined && input.payload !== null) {
    if (typeof input.payload !== "object" || Array.isArray(input.payload)) {
      return { code: "validation", field: "payload" };
    }
    const keys = Object.keys(input.payload);
    if (keys.length > PAYLOAD_MAX_KEYS) return { code: "validation", field: "payload" };
    for (const key of keys) {
      if (!spec.allowedPayloadKeys.includes(key)) {
        return { code: "validation", field: `payload.${key}` };
      }
    }
    if (payloadDepth(input.payload) > PAYLOAD_MAX_DEPTH) {
      return { code: "validation", field: "payload" };
    }
    payload = input.payload as Record<string, unknown>;
  }

  let actorUserId: string | null = null;
  if (input.actorUserId !== undefined && input.actorUserId !== null) {
    if (!isUuid(input.actorUserId)) return { code: "validation", field: "actorUserId" };
    actorUserId = input.actorUserId;
  }

  let relatedId: string | null = null;
  if (input.relatedId !== undefined && input.relatedId !== null) {
    if (!isUuid(input.relatedId)) return { code: "validation", field: "relatedId" };
    relatedId = input.relatedId;
  }

  let relatedType: string | null = null;
  if (input.relatedType !== undefined && input.relatedType !== null) {
    const value = String(input.relatedType).trim();
    if (value.length === 0 || value.length > 64) return { code: "validation", field: "relatedType" };
    if (!/^[a-z0-9_]+$/.test(value)) return { code: "validation", field: "relatedType" };
    relatedType = value;
  }

  let requestId: string | null = null;
  if (input.requestId !== undefined && input.requestId !== null) {
    const value = String(input.requestId).trim();
    if (value.length === 0 || value.length > REQUEST_ID_MAX) {
      return { code: "validation", field: "requestId" };
    }
    if (CONTROL_CHARS_RE.test(value)) return { code: "validation", field: "requestId" };
    requestId = value;
  }

  const publisher =
    typeof input.publisher === "string" && input.publisher.trim().length > 0
      ? input.publisher.trim().slice(0, 64)
      : "shim:packages/notifications";

  return {
    userId: input.userId,
    division: input.division,
    eventType: input.eventType,
    severity,
    title,
    body,
    deepLink,
    actionLabel,
    payload,
    actorUserId,
    relatedId,
    relatedType,
    requestId,
    publisher,
  };
}
