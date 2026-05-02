/**
 * Staff (operator) notification audience.
 *
 * Distinct from the customer audience: staff notifications carry richer
 * targeting (recipient_user_id | recipient_role | recipient_division —
 * any combination, at least one required) and per-recipient lifecycle
 * lives in `staff_notification_states` so a role/division broadcast
 * preserves per-staff inbox semantics.
 *
 * The publisher writes to:
 *   - public.staff_notifications      (the row)
 *   - public.notification_delivery_log (audit, with publisher = staff)
 *
 * Field mapping (publisher input -> staff_notifications column):
 *   eventType   -> category
 *   severity    -> priority
 *   deepLink    -> action_url
 *   payload     -> detail_payload
 *   relatedId   -> reference_id
 *   relatedType -> reference_type
 *   actorUserId -> actor_user_id
 *   requestId   -> request_id
 *   division    -> division          (the producing subsystem)
 *   recipient.userId      -> recipient_user_id
 *   recipient.role        -> recipient_role
 *   recipient.division    -> recipient_division
 */

import type { Division, Severity } from "./types";

export type StaffRecipient = {
  /** Direct targeting: a specific staff. */
  userId?: string;
  /**
   * Role-broadcast targeting (case-insensitive). Examples:
   *   'marketplace_owner', 'property_admin', 'care_lead', 'support', 'admin'.
   * The RLS predicate `is_staff_in(recipient_division, recipient_role)`
   * resolves the audience.
   */
  role?: string;
  /** Division-broadcast targeting (case-insensitive). E.g. 'marketplace'. */
  division?: string;
};

export type StaffPublishInput = {
  /** The producing division (subsystem that emitted the signal). */
  division: Division;
  /** At least one selector must be set. */
  recipient: StaffRecipient;
  eventType: string;
  severity?: Severity;
  title: string;
  body?: string;
  /**
   * Deep link the bell click navigates to. Same shape gate as the
   * customer publisher: relative '/path' or absolute https URL on a
   * HenryCo-controlled host.
   */
  deepLink: string;
  actionLabel?: string;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  relatedId?: string;
  relatedType?: string;
  requestId?: string;
  /** Defaults to "shim:packages/notifications/staff". */
  publisher?: string;
};

export type StaffPublishOk = { ok: true; id: string };

export type StaffPublishErrorCode =
  | "validation"
  | "rate_limited"
  | "persistence"
  | "missing_env";

export type StaffPublishErr = {
  ok: false;
  error: StaffPublishErrorCode;
  /** Safe, non-PII detail string for logging. */
  detail?: string;
};

export type StaffPublishResult = StaffPublishOk | StaffPublishErr;
