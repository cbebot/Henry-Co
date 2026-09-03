import { NextResponse, type NextRequest } from "next/server";
import { getLogisticsViewer, viewerHasRole } from "@/lib/logistics/auth";
import {
  LOGISTICS_DOCUMENT_RULE,
  uploadLogisticsDocument,
} from "@/lib/logistics/media";

/**
 * POST /api/logistics/pod/upload  (multipart/form-data)
 *
 * Rider-only. Receives the captured proof-of-delivery image binary and writes
 * it to the RLS-PRIVATE `logistics-documents` bucket via @henryco/media, then
 * returns a backend-neutral `media://private/...` reference.
 *
 * This replaces the previous client-side direct upload to Cloudinary's default
 * (public) `image/upload` endpoint: that produced a publicly-dereferenceable
 * `secure_url` which bypassed the row-level RLS protecting POD records. The
 * binary now never touches a public CDN; the persisted value is a signed-read
 * reference (see /api/logistics/pod and signLogisticsMediaUrl).
 *
 * The service-role storage write lives server-side (the privileged client
 * cannot ship to the rider's browser).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = LOGISTICS_DOCUMENT_RULE.maxBytes ?? 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const viewer = await getLogisticsViewer();
  if (!viewer.user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }
  if (!viewerHasRole(viewer, ["rider", "dispatch_manager", "logistics_owner"])) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_form" },
      { status: 400 },
    );
  }

  const entry = form.get("file");
  if (!(entry instanceof File) || entry.size <= 0) {
    return NextResponse.json(
      { ok: false, error: "file_required" },
      { status: 400 },
    );
  }
  if (entry.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "file_too_large" },
      { status: 413 },
    );
  }

  const shipmentId = String(form.get("shipment_id") ?? "").trim();

  try {
    const ref = await uploadLogisticsDocument(
      shipmentId || viewer.user.id,
      entry,
      "pod",
    );
    return NextResponse.json({ ok: true, ref });
  } catch (err) {
    console.error("[logistics-pod-upload] upload failed", err);
    return NextResponse.json(
      { ok: false, error: "upload_failed" },
      { status: 500 },
    );
  }
}
