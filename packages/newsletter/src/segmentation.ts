import type {
  NewsletterAudienceSegment,
  NewsletterDivision,
  NewsletterSegmentCriteria,
  NewsletterSubscriber,
  NewsletterSuppressionEntry,
} from "./types";
import { evaluateSuppression, type SuppressionEvaluationInput } from "./suppression";

export type SegmentCandidate = {
  subscriber: NewsletterSubscriber;
  topicKeys: string[];
  lifecycleStage?: string | null;
  trustState?: string | null;
  roleHint?: string | null;
  lastEngagementDaysAgo?: number | null;
  isSupportSensitive?: boolean;
  isTrustHold?: boolean;
  isDisputeActive?: boolean;
};

export type SegmentResolution = {
  segmentId: string;
  segmentKey: string;
  matchedCount: number;
  skippedCount: number;
  matched: SegmentCandidate[];
  skipped: Array<{
    subscriber: NewsletterSubscriber;
    reason: string;
  }>;
};

function matchesDivisions(
  candidate: SegmentCandidate,
  divisions: NewsletterDivision[] | undefined
): boolean {
  if (!divisions || divisions.length === 0) return true;
  if (candidate.subscriber.sourceDivision && divisions.includes(candidate.subscriber.sourceDivision))
    return true;
  // Topic-based division inference: caller passes candidate.topicKeys; we expect the
  // caller to precompute candidate topicKeys that include the division.
  return divisions.some((division) => candidate.topicKeys.some((t) => t.startsWith(`${division}_`)));
}

function matchesTopics(
  candidate: SegmentCandidate,
  topics: string[] | undefined
): boolean {
  if (!topics || topics.length === 0) return true;
  return topics.some((topic) => candidate.topicKeys.includes(topic));
}

function matchesCountries(
  candidate: SegmentCandidate,
  countries: string[] | undefined
): boolean {
  if (!countries || countries.length === 0) return true;
  if (!candidate.subscriber.country) return false;
  return countries.includes(candidate.subscriber.country);
}

function matchesLocales(candidate: SegmentCandidate, locales: string[] | undefined): boolean {
  if (!locales || locales.length === 0) return true;
  return locales.some((locale) => candidate.subscriber.locale.toLowerCase().startsWith(locale.toLowerCase()));
}

function matchesLifecycle(
  candidate: SegmentCandidate,
  stages: string[] | undefined
): boolean {
  if (!stages || stages.length === 0) return true;
  if (!candidate.lifecycleStage) return false;
  return stages.includes(candidate.lifecycleStage);
}

function matchesTrust(
  candidate: SegmentCandidate,
  trustStates: string[] | undefined
): boolean {
  if (!trustStates || trustStates.length === 0) return true;
  if (!candidate.trustState) return false;
  return trustStates.includes(candidate.trustState);
}

function matchesRoleHint(
  candidate: SegmentCandidate,
  roleHints: string[] | undefined
): boolean {
  if (!roleHints || roleHints.length === 0) return true;
  if (!candidate.roleHint) return false;
  return roleHints.includes(candidate.roleHint);
}

export type ResolveSegmentOptions = {
  segment: NewsletterAudienceSegment;
  candidates: SegmentCandidate[];
  suppressionEntries: NewsletterSuppressionEntry[];
  campaignClass: SuppressionEvaluationInput["campaignClass"];
  now?: Date;
};

export function resolveSegment(options: ResolveSegmentOptions): SegmentResolution {
  const { segment, candidates, suppressionEntries, campaignClass } = options;
  const criteria: NewsletterSegmentCriteria = segment.criteria ?? {};

  const matched: SegmentCandidate[] = [];
  const skipped: SegmentResolution["skipped"] = [];

  for (const candidate of candidates) {
    const reasons: string[] = [];
    if (!matchesDivisions(candidate, criteria.divisions)) reasons.push("division");
    if (!matchesTopics(candidate, criteria.topics)) reasons.push("topic");
    if (!matchesCountries(candidate, criteria.countries)) reasons.push("country");
    if (!matchesLocales(candidate, criteria.locales)) reasons.push("locale");
    if (!matchesLifecycle(candidate, criteria.lifecycleStages)) reasons.push("lifecycle");
    if (!matchesTrust(candidate, criteria.trustStates)) reasons.push("trust_state");
    if (!matchesRoleHint(candidate, criteria.userRoleHints)) reasons.push("role_hint");

    if (
      criteria.minEngagementWithinDays &&
      criteria.minEngagementWithinDays > 0 &&
      candidate.lastEngagementDaysAgo !== null &&
      candidate.lastEngagementDaysAgo !== undefined &&
      candidate.lastEngagementDaysAgo > criteria.minEngagementWithinDays
    ) {
      reasons.push("engagement_stale");
    }

    if (criteria.excludeDormant && candidate.lifecycleStage === "dormant") {
      reasons.push("exclude_dormant");
    }

    if (criteria.excludeSupportSensitive && candidate.isSupportSensitive) {
      reasons.push("exclude_support_sensitive");
    }

    if (criteria.excludeTrustHold && candidate.isTrustHold) {
      reasons.push("exclude_trust_hold");
    }

    if (criteria.excludeDisputeActive && candidate.isDisputeActive) {
      reasons.push("exclude_dispute_active");
    }

    if (reasons.length > 0) {
      skipped.push({ subscriber: candidate.subscriber, reason: reasons.join(",") });
      continue;
    }

    const decision = evaluateSuppression({
      subscriber: candidate.subscriber,
      campaignClass,
      suppressionEntries,
      supportState: {
        unresolvedCriticalThreads: 0,
        unresolvedDisputes: candidate.isDisputeActive ? 1 : 0,
        activeTrustHold: Boolean(candidate.isTrustHold),
        activePaymentIncident: false,
        legalHold: false,
      },
      trustState: {
        accountFrozen: false,
        trustTier: candidate.trustState ?? null,
        complianceReviewActive: Boolean(candidate.isTrustHold),
      },
    });

    if (!decision.allowed) {
      skipped.push({
        subscriber: candidate.subscriber,
        reason: `suppressed:${decision.reason ?? "unknown"}`,
      });
      continue;
    }

    matched.push(candidate);
  }

  return {
    segmentId: segment.id,
    segmentKey: segment.key,
    matchedCount: matched.length,
    skippedCount: skipped.length,
    matched,
    skipped,
  };
}

