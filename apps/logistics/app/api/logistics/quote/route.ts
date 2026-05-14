import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/env";
import { buildPricingBreakdown, resolveZone } from "@/lib/logistics/pricing";
import { DEFAULT_LOGISTICS_ZONES } from "@/lib/logistics/content";
import type {
  LogisticsServiceType,
  LogisticsUrgency,
} from "@/lib/logistics/types";

/**
 * V3 PASS 21 — POST /api/logistics/quote
 *
 * Accepts a quote payload (zone, service, urgency, weight, size,
 * fragile flag, optional contact info) and:
 *   1. Computes the pricing breakdown via @/lib/logistics/pricing
 *      (the same engine /quote uses today — no duplicate math).
 *   2. Persists the quote to public.logistics_quotes with a 24-hour
 *      expiry so /book can hydrate from the returned quote_id.
 *   3. Returns { quote_id, total, currency, expires_at, breakdown }.
 *
 * Idempotency: a client retry with the same payload produces a new
 * quote row (quotes are cheap; we never silently lose one). The
 * breakdown math is pure so two calls with the same payload return
 * the same total.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type QuoteRequestPayload = {
  zoneKey?: string;
  serviceType?: LogisticsServiceType;
  urgency?: LogisticsUrgency;
  weightKg?: number;
  sizeTier?: "small" | "medium" | "large" | "oversize";
  fragile?: boolean;
  email?: string | null;
  pickupCity?: string | null;
  dropoffCity?: string | null;
  parcelDescription?: string | null;
};

function isServiceType(value: unknown): value is LogisticsServiceType {
  return (
    value === "same_day" ||
    value === "scheduled" ||
    value === "dispatch" ||
    value === "inter_city" ||
    value === "business_route"
  );
}

function isUrgency(value: unknown): value is LogisticsUrgency {
  return value === "standard" || value === "priority" || value === "rush";
}

function isSizeTier(
  value: unknown,
): value is "small" | "medium" | "large" | "oversize" {
  return (
    value === "small" || value === "medium" || value === "large" || value === "oversize"
  );
}

export async function POST(request: NextRequest) {
  let body: QuoteRequestPayload;
  try {
    body = (await request.json()) as QuoteRequestPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const zone =
    resolveZone(body.zoneKey, DEFAULT_LOGISTICS_ZONES) ??
    DEFAULT_LOGISTICS_ZONES[0];
  const serviceType: LogisticsServiceType = isServiceType(body.serviceType)
    ? body.serviceType
    : "scheduled";
  const urgency: LogisticsUrgency = isUrgency(body.urgency)
    ? body.urgency
    : "standard";
  const sizeTier = isSizeTier(body.sizeTier) ? body.sizeTier : "small";
  const weightKg = Math.max(
    0,
    Number.isFinite(body.weightKg as number) ? Number(body.weightKg) : 0,
  );
  const fragile = Boolean(body.fragile);
  const normalizedEmail = normalizeEmail(body.email);

  const breakdown = buildPricingBreakdown({
    zone,
    serviceType,
    urgency,
    weightKg,
    sizeTier,
    fragile,
  });

  // Capture viewer identity (may be null for unauthenticated /quote
  // visitors — that is fine, we store normalized_email if we have it).
  let viewerUserId: string | null = null;
  try {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    viewerUserId = data.user?.id ?? null;
  } catch {
    viewerUserId = null;
  }

  const admin = createAdminSupabase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: row, error } = await admin
    .from("logistics_quotes")
    .insert({
      user_id: viewerUserId,
      normalized_email: normalizedEmail,
      source: "web_quote_v3",
      currency: breakdown.currency,
      total_minor: Math.round(breakdown.total * 100),
      expires_at: expiresAt,
      payload: {
        zoneKey: zone.key,
        zoneLabel: zone.name,
        serviceType,
        urgency,
        weightKg,
        sizeTier,
        fragile,
        pickupCity: body.pickupCity ?? null,
        dropoffCity: body.dropoffCity ?? null,
        parcelDescription: body.parcelDescription ?? null,
        breakdown,
      },
    })
    .select("id, expires_at, total_minor, currency")
    .single();

  if (error || !row) {
    console.error("[logistics-quote] insert failed", error);
    return NextResponse.json(
      { ok: false, error: "persist_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    quote_id: row.id,
    total: breakdown.total,
    total_minor: row.total_minor,
    currency: row.currency,
    expires_at: row.expires_at,
    breakdown,
  });
}
