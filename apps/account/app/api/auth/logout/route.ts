import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";
import { USER_FACING_GENERIC, logApiError } from "@/lib/user-facing-error";

export async function POST() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const context = await detectSecurityRequestContext();
    await logSecurityEvent({
      userId: user.id,
      eventType: "account_sign_out",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      locationSummary: context.locationSummary,
      metadata: {
        source: "account_logout_route",
        scope: "global",
      },
    });
  }

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    logApiError("auth/logout", error);
    return NextResponse.json({ error: USER_FACING_GENERIC }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
