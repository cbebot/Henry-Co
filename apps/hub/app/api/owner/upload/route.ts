import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary environment variables are missing." },
      { status: 500 }
    );
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

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
  });
}