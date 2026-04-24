import type {
  NewsletterCampaignClass,
  NewsletterSubscriber,
  NewsletterSubscriberStatus,
  NewsletterSuppressionEntry,
  NewsletterSuppressionReason,
  NewsletterSuppressionScope,
} from "./types";

export type SuppressionDecision = {
  allowed: boolean;
  reason: NewsletterSuppressionReason | null;
  scope: NewsletterSuppressionScope | null;
  note: string | null;
};

export type SupportState = {
  unresolvedCriticalThreads: number;
  unresolvedDisputes: number;
  activeTrustHold: boolean;
  activePaymentIncident: boolean;
  legalHold: boolean;
};

export type TrustState = {
  accountFrozen: boolean;
  trustTier: string | null;
  complianceReviewActive: boolean;
};

export type SuppressionEvaluationInput = {
  subscriber: Pick<
    NewsletterSubscriber,
    "email" | "status" | "hardBounceCount" | "softBounceCount" | "lastBouncedAt"
  >;
  campaignClass: NewsletterCampaignClass;
  suppressionEntries: NewsletterSuppressionEntry[];
  supportState?: SupportState;
  trustState?: TrustState;
};

function scopeMatchesCampaign(
  scope: NewsletterSuppressionScope,
  campaignClass: NewsletterCampaignClass
): boolean {
  if (scope === "all") return true;
  if (scope === "transactional_only") {
    return campaignClass !== "transactional_education";
  }
  if (scope === "marketing") {
    return (
      campaignClass === "company_wide" ||
      campaignClass === "division_digest" ||
      campaignClass === "announcement"
    );
  }
  if (scope === "lifecycle") return campaignClass === "lifecycle_journey";
  if (scope === "digest") return campaignClass === "division_digest";
  return false;
}

export function evaluateSuppression(input: SuppressionEvaluationInput): SuppressionDecision {
  const { subscriber, campaignClass, suppressionEntries, supportState, trustState } = input;

  if (subscriber.status === "unsubscribed") {
    return {
      allowed: false,
      reason: "unsubscribed",
      scope: "all",
      note: "Subscriber has unsubscribed",
    };
  }
  if (subscriber.status === "suppressed") {
    return {
      allowed: false,
      reason: "manual_optout",
      scope: "all",
      note: "Subscriber is in suppressed state",
    };
  }
  if (subscriber.status === "paused" && campaignClass !== "transactional_education") {
    return {
      allowed: false,
      reason: "manual_optout",
      scope: "marketing",
      note: "Subscriber paused promotional sends",
    };
  }
  if (subscriber.hardBounceCount >= 2) {
    return {
      allowed: false,
      reason: "hard_bounce",
      scope: "all",
      note: "Repeated hard bounces",
    };
  }
  if (subscriber.softBounceCount >= 6) {
    return {
      allowed: false,
      reason: "soft_bounce_repeated",
      scope: "all",
      note: "Repeated soft bounces",
    };
  }

  const now = Date.now();
  for (const entry of suppressionEntries) {
    if (entry.email.toLowerCase() !== subscriber.email.toLowerCase()) continue;
    if (entry.expiresAt) {
      const exp = Date.parse(entry.expiresAt);
      if (!Number.isNaN(exp) && exp <= now) continue;
    }
    if (!scopeMatchesCampaign(entry.scope, campaignClass)) continue;
    return {
      allowed: false,
      reason: entry.reason,
      scope: entry.scope,
      note: entry.note ?? null,
    };
  }

  if (supportState) {
    if (supportState.legalHold) {
      return {
        allowed: false,
        reason: "legal_hold",
        scope: "all",
        note: "Account under legal hold",
      };
    }
    if (supportState.activeTrustHold && campaignClass !== "transactional_education") {
      return {
        allowed: false,
        reason: "trust_hold",
        scope: "marketing",
        note: "Active trust/compliance review",
      };
    }
    if (supportState.unresolvedDisputes > 0 && campaignClass !== "transactional_education") {
      return {
        allowed: false,
        reason: "dispute_active",
        scope: "marketing",
        note: "Customer has an active dispute",
      };
    }
    if (supportState.activePaymentIncident && campaignClass !== "transactional_education") {
      return {
        allowed: false,
        reason: "payment_incident",
        scope: "marketing",
        note: "Active payment/billing incident",
      };
    }
    if (supportState.unresolvedCriticalThreads > 0 && campaignClass === "company_wide") {
      return {
        allowed: false,
        reason: "support_sensitive",
        scope: "marketing",
        note: "Unresolved critical support thread",
      };
    }
  }

  if (trustState?.accountFrozen) {
    return {
      allowed: false,
      reason: "trust_hold",
      scope: "all",
      note: "Account frozen",
    };
  }

  if (trustState?.complianceReviewActive && campaignClass !== "transactional_education") {
    return {
      allowed: false,
      reason: "trust_hold",
      scope: "marketing",
      note: "Compliance review active",
    };
  }

  return { allowed: true, reason: null, scope: null, note: null };
}

export function computeSubscriberStatusFromBounces(
  current: NewsletterSubscriberStatus,
  hardBounceCount: number,
  softBounceCount: number
): NewsletterSubscriberStatus {
  if (current === "unsubscribed") return "unsubscribed";
  if (hardBounceCount >= 2 || softBounceCount >= 6) return "suppressed";
  return current;
}

export function describeSuppressionReason(reason: NewsletterSuppressionReason): string {
  switch (reason) {
    case "manual_optout":
      return "Subscriber explicitly opted out";
    case "hard_bounce":
      return "Address returned hard bounce";
    case "soft_bounce_repeated":
      return "Address has repeated soft bounces";
    case "spam_complaint":
      return "Address reported a spam complaint";
    case "invalid_address":
      return "Address is not valid";
    case "support_sensitive":
      return "Active support issue — suppressed from promotional sends";
    case "trust_hold":
      return "Trust/compliance hold on account";
    case "dispute_active":
      return "Active dispute on account";
    case "payment_incident":
      return "Active payment incident";
    case "unsubscribed":
      return "Subscriber unsubscribed";
    case "role_address":
      return "Role address (noreply/abuse/etc.)";
    case "legal_hold":
      return "Legal hold";
    default:
      return reason;
  }
}
