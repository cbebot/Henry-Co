import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();

/**
 * Referral qualifying requirements.
 * A referral only "qualifies" for reward payout when the referee has:
 *  1. Completed at least one paid order / booking across HenryCo.
 *  2. Maintained an account for at least the hold period without being flagged.
 *  3. Passed the self-referral, duplicate-email, and fingerprint guards.
 */
export const REFERRAL_QUALIFY_HOLD_DAYS = 14;
export const REFERRAL_REWARD_KOBO = 200_000; // ₦2,000 per qualified referral

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HC-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function buildFingerprint(ip?: string | null, ua?: string | null): string | null {
  if (!ip || !ua) return null;
  return `${ip}::${ua}`;
}

export async function getUserReferrals(userId: string) {
  const { data } = await admin()
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getUserReferralCode(userId: string): Promise<string> {
  // Referral code is stored on customer_profiles
  const { data: profile } = await admin()
    .from("customer_profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.referral_code) return profile.referral_code as string;

  // Generate a unique code and save it to the profile.
  let code = generateReferralCode();
  const { error } = await admin()
    .from("customer_profiles")
    .update({ referral_code: code } as never)
    .eq("id", userId);

  // Retry once on unique-constraint collision.
  if (error) {
    code = generateReferralCode();
    await admin()
      .from("customer_profiles")
      .update({ referral_code: code } as never)
      .eq("id", userId);
  }

  return code;
}

export async function getReferralRewards(userId: string) {
  const { data } = await admin()
    .from("referral_rewards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getReferralStats(userId: string) {
  const referrals = await getUserReferrals(userId);
  const rewards = await getReferralRewards(userId);

  const totalReferred = referrals.filter(
    (r: Record<string, unknown>) => r.referee_id != null
  ).length;
  const converted = referrals.filter(
    (r: Record<string, unknown>) =>
      String(r.status || "").toLowerCase() === "converted"
  ).length;
  const qualified = referrals.filter(
    (r: Record<string, unknown>) =>
      String(r.status || "").toLowerCase() === "qualified"
  ).length;
  const flagged = referrals.filter(
    (r: Record<string, unknown>) =>
      String(r.status || "").toLowerCase() === "flagged"
  ).length;
  const pendingRewards = rewards
    .filter(
      (r: Record<string, unknown>) =>
        String(r.status || "").toLowerCase() === "pending" ||
        String(r.status || "").toLowerCase() === "held"
    )
    .reduce(
      (sum: number, r: Record<string, unknown>) =>
        sum + (Number(r.amount_kobo) || 0),
      0
    );
  const paidRewards = rewards
    .filter(
      (r: Record<string, unknown>) =>
        String(r.status || "").toLowerCase() === "paid" ||
        String(r.status || "").toLowerCase() === "released"
    )
    .reduce(
      (sum: number, r: Record<string, unknown>) =>
        sum + (Number(r.amount_kobo) || 0),
      0
    );

  return {
    totalReferred,
    converted,
    qualified,
    flagged,
    pendingRewards,
    paidRewards,
  };
}

type ConversionContext = {
  referralCode: string;
  refereeId: string;
  refereeEmail?: string | null;
  refereePhone?: string | null;
  refereeIp?: string | null;
  refereeUserAgent?: string | null;
  source?: string;
};

type ConversionResult =
  | { ok: true; referralId: string; referrerUserId: string }
  | { ok: false; reason: "invalid_code" | "already_converted" }
  | { ok: false; flagged: true; reason: "self_referral" | "duplicate_email" | "device_reuse" };

/**
 * Record a referral conversion with fraud-protection guards.
 *
 * Guards applied in order:
 * 1. Self-referral: a user cannot use their own code.
 * 2. Duplicate-referee-email: same normalized email already recorded.
 * 3. Duplicate device fingerprint: same IP+UA hash on 2+ conversions.
 *
 * On a clean conversion the row is set to `status = 'converted'` but
 * the reward ledger is NOT credited yet — rewards only unlock when
 * `qualifyReferral` is called after the referee completes a paid order.
 */
export async function recordReferralConversion(
  ctx: ConversionContext
): Promise<ConversionResult | null> {
  const { referralCode, refereeId } = ctx;
  if (!referralCode || !refereeId) return null;

  const adminClient = admin();

  // Resolve referrer by referral code on customer_profiles.
  const { data: profile } = await adminClient
    .from("customer_profiles")
    .select("id, referral_code")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!profile?.id) {
    return { ok: false, reason: "invalid_code" };
  }

  const referrerUserId = profile.id as string;

  // Find the active referral program for this division.
  const { data: program } = await adminClient
    .from("referral_programs")
    .select("id")
    .eq("division", ctx.source || "account")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const fingerprint = buildFingerprint(ctx.refereeIp, ctx.refereeUserAgent);
  const normalizedEmail = ctx.refereeEmail
    ? ctx.refereeEmail.trim().toLowerCase()
    : null;

  // Guard 1: self-referral.
  if (referrerUserId === refereeId) {
    await adminClient.from("referrals").insert({
      referrer_id: referrerUserId,
      referee_id: refereeId,
      referral_code: referralCode,
      division: ctx.source || "account",
      status: "flagged",
      flag_reason: "self_referral",
      referee_email: normalizedEmail,
      ip_address: ctx.refereeIp || null,
      referred_fingerprint: fingerprint,
      fraud_flags: { reason: "self_referral" },
      converted_at: new Date().toISOString(),
      program_id: program?.id || null,
    } as never);
    return { ok: false, flagged: true, reason: "self_referral" };
  }

  // Idempotency: one conversion per referee.
  const { data: existing } = await adminClient
    .from("referrals")
    .select("id, status")
    .eq("referee_id", refereeId)
    .maybeSingle();

  if (existing) {
    return { ok: false, reason: "already_converted" };
  }

  // Guard 2: duplicate email.
  if (normalizedEmail) {
    const { data: emailDuplicates } = await adminClient
      .from("referrals")
      .select("id")
      .eq("referee_email", normalizedEmail)
      .limit(1);

    if (emailDuplicates && emailDuplicates.length > 0) {
      await adminClient.from("referrals").insert({
        referrer_id: referrerUserId,
        referee_id: refereeId,
        referral_code: referralCode,
        division: ctx.source || "account",
        status: "flagged",
        flag_reason: "duplicate_email",
        referee_email: normalizedEmail,
        ip_address: ctx.refereeIp || null,
        referred_fingerprint: fingerprint,
        fraud_flags: { reason: "duplicate_email" },
        converted_at: new Date().toISOString(),
        program_id: program?.id || null,
      } as never);
      return { ok: false, flagged: true, reason: "duplicate_email" };
    }
  }

  // Guard 3: device fingerprint reuse (2+ prior conversions = flagged).
  if (fingerprint) {
    const { data: fingerprintDuplicates } = await adminClient
      .from("referrals")
      .select("id")
      .eq("referred_fingerprint", fingerprint)
      .limit(3);

    if (fingerprintDuplicates && fingerprintDuplicates.length >= 2) {
      await adminClient.from("referrals").insert({
        referrer_id: referrerUserId,
        referee_id: refereeId,
        referral_code: referralCode,
        division: ctx.source || "account",
        status: "flagged",
        flag_reason: "device_reuse",
        referee_email: normalizedEmail,
        ip_address: ctx.refereeIp || null,
        referred_fingerprint: fingerprint,
        fraud_flags: { reason: "device_reuse" },
        converted_at: new Date().toISOString(),
        program_id: program?.id || null,
      } as never);
      return { ok: false, flagged: true, reason: "device_reuse" };
    }
  }

  // Clean conversion.
  const { data: inserted, error } = await adminClient
    .from("referrals")
    .insert({
      referrer_id: referrerUserId,
      referee_id: refereeId,
      referral_code: referralCode,
      division: ctx.source || "account",
      status: "converted",
      referee_email: normalizedEmail,
      ip_address: ctx.refereeIp || null,
      referred_fingerprint: fingerprint,
      converted_at: new Date().toISOString(),
      program_id: program?.id || null,
    } as never)
    .select("id")
    .maybeSingle();

  if (error || !inserted) return null;

  return { ok: true, referralId: inserted.id as string, referrerUserId };
}

/**
 * Transition a referral from "converted" to "qualified" and create a
 * reward entry in the ledger (pending finance release).
 */
export async function qualifyReferral(
  referralId: string,
  options: { reason?: string } = {}
) {
  const adminClient = admin();
  const { data: referral } = await adminClient
    .from("referrals")
    .select("id, referrer_id, referee_id, status, converted_at")
    .eq("id", referralId)
    .maybeSingle();

  if (!referral) return null;
  if (String(referral.status || "").toLowerCase() !== "converted") return null;

  await adminClient
    .from("referrals")
    .update({
      status: "qualified",
      qualified_at: new Date().toISOString(),
    } as never)
    .eq("id", referralId);

  await adminClient.from("referral_rewards").insert({
    referral_id: referral.id,
    user_id: referral.referrer_id,
    reward_type: "wallet_credit",
    status: "pending",
    amount_kobo: REFERRAL_REWARD_KOBO,
    currency: "NGN",
    reason: options.reason || "referral_qualified",
  } as never);

  return {
    referrerUserId: referral.referrer_id,
    referralId: referral.id,
  };
}

/**
 * Qualify every converted referral for a given referee (called by webhook
 * when the referee completes their first paid order).
 */
export async function qualifyReferralsByReferee(
  refereeUserId: string,
  options: { reason?: string } = {}
) {
  const adminClient = admin();
  const { data: candidates } = await adminClient
    .from("referrals")
    .select("id")
    .eq("referee_id", refereeUserId)
    .eq("status", "converted");

  const results: Array<{ referralId: string; referrerUserId: string }> = [];
  for (const row of candidates || []) {
    const qualified = await qualifyReferral(row.id as string, options);
    if (qualified) results.push(qualified);
  }
  return results;
}
