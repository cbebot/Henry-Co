import { NextResponse } from "next/server";
import {
  createAvailabilityRateLimiter,
  handleAvailabilityRequest,
  isFlagEnabled,
  parseHenryFeatureFlags,
  resolveViewerLocation,
  type AvailabilityHandlerDeps,
  type AvailabilityLocation,
  type ServiceAreaCoverageRow,
} from "@henryco/intelligence";
import { emitEvent, type HenryEventName } from "@henryco/observability";
import { extractClientIp } from "@/lib/support/contact-rate-limit";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3-38 — care `/api/availability` (the shared handler's care host).
 *
 * Thin wrapper: parses nothing itself — `handleAvailabilityRequest` owns
 * validation and the invariants (flag-dark, viewer identity never
 * caller-supplied, emit-only resolution, opaque body). This file only builds
 * the injected deps:
 *   - coverage  — public-read `service_area_coverage` rows for care, via the
 *                 session server client (RLS public SELECT). Error => null =>
 *                 the engine resolves `unknown` (renders nothing). The table
 *                 is committed-not-applied until the owner runs the migration,
 *                 so this read is best-effort BY DESIGN.
 *   - location  — the viewer's OWN saved address (session client, RLS
 *                 own-row read on `user_addresses` — viewer-scoped by
 *                 construction), else coarse IP geo from the request geo
 *                 headers (country + mapped NG state, never a city, never
 *                 persisted per-user — PRIVACY-NDPR §1).
 *   - recordGap — the SECURITY DEFINER counter via the service-role client;
 *                 best-effort, only for the `unavailable_shown` beacon.
 */

export const runtime = "nodejs";

const limiter = createAvailabilityRateLimiter({ limit: 30, windowMs: 60_000 });

async function loadCareCoverage(): Promise<ServiceAreaCoverageRow[] | null> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("service_area_coverage")
      .select("division, offering_key, country, region, city, provider_count, is_active")
      .eq("division", "care")
      .eq("is_active", true)
      .limit(500);
    if (error || !Array.isArray(data)) return null;
    return data.map((row) => ({
      division: String(row.division),
      offeringKey: String(row.offering_key),
      country: String(row.country),
      region: row.region === null ? null : String(row.region),
      city: row.city === null ? null : String(row.city),
      providerCount: Number(row.provider_count) || 0,
      isActive: Boolean(row.is_active),
    }));
  } catch {
    return null;
  }
}

async function resolveCareViewerLocation(req: Request): Promise<AvailabilityLocation | null> {
  let savedAddress: { country: string | null; state: string | null; city: string | null } | null =
    null;
  try {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user) {
      // Viewer-scoped by construction: the SESSION client reads under RLS
      // own-row policies — there is no caller-supplied user id anywhere.
      const { data, error } = await supabase
        .from("user_addresses")
        .select("country, state, city, is_default")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        savedAddress = {
          country: (data.country as string | null) ?? null,
          state: (data.state as string | null) ?? null,
          city: (data.city as string | null) ?? null,
        };
      }
    }
  } catch {
    savedAddress = null;
  }

  return resolveViewerLocation({
    savedAddress,
    ipGeo: {
      country: req.headers.get("x-vercel-ip-country"),
      region: req.headers.get("x-vercel-ip-country-region"),
    },
  });
}

async function recordCareGap(gap: {
  offeringKey: string;
  country: string;
  region: string | null;
  city: string | null;
}): Promise<void> {
  // Best-effort: the gaps table/fn are committed-not-applied until the owner
  // apply — the handler already swallows a throw here.
  const admin = createAdminSupabase();
  await admin.rpc("record_service_availability_gap", {
    p_division: "care",
    p_offering_key: gap.offeringKey,
    p_country: gap.country,
    p_region: gap.region,
    p_city: gap.city,
  });
}

export async function POST(req: Request) {
  const ip = extractClientIp(req.headers);
  const rate = limiter.check(ip || "unknown");
  if (!rate.allowed) {
    return NextResponse.json(
      { off: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const enabled = isFlagEnabled(
    parseHenryFeatureFlags(process.env as Record<string, string | undefined>),
    "personalization_availability",
  );

  const deps: AvailabilityHandlerDeps = {
    division: "care",
    enabled,
    loadCoverage: loadCareCoverage,
    resolveLocation: () => resolveCareViewerLocation(req),
    emit: (event) => {
      emitEvent({
        name: event.name as HenryEventName,
        classification: event.classification,
        outcome: event.outcome,
        payload: event.payload,
      });
    },
    recordGap: recordCareGap,
  };

  const body = await req.json().catch(() => null);
  const result = await handleAvailabilityRequest(deps, body);
  return NextResponse.json(result.body, { status: result.status });
}
