import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getEmployerMembershipsByUser, getEmployerProfileBySlug } from "@/lib/jobs/data";
import type { EmployerProfile } from "@/lib/jobs/types";

type TrustTier = "basic" | "verified" | "trusted" | "premium_verified";

export type PostingChecklistItem = {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
};

export type EmployerPostingEligibility = {
  trustTier: TrustTier;
  trustScore: number;
  verifiedEmail: boolean;
  membershipActive: boolean;
  employerProfileReady: boolean;
  employerVerificationAllowed: boolean;
  canSubmitForReview: boolean;
  autoApprovalAllowed: boolean;
  employer: EmployerProfile | null;
  checklist: PostingChecklistItem[];
  requirements: string[];
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function calculateProfileCompletion(profile: Record<string, unknown>, documentCount: number) {
  let score = 0;
  if (asNullableText(profile.full_name)) score += 22;
  if (asNullableText(profile.phone)) score += 16;
  if (asNullableText(profile.avatar_url)) score += 10;
  if (asNullableText(profile.language)) score += 8;
  if (asNullableText(profile.currency)) score += 8;
  if (documentCount > 0) score += 14;
  if (documentCount >= 3) score += 8;
  return Math.min(score, 100);
}

function evaluateTier(input: {
  emailVerified: boolean;
  phonePresent: boolean;
  profileCompletion: number;
  accountAgeDays: number;
  settledTransactions: number;
  suspiciousEvents: number;
  completedActivityCount: number;
}): { tier: TrustTier; score: number } {
  let score = 0;
  if (input.emailVerified) score += 22;
  if (input.phonePresent) score += 14;
  score += Math.round(input.profileCompletion * 0.22);
  if (input.accountAgeDays >= 30) score += 12;
  if (input.accountAgeDays >= 90) score += 10;
  if (input.completedActivityCount >= 3) score += 10;
  if (input.completedActivityCount >= 8) score += 6;
  if (input.settledTransactions >= 1) score += 10;
  if (input.settledTransactions >= 3) score += 8;
  if (input.suspiciousEvents === 0) score += 8;
  score = Math.min(score, 100);

  const tier: TrustTier =
    input.emailVerified &&
    input.phonePresent &&
    input.profileCompletion >= 70 &&
    input.accountAgeDays >= 90 &&
    input.settledTransactions >= 3 &&
    input.suspiciousEvents === 0
      ? "premium_verified"
      : input.emailVerified &&
          input.phonePresent &&
          input.profileCompletion >= 62 &&
          input.accountAgeDays >= 30 &&
          input.settledTransactions >= 1 &&
          input.suspiciousEvents === 0
        ? "trusted"
        : input.emailVerified && input.phonePresent && input.profileCompletion >= 48
          ? "verified"
          : "basic";

  return { tier, score };
}

export async function getEmployerPostingEligibility(input: {
  userId: string;
  email?: string | null;
  employerSlug: string;
  actorRole?: string | null;
}) : Promise<EmployerPostingEligibility> {
  const admin = createAdminSupabase();
  const [profileRes, documentsRes, activityRes, walletRes, securityRes, authRes, memberships, employerProfile] =
    await Promise.all([
      admin.from("customer_profiles").select("*").eq("id", input.userId).maybeSingle(),
      admin.from("customer_documents").select("id").eq("user_id", input.userId).limit(10),
      admin
        .from("customer_activity")
        .select("id, status")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("customer_wallet_transactions")
        .select("id, status, reference_type")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("customer_security_log")
        .select("id, event_type, risk_level")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false })
        .limit(40),
      admin.auth.admin.getUserById(input.userId),
      getEmployerMembershipsByUser(input.userId, input.email),
      getEmployerProfileBySlug(input.employerSlug, { includeUnpublished: true }),
    ]);

  const profile = asObject(profileRes.data);
  const documents = documentsRes.data ?? [];
  const activity = (activityRes.data ?? []) as Array<Record<string, unknown>>;
  const walletTransactions = (walletRes.data ?? []) as Array<Record<string, unknown>>;
  const securityEvents = (securityRes.data ?? []) as Array<Record<string, unknown>>;
  const authUser = authRes.data.user;
  const membership =
    memberships.find((item) => item.employerSlug === input.employerSlug) ?? null;

  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phonePresent = Boolean(asNullableText(profile.phone));
  const profileCompletion = calculateProfileCompletion(profile, documents.length);
  const accountAgeDays = authUser?.created_at
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;
  const settledTransactions = walletTransactions.filter((row) => {
    const status = asText(row.status).toLowerCase();
    const referenceType = asText(row.reference_type).toLowerCase();
    return status === "completed" || (status === "verified" && referenceType !== "wallet_funding_request");
  }).length;
  const suspiciousEvents = securityEvents.filter((row) => {
    const risk = asText(row.risk_level).toLowerCase();
    const eventType = asText(row.event_type).toLowerCase();
    return risk === "high" || eventType.includes("suspicious") || eventType.includes("failed");
  }).length;
  const completedActivityCount = activity.filter((row) => {
    const status = asText(row.status).toLowerCase();
    return ["active", "completed", "verified", "delivered", "paid"].includes(status);
  }).length;

  const trust = evaluateTier({
    emailVerified,
    phonePresent,
    profileCompletion,
    accountAgeDays,
    settledTransactions,
    suspiciousEvents,
    completedActivityCount,
  });

  const employer = employerProfile?.employer ?? null;
  const membershipActive = Boolean(membership && membership.status !== "revoked");
  const employerProfileReady = Boolean(
    employer &&
      employer.name &&
      employer.description &&
      employer.website &&
      employer.industry &&
      employer.locations.length > 0
  );
  const employerVerificationAllowed = employer?.verificationStatus !== "rejected";
  const autoApprovalAllowed = ["owner", "manager"].includes(asText(input.actorRole).toLowerCase());
  const canSubmitForReview =
    membershipActive &&
    employerProfileReady &&
    employerVerificationAllowed &&
    emailVerified &&
    (trust.tier === "verified" || trust.tier === "trusted" || trust.tier === "premium_verified");

  const checklist: PostingChecklistItem[] = [
    {
      id: "membership",
      label: "Employer membership",
      detail: "The posting user must have an active employer membership for this company.",
      complete: membershipActive,
    },
    {
      id: "email",
      label: "Verified account email",
      detail: "HenryCo Jobs requires a verified email before an employer can submit a live role.",
      complete: emailVerified,
    },
    {
      id: "trust",
      label: "Shared account trust tier",
      detail: "Jobs posting now requires at least the shared HenryCo Verified trust lane.",
      complete: trust.tier !== "basic",
    },
    {
      id: "company",
      label: "Employer profile readiness",
      detail: "Company website, industry, description, and at least one location must be present.",
      complete: employerProfileReady,
    },
    {
      id: "verification",
      label: "Employer verification standing",
      detail: "Rejected employer verification blocks new live role submissions until resolved.",
      complete: employerVerificationAllowed,
    },
  ];

  const requirements = checklist.filter((item) => !item.complete).map((item) => item.detail);

  return {
    trustTier: trust.tier,
    trustScore: trust.score,
    verifiedEmail: emailVerified,
    membershipActive,
    employerProfileReady,
    employerVerificationAllowed,
    canSubmitForReview,
    autoApprovalAllowed,
    employer,
    checklist,
    requirements,
  };
}
