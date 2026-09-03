import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { assertThreadReadable, upsertThreadMemberActivity } from "@/app/lib/internal-comms-access";
import { withOwnerMutationContext, actorFromOwnerAuth } from "@/lib/owner-mutation-context";

export const runtime = "nodejs";

/**
 * Read receipts are high-frequency and idempotent; they get the
 * structured-log + Sentry-breadcrumb half of H4 but skip the audit_log
 * row per write to avoid an outsized audit_log table from passive
 * dashboard polling. Pin/DM/thread/message — all the "operator action"
 * mutations — still write audit rows.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  return withOwnerMutationContext(
    {
      route: "/api/owner/internal-comms/read",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      let body: { threadId?: string };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return {
          outcome: "validation" as const,
          value: NextResponse.json({ error: "Invalid JSON." }, { status: 400 }),
        };
      }

      const threadId = String(body.threadId || "").trim();
      if (!threadId) {
        return {
          outcome: "validation" as const,
          value: NextResponse.json({ error: "threadId is required." }, { status: 400 }),
        };
      }

      const admin = createAdminSupabase();
      const gate = await assertThreadReadable(admin, auth.user.id, threadId);
      if (!gate.ok) {
        return {
          outcome: "denied" as const,
          value: NextResponse.json({ error: gate.message }, { status: gate.status }),
        };
      }

      const now = new Date().toISOString();

      const error = await upsertThreadMemberActivity(admin, {
        threadId,
        userId: auth.user.id,
        defaultRole: gate.thread.kind === "dm" ? "member" : "owner",
        lastReadAt: now,
      });

      if (error) {
        return {
          outcome: "server_error" as const,
          value: NextResponse.json({ error: "Could not update read state." }, { status: 400 }),
        };
      }

      return {
        outcome: "ok" as const,
        value: NextResponse.json({ ok: true, lastReadAt: now }),
      };
    },
  );
}
