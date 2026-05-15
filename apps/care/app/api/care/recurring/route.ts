import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3 PASS 21 — /api/care/recurring
 *
 * Customer-side recurring auto-book schedule management. The
 * /api/cron/care-automation sweep reads `care_recurring_schedules`
 * rows whose `next_run_at` lands within 24h and creates a booking row
 * from the stored `service_payload`.
 *
 * Endpoints:
 *   GET    — list caller's own schedules.
 *   POST   — create / update a schedule (idempotent on id when
 *            provided).
 *   DELETE — soft-delete (status=cancelled).
 *
 * RLS policies enforce that owners only see/touch their own rows; the
 * server-action `user_id` must equal `auth.uid()`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CADENCES = new Set(["weekly", "biweekly", "monthly", "custom"]);
const VALID_STATUSES = new Set(["active", "paused", "cancelled"]);

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function smallintOrNull(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  if (i < 0 || i > 6) return null;
  return i;
}

function maybeIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to view your schedules." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("care_recurring_schedules")
    .select(
      "id, cadence, day_of_week, time_of_day, pickup_window, service_payload, pickup_address, contact_phone, notes, status, paused_until, next_run_at, last_run_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Schedules query failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, schedules: data ?? [] });
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

  const cadenceRaw = cleanText(body.cadence) || "weekly";
  if (!VALID_CADENCES.has(cadenceRaw)) {
    return NextResponse.json(
      {
        ok: false,
        error: `cadence must be one of ${[...VALID_CADENCES].join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const statusRaw = cleanText(body.status) || "active";
  if (!VALID_STATUSES.has(statusRaw)) {
    return NextResponse.json(
      { ok: false, error: "status must be active|paused|cancelled." },
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
      { ok: false, error: "Sign in to save a schedule." },
      { status: 401 },
    );
  }

  const id = cleanText(body.id) || null;
  const dayOfWeek = smallintOrNull(body.day_of_week);
  const timeOfDay = cleanText(body.time_of_day) || null;
  const pickupWindow = cleanText(body.pickup_window).slice(0, 120) || null;
  const contactPhone = cleanText(body.contact_phone).slice(0, 32) || null;
  const notes = cleanText(body.notes).slice(0, 2000) || null;
  const pausedUntil = maybeIsoTimestamp(body.paused_until);
  const nextRunAt = maybeIsoTimestamp(body.next_run_at);

  const servicePayload =
    body.service_payload && typeof body.service_payload === "object"
      ? body.service_payload
      : {};
  const pickupAddress =
    body.pickup_address && typeof body.pickup_address === "object"
      ? body.pickup_address
      : {};

  const upsertPayload = {
    id: id ?? undefined,
    user_id: user.id,
    cadence: cadenceRaw,
    day_of_week: dayOfWeek,
    time_of_day: timeOfDay,
    pickup_window: pickupWindow,
    service_payload: servicePayload,
    pickup_address: pickupAddress,
    contact_phone: contactPhone,
    notes,
    status: statusRaw,
    paused_until: pausedUntil,
    next_run_at: nextRunAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = id
    ? await supabase
        .from("care_recurring_schedules")
        .update(upsertPayload)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id, status, next_run_at, updated_at")
        .single()
    : await supabase
        .from("care_recurring_schedules")
        .insert(upsertPayload)
        .select("id, status, next_run_at, updated_at")
        .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Schedule could not be saved.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, schedule: data });
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
      { ok: false, error: "Sign in to cancel a schedule." },
      { status: 401 },
    );
  }

  const { error } = await supabase
    .from("care_recurring_schedules")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Schedule could not be cancelled." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
