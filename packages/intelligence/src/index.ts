import { z } from "zod";

export * from "./analytics";
export * from "./search";

export const henryDivisionSchema = z.enum([
  "hub",
  "account",
  "care",
  "studio",
  "marketplace",
  "property",
  "logistics",
  "learn",
  "jobs",
  "hq",
  "staff",
  "system",
  "wallet",
]);

export type HenryDivision = z.infer<typeof henryDivisionSchema>;

export const henryEventNameSchema = z
  .string()
  .regex(/^henry\.[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$/, "Expected henry.<domain>.<object>.<verb>");

export const henryEventEnvelopeSchema = z.object({
  name: henryEventNameSchema,
  version: z.literal("1"),
  occurredAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Expected ISO datetime"),
  division: henryDivisionSchema,
  eventId: z.string().max(128).optional(),
  correlationId: z.string().optional(),
  actor: z
    .object({
      kind: z.enum(["user", "system", "staff", "automation", "anonymous"]),
      subjectRef: z.string().max(128).optional(),
      roleHint: z.string().max(64).optional(),
    })
    .optional(),
  properties: z.record(z.string(), z.unknown()),
});

export type HenryEventEnvelope = z.infer<typeof henryEventEnvelopeSchema>;

export const HenryEventNames = {
  AUTH_SESSION_STARTED: "henry.auth.session.started",
  AUTH_SESSION_ENDED: "henry.auth.session.ended",
  AUTH_SIGNIN_FAILED: "henry.auth.signin.failed",
  PROFILE_UPDATED: "henry.profile.profile.updated",
  PROFILE_COMPLETION_CHANGED: "henry.profile.completion.changed",
  TRUST_VERIFICATION_SUBMITTED: "henry.trust.verification.submitted",
  TRUST_VERIFICATION_RESOLVED: "henry.trust.verification.resolved",
  SUPPORT_CONVERSATION_OPENED: "henry.support.conversation.opened",
  SUPPORT_CONVERSATION_ESCALATED: "henry.support.conversation.escalated",
  SUPPORT_CONVERSATION_RESOLVED: "henry.support.conversation.resolved",
  SECURITY_SIGNAL_RECORDED: "henry.security_signal.signal.recorded",
  WALLET_DEPOSIT_INITIATED: "henry.wallet.deposit.initiated",
  WALLET_WITHDRAW_REQUESTED: "henry.wallet.withdraw.requested",
  // Jobs trust events
  JOBS_EMPLOYER_TRUST_COMPUTED: "henry.jobs.employer_trust.computed",
  JOBS_INTERVIEW_NO_SHOW: "henry.jobs.interview.no_show",
  JOBS_EMPLOYER_MODERATION_INCIDENT: "henry.jobs.employer.moderation_incident",
  // Marketplace trust events
  MARKETPLACE_SELLER_TRUST_RECALCULATED: "henry.marketplace.seller_trust.recalculated",
  MARKETPLACE_REVIEW_FLAGGED: "henry.marketplace.review.flagged",
  MARKETPLACE_REVIEW_BLOCKED: "henry.marketplace.review.blocked",
  MARKETPLACE_DISPUTE_TRUST_IMPACT: "henry.marketplace.dispute.trust_impact",
  // Lifecycle / CRM events
  LIFECYCLE_STAGE_CHANGED: "henry.lifecycle.stage.changed",
  LIFECYCLE_RECOMMENDATION_CLICKED: "henry.lifecycle.recommendation.clicked",
  LIFECYCLE_DORMANT_DETECTED: "henry.lifecycle.dormant.detected",
  LIFECYCLE_REENTRY_COMPLETED: "henry.lifecycle.reentry.completed",
  LIFECYCLE_BLOCKER_DETECTED: "henry.lifecycle.blocker.detected",
} as const;

export type AnalyticsSink = { emit: (event: HenryEventEnvelope) => void | Promise<void> };

export const noopSink: AnalyticsSink = { emit: () => {} };

export function trackEvent(sink: AnalyticsSink, event: HenryEventEnvelope): void {
  const parsed = henryEventEnvelopeSchema.safeParse(event);
  if (!parsed.success) return;
  void sink.emit(parsed.data);
}

export type NotificationCategory =
  | "account"
  | "trust"
  | "marketplace"
  | "orders"
  | "bookings"
  | "logistics"
  | "learn"
  | "jobs"
  | "wallet"
  | "support"
  | "security"
  | "system";

export type DeliveryPriority = "low" | "normal" | "high" | "urgent";
export type ReadState = "unread" | "read" | "archived";
export type NotificationIntent = "informational" | "action_required";

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  sourceDivision: HenryDivision;
  deeplinkTemplate?: string;
  priority: DeliveryPriority;
  blocking?: boolean;
  dueAt?: string;
  createdAt: string;
  readState: ReadState;
}

export type TrustState = "unverified" | "pending_review" | "needs_action" | "verified" | "restricted" | "frozen";
export type UserRoleHint = "guest" | "buyer" | "seller" | "staff" | "owner";
export type RecommendationConfidence = "low" | "medium" | "high";
export type RecommendationReasonCode =
  | "profile_incomplete"
  | "trust_pending"
  | "saved_items"
  | "recent_activity"
  | "cross_sell_division"
  | "role_default";

export interface UserContext {
  roleHint: UserRoleHint;
  trustState: TrustState;
  profileCompleteness: number;
  explicitDivisionPrefs?: HenryDivision[];
  recentDivisions?: HenryDivision[];
  savedListingIds?: string[];
  savedJobIds?: string[];
  savedCourseIds?: string[];
}

