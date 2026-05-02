/**
 * V2-SEARCH-01 — search index worker.
 *
 * Drains `public.search_index_outbox` and pushes pending operations to
 * Typesense. Designed to be invoked from Vercel Cron at 60s cadence
 * (see apps/hub/vercel.json) or manually via curl with the CRON_SECRET.
 */

import { NextResponse } from "next/server";
import { drainOutbox, ensureCollectionsExist } from "@henryco/search-core";

import { createAdminSupabase } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const provision = ["1", "true", "yes"].includes(
    String(url.searchParams.get("provision") ?? "").trim().toLowerCase(),
  );

  try {
    const supabase = createAdminSupabase();

    if (provision) {
      const provisioned = await ensureCollectionsExist({});
      return NextResponse.json({ ok: true, provisioned });
    }

    const result = await drainOutbox({ supabase });

    // Opportunistic prune of completed rows older than 7 days.
    await supabase.rpc("purge_completed_search_outbox", {
      p_older_than: "7 days",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search worker failed.",
      },
      { status: 500 },
    );
  }
}
