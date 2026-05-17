import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
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
      route: "/api/owner/upload",
      method: "POST",
      actor: actorFromOwnerAuth(auth),
    },
    async () => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return {
          outcome: "server_error" as const,
          value: NextResponse.json(
            { error: "Cloudinary environment variables are missing." },
            { status: 500 },
          ),
        };
      }

      const body = await request.json().catch(() => ({}));
      const folder =
        typeof body.folder === "string" && body.folder.trim()
          ? body.folder.trim()
          : "henryco";

      const timestamp = Math.floor(Date.now() / 1000);

      const params = [`folder=${folder}`, `timestamp=${timestamp}`].join("&");
      const signature = createHash("sha1")
        .update(`${params}${apiSecret}`)
        .digest("hex");

      // Audit-log every signed-upload request so brand-asset uploads
      // are reconcilable downstream (folder + timestamp record).
      await writeOwnerAudit({
        action: "owner.brand.upload.sign",
        entityType: "cloudinary_upload",
        entityId: null,
        newValues: { folder, timestamp, cloud_name: cloudName },
        division: "hub",
      });

      return {
        outcome: "ok" as const,
        value: NextResponse.json({
          cloudName,
          apiKey,
          timestamp,
          folder,
          signature,
        }),
      };
    },
  );
}
