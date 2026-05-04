import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Employer subscription posting gate.
 *
 * The check is intentionally soft-fail: until the operator applies the
 * `jobs_employer_subscriptions` migration AND seeds at least one row,
 * the function returns { allowed: true, status: "soft-fail" } so we do
 * not hard-block live employers before billing infrastructure exists.
 *
 * Enforcement only kicks in for employers who already have a row whose
 * status is `expired`, `cancelled`, or `past_due`, OR whose
 * `expires_at` is in the past. That way the operator can opt
 * employers into enforcement one-by-one by inserting rows.
 *
 * Source-of-truth columns:
 *   employer_slug | plan_key | status | started_at | expires_at | cancelled_at
 */
export type EmployerSubscriptionResult =
  | { allowed: true; status: "active"; planKey: string; expiresAt: string | null }
  | { allowed: true; status: "soft-fail"; reason: "no-table" | "no-record" | "query-error" }
  | { allowed: false; status: "expired" | "cancelled" | "past_due"; planKey: string; expiresAt: string | null };

export async function isEmployerSubscribed(
  employerSlug: string
): Promise<EmployerSubscriptionResult> {
  if (!employerSlug) {
    return { allowed: true, status: "soft-fail", reason: "no-record" };
  }

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_employer_subscriptions")
    .select("plan_key,status,expires_at")
    .eq("employer_slug", employerSlug)
    .maybeSingle();

  if (error) {
    // Table missing or other DB-level issue — soft-fail so live posting
    // is not interrupted before the migration is applied.
    return { allowed: true, status: "soft-fail", reason: "no-table" };
  }

  if (!data) {
    // No record for this employer yet. Soft-fail allow until the
    // operator decides to enforce by seeding records.
    return { allowed: true, status: "soft-fail", reason: "no-record" };
  }

  const planKey = String(data.plan_key || "basic");
  const expiresAt = data.expires_at ? String(data.expires_at) : null;
  const expiresInPast = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const status = String(data.status || "active");

  if (status === "active" && !expiresInPast) {
    return { allowed: true, status: "active", planKey, expiresAt };
  }

  if (status === "active" && expiresInPast) {
    return { allowed: false, status: "expired", planKey, expiresAt };
  }

  if (status === "expired" || status === "cancelled" || status === "past_due") {
    return { allowed: false, status, planKey, expiresAt };
  }

  // Unknown status — fall back to soft-fail rather than hard-block.
  return { allowed: true, status: "soft-fail", reason: "query-error" };
}