export function estimateSegmentSize(
  criteria: NewsletterSegmentCriteria,
  candidates: SegmentCandidate[]
): number {
  let size = 0;
  for (const candidate of candidates) {
    if (!matchesDivisions(candidate, criteria.divisions)) continue;
    if (!matchesTopics(candidate, criteria.topics)) continue;
    if (!matchesCountries(candidate, criteria.countries)) continue;
    if (!matchesLocales(candidate, criteria.locales)) continue;
    if (!matchesLifecycle(candidate, criteria.lifecycleStages)) continue;
    if (!matchesTrust(candidate, criteria.trustStates)) continue;
    if (!matchesRoleHint(candidate, criteria.userRoleHints)) continue;
    if (criteria.excludeDormant && candidate.lifecycleStage === "dormant") continue;
    if (criteria.excludeSupportSensitive && candidate.isSupportSensitive) continue;
    if (criteria.excludeTrustHold && candidate.isTrustHold) continue;
    if (criteria.excludeDisputeActive && candidate.isDisputeActive) continue;
    size += 1;
  }
  return size;
}

export const DEFAULT_SEGMENTS: Array<Pick<NewsletterAudienceSegment, "key" | "label" | "description" | "criteria" | "ownerTeam">> = [
  {
    key: "company_newsletter_all_optins",
    label: "Company newsletter — all active opt-ins",
    description: "Anyone who opted into the HenryCo Group Digest and is not suppressed.",
    criteria: {
      topics: ["company_digest"],
      excludeSupportSensitive: true,
      excludeTrustHold: true,
      excludeDisputeActive: true,
    },
    ownerTeam: "Editorial",
  },
  {
    key: "marketplace_digest_active_buyers",
    label: "Marketplace digest — active buyers",
    description: "Opted-in marketplace digest subscribers with engagement in the last 90 days.",
    criteria: {
      topics: ["marketplace_digest"],
      minEngagementWithinDays: 90,
      excludeDormant: true,
      excludeSupportSensitive: true,
      excludeDisputeActive: true,
    },
    ownerTeam: "Marketplace Ops",
  },
  {
    key: "jobs_digest_candidates",
    label: "Jobs digest — candidates",
    description: "Candidates opted into jobs digest, not in trust hold.",
    criteria: {
      topics: ["jobs_digest"],
      userRoleHints: ["guest", "buyer", "seller"],
      excludeTrustHold: true,
      excludeSupportSensitive: true,
    },
    ownerTeam: "Jobs",
  },
  {
    key: "property_spotlights_engaged",
    label: "Property spotlights — engaged",
    description: "Subscribers opted into property spotlights with recent engagement.",
    criteria: {
      topics: ["property_spotlights"],
      minEngagementWithinDays: 120,
      excludeSupportSensitive: true,
      excludeDisputeActive: true,
    },
    ownerTeam: "Property",
  },
  {
    key: "care_seasonal_updates",
    label: "Care — seasonal update subscribers",
    description: "Care updates opted-in; excludes anyone with an active service dispute.",
    criteria: {
      topics: ["care_updates"],
      excludeDisputeActive: true,
      excludeSupportSensitive: true,
    },
    ownerTeam: "Care Ops",
  },
  {
    key: "learn_program_subscribers",
    label: "Learn program subscribers",
    description: "Learn program updates opted-in; excludes frozen accounts.",
    criteria: {
      topics: ["learn_programs"],
      excludeTrustHold: true,
    },
    ownerTeam: "Learn Ops",
  },
];
