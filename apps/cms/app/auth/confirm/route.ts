import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { normalizeTrustedRedirect } from "@henryco/config";
import { logger } from "@henryco/observability/logger";
import { createCmsSupabaseServer } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/owner-auth";

export const runtime = "nodejs";

const ALLOWED_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  "magiclink",
  "email",
  "signup",
  "invite",
  "recovery",
]);

/**
 * Magic-link landing. Handles both the PKCE `code` flow and the
 * `token_hash`/`type` flow, then re-verifies ownership via `requireOwner`
 * (defence-in-depth) before admitting the session to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const safeNext = normalizeTrustedRedirect(searchParams.get("next") ?? "/dashboard");
  const next = safeNext.startsWith("/") ? safeNext : "/dashboard";

  const supabase = await createCmsSupabaseServer();
  let verified = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  } else if (tokenHash && rawType && ALLOWED_TYPES.has(rawType as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: rawType as EmailOtpType,
      token_hash: tokenHash,
    });
    verified = !error;
  }

  if (verified) {
    const auth = await requireOwner();
    if (auth.ok) {
      logger.info("cms.auth.sign_in", { userId: auth.user.id });
      return NextResponse.redirect(new URL(next, origin));
    }
    logger.warn("cms.auth.non_owner_session");
    return NextResponse.redirect(new URL("/no-access", origin));
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  return NextResponse.redirect(loginUrl);
}
