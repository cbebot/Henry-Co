export type SharedVerificationStatus = "none" | "pending" | "verified" | "rejected";

export type SharedTrustTier = "basic" | "verified" | "trusted" | "premium_verified";

export type VerificationRequirementLevel = "submitted" | "verified";

export type VerificationGateCopy = {
  status: SharedVerificationStatus;
  headline: string;
  detail: string;
  actionLabel: string;
};

const TRUST_TIER_ORDER: SharedTrustTier[] = [
  "basic",
  "verified",
  "trusted",
  "premium_verified",
];

export function normalizeVerificationStatus(value: unknown): SharedVerificationStatus {
  const status = String(value || "").trim().toLowerCase();
  if (status === "pending" || status === "verified" || status === "rejected") {
    return status;
  }
  return "none";
}

export function rankSharedTrustTier(tier: SharedTrustTier) {
  return TRUST_TIER_ORDER.indexOf(tier);
}

export function clampSharedTrustTier(tier: SharedTrustTier, maxTier: SharedTrustTier) {
  const cappedRank = Math.min(rankSharedTrustTier(tier), rankSharedTrustTier(maxTier));
  return TRUST_TIER_ORDER[Math.max(0, cappedRank)] || "basic";
}

export function satisfiesVerificationRequirement(
  status: unknown,
  requirement: VerificationRequirementLevel
) {
  const normalized = normalizeVerificationStatus(status);
  if (requirement === "submitted") {
    return normalized === "pending" || normalized === "verified";
  }
  return normalized === "verified";
}

export function getVerificationGateCopy(
  status: unknown,
  requirement: VerificationRequirementLevel = "verified"
): VerificationGateCopy {
  const normalized = normalizeVerificationStatus(status);

  if (requirement === "submitted") {
    if (normalized === "verified") {
      return {
        status: normalized,
        headline: "Verification cleared",
        detail: "Your identity verification has already been approved.",
        actionLabel: "Review verification",
      };
    }

    if (normalized === "pending") {
      return {
        status: normalized,
        headline: "Verification is under review",
        detail:
          "Your documents are already in the review queue. This workflow will unlock once review completes.",
        actionLabel: "Review verification",
      };
    }

    if (normalized === "rejected") {
      return {
        status: normalized,
        headline: "Verification needs more information",
        detail:
          "Your last verification review was not approved. Resubmit clear documents before this workflow can continue.",
        actionLabel: "Resubmit verification",
      };
    }

    return {
      status: normalized,
      headline: "Verification submission required",
      detail:
        "Start identity verification first so this workflow can move into serious review instead of stalling later.",
      actionLabel: "Start verification",
    };
  }

  if (normalized === "verified") {
    return {
      status: normalized,
      headline: "Verification cleared",
      detail: "Identity verification is approved and trust-gated actions can proceed.",
      actionLabel: "Review verification",
    };
  }

  if (normalized === "pending") {
    return {
      status: normalized,
      headline: "Verification is under review",
      detail:
        "Your documents are in review. This action stays blocked until identity verification is approved.",
      actionLabel: "Review verification",
    };
  }

  if (normalized === "rejected") {
    return {
      status: normalized,
      headline: "Verification needs attention",
      detail:
        "Identity verification was not approved. Upload a clearer document set before retrying this action.",
      actionLabel: "Resubmit verification",
    };
  }

  return {
    status: normalized,
    headline: "Identity verification required",
    detail:
      "This is a trust-sensitive action. Submit and pass identity verification before it can unlock.",
    actionLabel: "Start verification",
  };
}

export function applyVerificationTrustControls(input: {
  verificationStatus: unknown;
  baseScore: number;
  baseTier: SharedTrustTier;
  verifiedBonus?: number;
  caps?: Partial<
    Record<
      Exclude<SharedVerificationStatus, "verified">,
      {
        maxScore: number;
        maxTier: SharedTrustTier;
      }
    >
  >;
}) {
  const status = normalizeVerificationStatus(input.verificationStatus);
  const baseScore = Math.max(0, Math.min(100, Math.round(Number(input.baseScore || 0))));
  const verifiedBonus = Number.isFinite(input.verifiedBonus) ? Number(input.verifiedBonus) : 18;
  const caps = {
    none: {
      maxScore: 58,
      maxTier: "basic" as SharedTrustTier,
      ...(input.caps?.none || {}),
    },
    pending: {
      maxScore: 72,
      maxTier: "verified" as SharedTrustTier,
      ...(input.caps?.pending || {}),
    },
    rejected: {
      maxScore: 38,
      maxTier: "basic" as SharedTrustTier,
      ...(input.caps?.rejected || {}),
    },
  };

  if (status === "verified") {
    return {
      status,
      score: Math.min(100, baseScore + verifiedBonus),
      tier: input.baseTier,
      capped: false,
    };
  }

  const cap = caps[status];
  return {
    status,
    score: Math.min(baseScore, cap.maxScore),
    tier: clampSharedTrustTier(input.baseTier, cap.maxTier),
    capped: true,
  };
}
