import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { assertThreadWritable, loadThreadAccessContext } from "@/app/lib/internal-comms-access";
import {
  HQ_IC_STORAGE_BUCKET,
  normalizeUploadKind,
  sanitizeStorageFileName,
  validateUploadDescriptor,
} from "@/app/lib/internal-comms-upload-rules";
import { withOwnerMutationContext, actorFromOwnerAuth } from "@/lib/owner-mutation-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  return withOwnerMutationContext(
    {
      route: "/api/owner/internal-comms/attachments/register",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      let body: {
        threadId?: string;
        fileName?: string;
        mimeType?: string;
        byteSize?: number;
        kind?: string;
      };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return {
          outcome: "validation" as const,
          value: NextResponse.json({ error: "Invalid JSON." }, { status: 400 }),
        };
      }

      const threadId = String(body.threadId || "").trim();
      const fileName = String(body.fileName || "file");
      const mimeType = String(body.mimeType || "");
      const byteSize = Number(body.byteSize || 0);
      const kind = normalizeUploadKind(String(body.kind || ""));

      if (!threadId || !kind) {
        return {
          outcome: "validation" as const,
          value: NextResponse.json({ error: "threadId and kind are required." }, { status: 400 }),
        };
      }

      const validated = validateUploadDescriptor({ kind, mimeType, byteSize });
      if (!validated.ok) {
        return {
          outcome: "validation" as const,
          value: NextResponse.json({ error: validated.message }, { status: 400 }),
        };
      }

      const admin = createAdminSupabase();
      const ctx = await loadThreadAccessContext(admin, auth.user.id);
      const gate = await assertThreadWritable(admin, auth.user.id, threadId, ctx);
      if (!gate.ok) {
        return {
          outcome: "denied" as const,
          value: NextResponse.json({ error: gate.message }, { status: gate.status }),
        };
      }

      const attachmentId = randomUUID();
      const safeName = sanitizeStorageFileName(fileName);
      const storagePath = `${threadId}/${auth.user.id}/${attachmentId}/${safeName}`;

      return {
        outcome: "ok" as const,
        value: NextResponse.json({
          attachmentId,
          storagePath,
          bucket: HQ_IC_STORAGE_BUCKET,
          mimeType: validated.mime,
        }),
      };
    },
  );
}
