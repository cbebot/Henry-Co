// ---------------------------------------------------------------------------
// apps/jobs/lib/jobs/trust.ts
// Server-side employer and candidate trust scoring for HenryCo Jobs.
//
// Design principles:
//  - Explainable: every signal is named and returned alongside the score.
//  - Not one opaque number: tier + score + reasons + coaching per sub-signal.
//  - Abuse-resistant: verification caps, no-show penalties, moderation impact.
//  - Connected to KYC truth: applyVerificationTrustControls controls maximum tier/score.
//  - Not legally reckless: employer feedback limited to platform-observable signals.
// ---------------------------------------------------------------------------
import "server-only";

import {
  applyVerificationTrustControls,
  normalizeVerificationStatus,
  type SharedVerificationStatus,
  type SharedTrustTier,
} from "@henryco/trust";
import { createAdminSupabase } from "@/lib/supabase";

// ---- Types ---------------------------------------------------------------

export type EmployerTrustTier = SharedTrustTier;

/** All behavioral signals that feed the employer trust score. */
export type EmployerTrustSignals = {
  verificationStatus: SharedVerificationStatus;
  identityVerified: boolean;
  companyProfileComplete: boolean;
  websitePresent: boolean;
  industrySet: boolean;
  locationsSet: boolean;
  /** Configured SLA in hours; lower is better. */
  responseSlaHours: number;
  /** Interviews cancelled < 2 hours before or marked no-show by candidate. */
  noShowCount: number;
  /** Applications that reached "hired" stage in HenryCo Jobs. */
  completedHirings: number;
  /** Total applications received (used for context). */
  totalApplications: number;
  /** Moderation actions taken against this employer (warn/reject/block). */
  moderationIncidents: number;
  /** Days since the employer profile was first created. */
  accountAgeDays: number;
};

export type EmployerTrustProfile = {
  tier: EmployerTrustTier;
  score: number;
  badge: string;
  /** Human-readable explanations of current trust state (shown to staff). */
  reasons: string[];
  /** Actionable advice shown to the employer to improve their trust standing. */
  coaching: string[];
  signals: EmployerTrustSignals;
  /** True when verification caps reduced the raw score or tier. */
  capped: boolean;
};

// ---- Badge labels --------------------------------------------------------

function badgeForTier(
  tier: EmployerTrustTier,
  verificationStatus: SharedVerificationStatus
): string {
  if (tier === "premium_verified") return "Premium verified employer";
  if (tier === "trusted") return "Trusted employer";
  if (tier === "verified") {
    return verificationStatus === "pending"
      ? "Verification under review"
      : "Employer verified";
  }
  return verificationStatus === "rejected" ? "Verification issue" : "Verification pending";
}

// ---- Pure score computation (synchronous, testable) ----------------------

/**
 * Computes an employer trust profile from pre-loaded signals.
 * No I/O — safe to call in synchronous contexts or tests.
 */
