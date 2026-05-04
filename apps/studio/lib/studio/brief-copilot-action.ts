"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { getOptionalEnv, normalizeEmail } from "@/lib/env";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { getStudioViewer } from "@/lib/studio/auth";
import {
  BRIEF_COPILOT_MODEL,
  BRIEF_COPILOT_SYSTEM_PROMPT,
} from "@/lib/studio/brief-copilot-prompt";
import { writeStudioLog } from "@/lib/studio/store";

const SESSION_COOKIE = "studio_copilot_session";

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

export type BriefCopilotStructured = {
  projectType: string;
  platformPreference: string;
  designDirection: string;
  preferredLanguage: string;
  frameworkPreference: string;
  backendPreference: string;
  hostingPreference: string;
  pageRequirements: string[];
  requiredFeatures: string[];
  addonServices: string[];
  techPreferences: string[];
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  goals: string;
  scopeNotes: string;
  summary: string;
  confidence: number;
  uncertainties: string[];
};

function clampString(value: unknown, maxLength = 200, fallback = ""): string {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

function clampArray(value: unknown, max = 8, itemMax = 80): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clampString(item, itemMax, ""))
    .filter((item) => item.length > 0)
    .slice(0, max);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function normaliseStructured(raw: unknown): BriefCopilotStructured | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  return {
    projectType: clampString(r.projectType, 80, "Custom website"),
    platformPreference: clampString(r.platformPreference, 80, "Best-fit recommendation"),
    designDirection: clampString(r.designDirection, 200, "Quiet luxury and high-trust"),
    preferredLanguage: clampString(r.preferredLanguage, 40, "English"),
    frameworkPreference: clampString(
      r.frameworkPreference,
      80,
      "HenryCo's framework recommendation"
    ),
    backendPreference: clampString(
      r.backendPreference,
      80,
      "HenryCo recommends the backend"
    ),
    hostingPreference: clampString(r.hostingPreference, 80, "HenryCo recommends the host"),
    pageRequirements: clampArray(r.pageRequirements, 12, 60),
    requiredFeatures: clampArray(r.requiredFeatures, 10, 80),
    addonServices: clampArray(r.addonServices, 5, 60),
    techPreferences: clampArray(r.techPreferences, 8, 60),
    businessType: clampString(r.businessType, 60, "Not specified"),
    budgetBand: clampString(r.budgetBand, 40, "Not sure yet"),
    urgency: clampString(r.urgency, 60, "No fixed deadline"),
    timeline: clampString(r.timeline, 80, "To be confirmed"),
    goals: clampString(r.goals, 600, ""),
    scopeNotes: clampString(r.scopeNotes, 1000, ""),
    summary: clampString(r.summary, 240, ""),
    confidence: clampNumber(r.confidence, 0, 1, 0.5),
    uncertainties: clampArray(r.uncertainties, 4, 140),
  };
}

