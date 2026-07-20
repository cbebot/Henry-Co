import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3 PASS 21 — /api/care/preferences/garments
 *
 * Per-user, per-garment-type care preferences. The booking flow
 * hydrates from saved preferences and the depot operator sees them
 * on intake. RLS-enforced: caller can only read/write their own rows.
 *
 * GET    — list caller's preferences.
 * POST   — upsert on (user_id, garment_type_id || garment_type_key).
 * DELETE — remove a single preference row.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to view care preferences." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("care_user_preferences")
    .select(
      "id, garment_type_id, garment_type_key, options, notes, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[care:preferences] query failed", error);
    return NextResponse.json(
      { ok: false, error: "Preferences could not be loaded. Please try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, preferences: data ?? [] });
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

  const garmentTypeId = cleanText(body.garment_type_id) || null;
  const garmentTypeKey = cleanText(body.garment_type_key) || null;
  if (!garmentTypeId && !garmentTypeKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "garment_type_id or garment_type_key is required.",
      },
      { status: 400 },
    );
  }

  const options =
    body.options && typeof body.options === "object" ? body.options : {};
  const notes = cleanText(body.notes).slice(0, 2000) || null;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to save care preferences." },
      { status: 401 },
    );
  }

  // Find existing row by (user_id, garment_type_id || garment_type_key)
  const { data: existing } = await supabase
    .from("care_user_preferences")
    .select("id")
    .eq("user_id", user.id)
    .match(
      garmentTypeId
        ? { garment_type_id: garmentTypeId }
        : { garment_type_key: garmentTypeKey },
    )
    .maybeSingle();

  const payload = {
    user_id: user.id,
    garment_type_id: garmentTypeId,
    garment_type_key: garmentTypeKey,
    options,
    notes,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = existing
    ? await supabase
        .from("care_user_preferences")
        .update(payload)
        .eq("id", existing.id)
        .eq("user_id", user.id)
        .select("id, garment_type_id, garment_type_key, options, notes, updated_at")
        .single()
    : await supabase
        .from("care_user_preferences")
        .insert(payload)
        .select("id, garment_type_id, garment_type_key, options, notes, updated_at")
        .single();

  if (error) {
    console.error("[care:preferences] save failed", error);
    return NextResponse.json(
      { ok: false, error: "Preference could not be saved. Please try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, preference: data });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = cleanText(url.searchParams.get("id"));
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id query param is required." },
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
      { ok: false, error: "Sign in to remove a preference." },
      { status: 401 },
    );
  }

  const { error } = await supabase
    .from("care_user_preferences")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[care:preferences] remove failed", error);
    return NextResponse.json(
      { ok: false, error: "Preference could not be removed. Please try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
