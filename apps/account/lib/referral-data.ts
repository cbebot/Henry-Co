import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();

/**
 * Referral qualifying requirements.
 * A referral only "qualifies" for reward payout when the referee has:
 *  1. Completed at least one paid order / booking across HenryCo.
 *  2. Maintained an account for at least the hold period without being flagged.
 *  3. Passed the self-referral, duplicate-email, and fingerprint guards.
 *
 * Flipping on referral rewards without these guards invites fraud rings and
 * creates real cash outflow against fake signups.
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
    .from("customer_referrals")
    .select("*")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getUserReferralCode(userId: string): Promise<string> {
  // Preferred source of truth: customer_referral_profiles
  const { data: profile } = await admin()
    .from("customer_referral_profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.referral_code) return profile.referral_code as string;

  // Generate a unique code and insert a new profile row.
  let code = generateReferralCode();
  let { error } = await admin()
    .from("customer_referral_profiles")
    .insert({
      user_id: userId,
      referral_code: code,
      is_active: true,
    });

  // Retry once on unique-constraint collision.
  if (error) {
    code = generateReferralCode();
    await admin()
      .from("customer_referral_profiles")
      .insert({
        user_id: userId,
        referral_code: code,
        is_active: true,
      });
  }

  return code;
}

export async function getReferralRewards(userId: string) {
  const { data } = await admin()
    .from("customer_referral_rewards")
    .select("*")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getReferralStats(userId: string) {
  const referrals = await getUserReferrals(userId);
  const rewards = await getReferralRewards(userId);

  const totalReferred = referrals.filter(
    (r: Record<string, unknown>) => r.referred_user_id != null
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
        String(r.reward_status || "").toLowerCase() === "held" ||
        String(r.reward_status || "").toLowerCase() === "pending"
    )
    .reduce(
      (sum: number, r: Record<string, unknown>) =>
        sum + (Number(r.amount_kobo) || 0),
      0
    );
  const paidRewards = rewards
    .filter(
      (r: Record<string, unknown>) =>
        String(r.reward_status || "").toLowerCase() === "released" ||
        String(r.reward_status || "").toLowerCase() === "paid"
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
 * 2. Duplicate-referee-email: same normalized email already recorded on
 *    a different referral row.
 * 3. Duplicate device fingerprint: the same IP+UA hash has already been
 *    used on 2+ referral conversions (threshold catches real device reuse
 *    while tolerating a couple of legitimate multi-account cases like
 *    couples or shared laptops).
 *
 * On a clean conversion, the row is moved to `status = 'converted'` but
 * the reward ledger is NOT credited yet — rewards only unlock when
 * `qualifyReferral` is called after the referee completes a paid order
 * during the hold period.
 */
