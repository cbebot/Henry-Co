import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { STUDIO_AI_MODEL_LABEL } from "@/lib/studio/ai-runtime";

/**
 * Shared anti-abuse accounting for the studio brief AI lanes, on the same
 * `studio_brief_drafts` table the one-shot co-pilot already uses — one place
 * for finance/ops to watch. Rows are intent-scoped so the lanes never
 * cross-count:
 *
 *   intent "studio_brief"       — one-shot brief generations (existing)
 *   intent "studio_brief_chat"  — coach chat turns (this module)
 *
 * Chat rows carry NO conversation content — the transcript stays client-side
 * and goes only to the governed gateway (PII-redacted). Accounting rows hold
 * just the salted identity hashes + status, enough to enforce ceilings.
 *
 * Every counter fails OPEN (returns 0) without admin env — same posture as
 * the one-shot: a broken counter must never take the product down; the
 * gateway's own per-actor daily allowance still binds underneath.
 */

export const BRIEF_CHAT_INTENT = "studio_brief_chat";

// Salted SHA-256 (BRIEF_COPILOT_HASH_SALT server-only; deterministic dev
// fallback) — a leaked table can't be reverse-resolved to raw IPs.
const HASH_SALT_FALLBACK = "henryco_studio_copilot_v1";
export function briefUsageHash(input: string): string {
  const salt = getOptionalEnv("BRIEF_COPILOT_HASH_SALT") || HASH_SALT_FALLBACK;
  return createHash("sha256").update(`${salt}::${input}`).digest("hex");
}

export async function resolveRequestIp(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const xff = headerStore.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = headerStore.get("x-real-ip");
    if (real) return real.trim();
    const cf = headerStore.get("cf-connecting-ip");
    if (cf) return cf.trim();
    return null;
  } catch {
    return null;
  }
}

export async function countChatTurnsBySession(
  sessionId: string,
  windowSeconds: number,
): Promise<number> {
  if (!hasAdminSupabaseEnv() || !sessionId) return 0;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await admin
      .from("studio_brief_drafts")
      .select("id", { count: "exact", head: true })
      .eq("intent", BRIEF_CHAT_INTENT)
      .eq("session_id", sessionId)
      .gte("created_at", since)
      .neq("status", "rate_limited");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countChatTurnsByIpHash(
  ipHash: string,
  windowSeconds: number,
): Promise<number> {
  if (!hasAdminSupabaseEnv() || !ipHash) return 0;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await admin
      .from("studio_brief_drafts")
      .select("id", { count: "exact", head: true })
      .eq("intent", BRIEF_CHAT_INTENT)
      .eq("ip_hash", ipHash)
      .gte("created_at", since)
      .neq("status", "rate_limited");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countChatTurnsSystemWide(windowSeconds: number): Promise<number> {
  if (!hasAdminSupabaseEnv()) return 0;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await admin
      .from("studio_brief_drafts")
      .select("id", { count: "exact", head: true })
      .eq("intent", BRIEF_CHAT_INTENT)
      .eq("status", "completed")
      .gte("created_at", since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fire-and-forget accounting row for one coach turn. No transcript content —
 * `raw_input` stays empty by design; `input_hash` is the salted hash of the
 * last user message (dedup/abuse analytics without storing words).
 */
export async function recordChatTurnRow(row: {
  sessionId: string;
  ipHash: string | null;
  lastUserMessage: string;
  status: "completed" | "failed" | "rate_limited";
  errorReason?: string;
  durationMs?: number;
}): Promise<void> {
  if (!hasAdminSupabaseEnv()) return;
  const admin = createAdminSupabase();
  await admin
    .from("studio_brief_drafts")
    .insert({
      id: randomUUID(),
      user_id: null,
      normalized_email: null,
      session_id: row.sessionId,
      ip_hash: row.ipHash,
      input_hash: briefUsageHash(row.lastUserMessage),
      intent: BRIEF_CHAT_INTENT,
      raw_input: "",
      structured_output: {},
      model_used: STUDIO_AI_MODEL_LABEL,
      status: row.status,
      ...(row.errorReason ? { error_reason: row.errorReason } : {}),
      ...(row.durationMs != null ? { duration_ms: row.durationMs } : {}),
    } as never)
    .then(
      () => undefined,
      () => undefined,
    );
}
