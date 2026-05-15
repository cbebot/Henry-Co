import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — Salary benchmark lookup (Distinctive Rule #5).
 *
 * GET /api/jobs/salary/[role]/[location]
 *
 * Returns the active p25/p50/p75 benchmark for a role+location, plus the
 * sample size and freshness signal. Both /jobs/[slug] (candidate-side
 * context) and /employer/jobs/new (employer-side reference) consume this.
 *
 * Public read is safe — see jobs_salary_benchmarks RLS ("public read
 * active"). The route accepts `currency` and `period` query parameters
 * to disambiguate when multiple currencies/periods coexist for the same
 * role+location.
 */
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json(
    { error: "invalid_request", message },
    { status: 400 },
  );
}

function notFound(message: string) {
  return NextResponse.json(
    { error: "not_found", message },
    { status: 404 },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ role: string; location: string }> },
) {
  const { role: rawRole, location: rawLocation } = await context.params;
  const role = decodeURIComponent(rawRole || "").trim();
  const location = decodeURIComponent(rawLocation || "").trim();

  if (!role || !location) {
    return badRequest("role and location are required.");
  }

  if (role.length > 120 || location.length > 120) {
    return badRequest("role and location must be 120 characters or fewer.");
  }

  const url = new URL(request.url);
  const currency = (url.searchParams.get("currency") || "NGN").toUpperCase();
  const period = (url.searchParams.get("period") || "YEAR").toUpperCase();

  const validPeriods = new Set(["YEAR", "MONTH", "WEEK", "DAY", "HOUR"]);
  if (!validPeriods.has(period)) {
    return badRequest("period must be one of YEAR, MONTH, WEEK, DAY, HOUR.");
  }

  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("jobs_salary_benchmarks")
      .select(
        "id, role_slug, location, currency, period, p25_minor, p50_minor, p75_minor, sample_size, source_label, sourced_at",
      )
      .eq("status", "active")
      .eq("role_slug", role.toLowerCase())
      .ilike("location", location)
      .eq("currency", currency)
      .eq("period", period)
      .order("sourced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[salary-benchmark] read error:", error.message);
      return NextResponse.json(
        { error: "lookup_failed", message: "Salary benchmark lookup failed." },
        { status: 500 },
      );
    }

    if (!data) {
      return notFound(
        `No active salary benchmark for ${role} in ${location} (${currency}/${period}).`,
      );
    }

    return NextResponse.json(
      {
        benchmark: {
          id: data.id,
          roleSlug: data.role_slug,
          location: data.location,
          currency: data.currency,
          period: data.period,
          p25: Number(data.p25_minor),
          p50: Number(data.p50_minor),
          p75: Number(data.p75_minor),
          sampleSize: Number(data.sample_size),
          sourceLabel: data.source_label,
          sourcedAt: data.sourced_at,
        },
      },
      {
        headers: {
          // Cache for an hour at the edge. Benchmarks turn over slowly.
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[salary-benchmark] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
