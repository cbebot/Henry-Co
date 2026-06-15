import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getLogisticsViewer, viewerHasRole } from "@/lib/logistics/auth";

/**
 * V3 PASS 21 — POST /api/logistics/pod
 *
 * Rider-only endpoint. Writes a public.logistics_pod_records row with the
 * proof-of-delivery photo reference, optional signature reference, GPS
 * coordinates + accuracy, recipient name + relationship, and a free-text note.
 *
 * The rider client uploads the asset to the RLS-PRIVATE `logistics-documents`
 * bucket via /api/logistics/pod/upload first, then posts the resulting
 * backend-neutral `media://private/...` reference here as `photo_url`. We do
 * not proxy binary data through this route. The persisted value is a signed-
 * read reference, NOT a public CDN URL — sensitive POD media is never
 * dereferenceable by raw URL. (Legacy rows holding an absolute URL still
 * resolve via signLogisticsMediaUrl passthrough at read time.)
 *
 * RLS on the table enforces:
 *   - captured_by_user_id = auth.uid()
 *   - leg_id belongs to a leg this rider is assigned to
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PodPayload = {
  shipment_id: string;
  leg_id?: string | null;
  photo_url?: string | null;
  signature_url?: string | null;
  cloudinary_public_id?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_accuracy_m?: number | null;
  recipient_name?: string | null;
  recipient_relationship?: string | null;
  note?: string | null;
};

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

  let body: PodPayload;
  try {
    body = (await request.json()) as PodPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  if (!body.shipment_id) {
    return NextResponse.json(
      { ok: false, error: "shipment_id_required" },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();
  const { data: row, error } = await admin
    .from("logistics_pod_records")
    .insert({
      shipment_id: body.shipment_id,
      leg_id: body.leg_id ?? null,
      captured_by_user_id: viewer.user.id,
      // photo_url / signature_url now hold `media://private/...` references
      // (RLS-private bucket; signed-read only). Legacy absolute URLs still
      // accepted for backward compatibility.
      photo_url: body.photo_url ?? null,
      signature_url: body.signature_url ?? null,
      // Cloudinary public-id metadata is retired (assets no longer live on a
      // public CDN). Persist only a non-empty legacy value; otherwise null.
      cloudinary_public_id: body.cloudinary_public_id?.trim() ? body.cloudinary_public_id : null,
      gps_lat: typeof body.gps_lat === "number" ? body.gps_lat : null,
      gps_lng: typeof body.gps_lng === "number" ? body.gps_lng : null,
      gps_accuracy_m:
        typeof body.gps_accuracy_m === "number" ? body.gps_accuracy_m : null,
      recipient_name: body.recipient_name ?? null,
      recipient_relationship: body.recipient_relationship ?? null,
      note: body.note ?? null,
    })
    .select("id, captured_at")
    .single();

  if (error || !row) {
    console.error("[logistics-pod] insert failed", error);
    return NextResponse.json(
      { ok: false, error: "persist_failed" },
      { status: 500 },
    );
  }

  // Best-effort: stamp the leg as completed if we have a leg_id.
  if (body.leg_id) {
    await admin
      .from("logistics_shipment_legs")
      .update({
        status: "delivered",
        completed_at: new Date().toISOString(),
      })
      .eq("id", body.leg_id);
  }

  // Use the SSR client to record an audit log via SECURITY DEFINER
  // helper add_audit_log_v2 (caller must be staff — rider qualifies
  // via legacy_profile in is_staff_in_any).
  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "logistics.pod.captured",
      p_entity_type: "logistics_shipment",
      p_entity_id: body.shipment_id,
      p_old_values: null,
      p_new_values: {
        pod_id: row.id,
        leg_id: body.leg_id ?? null,
        has_photo: Boolean(body.photo_url),
        has_signature: Boolean(body.signature_url),
      },
      p_reason: null,
      p_division: "logistics",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[logistics-pod] audit log write failed", err);
  }

  return NextResponse.json({
    ok: true,
    pod_id: row.id,
    captured_at: row.captured_at,
  });
}
