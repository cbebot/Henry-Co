import { NextResponse } from "next/server";
import { MediaValidationError } from "@henryco/media";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { uploadMarketplaceImage } from "@/lib/marketplace/media";
import { resolveMarketplaceImageUrl } from "@/lib/marketplace/media-image";

export const runtime = "nodejs";

/**
 * Vendor image upload — product photos and store branding. Same role gate as
 * `vendor_product_upsert` (the images belong to vendor surfaces only). Returns the
 * backend-neutral `media://public/...` ref (what the form persists) plus the resolved
 * public URL (what the client previews).
 */
export async function POST(request: Request) {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (!viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("image");
  const scope = form.get("scope") === "store" ? "store" : "product";
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  try {
    const ref = await uploadMarketplaceImage(`${scope}/${viewer.user.id}`, file);
    return NextResponse.json({ ok: true, ref, url: resolveMarketplaceImageUrl(ref) });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[marketplace][images] upload failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
