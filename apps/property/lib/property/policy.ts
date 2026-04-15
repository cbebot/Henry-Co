import "server-only";

import { getVerificationGateCopy } from "@henryco/trust";
import type {
  PropertyListing,
  PropertyListingIntent,
  PropertyListingServiceType,
  PropertyListingStatus,
} from "@/lib/property/types";

export const PROPERTY_POLICY_VERSION = "property-policy-v1.0";

export type PropertyPolicyContext = {
  viewer: {
    userId: string;
    email: string | null;
  };
  wallet: {
    balanceKobo: number;
    currency: string;
  };
  trust: {
    tier: "basic" | "verified" | "trusted" | "premium_verified" | "unknown";
    score: number;
    signals: {
      emailVerified: boolean;
      phonePresent: boolean;
      accountAgeDays: number;
      suspiciousEvents: number;
      duplicateEmailMatches: number;
      duplicatePhoneMatches: number;
      verificationStatus: "none" | "pending" | "verified" | "rejected";
    };
  };
  submission: {
    serviceType: PropertyListingServiceType;
    intent: PropertyListingIntent;
    kind: PropertyListing["kind"];
    price: number;
    mediaCount: number;
    verificationDocCount: number;
    locationSlug: string;
    ownershipProofCount: number;
    authorityProofCount: number;
    managementAuthorizationCount: number;
    identityEvidenceCount: number;
    inspectionEvidenceCount: number;
  };
};