function parseAssistantJson(text: string): unknown {
  const trimmed = text.trim();
  // Anthropic Haiku 4.5 in JSON mode usually returns clean JSON; strip a
  // possible code-fence just in case.
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(fenced);
  } catch {
    // Find the first {…} block as a last-ditch fallback.
    const start = fenced.indexOf("{");
    const end = fenced.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return null;
    try {
      return JSON.parse(fenced.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

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

async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value?.trim();
  if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  const fresh = randomBytes(18).toString("base64url");
  store.set(SESSION_COOKIE, fresh, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return fresh;
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

  const apiKey = getOptionalEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return {
      ok: false,
      reason: "model_unavailable",
      message: "The co-pilot is not configured for this environment yet.",
    };
  }

  const viewer = await getStudioViewer();
  const sessionId = await getOrCreateSessionId();
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
        modelUsed: BRIEF_COPILOT_MODEL,
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
    if (hasAdminSupabaseEnv()) {
      const admin = createAdminSupabase();
      await admin
        .from("studio_brief_drafts")
        .insert({
          id: randomUUID(),
          user_id: userId,
          normalized_email: email,
          session_id: sessionId,
          ip_hash: ipHash,
          input_hash: inputHash,
          intent: COPILOT_INTENT,
          raw_input: description,
          structured_output: {},
          model_used: BRIEF_COPILOT_MODEL,
          status: "rate_limited",
          error_reason: `limit_exceeded:${tripped}:${limit}`,
        } as never)
        .then(
          () => undefined,
          () => undefined
        );
    }
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
  let assistantText = "";
  let tokensIn = 0;
  let tokensOut = 0;
  let cacheReadInputTokens = 0;
  let cacheCreationInputTokens = 0;
  let modelUsed = BRIEF_COPILOT_MODEL;

  try {
    const client = new Anthropic({
      apiKey,
      timeout: 30 * 1000,
      maxRetries: 1,
    });

    const response = await client.messages.create({
      model: BRIEF_COPILOT_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: BRIEF_COPILOT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Brief input from prospective Studio client:\n\n"""\n${description}\n"""\n\nReturn the structured JSON now. JSON object only.`,
            },
          ],
        },
      ],
    });

    modelUsed = response.model || BRIEF_COPILOT_MODEL;
    const usage = response.usage as
      | {
          input_tokens?: number;
          output_tokens?: number;
          cache_read_input_tokens?: number;
          cache_creation_input_tokens?: number;
        }
      | undefined;
    tokensIn = Number(usage?.input_tokens ?? 0);
    tokensOut = Number(usage?.output_tokens ?? 0);
    cacheReadInputTokens = Number(usage?.cache_read_input_tokens ?? 0);
    cacheCreationInputTokens = Number(usage?.cache_creation_input_tokens ?? 0);

    const textBlocks = response.content.filter(
      (block): block is Extract<(typeof response.content)[number], { type: "text" }> =>
        block.type === "text"
    );
    assistantText = textBlocks.map((block) => block.text).join("\n").trim();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Co-pilot model call failed";
    if (hasAdminSupabaseEnv()) {
      const admin = createAdminSupabase();
      await admin
        .from("studio_brief_drafts")
        .insert({
          id: randomUUID(),
          user_id: userId,
          normalized_email: email,
          session_id: sessionId,
          ip_hash: ipHash,
          input_hash: inputHash,
          intent: COPILOT_INTENT,
          raw_input: description,
          structured_output: {},
          model_used: BRIEF_COPILOT_MODEL,
          status: "failed",
          error_reason: message.slice(0, 240),
          duration_ms: Date.now() - start,
        } as never)
        .then(
          () => undefined,
          () => undefined
        );
    }
    await writeStudioLog({
      eventType: "studio_brief_copilot_failed",
      route: "/request",
      success: false,
      meta: { userId, email, role: isAuthenticated ? "client" : "anon" },
      details: { error: message.slice(0, 240) },
    });
    return {
      ok: false,
      reason: "model_error",
      message:
        "The co-pilot didn't respond in time. Try again, or fill the brief manually below.",
    };
  }

  if (!assistantText) {
    return {
      ok: false,
      reason: "invalid_response",
      message: "The co-pilot returned an empty response. Try rephrasing your description.",
    };
  }

  const parsed = parseAssistantJson(assistantText);
  const structured = normaliseStructured(parsed);
  if (!structured) {
    if (hasAdminSupabaseEnv()) {
      const admin = createAdminSupabase();
      await admin
        .from("studio_brief_drafts")
        .insert({
          id: randomUUID(),
          user_id: userId,
          normalized_email: email,
          session_id: sessionId,
          ip_hash: ipHash,
          input_hash: inputHash,
          intent: COPILOT_INTENT,
          raw_input: description,
          structured_output: { raw_text: assistantText.slice(0, 4000) },
          model_used: modelUsed,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          cache_read_input_tokens: cacheReadInputTokens,
          cache_creation_input_tokens: cacheCreationInputTokens,
          duration_ms: Date.now() - start,
          status: "failed",
          error_reason: "invalid_json",
        } as never)
        .then(
          () => undefined,
          () => undefined
        );
    }
    return {
      ok: false,
      reason: "invalid_response",
      message:
        "The co-pilot returned something we couldn't parse. Try rephrasing or fill the brief manually below.",
    };
  }

  const durationMs = Date.now() - start;

  if (hasAdminSupabaseEnv()) {
    const admin = createAdminSupabase();
    await admin
      .from("studio_brief_drafts")
      .insert({
        id: randomUUID(),
        user_id: userId,
        normalized_email: email,
        session_id: sessionId,
        ip_hash: ipHash,
        input_hash: inputHash,
        intent: COPILOT_INTENT,
        raw_input: description,
        structured_output: structured as unknown as Record<string, unknown>,
        model_used: modelUsed,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cache_read_input_tokens: cacheReadInputTokens,
        cache_creation_input_tokens: cacheCreationInputTokens,
        duration_ms: durationMs,
        status: "completed",
      } as never)
      .then(
        () => undefined,
        () => undefined
      );
  }

  await writeStudioLog({
    eventType: "studio_brief_copilot_success",
    route: "/request",
    success: true,
    meta: { userId, email, role: isAuthenticated ? "client" : "anon" },
    details: {
      model: modelUsed,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cache_read: cacheReadInputTokens,
      duration_ms: durationMs,
      confidence: structured.confidence,
    },
  });

  return {
    ok: true,
    structured,
    meta: {
      modelUsed,
      durationMs,
      confidence: structured.confidence,
      cached: cacheReadInputTokens > 0,
      callsRemaining: Math.max(0, limit - (usedCount + 1)),
    },
  };
}
