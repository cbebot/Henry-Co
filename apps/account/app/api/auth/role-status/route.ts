import { NextResponse } from "next/server";
import { isRecoverableSupabaseAuthError } from "@henryco/config";
import { emitEvent } from "@henryco/observability/events";
import { readAccessSnapshot } from "@henryco/auth/server";
import { readRoleStatuses } from "@henryco/auth/server/role-status";
import { checkAncillaryRate } from "@henryco/auth/server/sensitive-action-rate-limit";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * V3-02 S3 — per-role status badge endpoint.
 *
 * Returns the requester's OWN role-status entries (Addendum A9):
 * never reveals another user's data even if the requester is staff
 * or owner. The Supabase admin client is used only to read the
 * unread / pending counts — `userId` is taken from the verified
 * session so client-supplied params cannot escalate scope.
 *
 * Rate-limited at 10 req/min/user via the ancillary rate limiter
 * (Upstash when configured, in-memory fallback in dev).
 *
 * 401 when no session is present.
 * 429 when over the per-user limit.
 * 200 with `{ roles: RoleStatus[] }` on success.
 */

export const dynamic = "force-dynamic";

const ENDPOINT_KEY = "auth.role-status";
const ROLE_STATUS_WINDOW_MS = 60 * 1000;
const ROLE_STATUS_LIMIT = 10;

export async function GET() {
  const supabase = await createSupabaseServer();
  let userId: string | null = null;
  let email: string | null = null;
  let appMetadata: Record<string, unknown> | undefined;
  let userMetadata: Record<string, unknown> | undefined;

  try {
    const auth = await supabase.auth.getUser();
    const user = auth.data.user;
    if (user) {
      userId = user.id;
      email = user.email ?? null;
      appMetadata = (user.app_metadata as Record<string, unknown>) ?? undefined;
      userMetadata = (user.user_metadata as Record<string, unknown>) ?? undefined;
    }
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) throw error;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const rate = await checkAncillaryRate({
    key: ENDPOINT_KEY,
    subject: userId,
    windowMs: ROLE_STATUS_WINDOW_MS,
    limit: ROLE_STATUS_LIMIT,
  });
  if (!rate.ok) {
    const response = NextResponse.json(
      {
        error: "Too many requests. Please slow down.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  const access = await readAccessSnapshot({
    id: userId,
    email,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  });

  const roles = await readRoleStatuses({
    access,
    userId,
    admin: createAdminSupabase(),
  });

  emitEvent({
    name: "henry.auth.role_chooser.viewed",
    classification: "user_action",
    outcome: "completed",
    actorId: userId,
    payload: {
      roleCount: roles.length,
      hasOwner: access.hasOwnerAccess,
      hasStaff: access.hasStaffAccess,
    },
  });

  return NextResponse.json({ roles });
}
