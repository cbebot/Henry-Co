"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
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
const ANON_LIMIT_PER_SESSION = 5;
const AUTH_LIMIT_PER_DAY = 20;
const MAX_INPUT_LENGTH = 1600;
const MIN_INPUT_LENGTH = 30;

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

export async function generateStudioBriefDraftAction(formData: FormData): Promise<BriefCopilotResult> {
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

  const isAuthenticated = Boolean(userId);
  const limit = isAuthenticated ? AUTH_LIMIT_PER_DAY : ANON_LIMIT_PER_SESSION;
  const windowSeconds = isAuthenticated ? 60 * 60 * 24 : 60 * 60 * 24 * 7;

  const usedCount = await countRecentDrafts({
    userId,
    email,
    sessionId,
    windowSeconds,
  });

  if (usedCount >= limit) {
    if (hasAdminSupabaseEnv()) {
      const admin = createAdminSupabase();
      await admin
        .from("studio_brief_drafts")
        .insert({
          id: randomUUID(),
          user_id: userId,
          normalized_email: email,
          session_id: sessionId,
          raw_input: description,
          structured_output: {},
          model_used: BRIEF_COPILOT_MODEL,
          status: "rate_limited",
          error_reason: `limit_exceeded:${limit}`,
        } as never)
        .then(
          () => undefined,
          () => undefined
        );
    }
    return {
      ok: false,
      reason: "rate_limited",
      message: isAuthenticated
        ? `You've hit the daily co-pilot limit (${AUTH_LIMIT_PER_DAY}/day). It resets at midnight Lagos time.`
        : `You've used all ${ANON_LIMIT_PER_SESSION} free co-pilot generations for this session. Sign in for a higher limit, or fill the brief manually below.`,
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
