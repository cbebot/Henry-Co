/**
 * V2-SEARCH-01 + SEARCH-01 — account-app search API.
 *
 * Identical contract to apps/hub/api/search; resolves the requesting
 * user via the account app's Supabase server helpers (which run inside
 * the same shared cookie domain as the hub).
 *
 * SEARCH-01 hardening: mirror the hub-route H8 defensive 500 wrap so
 * any unexpected throw (rate-limit store outage, role-resolution
 * throw, schema drift) degrades to an empty 200 response rather than
 * surfacing a 500 to the palette.
 */

import { NextResponse } from "next/server";
import { searchAcrossDivisions, type SearchInput } from "@henryco/search-core";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDivisions(raw: string | null): SearchInput["divisions_filter"] {
  if (!raw) return undefined;
  const valid = new Set([
    "hub",
    "account",
    "care",
    "marketplace",
    "jobs",
    "learn",
    "logistics",
    "property",
    "studio",
    "staff",
  ]);
  const items = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => valid.has(s)) as NonNullable<SearchInput["divisions_filter"]>;
  return items.length > 0 ? items : undefined;
}

function emptySearchResponse(query: string) {
  return {
    query,
    hits: [],
    took_ms: 0,
    next_cursor: null as string | null,
    total: 0,
    facets: {} as Record<string, number>,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = String(url.searchParams.get("q") ?? "").trim();
  const limitRaw = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 20;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const divisions_filter = parseDivisions(url.searchParams.get("division"));

  let user_id: string | undefined;
  try {
    const userClient = await createSupabaseServer();
    const { data } = await userClient.auth.getUser();
    user_id = data.user?.id ?? undefined;
  } catch {
    user_id = undefined;
  }

  const adminClient = (() => {
    try {
      return createAdminSupabase();
    } catch {
      return null;
    }
  })();

  let result;
  try {
    result = await searchAcrossDivisions(
      {
        query,
        user_id,
        limit,
        cursor: cursor || undefined,
        divisions_filter,
      },
      {
        supabase: adminClient,
        context: user_id ? "account" : "public",
        rateLimitIdentityKey: user_id ?? deriveAnonKey(request),
      },
    );
  } catch (error) {
    console.warn("[account:/api/search] degraded to empty on unexpected error", error);
    result = emptySearchResponse(query);
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

function deriveAnonKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}
