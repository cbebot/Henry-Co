/**
 * @henryco/rooms — typed error constructors.
 *
 * Every server action returns either a success payload or a `RoomError`
 * via the constructors below. Centralising construction keeps the wire
 * shape consistent and makes a future migration to a discriminated
 * Result<T,E> wrapper a one-file change.
 */

import type { ParticipantRole, RoomError, RoomProvider, RoomStatus } from "./types";

export function roomsUnavailable(retryAfter?: number): RoomError {
  return retryAfter === undefined
    ? { error: "rooms_unavailable" }
    : { error: "rooms_unavailable", retryAfter };
}

export function providerUnavailable(
  provider: RoomProvider,
  retryAfter?: number,
): RoomError {
  return retryAfter === undefined
    ? { error: "provider_unavailable", provider }
    : { error: "provider_unavailable", provider, retryAfter };
}

export function unauthorized(
  reason: "no_session" | "not_participant" | "wrong_role",
): RoomError {
  return { error: "unauthorized", reason };
}

export function consentMissing(missingUserIds: ReadonlyArray<string>): RoomError {
  return { error: "consent_missing", missingUserIds };
}

export function sessionNotFound(sessionId: string): RoomError {
  return { error: "session_not_found", sessionId };
}

export function sessionNotJoinable(status: RoomStatus): RoomError {
  return { error: "session_not_joinable", status };
}

export function rateLimited(retryAfter: number): RoomError {
  return { error: "rate_limited", retryAfter };
}

export function validationFailed(field: string, message: string): RoomError {
  return { error: "validation_failed", field, message };
}

export function internalError(message: string): RoomError {
  return { error: "internal_error", message };
}

/**
 * The participant role check the join action enforces. Returns `true`
 * when the requested role is in the allowed-for-this-kind set per
 * the audit §4.1 consumption matrix. Wave C extends this for Jobs
 * interview-specific roles.
 */
const ROLE_BY_KIND: Record<string, ReadonlySet<ParticipantRole>> = {
  care_consult: new Set<ParticipantRole>(["operator", "customer", "observer"]),
  marketplace_dispute: new Set<ParticipantRole>(["operator", "customer", "observer"]),
  studio_review: new Set<ParticipantRole>(["host", "customer", "observer"]),
  academy_class: new Set<ParticipantRole>(["host", "customer", "observer"]),
  logistics_call: new Set<ParticipantRole>(["operator", "customer"]),
  property_tour: new Set<ParticipantRole>(["host", "customer", "observer"]),
  jobs_interview: new Set<ParticipantRole>([
    "host",
    "candidate",
    "interviewer",
    "observer",
  ]),
};

export function isRoleAllowedForKind(
  role: ParticipantRole,
  kind: keyof typeof ROLE_BY_KIND,
): boolean {
  const allowed = ROLE_BY_KIND[kind];
  return allowed ? allowed.has(role) : false;
}