export function computeEmployerTrustProfile(
  signals: EmployerTrustSignals
): EmployerTrustProfile {
  let score = 0;
  const reasons: string[] = [];
  const coaching: string[] = [];

  // Identity verification — controlled by applyVerificationTrustControls later
  if (signals.identityVerified) {
    score += 18;
    reasons.push("Identity verification is approved.");
  } else if (signals.verificationStatus === "pending") {
    reasons.push("Identity documents are currently under review.");
    coaching.push("Identity verification is in progress — expect higher-trust lanes to unlock once approved.");
  } else if (signals.verificationStatus === "rejected") {
    score -= 8;
    reasons.push("Identity verification needs attention before trust-gated actions can unlock.");
    coaching.push("Resubmit clear identity documents to restore normal employer trust access.");
  } else {
    coaching.push("Start identity verification to unlock higher-trust employer posting lanes.");
  }

  // Company profile completeness (website + industry + locations + name + description)
  if (signals.companyProfileComplete) {
    score += 12;
    reasons.push("Employer profile has website, industry, and locations set.");
  } else {
    const missing: string[] = [];
    if (!signals.websitePresent) missing.push("website");
    if (!signals.industrySet) missing.push("industry");
    if (!signals.locationsSet) missing.push("locations");
    coaching.push(
      `Complete the employer profile — ${missing.length ? missing.join(", ") + " " : ""}missing fields reduce candidate confidence.`
    );
  }

  // Account history
  if (signals.accountAgeDays >= 90) {
    score += 14;
    reasons.push(`Employer account has ${signals.accountAgeDays} days of activity history.`);
  } else if (signals.accountAgeDays >= 30) {
    score += 8;
    reasons.push(`Employer account has ${signals.accountAgeDays} days of history.`);
  } else if (signals.accountAgeDays < 7) {
    coaching.push("New employer accounts start with lower trust while history builds.");
  }

  // Hiring completions — track record of actually closing roles
  if (signals.completedHirings >= 5) {
    score += 18;
    reasons.push(`${signals.completedHirings} verified hires demonstrate consistent hiring execution.`);
  } else if (signals.completedHirings >= 2) {
    score += 10;
    reasons.push(`${signals.completedHirings} completed hires are on record.`);
  } else if (signals.completedHirings === 1) {
    score += 5;
    reasons.push("One completed hire is on record.");
  } else {
    coaching.push("Completing hires through HenryCo Jobs builds measurable hiring credibility.");
  }

  // No-show penalty — interview abandonment harms candidate trust
  if (signals.noShowCount === 0) {
    score += 8;
    reasons.push("No interview no-shows or late cancellations are on record.");
  } else if (signals.noShowCount >= 3) {
    score -= 14;
    reasons.push(
      `${signals.noShowCount} interview no-shows are affecting employer trust standing.`
    );
    coaching.push(
      "Address interview no-show incidents — repeated abandonment reduces candidate confidence significantly."
    );
  } else {
    score -= 6;
    reasons.push(`${signals.noShowCount} interview no-show(s) are on record.`);
    coaching.push("Reduce last-minute interview cancellations to maintain trust standing.");
  }

  // Moderation history penalty
  if (signals.moderationIncidents === 0) {
    score += 8;
    reasons.push("No moderation incidents are on record.");
  } else if (signals.moderationIncidents >= 3) {
    score -= 16;
    reasons.push(`${signals.moderationIncidents} moderation incidents are on record.`);
    coaching.push("Resolve open moderation findings before submitting new live roles.");
  } else {
    score -= 6;
    reasons.push(`${signals.moderationIncidents} moderation incident(s) on record.`);
    coaching.push("Keep the moderation record clean to maintain higher-trust access.");
  }

  // Response SLA — faster SLA signals hiring intent to candidates
  if (signals.responseSlaHours > 0 && signals.responseSlaHours <= 4) {
    score += 6;
    reasons.push("Very fast response SLA configured (≤ 4 hours).");
  } else if (signals.responseSlaHours > 0 && signals.responseSlaHours <= 24) {
    score += 3;
    reasons.push("Standard response SLA configured.");
  } else {
    coaching.push(
      "Setting a tighter response SLA communicates serious hiring intent to candidates."
    );
  }

  score = Math.max(0, Math.min(100, score));

  // Derive base tier from combined signals (before verification cap)
  const baseTier: EmployerTrustTier =
    signals.identityVerified &&
    signals.companyProfileComplete &&
    signals.accountAgeDays >= 90 &&
    signals.completedHirings >= 3 &&
    signals.noShowCount === 0 &&
    signals.moderationIncidents === 0
      ? "premium_verified"
      : signals.identityVerified &&
          signals.companyProfileComplete &&
          signals.accountAgeDays >= 30 &&
          signals.completedHirings >= 1 &&
          signals.noShowCount <= 1 &&
          signals.moderationIncidents <= 1
        ? "trusted"
        : signals.identityVerified && signals.companyProfileComplete
          ? "verified"
          : "basic";

  // Apply verification-controlled caps — unverified/rejected employers cannot
  // reach verified or trusted tiers regardless of other signals.
  const controlled = applyVerificationTrustControls({
    verificationStatus: signals.verificationStatus,
    baseScore: score,
    baseTier,
    verifiedBonus: 0,
    caps: {
      none: { maxScore: 56, maxTier: "basic" },
      pending: { maxScore: 70, maxTier: "verified" },
      rejected: { maxScore: 36, maxTier: "basic" },
    },
  });

  const finalTier = controlled.tier as EmployerTrustTier;

  return {
    tier: finalTier,
    score: controlled.score,
    badge: badgeForTier(finalTier, signals.verificationStatus),
    reasons,
    coaching: coaching.filter(Boolean),
    signals,
    capped: controlled.capped,
  };
}

