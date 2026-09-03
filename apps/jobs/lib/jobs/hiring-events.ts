import "server-only";

import {
  HenryEventNames,
  henryEventEnvelopeSchema,
  noopSink,
  trackEvent,
  type HenryEventEnvelope,
} from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-70 — employer-hiring telemetry. Mirrors the canonical
 * `emitIntelligenceEvent` (apps/account): validates the envelope, runs the
 * package sink (no-op), and persists a `customer_activity` `intel:henry.*` row
 * (the path analytics auto-derives). Best-effort: every failure is swallowed so
 * telemetry NEVER throws into a hiring mutation.
 *
 * Hiring events ride on division 'jobs', actor.kind 'user' (the acting
 * recruiter); the business identity rides in eventId + properties and the member
 * role in actor.roleHint — there is no 'business'/'hiring' division or actor.kind.
 */

export type HiringEventKey =
  | "HIRING_APPLICATION_STAGED"
  | "HIRING_INTERVIEW_SCHEDULED"
  | "HIRING_OFFER_SENT"
  | "HIRING_CANDIDATE_HIRED";

export async function emitHiringEvent(args: {
  key: HiringEventKey;
  actorUserId: string;
  roleHint?: string;
  businessId: string;
  pipelineId?: string;
  applicationId?: string;
  properties: Record<string, unknown>;
}): Promise<void> {
  try {
    const envelope: HenryEventEnvelope = {
      name: HenryEventNames[args.key],
      version: "1",
      occurredAt: new Date().toISOString(),
      division: "jobs",
      eventId: `hiring:${args.key}:${args.businessId}:${args.applicationId ?? args.pipelineId ?? args.actorUserId}`,
      actor: { kind: "user", subjectRef: args.actorUserId, roleHint: args.roleHint },
      properties: {
        businessId: args.businessId,
        pipelineId: args.pipelineId ?? null,
        applicationId: args.applicationId ?? null,
        ...args.properties,
      },
    };

    // Drop silently on an invalid envelope (matches trackEvent semantics) rather
    // than persisting a malformed activity row.
    if (!henryEventEnvelopeSchema.safeParse(envelope).success) return;
    trackEvent(noopSink, envelope);

    const admin = createAdminSupabase();
    await admin.from("customer_activity").insert({
      user_id: envelope.actor?.subjectRef || null,
      division: envelope.division,
      activity_type: `intel:${envelope.name}`,
      title: String(envelope.properties.title || envelope.name),
      description: String(envelope.properties.summary || "Hiring event captured."),
      status: String(envelope.properties.status || "recorded"),
      reference_type: "intel_event",
      reference_id: String(envelope.eventId || ""),
      metadata: {
        ...envelope.properties,
        event_name: envelope.name,
        correlation_id: envelope.correlationId || null,
      },
    } as never);
  } catch {
    // Telemetry is best-effort — never let it surface into the request path.
  }
}
