import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  INTERNAL_COMMS_UNAVAILABLE,
  isInternalCommsStorageError,
  logInternalCommsError,
} from "@/app/lib/internal-comms-errors";
import { assertThreadReadable, upsertThreadMemberActivity } from "@/app/lib/internal-comms-access";
import { writeOwnerAudit } from "@/lib/owner-audit-log";
import { withOwnerMutationContext, actorFromOwnerAuth } from "@/lib/owner-mutation-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  return withOwnerMutationContext(
    {
      route: "/api/owner/internal-comms/pin",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      let body: { threadId?: string; pinned?: boolean };
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

      const pinned = Boolean(body.pinned);

      const admin = createAdminSupabase();
      const gate = await assertThreadReadable(admin, auth.user.id, threadId);
      if (!gate.ok) {
        return {
          outcome: "denied" as const,
          value: NextResponse.json({ error: gate.message }, { status: gate.status }),
        };
      }

      const error = await upsertThreadMemberActivity(admin, {
        threadId,
        userId: auth.user.id,
        defaultRole: gate.thread.kind === "dm" ? "member" : "owner",
        pinned,
      });

      if (error) {
        logInternalCommsError("pin", error);
        if (isInternalCommsStorageError(error)) {
          return {
            outcome: "server_error" as const,
            value: NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE }, { status: 503 }),
          };
        }
        return {
          outcome: "server_error" as const,
          value: NextResponse.json({ error: "Could not update pin." }, { status: 400 }),
        };
      }

      await writeOwnerAudit({
        action: "owner.messaging.thread.pin",
        entityType: "hq_internal_comm_thread_member",
        entityId: threadId,
        newValues: { thread_id: threadId, pinned },
        division: gate.thread.division ?? "hub",
      });

      return {
        outcome: "ok" as const,
        value: NextResponse.json({ ok: true, pinned }),
      };
    },
  );
}
