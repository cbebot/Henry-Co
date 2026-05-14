import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getLogisticsViewer, viewerHasRole } from "@/lib/logistics/auth";

/**
 * V3 PASS 21 — POST /api/logistics/dispatch/assign
 *
 * Dispatcher-only endpoint. Either:
 *   1. Creates a new leg for a shipment (if none exists) and assigns
 *      it to a rider in one step.
 *   2. Updates an existing leg's rider_user_id + rider_name.
 *
 * Writes an audit_logs row via add_audit_log_v2 so reassignments are
 * traceable.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AssignPayload = {
  shipment_id: string;
  leg_id?: string | null;
  rider_user_id: string;
  rider_name?: string | null;
  vehicle_id?: string | null;
  eta_at?: string | null;
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  const viewer = await getLogisticsViewer();
  if (!viewer.user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }
  if (
    !viewerHasRole(viewer, [
      "dispatch_admin",
      "dispatch_manager",
      "logistics_owner",
    ])
  ) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  let body: AssignPayload;
  try {
    body = (await request.json()) as AssignPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  if (!body.shipment_id || !body.rider_user_id) {
    return NextResponse.json(
      { ok: false, error: "shipment_id_and_rider_required" },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();
  let legId: string | null = body.leg_id ?? null;

  if (legId) {
    const { data: existing, error: fetchError } = await admin
      .from("logistics_shipment_legs")
      .select("id, rider_user_id")
      .eq("id", legId)
      .maybeSingle<{ id: string; rider_user_id: string | null }>();

    if (fetchError) {
      console.error("[logistics-dispatch] leg fetch failed", fetchError);
      return NextResponse.json(
        { ok: false, error: "fetch_failed" },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "leg_not_found" },
        { status: 404 },
      );
    }

    const { error: updateError } = await admin
      .from("logistics_shipment_legs")
      .update({
        rider_user_id: body.rider_user_id,
        rider_name: body.rider_name ?? null,
        vehicle_id: body.vehicle_id ?? null,
        eta_at: body.eta_at ?? null,
        notes: body.notes ?? null,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[logistics-dispatch] update failed", updateError);
      return NextResponse.json(
        { ok: false, error: "update_failed" },
        { status: 500 },
      );
    }
  } else {
    // Create a new leg as leg_index = current max + 1 for that shipment.
    const { data: existingLegs } = await admin
      .from("logistics_shipment_legs")
      .select("leg_index")
      .eq("shipment_id", body.shipment_id)
      .order("leg_index", { ascending: false })
      .limit(1);
    const nextIndex =
      existingLegs && existingLegs.length > 0
        ? Number(existingLegs[0]?.leg_index ?? -1) + 1
        : 0;

    const { data: newLeg, error: insertError } = await admin
      .from("logistics_shipment_legs")
      .insert({
        shipment_id: body.shipment_id,
        leg_index: nextIndex,
        rider_user_id: body.rider_user_id,
        rider_name: body.rider_name ?? null,
        vehicle_id: body.vehicle_id ?? null,
        eta_at: body.eta_at ?? null,
        notes: body.notes ?? null,
        status: "assigned",
      })
      .select("id")
      .single();

    if (insertError || !newLeg) {
      console.error("[logistics-dispatch] insert failed", insertError);
      return NextResponse.json(
        { ok: false, error: "insert_failed" },
        { status: 500 },
      );
    }
    legId = newLeg.id;
  }

  // Stamp the parent shipment so the rider name surfaces in customer views.
  await admin
    .from("logistics_shipments")
    .update({
      assigned_rider_user_id: body.rider_user_id,
      assigned_rider_name: body.rider_name ?? null,
      lifecycle_status: "assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.shipment_id);

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "logistics.dispatch.assigned",
      p_entity_type: "logistics_shipment",
      p_entity_id: body.shipment_id,
      p_old_values: null,
      p_new_values: {
        leg_id: legId,
        rider_user_id: body.rider_user_id,
        rider_name: body.rider_name ?? null,
        vehicle_id: body.vehicle_id ?? null,
      },
      p_reason: body.notes ?? null,
      p_division: "logistics",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[logistics-dispatch] audit log write failed", err);
  }

  return NextResponse.json({ ok: true, leg_id: legId });
}
