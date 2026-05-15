import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3 PASS 21 — POST /api/care/pod
 *
 * Rider proof-of-delivery capture. Mirrors logistics /api/pod
 * (commit b667567d).
 *
 * The RLS policy `care pod: rider insert` requires:
 *   - captured_by_user_id = auth.uid()
 *   - public.is_staff_in('care') === true
 *
 * Cloudinary upload happens client-side via the signed-upload route;
 * this endpoint persists only the resulting URL, public_id, GPS, and
 * recipient metadata.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const bookingId = cleanText(body.booking_id);
  const leg = (cleanText(body.leg) || "delivery").toLowerCase();
  const photoUrl = cleanText(body.photo_url);
  const signatureUrl = cleanText(body.signature_url);
  const cloudinaryPublicId = cleanText(body.cloudinary_public_id);
  const recipientName = cleanText(body.recipient_name).slice(0, 120);
  const recipientRelationship = cleanText(body.recipient_relationship).slice(0, 120);
  const note = cleanText(body.note).slice(0, 2000) || null;

  if (!bookingId) {
    return NextResponse.json(
      { ok: false, error: "booking_id is required." },
      { status: 400 },
    );
  }

  if (leg !== "pickup" && leg !== "delivery") {
    return NextResponse.json(
      { ok: false, error: "leg must be 'pickup' or 'delivery'." },
      { status: 400 },
    );
  }

  if (!photoUrl && !signatureUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "At least one of photo_url or signature_url is required.",
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to capture proof of delivery." },
      { status: 401 },
    );
  }

  const insertPayload = {
    booking_id: bookingId,
    leg,
    captured_by_user_id: user.id,
    photo_url: photoUrl || null,
    signature_url: signatureUrl || null,
    cloudinary_public_id: cloudinaryPublicId || null,
    gps_lat: numberOrNull(body.gps_lat),
    gps_lng: numberOrNull(body.gps_lng),
    gps_accuracy_m: numberOrNull(body.gps_accuracy_m),
    recipient_name: recipientName || null,
    recipient_relationship: recipientRelationship || null,
    note,
  };

  const { data, error } = await supabase
    .from("care_pod_records")
    .insert(insertPayload)
    .select("id, booking_id, leg, captured_at")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error.message || "Proof of delivery could not be captured.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, pod: data });
}
