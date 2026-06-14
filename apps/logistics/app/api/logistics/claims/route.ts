import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getLogisticsViewer, viewerHasRole } from "@/lib/logistics/auth";
import { normalizeEmail } from "@/lib/env";

/**
 * V3 PASS 21 — POST /api/logistics/claims
 *
 * Customer-only endpoint for filing a claim on a shipment the caller
 * owns. Staff use a separate triage flow (web app) — they read the
 * table directly through RLS staff policy.
 *
 * Validates ownership by joining logistics_shipments — caller must
 * match customer_user_id OR normalized_email.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClaimPayload = {
  shipment_id: string;
  reason: string;
  description?: string | null;
  evidence_urls?: string[];
  requested_amount?: number | null;
  currency?: string | null;
};

type ShipmentOwnerRow = {
  id: string;
  customer_user_id: string | null;
  normalized_email: string | null;
};

export async function POST(request: NextRequest) {
  const viewer = await getLogisticsViewer();
  if (!viewer.user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  let body: ClaimPayload;
  try {
    body = (await request.json()) as ClaimPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  if (!body.shipment_id || !body.reason) {
    return NextResponse.json(
      { ok: false, error: "shipment_id_and_reason_required" },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();
  const { data: shipment, error: fetchError } = await admin
    .from("logistics_shipments")
    .select("id, customer_user_id, normalized_email")
    .eq("id", body.shipment_id)
    .maybeSingle<ShipmentOwnerRow>();

  if (fetchError) {
    console.error("[logistics-claims] shipment fetch failed", fetchError);
    return NextResponse.json(
      { ok: false, error: "fetch_failed" },
      { status: 500 },
    );
  }
  if (!shipment) {
    return NextResponse.json(
      { ok: false, error: "shipment_not_found" },
      { status: 404 },
    );
  }

  const viewerEmail = normalizeEmail(viewer.user.email);
  const ownsShipment =
    shipment.customer_user_id === viewer.user.id ||
    (shipment.normalized_email !== null &&
      shipment.normalized_email === viewerEmail);

  if (!ownsShipment && !viewerHasRole(viewer, ["logistics_owner", "dispatch_manager", "support"])) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const { data: claim, error: insertError } = await admin
    .from("logistics_claims")
    .insert({
      shipment_id: shipment.id,
      opened_by_user_id: viewer.user.id,
      reason: String(body.reason).slice(0, 200),
      description: body.description ?? null,
      // Claim evidence is sensitive (loss/damage photos). When a logistics-
      // controlled uploader is wired up it must write to the RLS-private
      // `logistics-documents` bucket (see uploadLogisticsDocument) and pass the
      // resulting `media://private/...` reference here — which is persisted
      // verbatim below. Read sites MUST resolve via signLogisticsMediaUrls
      // before sending to a client (resolveMediaUrl THROWS on a private ref).
      // Legacy/external URL strings are still accepted unchanged.
      evidence_urls: Array.isArray(body.evidence_urls)
        ? body.evidence_urls.slice(0, 12).map((url) => String(url))
        : [],
      requested_amount_minor:
        typeof body.requested_amount === "number"
          ? Math.max(0, Math.round(body.requested_amount * 100))
          : 0,
      currency: body.currency ?? "NGN",
      status: "submitted",
    })
    .select("id, created_at")
    .single();

  if (insertError || !claim) {
    console.error("[logistics-claims] insert failed", insertError);
    return NextResponse.json(
      { ok: false, error: "persist_failed" },
      { status: 500 },
    );
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "logistics.claims.opened",
      p_entity_type: "logistics_claim",
      p_entity_id: claim.id,
      p_old_values: null,
      p_new_values: {
        shipment_id: shipment.id,
        reason: body.reason,
        requested_amount: body.requested_amount ?? 0,
      },
      p_reason: null,
      p_division: "logistics",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[logistics-claims] audit log write failed", err);
  }

  return NextResponse.json({
    ok: true,
    claim_id: claim.id,
    created_at: claim.created_at,
  });
}
