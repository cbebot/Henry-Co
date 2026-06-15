import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { signAccountMediaUrl, uploadAccountDocument } from "@/lib/account/media";

const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];

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

    // Upload to the RLS-PRIVATE document bucket (signed-URL only — never a
    // public CDN). Returns a backend-neutral `media://private/...` reference;
    // the client persists this REF, and displays the short-lived signed
    // previewUrl below for the in-composer preview (V3-MEDIA-SWEEP-01).
    const ref = await uploadAccountDocument(`support/${user.id}`, file, {
      maxBytes: MAX_BYTES,
      allowedTypes: ALLOWED_ATTACHMENT_TYPES,
      invalidTypeMessage: "Upload JPG, PNG, WebP, PDF, or TXT attachments only.",
    });

    // A private `media://` ref is not renderable in a browser (resolveMediaUrl
    // throws on private refs), so we also hand back a short-lived signed URL
    // for the immediate composer preview. The persisted value is `ref`.
    const previewUrl = await signAccountMediaUrl(ref);

    return NextResponse.json({
      ok: true,
      ref,
      url: previewUrl,
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
