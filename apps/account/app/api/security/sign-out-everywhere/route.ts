import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { emitEvent } from "@henryco/observability/events";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { clearReauthCookieOnJar } from "@henryco/auth/server/reauth-cookie";
import { checkAncillaryRate } from "@henryco/auth/server/sensitive-action-rate-limit";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";

/**
 * V3-02 S7 — Sign-out-everywhere endpoint.
 *
 * Per Addendum A7, the sequence is:
 *
 *   1. Verify session.
 *   2. Apply per-user rate limit (3 calls / minute — this is an
 *      expensive action that should not be rapid-fire).
 *   3. Publish a soft broadcast on Supabase Realtime
 *      `user:<id>:session` so OTHER devices receive the signal and
 *      can show "Your session was ended from another device" plus
 *      preserve their in-flight V3-01 drafts.
 *   4. 200ms grace so peer listeners receive the broadcast before
 *      tokens invalidate.
 *   5. supabase.auth.signOut({ scope: 'global' }) — invalidates all
 *      refresh tokens for the user.
 *   6. Clear local hc_last_reauth + audit log.
 *
 * The client (GlobalSignOutCard) follows up with logoutEverywhere()
 * to tear down THIS device's storage + cookies. The endpoint
 * returns 200 with `{ ok: true }` so the client knows to proceed.
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const REALTIME_GRACE_MS = 200;

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const rate = await checkAncillaryRate({
    key: "security.sign-out-everywhere",
    subject: user.id,
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
  });
  if (!rate.ok) {
    const response = NextResponse.json(
      {
        error: "Too many sign-out-everywhere attempts. Please wait.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  const headerStore = await headers();
  const context = await detectSecurityRequestContext();

  // Step 3: broadcast first so peer devices know the session is
  // about to drop. Uses the service-role client so the broadcast
  // does not require the user-scoped Realtime auth dance.
  await broadcastSessionTermination(user.id);

  // Step 4: tiny grace window so peers receive the broadcast.
  await new Promise<void>((resolve) => setTimeout(resolve, REALTIME_GRACE_MS));

  // Step 5: invalidate every refresh token.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });

  // Step 6: clean up local state + audit + telemetry. We do these
  // even on signOut failure so the audit trail reflects the intent
  // — a failed global signOut is a security signal we want visible.
  try {
    await clearReauthCookieOnJar();
  } catch {
    // session cookie context can be read-only in some Next routings;
    // not fatal — the next sensitive action will challenge anyway.
  }
  await logSecurityEvent({
    userId: user.id,
    eventType: "account_sign_out",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    locationSummary: context.locationSummary,
    metadata: {
      source: "security.sign_out_everywhere",
      scope: "global",
      outcome: signOutError ? "failed" : "ok",
    },
  });

  try {
    const admin = createAdminSupabase() as unknown as Parameters<typeof writeAuditLog>[0];
    await writeAuditLog(admin, {
      action: "sensitive_action.sign_out_everywhere",
      entityType: "user_session",
      entityId: user.id,
      newValues: {
        ip: context.ipAddress,
        ua: context.userAgent,
        ok: !signOutError,
      },
    });
  } catch {
    // audit-log RPC missing in dev → ignore.
  }

  emitEvent({
    name: "henry.auth.logout.everywhere",
    classification: "user_action",
    outcome: signOutError ? "failed" : "completed",
    actorId: user.id,
    payload: {
      scope: "global",
      initiatedFrom: "security.page",
      ip: context.ipAddress,
      ua: headerStore.get("user-agent"),
    },
  });

  if (signOutError) {
    return NextResponse.json(
      { error: "We couldn't end every session. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

async function broadcastSessionTermination(userId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  try {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    const channel = admin.channel(`user:${userId}:session`, {
      config: { broadcast: { self: false, ack: false } },
    });
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => resolve(), 1500);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        }
      });
    });
    await channel.send({
      type: "broadcast",
      event: "sign-out-everywhere",
      payload: {
        type: "sign-out-everywhere",
        initiatedAt: Date.now(),
      },
    });
    await admin.removeChannel(channel);
  } catch {
    // Realtime is best-effort — if the broadcast fails, the
    // forced signOut still drops the tokens. Peer devices simply
    // get the abrupt "refresh failed" experience instead of the
    // soft notice.
  }
}
