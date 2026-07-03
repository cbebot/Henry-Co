"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import { getOptionalEnv, normalizeEmail } from "@/lib/env";
import {
  createAdminSupabase,
  hasAdminSupabaseEnv,
  hasPublicSupabaseEnv,
} from "@/lib/supabase";
import { getStudioViewer } from "@/lib/studio/auth";
import { STUDIO_AI_MODEL_LABEL, briefFailureCopy, isRetryableGatewayCode } from "@/lib/studio/ai-runtime";
import { getOrCreateCopilotSessionId } from "@/lib/studio/copilot-session";
import {
  normaliseStructured,
  parseAssistantJson,
  countWords,
  type BriefCopilotStructured,
} from "@/lib/studio/brief-copilot-structured";
import { writeStudioLog } from "@/lib/studio/store";
import type { StudioViewer } from "@/lib/studio/types";

// NOTE: no type re-exports here. A "use server" module may only export async functions — even an
// `export type { … }` CLAUSE makes Turbopack emit a runtime reference that throws
// `ReferenceError … is not defined` at module evaluation, 500-ing EVERY action in this chunk
// (prod incident, digest 793253544). Consumers import BriefCopilotStructured from its true home,
// @/lib/studio/brief-copilot-structured. Inline `export type X = {…}` declarations remain safe.

/**
 * Anti-abuse rules — kept conservative on purpose. These are the
 * standard professional ceilings we tell finance + ops about, sized
 * so a runaway client or a leaked credential can't drain the budget
 * before someone notices.
 *
 * Cost guard rails (each row enforced in order — first that trips
 * blocks the call):
 *   1. Min-word-count + min-length   — defeats keyboard-mash spam
 *   2. Per-session cap (anon)        — 5 generations per session cookie
 *   3. Per-account cap (authed)      — 20 generations per 24h
 *   4. Per-IP backstop               — 10 generations per IP per 24h
 *                                       (defeats cookie-clear bypass)
 *   5. System-wide ceiling           — 500 successful calls per 24h
 *                                       (final brake against runaway)
 *   6. Duplicate-input dedup         — same SHA-256 input_hash from
 *                                       same identity within 24h →
 *                                       returns the cached structured
 *                                       output, no model call billed
 */
const ANON_LIMIT_PER_SESSION = 5;
const AUTH_LIMIT_PER_DAY = 20;
const IP_LIMIT_PER_DAY = 10;
const SYSTEM_LIMIT_PER_DAY = 500;
const MAX_INPUT_LENGTH = 1600;
const MIN_INPUT_LENGTH = 30;
const MIN_WORD_COUNT = 8;
const DEDUP_WINDOW_SECONDS = 60 * 60 * 24;
const COPILOT_INTENT = "studio_brief";

const ANONYMOUS_VIEWER: StudioViewer = {
  user: null,
  normalizedEmail: null,
  roles: [],
};

export type BriefCopilotResult =
  | {
      ok: true;
      structured: BriefCopilotStructured;
      meta: {
        modelUsed: string;
        durationMs: number;
        confidence: number;
        cached: boolean;
        callsRemaining: number | null;
      };
    }
  | {
      ok: false;
      reason:
        | "input_too_short"
        | "input_too_long"
        | "rate_limited"
        | "model_unavailable"
        | "model_error"
        | "invalid_response"
        | "server_error";
      message: string;
      callsRemaining?: number | null;
    };

// Salted SHA-256. Salt comes from BRIEF_COPILOT_HASH_SALT (server-only)
// so a leaked database can't be reverse-resolved to raw IPs or inputs.
// Falls back to a deterministic compile-time string in dev so the dedup
// path still works without setup; rotate once we know production runs
// with the salt set.
const COPILOT_HASH_SALT_FALLBACK = "henryco_studio_copilot_v1";
function copilotHash(input: string): string {
  const salt = getOptionalEnv("BRIEF_COPILOT_HASH_SALT") || COPILOT_HASH_SALT_FALLBACK;
  return createHash("sha256").update(`${salt}::${input}`).digest("hex");
}

