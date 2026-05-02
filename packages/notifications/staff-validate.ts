import { DIVISIONS, SEVERITIES, type Division, type Severity } from "./types";
import { getStaffEventTypeSpec } from "./staff-event-types";
import type { StaffPublishInput } from "./staff-types";
import {
  SHARED_LIMITS,
  isControlCharFree,
  isPlainText,
  isSafeDeepLink,
  isUuid,
  isValidRelatedType,
  looksLikePii,
  payloadDepth,
} from "./validate-shared";

export type StaffValidationFailure = { code: "validation"; field: string };

const ROLE_MAX = 64;
const RECIPIENT_DIVISION_MAX = 32;
// Roles use snake_case identifiers (e.g. "marketplace_owner", "property_admin").
// Allow lowercase letters, digits, underscores, dots — same shape constraints
// as the per-division *_role_memberships tables today.
const ROLE_RE = /^[a-z0-9_.]+$/;
const DIVISION_RE = /^[a-z0-9_]+$/;

export type ValidatedStaffInput = {
  division: Division;
  recipient: {
    userId: string | null;
    role: string | null;
    division: string | null;
  };
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

function isDivision(value: unknown): value is Division {
  return typeof value === "string" && (DIVISIONS as readonly string[]).includes(value);
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && (SEVERITIES as readonly string[]).includes(value);
}

export function validateStaffPublishInput(
  input: StaffPublishInput,
): StaffValidationFailure | ValidatedStaffInput {
  if (!isDivision(input.division)) return { code: "validation", field: "division" };

  const spec = getStaffEventTypeSpec(input.eventType);
  if (!spec) return { code: "validation", field: "eventType" };

  // Recipient: at least one selector must be set.
  let recipientUserId: string | null = null;
  if (input.recipient?.userId !== undefined && input.recipient.userId !== null) {
    if (!isUuid(input.recipient.userId)) return { code: "validation", field: "recipient.userId" };
    recipientUserId = input.recipient.userId;
  }

  let recipientRole: string | null = null;
  if (input.recipient?.role !== undefined && input.recipient.role !== null) {
    const value = String(input.recipient.role).trim().toLowerCase();
    if (value.length === 0 || value.length > ROLE_MAX) {
      return { code: "validation", field: "recipient.role" };
    }
    if (!ROLE_RE.test(value)) {
      return { code: "validation", field: "recipient.role" };
    }
    recipientRole = value;
  }

  let recipientDivision: string | null = null;
  if (input.recipient?.division !== undefined && input.recipient.division !== null) {
    const value = String(input.recipient.division).trim().toLowerCase();
    if (value.length === 0 || value.length > RECIPIENT_DIVISION_MAX) {
      return { code: "validation", field: "recipient.division" };
    }
    if (!DIVISION_RE.test(value)) {
      return { code: "validation", field: "recipient.division" };
    }
    recipientDivision = value;
  }

  if (!recipientUserId && !recipientRole && !recipientDivision) {
    return { code: "validation", field: "recipient" };
  }

  let severity: Severity;
  if (input.severity === undefined) {
    severity = spec.defaultSeverity;
  } else if (!isSeverity(input.severity)) {
    return { code: "validation", field: "severity" };
  } else {
    severity = input.severity;
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length === 0 || title.length > SHARED_LIMITS.TITLE_MAX) return { code: "validation", field: "title" };
  if (!isPlainText(title)) return { code: "validation", field: "title" };
  if (looksLikePii(title)) return { code: "validation", field: "title" };

  let body: string | null = null;
  if (input.body !== undefined && input.body !== null) {
    const trimmed = String(input.body).trim();
    if (trimmed.length > SHARED_LIMITS.BODY_MAX) return { code: "validation", field: "body" };
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
      if (trimmed.length > SHARED_LIMITS.ACTION_LABEL_MAX) return { code: "validation", field: "actionLabel" };
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
    if (keys.length > SHARED_LIMITS.PAYLOAD_MAX_KEYS) return { code: "validation", field: "payload" };
    for (const key of keys) {
      if (!spec.allowedPayloadKeys.includes(key)) {
        return { code: "validation", field: `payload.${key}` };
      }
    }
    if (payloadDepth(input.payload) > SHARED_LIMITS.PAYLOAD_MAX_DEPTH) {
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
    if (!isValidRelatedType(value)) return { code: "validation", field: "relatedType" };
    relatedType = value;
  }

  let requestId: string | null = null;
  if (input.requestId !== undefined && input.requestId !== null) {
    const value = String(input.requestId).trim();
    if (value.length === 0 || value.length > SHARED_LIMITS.REQUEST_ID_MAX) {
      return { code: "validation", field: "requestId" };
    }
    if (!isControlCharFree(value)) return { code: "validation", field: "requestId" };
    requestId = value;
  }

  const publisher =
    typeof input.publisher === "string" && input.publisher.trim().length > 0
      ? input.publisher.trim().slice(0, SHARED_LIMITS.PUBLISHER_MAX)
      : "shim:packages/notifications/staff";

  return {
    division: input.division,
    recipient: {
      userId: recipientUserId,
      role: recipientRole,
      division: recipientDivision,
    },
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