export type PropertyPolicyDecision = {
  riskScore: number;
  riskFlags: string[];
  required: {
    verificationDocsMin: number;
    mediaMin: number;
    requiresInspection: boolean;
    requiresEnhancedKyc: boolean;
    requiresManualReview: boolean;
    requiresWalletFloorKobo: number;
    allowsWalletBypassViaInspection: boolean;
  };
  nextStatus: PropertyListingStatus;
  summary: string;
  userGuidance: {
    headline: string;
    bullets: string[];
    nextStepLabel: string;
  };
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function requiredDocsForService(serviceType: PropertyListingServiceType) {
  switch (serviceType) {
    case "sale":
    case "land":
      return { verificationDocsMin: 2, mediaMin: 6 };
    case "commercial":
      return { verificationDocsMin: 2, mediaMin: 6 };
    case "shortlet":
      return { verificationDocsMin: 1, mediaMin: 8 };
    case "managed_property":
    case "verified_property":
      return { verificationDocsMin: 2, mediaMin: 6 };
    case "inspection_request":
      return { verificationDocsMin: 0, mediaMin: 0 };
    case "agent_assisted":
      return { verificationDocsMin: 1, mediaMin: 5 };
    case "rent":
    default:
      return { verificationDocsMin: 1, mediaMin: 5 };
  }
}

function baseRiskForService(serviceType: PropertyListingServiceType) {
  switch (serviceType) {
    case "shortlet":
      return 72;
    case "sale":
      return 70;
    case "land":
      return 78;
    case "commercial":
      return 74;
    case "inspection_request":
      return 45;
    case "managed_property":
      return 55;
    case "verified_property":
      return 62;
    case "agent_assisted":
      return 60;
    case "rent":
    default:
      return 52;
  }
}

function isHighValue(price: number) {
  // Heuristic: make high-value listings stricter (in NGN).
  return price >= 50_000_000 || (price > 0 && price >= 1_500_000 && price <= 5_000_000);
}

export function evaluatePropertySubmissionPolicy(ctx: PropertyPolicyContext): PropertyPolicyDecision {
  const baseDocs = requiredDocsForService(ctx.submission.serviceType);

  const flags: string[] = [];
  let risk = baseRiskForService(ctx.submission.serviceType);
  const requiresAuthorityProof =
    ctx.submission.intent === "agent_listed" || ctx.submission.intent === "agent_assisted";
  const requiresManagementAuthorization =
    ctx.submission.serviceType === "managed_property" ||
    ctx.submission.intent === "managed_property";
  const requiresIdentityApproval =
    ctx.submission.serviceType === "sale" ||
    ctx.submission.serviceType === "land" ||
    ctx.submission.serviceType === "commercial" ||
    ctx.submission.serviceType === "managed_property" ||
    ctx.submission.serviceType === "verified_property" ||
    ctx.submission.intent === "agent_listed" ||
    ctx.submission.intent === "agent_assisted" ||
    isHighValue(ctx.submission.price);
  const verificationGate = getVerificationGateCopy(
    ctx.trust.signals.verificationStatus,
    "verified"
  );

  if (requiresAuthorityProof) {
    risk += 6;
    flags.push("agent_flow");
  }

  if (ctx.trust.signals.suspiciousEvents > 0) {
    risk += 18;
    flags.push("suspicious_security_events");
  }

  if (ctx.trust.signals.duplicateEmailMatches > 0 || ctx.trust.signals.duplicatePhoneMatches > 0) {
    risk += 12;
    flags.push("duplicate_contact_review");
  }

  if (ctx.trust.signals.accountAgeDays < 7) {
    risk += 8;
    flags.push("new_account");
  }

  if (requiresIdentityApproval && ctx.trust.signals.verificationStatus !== "verified") {
    risk += ctx.trust.signals.verificationStatus === "pending" ? 8 : 16;
    flags.push("identity_verification_required");
  }

  if (isHighValue(ctx.submission.price)) {
    risk += 8;
    flags.push("high_value");
  }

  if (ctx.submission.mediaCount < baseDocs.mediaMin) {
    risk += 6;
    flags.push("low_media");
  }

  if (ctx.submission.verificationDocCount < baseDocs.verificationDocsMin) {
    risk += 8;
    flags.push("missing_docs");
  }

  if (requiresAuthorityProof && ctx.submission.authorityProofCount === 0) {
    risk += 10;
    flags.push("missing_authority_proof");
  }

  if (
    !requiresAuthorityProof &&
    ctx.submission.serviceType !== "inspection_request" &&
    ctx.submission.ownershipProofCount === 0 &&
    ctx.submission.verificationDocCount === 0
  ) {
    risk += 8;
    flags.push("missing_primary_authority");
  }

  if (requiresManagementAuthorization && ctx.submission.managementAuthorizationCount === 0) {
    risk += 10;
    flags.push("missing_management_authorization");
  }

  if (ctx.submission.intent === "inspection_request") {
    flags.push("inspection_requested_by_user");
  }

  if (Number(ctx.wallet.balanceKobo || 0) > 0) {
    risk -= 2;
  }

  risk = clampScore(risk);

  const requiresManualReview = true; // Property always has editorial review rails.
  const requiresEnhancedKyc =
    risk >= 85 ||
    ctx.submission.serviceType === "land" ||
    (requiresIdentityApproval && ctx.trust.signals.verificationStatus !== "verified" && risk >= 78);

  const requiresInspection =
    ctx.submission.intent === "inspection_request" ||
    ctx.submission.serviceType === "managed_property" ||
    ctx.submission.serviceType === "verified_property" ||
    ctx.submission.serviceType === "land" ||
    risk >= 76;

  const identityGateSatisfied = ctx.trust.signals.verificationStatus === "verified";
  const documentGateSatisfied =
    ctx.submission.verificationDocCount >= baseDocs.verificationDocsMin &&
    (!requiresAuthorityProof || ctx.submission.authorityProofCount > 0) &&
    (!requiresManagementAuthorization || ctx.submission.managementAuthorizationCount > 0);
  const eligibilityHoldRequired =
    (requiresIdentityApproval && !identityGateSatisfied) ||
    ctx.trust.signals.duplicateEmailMatches > 0 ||
    ctx.trust.signals.duplicatePhoneMatches > 0 ||
    (ctx.trust.signals.suspiciousEvents > 0 && requiresIdentityApproval);

  let nextStatus: PropertyListingStatus = "under_review";

  if (eligibilityHoldRequired) nextStatus = "awaiting_eligibility";
  else if (!documentGateSatisfied) nextStatus = "awaiting_documents";
  else if (requiresInspection) nextStatus = "inspection_requested";
  else nextStatus = "under_review";

  const summary = [
    `${ctx.submission.serviceType.replaceAll("_", " ")} submission`,
    `risk ${risk}/100`,
    requiresInspection ? "inspection path" : "review path",
  ].join(" · ");

  const bullets: string[] = [];
  bullets.push("Your submission is private until HenryCo approves it for publication.");
  if (requiresIdentityApproval && !identityGateSatisfied) {
    bullets.push(
      `${verificationGate.detail} Open account verification before expecting publication review to continue.`
    );
  }
  if (!documentGateSatisfied && baseDocs.verificationDocsMin > 0) {
    bullets.push(
      `Documents: ${baseDocs.verificationDocsMin}+ proof files are expected for this listing path before public review can clear.`
    );
  }
  if (requiresAuthorityProof && ctx.submission.authorityProofCount === 0) {
    bullets.push(
      "Authority proof: broker or agent-led submissions stay held until HenryCo can see a mandate or equivalent approval."
    );
  }
  if (requiresManagementAuthorization && ctx.submission.managementAuthorizationCount === 0) {
    bullets.push(
      "Managed listing authorization: HenryCo needs a management instruction or equivalent written authority before this can move as a managed listing."
    );
  }
  if (requiresInspection) {
    bullets.push("Inspection: HenryCo may send an agent to verify the property and location before it goes live.");
  }
  if (ctx.trust.signals.duplicateEmailMatches > 0 || ctx.trust.signals.duplicatePhoneMatches > 0) {
    bullets.push("Contact review: shared contact details keep the submission in manual review until ownership is confirmed.");
  }
  if (requiresEnhancedKyc) {
    bullets.push("Enhanced verification: higher-risk listings may require extra identity or ownership proof.");
  }
  if (ctx.submission.serviceType === "managed_property") {
    bullets.push("Managed vs non-managed: managed listings only move forward when HenryCo can support the operating handoff, not just publish the listing.");
  }

  const headline =
    nextStatus === "awaiting_eligibility"
      ? requiresIdentityApproval && !identityGateSatisfied
        ? verificationGate.headline
        : "Eligibility check required"
      : nextStatus === "awaiting_documents"
        ? "Documents required before review"
        : nextStatus === "inspection_requested"
          ? "Inspection required before publication"
          : "Submission queued for review";

  const nextStepLabel =
    nextStatus === "awaiting_eligibility"
      ? requiresIdentityApproval && !identityGateSatisfied
        ? verificationGate.actionLabel
        : "Resolve eligibility"
      : nextStatus === "awaiting_documents"
        ? "Upload documents"
        : nextStatus === "inspection_requested"
          ? "Schedule inspection"
          : "Track review";

  return {
    riskScore: risk,
    riskFlags: Array.from(new Set(flags)),
    required: {
      verificationDocsMin: baseDocs.verificationDocsMin,
      mediaMin: baseDocs.mediaMin,
      requiresInspection,
      requiresEnhancedKyc,
      requiresManualReview,
      requiresWalletFloorKobo: 0,
      allowsWalletBypassViaInspection: false,
    },
    nextStatus,
    summary,
    userGuidance: {
      headline,
      bullets,
      nextStepLabel,
    },
  };
}
