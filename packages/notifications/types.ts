/**
 * Cross-division notification signal types.
 *
 * The publisher shim writes to two existing tables:
 *   - public.customer_notifications  (the inbox row the user sees)
 *   - public.notification_delivery_log  (the audit trail of each publish)
 *
 * Field mapping (publisher input -> customer_notifications column):
 *   eventType   -> category
 *   severity    -> priority
 *   deepLink    -> action_url
 *   payload     -> detail_payload
 *   relatedId   -> reference_id
 *   relatedType -> reference_type
 *   actorUserId -> actor_user_id
 *   requestId   -> request_id
 *   division    -> division
 *   title/body  -> title/body
 */

export type Division =
  | "hub"
  | "account"
  | "staff"
  | "care"
  | "marketplace"
  | "property"
  | "logistics"
  | "jobs"
  | "learn"
  | "studio"
  | "security"
  | "system";

export const DIVISIONS: readonly Division[] = [
  "hub",
  "account",
  "staff",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
  "security",
  "system",
] as const;

export type Severity = "info" | "success" | "warning" | "urgent" | "security";

export const SEVERITIES: readonly Severity[] = [
  "info",
  "success",
  "warning",
  "urgent",
  "security",
] as const;

export type PublishInput = {
  userId: string;
  division: Division;
  eventType: string;
  severity?: Severity;
  title: string;
  body?: string;
  deepLink: string;
  /**
   * Optional CTA label rendered next to the deep_link in the popover/inbox
   * (e.g. "Open shipment", "View order"). Bridges that previously wrote
   * `action_label` directly to customer_notifications pass it here.
   */
  actionLabel?: string;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  relatedId?: string;
  relatedType?: string;
  requestId?: string;
  /**
   * Identifier of the calling subsystem. Helpful for incident replay.
   * Defaults to "shim:packages/notifications".
   */
  publisher?: string;
};

export type PublishOk = { ok: true; id: string; muted: boolean };

export type PublishErrorCode =
  | "validation"
  | "rate_limited"
  | "preferences_blocked"
  | "persistence"
  | "missing_env";

export type PublishErr = {
  ok: false;
  error: PublishErrorCode;
  /**
   * A safe, user-non-identifying message suitable for logging. Never
   * includes the user's title/body/email/IDs.
   */
  detail?: string;
};

export type PublishResult = PublishOk | PublishErr;
