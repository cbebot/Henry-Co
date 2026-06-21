import "server-only";

import { resolveActingContextForUser, type ActingContext } from "@henryco/auth/server/acting-context";
import type { AuditLogSupabaseClient } from "@henryco/observability/audit-log";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * The jobs admin client is created untyped (no `<Database>` generic), so its
 * `.rpc()` returns a PostgrestFilterBuilder rather than a strict Promise — which
 * is awaitable at runtime but not structurally a Promise. writeAuditLog only
 * needs the narrow `rpc("add_audit_log_v2", …)` surface, so we adapt the client
 * to AuditLogSupabaseClient here (single localized cast).
 */
export function hiringAuditClient(): AuditLogSupabaseClient {
  return createAdminSupabase() as unknown as AuditLogSupabaseClient;
}

/**
 * V3-70 — resolve the acting context for an employer/hiring route.
 *
 * The jobs app authenticates through the SSR session (not the `x-supabase-user`
 * middleware header), so we resolve the user via the SSR client and hand the id
 * to resolveActingContextForUser — which performs the SAME signed-cookie
 * verification + live `business_members` role re-check (fail-closed to personal).
 *
 * Every employer/hiring mutation requires a BUSINESS context; a personal context
 * is rejected with 403 at the route. The acting-context cookie carries intent,
 * never authority — the owning-business check is still re-done per resource (the
 * pipeline must belong to ctx.businessId) and the bulk-move RPC re-validates
 * membership server-side.
 */
export async function resolveHiringActingContext(): Promise<ActingContext> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "personal", userId: "" };
  return resolveActingContextForUser(user.id);
}