async function resolveRequestIp(): Promise<string | null> {
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

async function getCopilotViewer(): Promise<StudioViewer> {
  if (!hasPublicSupabaseEnv()) {
    return ANONYMOUS_VIEWER;
  }

  try {
    return await getStudioViewer();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Studio auth lookup failed";
    console.error("[studio][brief-copilot] auth lookup skipped", {
      reason: message.slice(0, 180),
    });
    return ANONYMOUS_VIEWER;
  }
}

async function countRecentDrafts(input: {
  userId: string | null;
  email: string | null;
  sessionId: string;
  windowSeconds: number;
}): Promise<number> {
  if (!hasAdminSupabaseEnv()) return 0;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - input.windowSeconds * 1000).toISOString();

  const filter = input.userId
    ? `user_id.eq.${input.userId}`
    : input.email
      ? `normalized_email.eq.${input.email}`
      : `session_id.eq.${input.sessionId}`;

  try {
    const { count, error } = await admin
      .from("studio_brief_drafts")
      .select("id", { count: "exact", head: true })
      // Intent-scoped: the coach chat lane accounts on the same table
      // (intent "studio_brief_chat") — its turns must never eat into the
      // one-shot generation allowance. Historical rows are all this
      // intent, so the filter is a no-op for existing data.
      .eq("intent", COPILOT_INTENT)
      .or(filter)
      .gte("created_at", since)
      .neq("status", "rate_limited");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countByIpHash(ipHash: string, windowSeconds: number): Promise<number> {
  if (!hasAdminSupabaseEnv() || !ipHash) return 0;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await admin
      .from("studio_brief_drafts")
      .select("id", { count: "exact", head: true })
      .eq("intent", COPILOT_INTENT)
      .eq("ip_hash", ipHash)
      .gte("created_at", since)
      .neq("status", "rate_limited");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countSystemWide(windowSeconds: number): Promise<number> {
  if (!hasAdminSupabaseEnv()) return 0;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  try {
    const { count, error } = await admin
      .from("studio_brief_drafts")
      .select("id", { count: "exact", head: true })
      .eq("intent", COPILOT_INTENT)
      .eq("status", "completed")
      .gte("created_at", since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function findCachedDraft(input: {
  inputHash: string;
  userId: string | null;
  email: string | null;
  sessionId: string;
  windowSeconds: number;
}): Promise<BriefCopilotStructured | null> {
  if (!hasAdminSupabaseEnv() || !input.inputHash) return null;
  const admin = createAdminSupabase();
  const since = new Date(Date.now() - input.windowSeconds * 1000).toISOString();

  const identityFilter = input.userId
    ? `user_id.eq.${input.userId}`
    : input.email
      ? `normalized_email.eq.${input.email}`
      : `session_id.eq.${input.sessionId}`;

  try {
    const { data, error } = await admin
      .from("studio_brief_drafts")
      .select("structured_output")
      .eq("input_hash", input.inputHash)
      .eq("status", "completed")
      .or(identityFilter)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ structured_output: unknown }>();
    if (error || !data) return null;
    return normaliseStructured(data.structured_output);
  } catch {
    return null;
  }
}

/**
 * Records a studio_brief_drafts row for anti-abuse accounting + the dedup cache.
 *
 * Opacity: the provider/model is NEVER named in a row. The governed gateway owns redacted usage
 * telemetry (tokens, cost), so studio persists ONLY the brand-opaque label + its own accounting
 * fields — no provider token counts. (The table's historical `model_used` default is a concrete
 * model id; we always write the opaque label explicitly so that default is never reached.)
 */
async function recordDraftRow(row: {
  userId: string | null;
  email: string | null;
  sessionId: string;
  ipHash: string | null;
  inputHash: string;
  description: string;
  structuredOutput: Record<string, unknown>;
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
      user_id: row.userId,
      normalized_email: row.email,
      session_id: row.sessionId,
      ip_hash: row.ipHash,
      input_hash: row.inputHash,
      intent: COPILOT_INTENT,
      raw_input: row.description,
      structured_output: row.structuredOutput,
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

export async function generateStudioBriefDraftAction(
  formData: FormData
): Promise<BriefCopilotResult> {
  const description = String(formData.get("description") || "").trim();

  if (description.length < MIN_INPUT_LENGTH) {
    return {
      ok: false,
      reason: "input_too_short",
      message: `Add a bit more detail — at least ${MIN_INPUT_LENGTH} characters helps the co-pilot match the right scope.`,
    };
  }

  if (description.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      reason: "input_too_long",
      message: `Keep it under ${MAX_INPUT_LENGTH} characters. The co-pilot does best with a focused paragraph.`,
    };
  }

  if (countWords(description) < MIN_WORD_COUNT) {
    return {
      ok: false,
      reason: "input_too_short",
      message: `Use at least ${MIN_WORD_COUNT} words so the co-pilot can map your project to the right scope.`,
    };
  }

  const viewer = await getCopilotViewer();
  const sessionId = await getOrCreateCopilotSessionId();
  const userId = viewer.user?.id ?? null;
  const email = viewer.normalizedEmail || normalizeEmail(viewer.user?.email);
  const rawIp = await resolveRequestIp();
  const ipHash = rawIp ? copilotHash(`ip:${rawIp}`) : null;
  const inputHash = copilotHash(`brief:${description.toLowerCase().replace(/\s+/g, " ")}`);

  const isAuthenticated = Boolean(userId);
  const limit = isAuthenticated ? AUTH_LIMIT_PER_DAY : ANON_LIMIT_PER_SESSION;
  const identityWindow = isAuthenticated ? 60 * 60 * 24 : 60 * 60 * 24 * 7;
  const ipWindow = 60 * 60 * 24;
  const systemWindow = 60 * 60 * 24;

  // Identity-based cap (session for anon, account for authed) — runs in
  // parallel with the IP backstop, system ceiling, and dedup lookup so
  // a single round-trip enforces all four guards.
  const [usedCount, ipCount, systemCount, cachedDraft] = await Promise.all([
    countRecentDrafts({ userId, email, sessionId, windowSeconds: identityWindow }),
    ipHash ? countByIpHash(ipHash, ipWindow) : Promise.resolve(0),
    countSystemWide(systemWindow),
    findCachedDraft({
      inputHash,
      userId,
      email,
      sessionId,
      windowSeconds: DEDUP_WINDOW_SECONDS,
    }),
  ]);

  // ── DEDUP — answered already in the last 24h, return the cached
  // structured output without billing the model. This is the cheapest
  // path so it runs before the rate-limit refusals.
  if (cachedDraft) {
    await writeStudioLog({
      eventType: "studio_brief_copilot_dedup_hit",
      route: "/request",
      success: true,
      meta: { userId, email, role: isAuthenticated ? "client" : "anon" },
      details: { input_hash: inputHash.slice(0, 12), confidence: cachedDraft.confidence },
    });
    return {
      ok: true,
      structured: cachedDraft,
      meta: {
        modelUsed: STUDIO_AI_MODEL_LABEL,
        durationMs: 0,
        confidence: cachedDraft.confidence,
        cached: true,
        callsRemaining: Math.max(0, limit - usedCount),
      },
    };
  }

  const tripped =
    usedCount >= limit
      ? "identity"
      : ipHash && ipCount >= IP_LIMIT_PER_DAY
        ? "ip"
        : systemCount >= SYSTEM_LIMIT_PER_DAY
          ? "system"
          : null;

  if (tripped) {
    await recordDraftRow({
      userId,
      email,
      sessionId,
      ipHash,
      inputHash,
      description,
      structuredOutput: {},
      status: "rate_limited",
      errorReason: `limit_exceeded:${tripped}:${limit}`,
    });
    const message =
      tripped === "system"
        ? "The co-pilot has hit today's safety ceiling. Studio is paused while staff review usage — please fill the brief manually below; we read every submission."
        : tripped === "ip"
          ? "Too many co-pilot drafts from this network today. Try again tomorrow, or fill the brief manually below — Studio reads every brief."
          : isAuthenticated
            ? `You've hit the daily co-pilot limit (${AUTH_LIMIT_PER_DAY}/day). It resets at midnight Lagos time.`
            : `You've used all ${ANON_LIMIT_PER_SESSION} free co-pilot generations for this session. Sign in for a higher limit, or fill the brief manually below.`;
    return {
      ok: false,
      reason: "rate_limited",
      message,
      callsRemaining: 0,
    };
  }

  const start = Date.now();
  const attempt = async (): Promise<Awaited<ReturnType<typeof runAiTask>>> => {
    try {
      return await runAiTask(
        {
          surface: "studio.brief.staff",
          // Public funnel (prospective clients, pre-signup): a stable synthetic actor keyed off the
          // session so the gateway's "no anonymous AI" gate never refuses this FREE draft. Studio's
          // 6-layer anti-abuse above is the real guard.
          actorId: userId ?? `studio-brief:${sessionId}`,
          input: { description },
          idempotencyKey: randomUUID(),
        },
        { billing: noBillingPort },
      );
    } catch (error) {
      // Defence in depth — the gateway's contract is to never throw; if it somehow does, the
      // person gets honest copy below, not a crash. Error name only (no provider/model).
      console.error("[studio][brief-copilot] gateway threw", {
        name: error instanceof Error ? error.name : "unknown",
      });
      return { ok: false, error: { code: "provider_error", message: "" } };
    }
  };

  // Model-only, by design: NO deterministic stand-in brief (a keyword-guessed draft presented as
  // the co-pilot's work misleads). One transparent retry on transport trouble; every other
  // refusal reports honestly and the person tries again or continues with the manual form.
  let result = await attempt();
  if (!result.ok && isRetryableGatewayCode(result.error.code)) {
    result = await attempt();
  }

  if (!result.ok) {
    // The gateway error code carries no provider/model name — safe to log.
    console.error("[studio][brief-copilot] gateway refusal", {
      code: result.error.code,
      authed: isAuthenticated,
    });
    await recordDraftRow({
      userId,
      email,
      sessionId,
      ipHash,
      inputHash,
      description,
      structuredOutput: {},
      status: "failed",
      errorReason: result.error.code,
      durationMs: Date.now() - start,
    });
    await writeStudioLog({
      eventType: "studio_brief_copilot_failed",
      route: "/request",
      success: false,
      meta: { userId, email, role: isAuthenticated ? "client" : "anon" },
      details: { error: result.error.code },
    });
    const code = result.error.code;
    return {
      ok: false,
      reason: code === "rate_limited" ? "rate_limited" : code === "kill_switch_active" || code === "not_configured" ? "model_unavailable" : "model_error",
      message: briefFailureCopy(code),
      callsRemaining: Math.max(0, limit - usedCount),
    };
  }

  const assistantText = result.value.output.trim();
  const parsed = assistantText ? parseAssistantJson(assistantText) : null;
  const structured = parsed ? normaliseStructured(parsed) : null;
  if (!structured) {
    await recordDraftRow({
      userId,
      email,
      sessionId,
      ipHash,
      inputHash,
      description,
      structuredOutput: { raw_text: assistantText.slice(0, 4000) },
      status: "failed",
      errorReason: "invalid_json",
      durationMs: Date.now() - start,
    });
    return {
      ok: false,
      reason: "invalid_response",
      message: briefFailureCopy("schema_validation_failed"),
      callsRemaining: Math.max(0, limit - usedCount),
    };
  }

  const durationMs = Date.now() - start;
  await recordDraftRow({
    userId,
    email,
    sessionId,
    ipHash,
    inputHash,
    description,
    structuredOutput: structured as unknown as Record<string, unknown>,
    status: "completed",
    durationMs,
  });

  await writeStudioLog({
    eventType: "studio_brief_copilot_success",
    route: "/request",
    success: true,
    meta: { userId, email, role: isAuthenticated ? "client" : "anon" },
    details: {
      duration_ms: durationMs,
      confidence: structured.confidence,
    },
  });

  return {
    ok: true,
    structured,
    meta: {
      modelUsed: STUDIO_AI_MODEL_LABEL,
      durationMs,
      confidence: structured.confidence,
      cached: false,
      callsRemaining: Math.max(0, limit - (usedCount + 1)),
    },
  };
}
