// ---------------------------------------------------------------------------
// telemetry.ts — henry.moderation.* event envelope builders (content-free)
//
// Pure builders that return the app-emittable envelope shape
// (Omit<HenryEventEnvelope, "version" | "occurredAt">). The app stamps version
// + occurredAt and persists via its emitIntelligenceEvent → customer_activity
// path (the intelligence package's trackEvent is fire-and-forget; persistence
// is app-level). Properties carry content TYPE, decision, scanner, reason codes
// and latency — NEVER the raw content body.
// ---------------------------------------------------------------------------

import type { HenryEventEnvelope } from "@henryco/intelligence";
import type {
  ContentType,
  ModerationDecision,
  ModerationReason,
  ScannerKind,
} from "./types";

export type ModerationEventInput = Omit<HenryEventEnvelope, "version" | "occurredAt">;

export const MODERATION_EVENTS = {
  scanned: "henry.moderation.content.scanned",
  held: "henry.moderation.content.held",
  rejected: "henry.moderation.content.rejected",
  reportFiled: "henry.moderation.report.filed",
  staffOverride: "henry.moderation.staff.override",
} as const;

type HenryDivision = HenryEventEnvelope["division"];

/** Map a content domain to a telemetry division (the enum has no "moderation"). */
export function divisionForContentType(contentType: ContentType): HenryDivision {
  switch (contentType) {
    case "marketplace_listing":
      return "marketplace";
    case "job_post":
      return "jobs";
    case "studio_brief":
      return "studio";
    case "service_profile":
      return "care";
    default:
      return "system";
  }
}

export interface ScanEventArgs {
  contentType: ContentType;
  contentId: string;
  decision: ModerationDecision;
  scanner: ScannerKind;
  reasons: ReadonlyArray<ModerationReason>;
  latencyMs: number;
  actorId?: string | null;
  correlationId?: string;
}

/**
 * Build the scan envelope. Emits a `scanned` event always, plus the caller
 * should additionally emit held/rejected via the dedicated builders when the
 * decision warrants it.
 */
export function buildScanEvent(args: ScanEventArgs): ModerationEventInput {
  return {
    name: decisionEventName(args.decision),
    division: divisionForContentType(args.contentType),
    actor: { kind: "automation", subjectRef: args.actorId ?? undefined, roleHint: "moderation" },
    correlationId: args.correlationId,
    properties: {
      contentType: args.contentType,
      contentId: args.contentId,
      decision: args.decision,
      scanner: args.scanner,
      reasons: [...args.reasons],
      latencyMs: args.latencyMs,
    },
  };
}

function decisionEventName(decision: ModerationDecision): string {
  if (decision === "reject") return MODERATION_EVENTS.rejected;
  if (decision === "hold") return MODERATION_EVENTS.held;
  return MODERATION_EVENTS.scanned;
}

export interface ReportEventArgs {
  contentType: ContentType;
  contentId: string;
  reasonCode: string;
  reporterId?: string | null;
  correlationId?: string;
}

export function buildReportFiledEvent(args: ReportEventArgs): ModerationEventInput {
  return {
    name: MODERATION_EVENTS.reportFiled,
    division: divisionForContentType(args.contentType),
    actor: { kind: "user", subjectRef: args.reporterId ?? undefined, roleHint: "customer" },
    correlationId: args.correlationId,
    properties: {
      contentType: args.contentType,
      contentId: args.contentId,
      reasonCode: args.reasonCode,
    },
  };
}

export interface StaffOverrideEventArgs {
  contentType: ContentType;
  contentId: string;
  decision: ModerationDecision;
  staffId: string;
  priorDecision?: ModerationDecision;
  correlationId?: string;
}

export function buildStaffOverrideEvent(args: StaffOverrideEventArgs): ModerationEventInput {
  return {
    name: MODERATION_EVENTS.staffOverride,
    division: divisionForContentType(args.contentType),
    actor: { kind: "staff", subjectRef: args.staffId, roleHint: "moderation" },
    correlationId: args.correlationId,
    properties: {
      contentType: args.contentType,
      contentId: args.contentId,
      decision: args.decision,
      priorDecision: args.priorDecision ?? null,
      scanner: "manual" as ScannerKind,
    },
  };
}
