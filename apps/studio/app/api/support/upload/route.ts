import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES = 10 * 1024 * 1024;

type CloudinaryUpload = {
  secure_url: string;
  public_id: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
};

function clean(value: string) {
  return value.replace(/[^a-z0-9.-]+/gi, "-").replace(/-+/g, "-");
}

async function uploadSupportAttachmentToCloudinary(
  file: File,
  userId: string,
): Promise<CloudinaryUpload | null> {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = String(process.env.CLOUDINARY_FOLDER || "henryco/studio").trim();
  if (!cloudName || !apiKey || !apiSecret) return null;

  const folder = `${baseFolder}/support-attachments/${clean(userId).slice(0, 32) || "unscoped"}`;
  const safeName =
    clean(file.name).toLowerCase().slice(0, 32).replace(/^-|-$/g, "") ||
    "attachment";
  const publicId = `support-${Date.now()}-${safeName}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signaturePayload).digest("hex");

  const isImage = String(file.type || "").toLowerCase().startsWith("image/");
  const resourcePath = isImage ? "image/upload" : "raw/upload";

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourcePath}`,
    { method: "POST", body: form },
  );
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as
    | CloudinaryUpload
    | null;
  if (!payload?.secure_url || !payload?.public_id) return null;
  return payload;
}

/**
 * PASS 24 — pre-upload endpoint used by the @henryco/messaging-thread
 * engine. The engine uploads each attachment here first and then passes
 * the resulting secure URLs to /api/support/reply as JSON, which keeps
 * the send round-trip tight and lets the composer surface real per-file
 * progress.
 *
 * Auth-gated to studio staff (studio_owner, client_success) and thread
 * owners — anyone who can reply to a thread can also attach to it.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, reason: "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminSupabase();
    const { data: memberships } = await admin
      .from("studio_role_memberships")
      .select("role")
      .eq("is_active", true)
      .eq("user_id", user.id);
    const staffRoles = new Set(
      (memberships ?? []).map((row) => String((row as { role?: string }).role || "")),
    );
    const hasSupportRole =
      staffRoles.has("studio_owner") ||
      staffRoles.has("client_success") ||
      staffRoles.has("owner") ||
      staffRoles.has("support");
    if (!hasSupportRole) {
      return NextResponse.json(
        { ok: false, reason: "Forbidden" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { ok: false, reason: "Choose a file to upload." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, reason: "Attachment is larger than 10 MB." },
        { status: 400 },
      );
    }

    const mimeType = String(file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          ok: false,
          reason: "Upload images, PDF, TXT, or Word documents only.",
        },
        { status: 400 },
      );
    }

    const upload = await uploadSupportAttachmentToCloudinary(file, user.id);
    if (!upload) {
      return NextResponse.json(
        { ok: false, reason: "Upload failed. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      url: upload.secure_url,
      name: file.name,
      type: mimeType,
      size: file.size,
    });
  } catch (error) {
    console.error("[studio/support/upload] upload error:", error);
    return NextResponse.json(
      { ok: false, reason: "We couldn't upload that file. Please try again." },
      { status: 500 },
    );
  }
}
