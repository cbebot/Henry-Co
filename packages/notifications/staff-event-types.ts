/**
 * Staff event-type registry — V2-NOT-02-A foundation slice.
 *
 * Only foundation events land here. Per-division operator events (refund
 * requests, dispatch alerts, listing flags, etc.) graduate as their
 * dispatchers are wired into publishStaffNotification() in PR-γ.
 *
 * Each entry constrains:
 *   - default severity
 *   - the deep-link template
 *   - the expected payload key allow-list (publisher rejects unknown keys)
 */

import type { Severity } from "./types";

export type StaffEventTypeId =
  | "staff.system.alert"
  | "staff.system.health"
  | "staff.support.thread.assigned"
  | "staff.support.reply.received"
  | "staff.kyc.review.queued"
  | "staff.security.incident";

export type StaffEventTypeSpec = {
  defaultSeverity: Severity;
  deepLinkTemplate: string;
  /** Top-level payload keys allowed. Empty array = no payload allowed. */
  allowedPayloadKeys: readonly string[];
};

export const STAFF_EVENT_TYPES: Record<StaffEventTypeId, StaffEventTypeSpec> = {
  "staff.system.alert": {
    defaultSeverity: "warning",
    deepLinkTemplate: "/workspace",
    allowedPayloadKeys: [],
  },
  "staff.system.health": {
    defaultSeverity: "info",
    deepLinkTemplate: "/workspace",
    allowedPayloadKeys: [],
  },
  "staff.support.thread.assigned": {
    defaultSeverity: "info",
    deepLinkTemplate: "/workspace/support",
    allowedPayloadKeys: [],
  },
  "staff.support.reply.received": {
    defaultSeverity: "info",
    deepLinkTemplate: "/workspace/support",
    allowedPayloadKeys: [],
  },
  "staff.kyc.review.queued": {
    defaultSeverity: "warning",
    deepLinkTemplate: "/workspace/kyc",
    allowedPayloadKeys: [],
  },
  "staff.security.incident": {
    defaultSeverity: "security",
    deepLinkTemplate: "/workspace/security",
    allowedPayloadKeys: [],
  },
} as const;

export function getStaffEventTypeSpec(eventType: string): StaffEventTypeSpec | null {
  return (STAFF_EVENT_TYPES as Record<string, StaffEventTypeSpec | undefined>)[eventType] ?? null;
}
