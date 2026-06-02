import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner-auth";

export const runtime = "nodejs";

/**
 * Owner-gated Cloudinary signed-upload endpoint. Mirrors the hub pattern: we
 * never proxy the file — we sign `folder`+`timestamp` with the API secret
 * (server-only) and the browser uploads the file straight to Cloudinary. The
 * secret never reaches the client.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Image upload isn't configured yet (Cloudinary credentials are missing)." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { folder?: unknown };
  const folder =
    typeof body.folder === "string" && body.folder.trim() ? body.folder.trim() : "henryco/cms";

  const timestamp = Math.floor(Date.now() / 1000);
  const params = [`folder=${folder}`, `timestamp=${timestamp}`].join("&");
  const signature = createHash("sha1").update(`${params}${apiSecret}`).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