// ---- Helpers ---------------------------------------------------------------

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => asText(item).trim()).filter(Boolean)
    : [];
}

// ---- DB-backed employer trust retrieval ---------------------------------

/**
 * Loads employer behavioral signals from the database and returns a full
 * trust profile.  Reads from:
 *  - customer_activity (jobs_employer_profile + jobs_employer_verification)
 *  - customer_activity (jobs_application  — hired count)
 *  - customer_activity (jobs_interview    — no-show detection)
 *  - platform_moderation_queue            — moderation incidents
 */
export async function getEmployerTrustProfile(
  employerSlug: string
): Promise<EmployerTrustProfile | null> {
  if (!employerSlug) return null;

  const admin = createAdminSupabase();

  const [profileRes, verificationRes, applicationsRes, interviewsRes, moderationRes] =
    await Promise.all([
      admin
        .from("customer_activity")
        .select("*")
        .eq("division", "jobs")
        .eq("activity_type", "jobs_employer_profile")
        .eq("reference_id", employerSlug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      admin
        .from("customer_activity")
        .select("*")
        .eq("division", "jobs")
        .eq("activity_type", "jobs_employer_verification")
        .eq("reference_id", employerSlug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Applications to this employer — look for "hired" stage completions
      admin
        .from("customer_activity")
        .select("id, status, metadata")
        .eq("division", "jobs")
        .eq("activity_type", "jobs_application")
        .order("created_at", { ascending: false })
        .limit(250),

      // Interviews with this employer — look for cancellations/no-shows
      admin
        .from("customer_activity")
        .select("id, status, metadata")
        .eq("division", "jobs")
        .eq("activity_type", "jobs_interview")
        .order("created_at", { ascending: false })
        .limit(150),

      // Platform moderation cases linked to this employer
      admin
        .from("platform_moderation_queue")
        .select("id, status, action_taken, entity_id, entity_type")
        .or(`entity_id.eq.${employerSlug},entity_type.eq.user_profile`)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const profileRow = asObject(profileRes.data);
  const verificationRow = asObject(verificationRes.data);
  const profile = asObject(profileRow.metadata);
  const verification = asObject(verificationRow.metadata);

  // No employer profile found at all
  if (!profileRes.data && !verificationRes.data) return null;

  const verificationStatus = normalizeVerificationStatus(
    verification.status ||
      verificationRow.status ||
      profile.verificationStatus
  );
  const identityVerified = verificationStatus === "verified";

  // Applications linked to this employer
  const allApplications = (applicationsRes.data ?? []) as Array<Record<string, unknown>>;
  const employerApplications = allApplications.filter((app) => {
    const meta = asObject(app.metadata);
    return asText(meta.employerSlug) === employerSlug;
  });
  const completedHirings = employerApplications.filter((app) => {
    const meta = asObject(app.metadata);
    return asText(meta.stage || app.status) === "hired";
  }).length;

  // Interviews linked to this employer — detect no-shows
  const allInterviews = (interviewsRes.data ?? []) as Array<Record<string, unknown>>;
  const employerInterviews = allInterviews.filter((interview) => {
    const meta = asObject(interview.metadata);
    return asText(meta.employerSlug) === employerSlug;
  });
  const noShowCount = employerInterviews.filter((interview) => {
    const meta = asObject(interview.metadata);
    const status = asText(
      meta.interviewStatus || meta.status || interview.status
    ).toLowerCase();
    // "no_show" = explicit flag; "cancelled" with employerCancelled = true = last-minute
    return (
      status === "no_show" ||
      (status === "cancelled" && Boolean(meta.employerCancelled))
    );
  }).length;

  // Moderation incidents: warn / reject / block actions against this employer
  const moderationCases = (moderationRes.data ?? []) as Array<Record<string, unknown>>;
  const moderationIncidents = moderationCases.filter((c) => {
    const action = asText(c.action_taken).toLowerCase();
    return action === "reject" || action === "block" || action === "warn";
  }).length;

  // Profile completeness
  const websitePresent = Boolean(asText(profile.website));
  const industrySet = Boolean(asText(profile.industry));
  const locationsSet = asStringArray(profile.locations).length > 0;
  const companyProfileComplete =
    websitePresent &&
    industrySet &&
    locationsSet &&
    Boolean(asText(profile.name)) &&
    Boolean(asText(profile.description));

  // Account age from employer profile row creation timestamp
  const createdAt = asText(profileRow.created_at);
  const accountAgeDays = createdAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const signals: EmployerTrustSignals = {
    verificationStatus,
    identityVerified,
    companyProfileComplete,
    websitePresent,
    industrySet,
    locationsSet,
    responseSlaHours: asNumber(profile.responseSlaHours, 24),
    noShowCount,
    completedHirings,
    totalApplications: employerApplications.length,
    moderationIncidents,
    accountAgeDays,
  };

  return computeEmployerTrustProfile(signals);
}

// ---- Job post trust highlights (synchronous helper) ----------------------

/**
 * Derives human-readable trust highlights for a job listing from employer
 * data already in memory.  Does NOT hit the database — use in buildJobPost.
 *
 * Returns 0–4 short strings suitable for display on a job card or detail page.
 */
export function deriveJobTrustHighlights(input: {
  employerVerificationStatus: string;
  employerTrustScore: number;
  responseSlaHours: number | null;
  employerType: "internal" | "external";
}): string[] {
  const highlights: string[] = [];

  if (input.employerType === "internal") {
    highlights.push("HenryCo internal role");
  }

  if (input.employerVerificationStatus === "verified") {
    highlights.push("Verified employer");
  } else if (input.employerVerificationStatus === "watch") {
    // Do not expose watch status to candidates — treat as pending
    highlights.push("Verification in progress");
  } else if (input.employerVerificationStatus === "pending") {
    highlights.push("Verification in progress");
  }

  if (input.employerTrustScore >= 82) {
    highlights.push("High employer trust score");
  }

  if (input.responseSlaHours !== null && input.responseSlaHours <= 4) {
    highlights.push("Responds within 4 hours");
  } else if (input.responseSlaHours !== null && input.responseSlaHours <= 24) {
    highlights.push("Responds within 24 hours");
  }

  return highlights.slice(0, 4);
}

// ---- Candidate trust readiness (used in application display) -------------

export type CandidateReadinessBand = "interview_ready" | "strong_profile" | "needs_proof" | "needs_structure";

export function getCandidateReadinessBand(trustScore: number): CandidateReadinessBand {
  if (trustScore >= 88) return "interview_ready";
  if (trustScore >= 68) return "strong_profile";
  if (trustScore >= 45) return "needs_proof";
  return "needs_structure";
}

export function getCandidateReadinessLabel(band: CandidateReadinessBand): string {
  switch (band) {
    case "interview_ready": return "Interview-ready";
    case "strong_profile": return "Strong profile";
    case "needs_proof": return "Needs proof";
    case "needs_structure": return "Needs structure";
  }
}
