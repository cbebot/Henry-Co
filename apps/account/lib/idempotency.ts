import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

function clean(value: string | null) {
  return String(value || "").trim();
}

export async function getIdempotentResponse(input: {
  userId: string;
  routeKey: string;
  request: Request;
}) {
  const key = clean(input.request.headers.get("idempotency-key"));
  if (!key) return null;

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("account_idempotency_keys")
    .select("response_payload")
    .eq("user_id", input.userId)
    .eq("route_key", input.routeKey)
    .eq("idempotency_key", key)
    .maybeSingle<{ response_payload: Record<string, unknown> | null }>();

  return data?.response_payload ?? null;
}

export async function rememberIdempotentResponse(input: {
  userId: string;
  routeKey: string;
  request: Request;
  responsePayload: Record<string, unknown>;
}) {
  const key = clean(input.request.headers.get("idempotency-key"));
  if (!key) return;

  const admin = createAdminSupabase();
  await admin.from("account_idempotency_keys").upsert({
    user_id: input.userId,
    route_key: input.routeKey,
    idempotency_key: key,
    response_payload: input.responsePayload,
    updated_at: new Date().toISOString(),
  } as never);
}

