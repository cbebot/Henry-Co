import "server-only";

import { applyVerificationTrustControls, normalizeVerificationStatus } from "@henryco/trust";
import { normalizeEmail, normalizePhone } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export type PropertyTrustSignals = {
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

export async function getPropertyWalletSummary(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_wallets")
    .select("balance_kobo, currency, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    balanceKobo: Number((data as { balance_kobo?: number } | null)?.balance_kobo ?? 0),
    currency: asText((data as { currency?: string } | null)?.currency, "NGN"),
    isActive: Boolean((data as { is_active?: boolean } | null)?.is_active ?? true),
  };
}

export async function getPropertyTrustSignals(userId: string): Promise<PropertyTrustSignals> {
  const admin = createAdminSupabase();

  const [profileRes, securityRes, authRes] = await Promise.all([
    admin
      .from("customer_profiles")
      .select("email, phone, verification_status")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("customer_security_log")
      .select("id, event_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    admin.auth.admin.getUserById(userId),
  ]);

  const profile = asObject(profileRes.data);
  const securityEvents = (securityRes.data ?? []) as Array<Record<string, unknown>>;
  const authUser = authRes.data.user;
  const normalizedEmail = normalizeEmail(asText(profile.email) || authUser?.email || null);
  const normalizedPhone = normalizePhone(asText(profile.phone) || null);
  const [emailOverlap, phoneOverlap] = await Promise.all([
    normalizedEmail
      ? admin
          .from("customer_profiles")
          .select("id", { count: "exact", head: true })
          .eq("email", normalizedEmail)
          .neq("id", userId)
      : Promise.resolve({ count: 0, error: null } as const),
    normalizedPhone
      ? admin
          .from("customer_profiles")
          .select("id", { count: "exact", head: true })
          .eq("phone", normalizedPhone)
          .neq("id", userId)
      : Promise.resolve({ count: 0, error: null } as const),
  ]);

  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phonePresent = Boolean(normalizedPhone);
  const verificationStatus = normalizeVerificationStatus(profile.verification_status);
  const accountAgeDays = authUser?.created_at
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;
  const suspiciousEvents = securityEvents.filter((row) => {
    const eventType = asText(row.event_type).toLowerCase();
    return (
      eventType.includes("suspicious") ||
      eventType.includes("failed") ||
      eventType.includes("blocked")
    );
  }).length;
  const duplicateEmailMatches = emailOverlap.error ? 0 : Number(emailOverlap.count || 0);
  const duplicatePhoneMatches = phoneOverlap.error ? 0 : Number(phoneOverlap.count || 0);

  let score = 0;
  if (emailVerified) score += 40;
  if (phonePresent) score += 20;
  if (accountAgeDays >= 30) score += 16;
  if (accountAgeDays >= 90) score += 12;
  if (suspiciousEvents === 0) score += 12;
  if (duplicateEmailMatches > 0 || duplicatePhoneMatches > 0) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const baseTier: PropertyTrustSignals["tier"] =
    emailVerified &&
    phonePresent &&
    accountAgeDays >= 90 &&
    suspiciousEvents === 0 &&
    duplicateEmailMatches === 0 &&
    duplicatePhoneMatches === 0
      ? "trusted"
      : emailVerified &&
          phonePresent &&
          accountAgeDays >= 30 &&
          suspiciousEvents === 0 &&
          duplicateEmailMatches === 0 &&
          duplicatePhoneMatches === 0
        ? "verified"
        : emailVerified && phonePresent
          ? "verified"
          : "basic";

  const verificationControlledTrust = applyVerificationTrustControls({
    verificationStatus,
    baseScore: score,
    baseTier: baseTier === "trusted" ? "trusted" : baseTier === "verified" ? "verified" : "basic",
    verifiedBonus: 0,
    caps: {
      none: {
        maxScore: 52,
        maxTier: "basic",
      },
      pending: {
        maxScore: 66,
        maxTier: "verified",
      },
      rejected: {
        maxScore: 34,
        maxTier: "basic",
      },
    },
  });

  return {
    tier: verificationControlledTrust.tier,
    score: verificationControlledTrust.score,
    signals: {
      emailVerified,
      phonePresent,
      accountAgeDays,
      suspiciousEvents,
      duplicateEmailMatches,
      duplicatePhoneMatches,
      verificationStatus,
    },
  };
}

export type PropertyListingContactReview = {
  listingId: string;
  reviewRequired: boolean;
  emailMatches: number;
  phoneMatches: number;
  notes: string[];
};

export async function getPropertyListingContactReviewMap(
  listings: Array<{
    id: string;
    ownerEmail?: string | null;
    ownerPhone?: string | null;
  }>
) {
  const admin = createAdminSupabase();
  const emails = Array.from(
    new Set(
      listings
        .map((listing) => normalizeEmail(listing.ownerEmail))
        .filter((value): value is string => Boolean(value))
    )
  );
  const phones = Array.from(
    new Set(
      listings
        .map((listing) => normalizePhone(listing.ownerPhone))
        .filter((value): value is string => Boolean(value))
    )
  );

  const [emailRows, phoneRows] = await Promise.all([
    emails.length
      ? admin
          .from("customer_profiles")
          .select("id, email")
          .in("email", emails)
      : Promise.resolve({ data: [], error: null } as const),
    phones.length
      ? admin
          .from("customer_profiles")
          .select("id, phone")
          .in("phone", phones)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  const emailCounts = new Map<string, number>();
  const phoneCounts = new Map<string, number>();

  for (const row of (emailRows.data ?? []) as Array<Record<string, unknown>>) {
    const value = normalizeEmail(asText(row.email));
    if (!value) continue;
    emailCounts.set(value, (emailCounts.get(value) || 0) + 1);
  }

  for (const row of (phoneRows.data ?? []) as Array<Record<string, unknown>>) {
    const value = normalizePhone(asText(row.phone));
    if (!value) continue;
    phoneCounts.set(value, (phoneCounts.get(value) || 0) + 1);
  }

  return new Map<string, PropertyListingContactReview>(
    listings.map((listing) => {
      const email = normalizeEmail(listing.ownerEmail);
      const phone = normalizePhone(listing.ownerPhone);
      const emailMatches = email ? Math.max(0, (emailCounts.get(email) || 0) - 1) : 0;
      const phoneMatches = phone ? Math.max(0, (phoneCounts.get(phone) || 0) - 1) : 0;
      const notes: string[] = [];

      if (emailMatches > 0) {
        notes.push("Owner email is shared across multiple HenryCo accounts.");
      }
      if (phoneMatches > 0) {
        notes.push("Owner phone is shared across multiple HenryCo accounts.");
      }

      return [
        listing.id,
        {
          listingId: listing.id,
          reviewRequired: emailMatches > 0 || phoneMatches > 0,
          emailMatches,
          phoneMatches,
          notes,
        },
      ];
    })
  );
}
