import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadOwnedAsset } from "@/lib/cloudinary";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { ok: false, reason: "Choose a file to upload." },
        { status: 400 },
      );
    }

    const upload = await uploadOwnedAsset(file, user.id, {
      folder: "support-attachments",
      resourceType: "auto",
      maxBytes: MAX_BYTES,
      allowedTypes: ALLOWED_ATTACHMENT_TYPES,
      invalidTypeMessage: "Upload JPG, PNG, WebP, PDF, or TXT attachments only.",
      publicIdPrefix: "support-attachment",
    });

    return NextResponse.json({
      ok: true,
      url: upload.secureUrl,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "We couldn't upload that file.",
      },
      { status: 500 },
    );
  }
}
