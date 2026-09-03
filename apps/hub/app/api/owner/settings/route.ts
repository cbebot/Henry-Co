import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { applyCompanySettingsWrite } from "@/lib/company-settings-write";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { withOwnerMutationContext, actorFromOwnerAuth } from "@/lib/owner-mutation-context";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[owner/settings][GET]", error);
    return NextResponse.json({ error: "Could not load company settings right now." }, { status: 400 });
  }

  return NextResponse.json({ settings: data ?? null });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  return withOwnerMutationContext(
    {
      route: "/api/owner/settings",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      const body = await request.json();
      // F3 (2026-07-10): the write sequence lives in applyCompanySettingsWrite —
      // ONE path shared with the founder action rail. Behavior unchanged.
      const result = await applyCompanySettingsWrite(body);

      if (!result.ok) {
        return {
          outcome: "server_error" as const,
          value: NextResponse.json({ error: result.error }, { status: 400 }),
        };
      }

      return {
        outcome: "ok" as const,
        value: NextResponse.json({ ok: true }),
      };
    },
  );
}
