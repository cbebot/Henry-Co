import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveRequestOrigin } from "@henryco/config";
import { checkAncillaryRate } from "@henryco/auth/server/sensitive-action-rate-limit";

import { createSupabaseServer } from "@/lib/supabase/server";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";
import { revokeAllKnownDevices } from "@/lib/security/known-devices";

/**
 * "No, secure my account" — the protective response to an unrecognised
 * sign-in. Runs in the user's authenticated session (the only context that can
 * truly revoke every session), so it is never an emailed one-click action.
 *
 * Sequence:
 *   1. Send the standard password-reset email (reusing the normal recovery
 *      flow → the user lands on /reset-password to choose a new password).
 *   2. Forget every recognised device, so each must re-verify next time.
 *   3. Sign out of every session everywhere (invalidate all refresh tokens).
 *
 * Steps 1–2 run before the sign-out so the live session is still available.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rate = await checkAncillaryRate({
    key: "security.secure-account",
    subject: user.id,
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
  });
  if (!rate.ok) {
    const response = NextResponse.json(
      { error: "Too many attempts. Please wait a moment.", retryAfterSeconds: rate.retryAfterSeconds },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  const headerStore = await headers();
  const origin = resolveRequestOrigin((name) => headerStore.get(name), new URL(request.url).origin);
  const context = await detectSecurityRequestContext();

  // 1) Standard recovery email (same flow as "forgot password").
  let resetSent = false;
  if (user.email) {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${origin}/reset-password`,
    });
    resetSent = !error;
  }

  // 2) Forget every recognised device so they re-verify on next sign-in.
  await revokeAllKnownDevices(user.id);

  // 3) Invalidate every session everywhere.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });

  await logSecurityEvent({
    userId: user.id,
    eventType: "account_secured_after_alert",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    locationSummary: context.locationSummary,
    country: context.country,
    metadata: {
      source: "sign_in_review",
      reset_sent: resetSent,
      scope: "global",
      sign_out_ok: !signOutError,
    },
  });

  return NextResponse.json({ ok: true, resetSent });
}
