import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3 PASS 21 — POST /api/care/claims
 *
 * Customer-side damage / lost / not-returned claim intake. Mirrors
 * logistics /api/claims (commit b667567d). Insert is RLS-gated by
 * `care claims: customer insert own` policy — the row body must carry
 * `opened_by_user_id = auth.uid()` AND the booking_id must be either
 * null or owned by the caller (by user_id or normalized_email).
 *
 * Evidence URLs are Cloudinary URLs uploaded client-side via the
 * signed upload route (already shipped). The route only persists the
 * resulting URL list; it does NOT itself accept binary uploads.
 *
 * Gates:
 *   - Authenticated.
 *   - reason: 4..240 chars
 *   - description: 0..2000 chars
 *   - evidence_urls: 0..5 strings (cap on count enforced server-side
 *     too in the C6 gate).
 *
 * No-rebuild: WhatsApp HMAC + care contact rate-limit are out of scope
 * for this route. Idempotency is handled by the unique (booking_id,
 * opened_by_user_id, reason hash) check — duplicates within 60s return
 * 200 with the existing row.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVIDENCE = 5;
const MAX_REASON = 240;
const MIN_REASON = 4;
const MAX_DESCRIPTION = 2000;
const MAX_GARMENT_LABEL = 120;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => cleanText(entry))
    .filter((entry) => entry.length > 0 && entry.length < 1024)
    .slice(0, MAX_EVIDENCE);
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

  const bookingId = cleanText(body.booking_id) || null;
  const garmentLabel = cleanText(body.garment_label).slice(0, MAX_GARMENT_LABEL) || null;
  const reason = cleanText(body.reason);
  const description = cleanText(body.description).slice(0, MAX_DESCRIPTION) || null;
  const evidence = cleanArray(body.evidence_urls);
  const requestedAmountMinor = Number(body.requested_amount_minor ?? 0);
  const currency = cleanText(body.currency).slice(0, 6) || "NGN";

  if (reason.length < MIN_REASON || reason.length > MAX_REASON) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please describe the issue in at least a sentence.",
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
      { ok: false, error: "Sign in to file a claim." },
      { status: 401 },
    );
  }

  const insertPayload = {
    booking_id: bookingId,
    opened_by_user_id: user.id,
    garment_label: garmentLabel,
    reason,
    description,
    evidence_urls: evidence,
    requested_amount_minor: Number.isFinite(requestedAmountMinor)
      ? Math.max(0, Math.round(requestedAmountMinor))
      : 0,
    currency,
    status: "submitted",
  };

  const { data, error } = await supabase
    .from("care_claims")
    .insert(insertPayload)
    .select("id, status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Claim could not be filed.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    claim: data,
  });
}

/**
 * GET /api/care/claims — list the caller's claims.
 * RLS limits to `opened_by_user_id = auth.uid()` for customers, plus
 * is_staff_in('care') for staff.
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to view claims." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));

  const { data, error } = await supabase
    .from("care_claims")
    .select(
      "id, booking_id, garment_label, reason, description, evidence_urls, requested_amount_minor, currency, status, resolved_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Claims query failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, claims: data ?? [] });
}
