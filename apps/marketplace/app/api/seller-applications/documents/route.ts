import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/env";
import { uploadOwnedAsset } from "@/lib/cloudinary";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { MarketplaceSellerDocumentRecord } from "@/lib/marketplace/types";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_KINDS = new Set(["businessRegistration", "founderIdentity", "payoutProof", "other"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("document");
    const requestedKind = String(formData.get("kind") || "").trim();
    const kind = ALLOWED_KINDS.has(requestedKind) ? requestedKind : "other";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A seller document file is required." }, { status: 400 });
    }

    const upload = await uploadOwnedAsset(file, user.id, {
      folder: "seller-documents",
      resourceType: "auto",
      maxBytes: 10 * 1024 * 1024,
      allowedTypes: ALLOWED_TYPES,
      invalidTypeMessage: "Upload a JPG, PNG, WebP, or PDF file.",
      publicIdPrefix: `seller-${kind}`,
    });

    const admin = createAdminSupabase();
    const { data: application } = await admin
      .from("marketplace_vendor_applications")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await admin.from("customer_documents").insert({
      user_id: user.id,
      division: "marketplace",
      type:
        kind === "founderIdentity"
          ? "id_document"
          : kind === "payoutProof"
            ? "payment_proof"
            : "document",
      name: file.name,
      file_url: upload.secureUrl,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      reference_type: "marketplace_vendor_application",
      reference_id: application?.id ? String(application.id) : null,
      metadata: {
        public_id: upload.publicId,
        kind,
        normalized_email: normalizeEmail(user.email),
        ...(upload.ocrWarning ? { ocr_flag: upload.ocrWarning } : {}),
      },
    } as never);

    const document: MarketplaceSellerDocumentRecord = {
      kind: kind as MarketplaceSellerDocumentRecord["kind"],
      name: file.name,
      fileUrl: upload.secureUrl,
      mimeType: file.type || null,
      size: file.size,
      publicId: upload.publicId,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
    };

    try {
      await admin.from("marketplace_events").insert({
        event_type: "vendor_application_document_uploaded",
        user_id: user.id,
        normalized_email: normalizeEmail(user.email),
        entity_type: "vendor_application",
        entity_id: application?.id ? String(application.id) : null,
        payload: {
          kind,
          name: file.name,
          file_url: upload.secureUrl,
        },
      } as never);
    } catch {
      // tolerate event schema lag
    }

    return NextResponse.json({
      ok: true,
      document,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload that document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
