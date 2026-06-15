import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/env";
import {
  MARKETPLACE_DOCUMENT_RULE,
  signMarketplaceMediaUrl,
  uploadMarketplaceDocument,
} from "@/lib/marketplace/media";
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

    // Upload to the RLS-PRIVATE marketplace document bucket (signed-URL only —
    // never a public CDN). Returns a backend-neutral `media://private/...`
    // reference that is persisted in place of a raw URL (V3-MEDIA-SWEEP-01).
    const mediaRef = await uploadMarketplaceDocument(`seller-${kind}/${user.id}`, file, {
      ...MARKETPLACE_DOCUMENT_RULE,
      allowedTypes: [...ALLOWED_TYPES],
      invalidTypeMessage: "Upload a JPG, PNG, WebP, or PDF file.",
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
      file_url: mediaRef,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      reference_type: "marketplace_vendor_application",
      reference_id: application?.id ? String(application.id) : null,
      metadata: {
        kind,
        normalized_email: normalizeEmail(user.email),
      },
    } as never);

    // The client preview cannot render a private `media://` ref directly
    // (resolveMediaUrl throws on private). Hand back BOTH: the canonical REF in
    // `fileUrl` (the wizard round-trips this on draft save / submit) and a
    // short-lived SIGNED `previewUrl` for the "Review file" preview link.
    const previewUrl = await signMarketplaceMediaUrl(mediaRef);

    const document: MarketplaceSellerDocumentRecord = {
      kind: kind as MarketplaceSellerDocumentRecord["kind"],
      name: file.name,
      fileUrl: mediaRef,
      previewUrl: previewUrl || null,
      mimeType: file.type || null,
      size: file.size,
      publicId: null,
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
          file_url: mediaRef,
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
