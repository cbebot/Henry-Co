import "server-only";

import { getAccountTrustTierLabel, type AccountTrustTier } from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import { getContactOverlapSummary } from "@/lib/contact-review";

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

export type TrustTier = AccountTrustTier;

export type AccountTrustProfile = {
  tier: TrustTier;
  score: number;
  reasons: string[];
  nextTier: TrustTier | null;
  requirements: string[];
  flags: {
    jobsPostingEligible: boolean;
    marketplaceEligible: boolean;
  };
  signals: {
    emailVerified: boolean;
    phonePresent: boolean;
    profileCompletion: number;
    accountAgeDays: number;
    settledTransactions: number;
    suspiciousEvents: number;
    duplicateEmailMatches: number;
    duplicatePhoneMatches: number;
  };
};

export function getTrustTierLabel(tier: TrustTier) {
  return getAccountTrustTierLabel(tier);
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

export async function getAccountTrustProfile(userId: string): Promise<AccountTrustProfile> {
  const admin = createAdminSupabase();

  const [profileRes, documentsRes, activityRes, walletRes, securityRes, authRes] =
    await Promise.all([
      admin.from("customer_profiles").select("*").eq("id", userId).maybeSingle(),
      admin.from("customer_documents").select("id").eq("user_id", userId).limit(10),
      admin
        .from("customer_activity")
        .select("id, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("customer_wallet_transactions")
        .select("id, status, reference_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("customer_security_log")
        .select("id, event_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
      admin.auth.admin.getUserById(userId),
    ]);

  const profile = asObject(profileRes.data);
  const documents = documentsRes.data ?? [];
  const activity = (activityRes.data ?? []) as Array<Record<string, unknown>>;
  const walletTransactions = (walletRes.data ?? []) as Array<Record<string, unknown>>;
  const securityEvents = (securityRes.data ?? []) as Array<Record<string, unknown>>;
  const authUser = authRes.data.user;
  const overlaps = await getContactOverlapSummary({
    userId,
    email: asNullableText(profile.email) || authUser?.email || null,
    phone: asNullableText(profile.phone),
  });

  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phonePresent = Boolean(asNullableText(profile.phone));
  const profileCompletion = calculateProfileCompletion(profile, documents.length);
  const accountAgeDays = authUser?.created_at
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  const settledTransactions = walletTransactions.filter((row) => {
    const status = asText(row.status).toLowerCase();
    const referenceType = asText(row.reference_type).toLowerCase();
    return status === "completed" || (status === "verified" && referenceType !== "wallet_funding_request");
  }).length;
  const suspiciousEvents = securityEvents.filter((row) => {
    const eventType = asText(row.event_type).toLowerCase();
    return (
      eventType.includes("suspicious") ||
      eventType.includes("failed") ||
      eventType.includes("blocked")
    );
  }).length;
  const completedActivityCount = activity.filter((row) => {
    const status = asText(row.status).toLowerCase();
    return ["active", "completed", "verified", "delivered", "paid"].includes(status);
  }).length;

  let score = 0;
  if (emailVerified) score += 22;
  if (phonePresent) score += 14;
  score += Math.round(profileCompletion * 0.22);
  if (accountAgeDays >= 30) score += 12;
  if (accountAgeDays >= 90) score += 10;
  if (completedActivityCount >= 3) score += 10;
  if (completedActivityCount >= 8) score += 6;
  if (settledTransactions >= 1) score += 10;
  if (settledTransactions >= 3) score += 8;
  if (suspiciousEvents === 0) score += 8;
  if (overlaps.reviewRequired) score -= 12;
  score = Math.min(score, 100);

  const tier: TrustTier =
    emailVerified &&
    phonePresent &&
    profileCompletion >= 70 &&
    accountAgeDays >= 90 &&
    settledTransactions >= 3 &&
    suspiciousEvents === 0 &&
    !overlaps.reviewRequired
      ? "premium_verified"
      : emailVerified &&
          phonePresent &&
          profileCompletion >= 62 &&
          accountAgeDays >= 30 &&
          settledTransactions >= 1 &&
          suspiciousEvents === 0 &&
          !overlaps.reviewRequired
        ? "trusted"
        : emailVerified && phonePresent && profileCompletion >= 48
          ? "verified"
          : "basic";

  const reasons = [
    emailVerified ? "Email ownership is verified." : null,
    phonePresent ? "A contact phone is on file." : null,
    profileCompletion >= 48 ? "Profile completion is strong enough for verified workflows." : null,
    accountAgeDays >= 30 ? `Account history spans ${accountAgeDays} days.` : null,
    settledTransactions >= 1 ? "Verified transaction history exists." : null,
    suspiciousEvents === 0 ? "No recent high-risk security events were found." : null,
    ...overlaps.reasons,
  ].filter(Boolean) as string[];

  const nextTier: TrustTier | null =
    tier === "basic"
      ? "verified"
      : tier === "verified"
        ? "trusted"
        : tier === "trusted"
          ? "premium_verified"
          : null;

  const requirements =
    nextTier === "verified"
      ? [
          !emailVerified ? "Verify your email address." : null,
          !phonePresent ? "Add a usable phone number." : null,
          profileCompletion < 48 ? "Complete more of your profile and add proof documents." : null,
          overlaps.reviewRequired
            ? "A shared contact detail needs manual trust review before higher-trust actions unlock."
            : null,
        ]
      : nextTier === "trusted"
        ? [
            accountAgeDays < 30 ? "Build more account age before trusted status unlocks." : null,
            settledTransactions < 1 ? "Complete at least one verified transaction or funding cycle." : null,
            suspiciousEvents > 0 ? "Keep the account clear of suspicious access warnings." : null,
            overlaps.reviewRequired
              ? "Resolve contact overlap review before trusted seller, payout, or property lanes unlock."
              : null,
          ]
        : nextTier === "premium_verified"
          ? [
              accountAgeDays < 90 ? "Maintain a longer clean account history." : null,
              settledTransactions < 3 ? "Build a stronger verified transaction record." : null,
              completedActivityCount < 8 ? "Use more HenryCo divisions with clean outcomes." : null,
              overlaps.reviewRequired
                ? "Keep duplicate-contact review clear before premium trust can be granted."
                : null,
            ]
          : [];

  return {
    tier,
    score,
    reasons,
    nextTier,
    requirements: requirements.filter(Boolean) as string[],
    flags: {
      jobsPostingEligible: tier !== "basic",
      marketplaceEligible:
        (tier === "trusted" || tier === "premium_verified") && !overlaps.reviewRequired,
    },
    signals: {
      emailVerified,
      phonePresent,
      profileCompletion,
      accountAgeDays,
      settledTransactions,
      suspiciousEvents,
      duplicateEmailMatches: overlaps.emailMatches,
      duplicatePhoneMatches: overlaps.phoneMatches,
    },
  };
}