export interface Recommendation {
  id: string;
  division: HenryDivision;
  title: string;
  description?: string;
  reasonCodes: RecommendationReasonCode[];
  confidence: RecommendationConfidence;
  ctaHref: string;
  ctaLabel: string;
}

export function nextAccountSteps(ctx: UserContext): Recommendation[] {
  const items: Recommendation[] = [];
  if (ctx.trustState === "pending_review" || ctx.trustState === "needs_action") {
    items.push({
      id: "trust-next",
      division: "account",
      title: "Complete your trust verification",
      description: "Unlock more actions across HenryCo.",
      reasonCodes: ["trust_pending"],
      confidence: "high",
      ctaHref: "/security",
      ctaLabel: "Review trust status",
    });
  }
  if (ctx.profileCompleteness < 0.6) {
    items.push({
      id: "profile-next",
      division: "account",
      title: "Finish your profile",
      description: "A complete profile improves support and service continuity.",
      reasonCodes: ["profile_incomplete"],
      confidence: "medium",
      ctaHref: "/settings",
      ctaLabel: "Complete profile",
    });
  }
  if (ctx.savedJobIds?.length) {
    items.push({
      id: "jobs-saved",
      division: "jobs",
      title: "Follow up on saved roles",
      reasonCodes: ["saved_items"],
      confidence: "medium",
      ctaHref: "/jobs",
      ctaLabel: "Open jobs",
    });
  }
  return items.slice(0, 5);
}

export type SupportIntent =
  | "billing"
  | "account_access"
  | "marketplace_order"
  | "booking"
  | "verification"
  | "wallet"
  | "other";
export type SupportQueue = "general" | "trust" | "finance";

export interface SupportTriageResult {
  intent: SupportIntent;
  confidence: number;
  shouldEscalate: boolean;
  handoffSummary: {
    intent: SupportIntent;
    userSummary: string;
    suggestedQueue?: SupportQueue;
  };
}

export const TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD = 0.55;

export function triageSupportStub(input: { message: string }): SupportTriageResult {
  const text = input.message.trim().toLowerCase();
  let intent: SupportIntent = "other";
  if (/(password|login|sign in|locked out|otp|mfa|2fa)/.test(text)) intent = "account_access";
  else if (/(refund|charge|invoice|payment failed|card|billing)/.test(text)) intent = "billing";
  else if (/(order|delivery|seller|marketplace)/.test(text)) intent = "marketplace_order";
  else if (/(book|booking|appointment)/.test(text)) intent = "booking";
  else if (/(verify|verification|kyc|document)/.test(text)) intent = "verification";
  else if (/(wallet|withdraw|deposit|transfer)/.test(text)) intent = "wallet";

  const urgent = /(urgent|fraud|hack|stolen)/.test(text);
  const confidence = intent === "other" ? 0.4 : 0.72;
  const suggestedQueue: SupportQueue =
    intent === "wallet" || intent === "billing"
      ? "finance"
      : intent === "verification"
        ? "trust"
        : "general";

  return {
    intent,
    confidence,
    shouldEscalate: urgent || confidence < TRIAGE_CONFIDENCE_ESCALATE_THRESHOLD,
    handoffSummary: {
      intent,
      userSummary: "Customer issue categorized for staff triage.",
      suggestedQueue,
    },
  };
}

export type RiskSignalType =
  | "failed_sensitive_action_burst"
  | "listing_spam_pattern"
  | "wallet_velocity_anomaly"
  | "verification_mismatch"
  | "support_abuse_pattern"
  | "booking_brute_force"
  | "moderation_repeat_failure"
  | "upload_pattern_suspicious";
export type RiskSeverity = "info" | "low" | "medium" | "high";

export interface RiskSignal {
  id: string;
  type: RiskSignalType;
  severity: RiskSeverity;
  subjectRef: string;
  recordedAt: string;
  metadataKeys: string[];
}

export type HenryFeatureFlagName =
  | "intelligence_events"
  | "intelligence_recommendations"
  | "intelligence_staff_queues";

export type HenryFeatureFlags = Record<HenryFeatureFlagName, boolean>;

export const ACCOUNT_TRUST_TIERS = [
  "basic",
  "verified",
  "trusted",
  "premium_verified",
] as const;

export type AccountTrustTier = (typeof ACCOUNT_TRUST_TIERS)[number];

export function getAccountTrustTierLabel(tier: AccountTrustTier) {
  return tier
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function envBool(v: string | undefined): boolean {
  if (v == null) return false;
  return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
}

export function parseHenryFeatureFlags(env: Record<string, string | undefined>): HenryFeatureFlags {
  const list = new Set(
    (env.NEXT_PUBLIC_HENRY_FLAGS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return {
    intelligence_events:
      envBool(env.NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_EVENTS) ||
      list.has("intelligence_events") ||
      list.has("events"),
    intelligence_recommendations:
      envBool(env.NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_RECOMMENDATIONS) ||
      list.has("intelligence_recommendations") ||
      list.has("recommendations"),
    intelligence_staff_queues:
      envBool(env.NEXT_PUBLIC_HENRY_FLAG_INTELLIGENCE_STAFF_QUEUES) ||
      list.has("intelligence_staff_queues") ||
      list.has("staff_queues"),
  };
}

export function isFlagEnabled(flags: HenryFeatureFlags, name: HenryFeatureFlagName) {
  return Boolean(flags[name]);
}