export async function recordReferralConversion(
  ctx: ConversionContext
): Promise<ConversionResult | null> {
  const { referralCode, refereeId } = ctx;
  if (!referralCode || !refereeId) return null;

  const adminClient = admin();

  // Resolve referrer by referral code.
  const { data: profile } = await adminClient
    .from("customer_referral_profiles")
    .select("user_id, referral_code")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!profile?.user_id) {
    return { ok: false, reason: "invalid_code" };
  }

  const referrerUserId = profile.user_id as string;

  // Guard 1: self-referral. Flag the attempt so finance can see it later.
  if (referrerUserId === refereeId) {
    await adminClient.from("customer_referrals").insert({
      referrer_user_id: referrerUserId,
      referred_user_id: refereeId,
      source: ctx.source || "account",
      status: "flagged",
      flag_reason: "self_referral",
      referred_email_normalized: ctx.refereeEmail
        ? ctx.refereeEmail.trim().toLowerCase()
        : null,
      referred_phone_normalized: ctx.refereePhone || null,
      referred_fingerprint: buildFingerprint(ctx.refereeIp, ctx.refereeUserAgent),
      converted_at: new Date().toISOString(),
    } as never);
    return { ok: false, flagged: true, reason: "self_referral" };
  }

  // Check if this referee was already recorded (idempotency: one conversion
  // per referee, not per invocation).
  const { data: existing } = await adminClient
    .from("customer_referrals")
    .select("id, status")
    .eq("referred_user_id", refereeId)
    .maybeSingle();

  if (existing) {
    return { ok: false, reason: "already_converted" };
  }

  const normalizedEmail = ctx.refereeEmail
    ? ctx.refereeEmail.trim().toLowerCase()
    : null;
  const fingerprint = buildFingerprint(ctx.refereeIp, ctx.refereeUserAgent);

  // Guard 2: duplicate email. Insert the row as flagged instead of clean.
  if (normalizedEmail) {
    const { data: emailDuplicates } = await adminClient
      .from("customer_referrals")
      .select("id")
      .eq("referred_email_normalized", normalizedEmail)
      .limit(1);

    if (emailDuplicates && emailDuplicates.length > 0) {
      await adminClient.from("customer_referrals").insert({
        referrer_user_id: referrerUserId,
        referred_user_id: refereeId,
        referred_email_normalized: normalizedEmail,
        referred_phone_normalized: ctx.refereePhone || null,
        referred_fingerprint: fingerprint,
        source: ctx.source || "account",
        status: "flagged",
        flag_reason: "duplicate_email",
        converted_at: new Date().toISOString(),
      } as never);
      return { ok: false, flagged: true, reason: "duplicate_email" };
    }
  }

  // Guard 3: device fingerprint reuse. Two or more prior conversions from
  // the same IP+UA pair gets flagged.
  if (fingerprint) {
    const { data: fingerprintDuplicates } = await adminClient
      .from("customer_referrals")
      .select("id")
      .eq("referred_fingerprint", fingerprint)
      .limit(3);

    if (fingerprintDuplicates && fingerprintDuplicates.length >= 2) {
      await adminClient.from("customer_referrals").insert({
        referrer_user_id: referrerUserId,
        referred_user_id: refereeId,
        referred_email_normalized: normalizedEmail,
        referred_phone_normalized: ctx.refereePhone || null,
        referred_fingerprint: fingerprint,
        source: ctx.source || "account",
        status: "flagged",
        flag_reason: "device_reuse",
        converted_at: new Date().toISOString(),
      } as never);
      return { ok: false, flagged: true, reason: "device_reuse" };
    }
  }

  // Clean conversion — status = 'converted'. Reward ledger stays untouched
  // until qualifyReferral() is called after the referee transacts.
  const { data: inserted, error } = await adminClient
    .from("customer_referrals")
    .insert({
      referrer_user_id: referrerUserId,
      referred_user_id: refereeId,
      referred_email_normalized: normalizedEmail,
      referred_phone_normalized: ctx.refereePhone || null,
      referred_fingerprint: fingerprint,
      source: ctx.source || "account",
      status: "converted",
      converted_at: new Date().toISOString(),
    } as never)
    .select("id")
    .maybeSingle();

  if (error || !inserted) return null;

  return { ok: true, referralId: inserted.id as string, referrerUserId };
}

/**
 * Transition a referral from "converted" to "qualified" once the referee
 * has completed a paid order during the hold period. Only a qualified
 * referral unlocks a reward entry in the ledger.
 *
 * The reward is inserted in `reward_status = 'held'` so finance still has
 * the final release pass before any real money moves.
 */
export async function qualifyReferral(
  referralId: string,
  options: { reason?: string } = {}
) {
  const adminClient = admin();
  const { data: referral } = await adminClient
    .from("customer_referrals")
    .select("id, referrer_user_id, referred_user_id, status, converted_at")
    .eq("id", referralId)
    .maybeSingle();

  if (!referral) return null;
  if (String(referral.status || "").toLowerCase() !== "converted") return null;

  await adminClient
    .from("customer_referrals")
    .update({
      status: "qualified",
      qualified_at: new Date().toISOString(),
    } as never)
    .eq("id", referralId);

  // Create a reward entry in the ledger (held pending finance release).
  await adminClient.from("customer_referral_rewards").insert({
    referral_id: referral.id,
    referrer_user_id: referral.referrer_user_id,
    referred_user_id: referral.referred_user_id,
    reward_kind: "wallet_credit",
    reward_status: "held",
    amount_kobo: REFERRAL_REWARD_KOBO,
    currency: "NGN",
    reason: options.reason || "referral_qualified",
  } as never);

  return {
    referrerUserId: referral.referrer_user_id,
    referralId: referral.id,
  };
}

/**
 * Convenience wrapper for a webhook that wants to qualify every converted
 * referral belonging to a given referee once their first paid order lands.
 */
export async function qualifyReferralsByReferee(
  refereeUserId: string,
  options: { reason?: string } = {}
) {
  const adminClient = admin();
  const { data: candidates } = await adminClient
    .from("customer_referrals")
    .select("id")
    .eq("referred_user_id", refereeUserId)
    .eq("status", "converted");

  const results: Array<{ referralId: string; referrerUserId: string }> = [];
  for (const row of candidates || []) {
    const qualified = await qualifyReferral(row.id as string, options);
    if (qualified) results.push(qualified);
  }
  return results;
}
