import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail, normalizeTrustedRedirect } from "@henryco/config";
import { checkAncillaryRate } from "@henryco/auth/server/sensitive-action-rate-limit";
import { logger } from "@henryco/observability/logger";
import { createCmsSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { clientIpFromHeaders } from "@/lib/request-ip";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(320),
  next: z.string().max(512).optional(),
});

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Owner sign-in: dispatch a magic-link ONLY to an existing active owner.
 * Hardening:
 *  - rate-limited by email AND IP (fail-closed Upstash/local limiter),
 *  - `owner_profiles` pre-check so a non-owner never receives a link,
 *  - anti-enumeration: the response is always generic `{ ok: true }`
 *    regardless of whether the address is an owner.
 */
export async function POST(request: Request) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.email);
  if (!email) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(request.headers);

  const [emailRate, ipRate] = await Promise.all([
    checkAncillaryRate({ key: "cms-otp-send-email", subject: email, windowMs: WINDOW_MS, limit: 5 }),
    checkAncillaryRate({ key: "cms-otp-send-ip", subject: ip, windowMs: WINDOW_MS, limit: 12 }),
  ]);

  if (!emailRate.ok || !ipRate.ok) {
    const retryAfter = Math.max(
      emailRate.ok ? 0 : emailRate.retryAfterSeconds,
      ipRate.ok ? 0 : ipRate.retryAfterSeconds
    );
    logger.warn("cms.auth.otp.rate_limited", { ip });
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let isOwner = false;
  try {
    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from("owner_profiles")
      .select("user_id, email, role, is_active")
      .eq("email", email)
      .maybeSingle();
    isOwner =
      !!profile &&
      profile.is_active === true &&
      ["owner", "admin"].includes(String(profile.role).trim().toLowerCase());
  } catch (error) {
    // Fail closed: never dispatch a link if ownership cannot be confirmed.
    logger.error("cms.auth.otp.owner_precheck_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: true });
  }

  if (isOwner) {
    try {
      const supabase = await createCmsSupabaseServer();
      const origin = new URL(request.url).origin;
      const safeNext = normalizeTrustedRedirect(parsed.next ?? "/dashboard");
      const emailRedirectTo = `${origin}/auth/confirm?next=${encodeURIComponent(safeNext)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo },
      });
      if (error) {
        logger.error("cms.auth.otp.send_failed", { ip, message: error.message });
      } else {
        logger.info("cms.auth.otp.sent", { ip });
      }
    } catch (error) {
      logger.error("cms.auth.otp.send_threw", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    logger.info("cms.auth.otp.non_owner_attempt", { ip });
  }

  return NextResponse.json({ ok: true });
}
