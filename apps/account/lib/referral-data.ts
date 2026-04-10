import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HC-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getReferralPrograms() {
  const { data } = await admin()
    .from("referral_programs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return data || [];
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
  // Check if user already has a referral row
  const { data: existing } = await admin()
    .from("referrals")
    .select("referral_code")
    .eq("referrer_id", userId)
    .not("referral_code", "is", null)
    .limit(1)
    .maybeSingle();

  if (existing?.referral_code) return existing.referral_code;

  // Generate a unique code and insert a pending referral row
  const code = generateReferralCode();
  const { error } = await admin()
    .from("referrals")
    .insert({
      referrer_id: userId,
      referral_code: code,
      status: "pending",
    });

  if (error) {
    // If insert fails due to uniqueness, retry once with a new code
    const retryCode = generateReferralCode();
    await admin()
      .from("referrals")
      .insert({
        referrer_id: userId,
        referral_code: retryCode,
        status: "pending",
      });
    return retryCode;
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
  const pendingRewards = rewards
    .filter(
      (r: Record<string, unknown>) =>
        String(r.status || "").toLowerCase() === "pending"
    )
    .reduce(
      (sum: number, r: Record<string, unknown>) =>
        sum + (Number(r.amount_kobo) || 0),
      0
    );
  const paidRewards = rewards
    .filter(
      (r: Record<string, unknown>) =>
        String(r.status || "").toLowerCase() === "paid"
    )
    .reduce(
      (sum: number, r: Record<string, unknown>) =>
        sum + (Number(r.amount_kobo) || 0),
      0
    );

  return { totalReferred, converted, pendingRewards, paidRewards };
}

export async function recordReferralConversion(
  referralCode: string,
  refereeId: string
) {
  if (!referralCode || !refereeId) return null;

  // Find the pending referral row with this code
  const { data: referral } = await admin()
    .from("referrals")
    .select("id, referrer_id")
    .eq("referral_code", referralCode)
    .eq("status", "pending")
    .is("referee_id", null)
    .limit(1)
    .maybeSingle();

  if (!referral) return null;
  if (String(referral.referrer_id || "") === refereeId) return null;

  const { data: existingRefereeReferral } = await admin()
    .from("referrals")
    .select("id")
    .eq("referee_id", refereeId)
    .limit(1)
    .maybeSingle();

  if (existingRefereeReferral?.id) return null;

  // Update the referral with the referee and mark as converted
  const { error } = await admin()
    .from("referrals")
    .update({
      referee_id: refereeId,
      status: "converted",
      converted_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  if (error) return null;

  return { referrerId: referral.referrer_id, referralId: referral.id };
}
