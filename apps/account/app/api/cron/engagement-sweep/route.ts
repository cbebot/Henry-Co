/**
 * V2-CART-01 — Engagement sweep cron.
 *
 * Runs hourly. Three jobs:
 *   1. saved_items_sweep_expiry()       — DB function emits warnings + expires
 *   2. cart_abandoned                   — items in marketplace_cart_items > 3d
 *   3. kyc_incomplete_after_signup      — accounts created 3+ days ago, no KYC
 *
 * The route is idempotent — events dedupe per (user, type, dedupe_key, day)
 * via partial unique index so re-running within a day is a no-op.
 *
 * NO email worker is wired here. The events are produced; a future
 * marketing-automation pass consumes them.
 */

import { NextResponse } from "next/server";
import { emitEngagementEvent } from "@henryco/cart-saved-items/server";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = String(process.env.CRON_SECRET || "").trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const summary = {
    saved_warned: 0,
    saved_expired: 0,
    cart_abandoned: 0,
    kyc_incomplete: 0,
    errors: [] as string[],
  };

  // 1) saved_items expiry sweep — DB function handles both warnings and expiry.
  try {
    const { data } = await admin.rpc("saved_items_sweep_expiry");
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      summary.saved_expired = Number((row as { expired_count?: number }).expired_count ?? 0);
      summary.saved_warned = Number((row as { warned_count?: number }).warned_count ?? 0);
    }
  } catch (error) {
    summary.errors.push(
      `saved_items_sweep_expiry: ${error instanceof Error ? error.message : "unknown"}`
    );
  }

  // 2) cart_abandoned — marketplace_cart_items older than 3 days, with cart in
  //    'active' status. Look up cart owner via marketplace_carts and emit per-user.
  try {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await admin
      .from("marketplace_cart_items")
      .select("cart_id, updated_at")
      .lt("updated_at", cutoff)
      .limit(500);

    const cartIds = Array.from(
      new Set(((data ?? []) as Array<{ cart_id: string }>).map((row) => row.cart_id))
    );
    if (cartIds.length > 0) {
      const { data: carts } = await admin
        .from("marketplace_carts")
        .select("id, user_id")
        .in("id", cartIds)
        .eq("status", "active");

      const userIds = new Set<string>();
      for (const cart of (carts ?? []) as Array<{ id: string; user_id: string | null }>) {
        if (cart.user_id) userIds.add(String(cart.user_id));
      }

      for (const userId of userIds) {
        const result = await emitEngagementEvent(admin, {
          userId,
          eventType: "cart_abandoned",
          division: "marketplace",
          subjectType: "cart",
          subjectId: userId,
          dedupeKey: `cart_abandoned:${userId}:${new Date().toISOString().slice(0, 10)}`,
          payload: { abandonedSince: cutoff },
        });
        if (result.ok && !result.deduped) summary.cart_abandoned += 1;
      }
    }
  } catch (error) {
    summary.errors.push(
      `cart_abandoned: ${error instanceof Error ? error.message : "unknown"}`
    );
  }

  // 3) kyc_incomplete_after_signup — accounts older than 3 days where the user's
  //    KYC profile has no verified address. Heuristic: customer_profiles row
  //    exists with kyc_completed_at = null.
  try {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: profiles } = await admin
      .from("customer_profiles")
      .select("id, created_at, kyc_completed_at")
      .lt("created_at", cutoff)
      .is("kyc_completed_at", null)
      .limit(500);

    for (const row of (profiles ?? []) as Array<{ id: string }>) {
      const result = await emitEngagementEvent(admin, {
        userId: row.id,
        eventType: "kyc_incomplete_after_signup",
        division: null,
        subjectType: "kyc",
        subjectId: row.id,
        dedupeKey: `kyc_incomplete:${row.id}`,
        payload: {},
      });
      if (result.ok && !result.deduped) summary.kyc_incomplete += 1;
    }
  } catch (error) {
    summary.errors.push(
      `kyc_incomplete_after_signup: ${error instanceof Error ? error.message : "unknown"}`
    );
  }

  return NextResponse.json({
    ok: summary.errors.length === 0,
    summary,
    executedAt: new Date().toISOString(),
  });
}
