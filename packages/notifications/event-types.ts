/**
 * Event-type registry for the V2-NOT-01-A foundation slice.
 *
 * Only the auth-side and system-welcome happy-path events are landed in this
 * pass. Care, marketplace, property, jobs, learn, logistics, studio, support
 * events are owned by their per-division dispatchers today and will route
 * through this shim once NOT-01-B audits each dispatcher.
 *
 * Each entry constrains:
 *   - the default severity if the publisher does not pass one
 *   - the deep-link template (placeholder substitution from payload)
 *   - the expected payload key set (the publisher rejects unknown keys)
 */

import type { Severity } from "./types";

export type EventTypeId =
  | "auth.signup.welcome"
  | "auth.password.changed"
  | "auth.security.new_device"
  | "system.welcome";

export type EventTypeSpec = {
  defaultSeverity: Severity;
  deepLinkTemplate: string;
  /** Allowed top-level payload keys. Empty array = no payload allowed. */
  allowedPayloadKeys: readonly string[];
};

export const EVENT_TYPES: Record<EventTypeId, EventTypeSpec> = {
  "auth.signup.welcome": {
    defaultSeverity: "success",
    deepLinkTemplate: "/account",
    allowedPayloadKeys: ["display_name"],
  },
  "auth.password.changed": {
    defaultSeverity: "security",
    deepLinkTemplate: "/account/settings/security",
    allowedPayloadKeys: ["changed_at"],
  },
  "auth.security.new_device": {
    defaultSeverity: "security",
    deepLinkTemplate: "/account/settings/security",
    allowedPayloadKeys: ["device_label", "ip_country", "occurred_at"],
  },
  "system.welcome": {
    defaultSeverity: "info",
    deepLinkTemplate: "/account",
    allowedPayloadKeys: [],
  },
} as const;

export function getEventTypeSpec(eventType: string): EventTypeSpec | null {
  return (EVENT_TYPES as Record<string, EventTypeSpec | undefined>)[eventType] ?? null;
}

/**
 * Substitute {placeholder} tokens in a template using payload values.
 * Used to derive a default deep_link if the caller does not supply one.
 *
 * Unknown placeholders are left as-is so the publisher-layer validation
 * still rejects the result via the deepLink-shape check.
 */
export function applyDeepLinkTemplate(
  template: string,
  payload: Record<string, unknown> | undefined,
): string {
  if (!payload) return template;
  return template.replace(/\{([a-z0-9_]+)\}/gi, (match, key: string) => {
    const value = payload[key];
    if (typeof value === "string" || typeof value === "number") {
      return encodeURIComponent(String(value));
    }
    return match;
  });
}
