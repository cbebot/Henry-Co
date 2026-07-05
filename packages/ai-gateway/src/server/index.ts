import "server-only";

import { defaultAiUsageRules, type AiUsageRuleSet, type VatRatePolicy, type VatTreatment } from "@henryco/pricing";
import { TAX } from "@henryco/config";
import { isFlagEnabled, parseHenryFeatureFlags } from "@henryco/intelligence";

import type { Result } from "../result";
import { aiError, DEFAULT_AI_ERROR_COPY, type AiGatewayError } from "../errors";
import type { AiTask } from "../contracts";
import type { AiBillingPort } from "../billing-port";
import { runAiTaskWith, type AiTaskDeps, type AiTaskSuccess, type AiUsageSignal } from "../orchestrator";
import { getAiServerConfig, AI_GATEWAY_TIMEOUT_MS } from "./config";
import { createAnthropicAdapter } from "./providers/anthropic";
import { buildPrompt, validateDraftOutput } from "./prompts";
import { createAiTelemetry, type AiTelemetryDeps } from "./telemetry";
import { parseVerdict } from "../verify";
import { parseCoachEnvelope } from "../studio-prompts";
import { parseSupportAssistEnvelope } from "../support-assist";
import { assistantReplyLeaksProvider } from "../doctrine";
import { InMemoryRateLimiter, type AiRateLimitPort } from "../rate-limit";

// A per-instance anti-abuse backstop. For durable cross-instance limits, pass a
// DB/KV-backed AiRateLimitPort via RunAiTaskOptions.rateLimiter.
const defaultRateLimiter = new InMemoryRateLimiter();

export interface RunAiTaskOptions {
  /** The billing port — the app supplies `createPgBillingPort(sql)` over a service-role
   *  Postgres connection (the guarded RPCs are not PostgREST-reachable). */
  billing: AiBillingPort;
  /** The rate card. Defaults to the governed launch baseline. */
  rules?: AiUsageRuleSet;
  /** "standard" collects VAT (default); a non-standard treatment defers it. */
  vatTreatment?: VatTreatment;
  onSignal?: (signal: AiUsageSignal) => void;
  /** V3-33 — durable audit + telemetry. Pass a user-scoped Supabase client and every call
   *  (estimate / settled charge / refusal / provider failure) is emitted, persisted to
   *  henry_events, and (for state changes/refusals) written to the V19 audit log. */
  audit?: { supabase: AiTelemetryDeps["supabase"]; traceId?: string };
  /** Id generator for the FREE-surface receipt; defaults to crypto.randomUUID. */
  newId?: () => string;
  /** Anti-abuse velocity limiter. Defaults to a per-instance in-memory backstop; pass a
   *  durable (DB/KV-backed) AiRateLimitPort for cross-instance enforcement in production. */
  rateLimiter?: AiRateLimitPort;
  /** Env source (defaults to process.env) — the kill switch + model routing read it. */
  env?: NodeJS.ProcessEnv;
}

function emitBlocked(onSignal: (s: AiUsageSignal) => void, surface: AiTask["surface"], code: AiGatewayError["code"]): void {
  onSignal({ kind: "blocked", surface, tier: "standard", billable: true, code });
}

/**
 * The server entry point — the only governed path from any surface to a model provider.
 * Wires the real Anthropic adapter, the guarded `payments_private` billing port, the rate
 * card, VAT (`TAX.vat`), the per-surface prompt builder, and the system-wide kill switch,
 * then runs the pure orchestrator. Returns the model output plus a redacted receipt that
 * names no provider/source and no real model.
 *
 * Launch posture: the `ai_gateway` flag defaults OFF, so this refuses every call (no
 * wallet touch, no provider call) until the company enables it.
 */
export async function runAiTask(task: AiTask, opts: RunAiTaskOptions): Promise<Result<AiTaskSuccess, AiGatewayError>> {
  const env = opts.env ?? process.env;

  // V3-33 — compose durable audit/telemetry with any caller signal. The audit actor is the
  // authenticated id, or null for an anonymous (refused) call.
  const auditActorId = typeof task.actorId === "string" && task.actorId.trim().length > 0 ? task.actorId : null;
  const telemetry = opts.audit ? createAiTelemetry({ supabase: opts.audit.supabase, actorId: auditActorId, traceId: opts.audit.traceId }) : undefined;
  const onSignal = (signal: AiUsageSignal): void => {
    telemetry?.(signal);
    opts.onSignal?.(signal);
  };

  // 1. System-wide kill switch — default OFF. Nothing else runs while paused.
  if (!isFlagEnabled(parseHenryFeatureFlags(env), "ai_gateway")) {
    emitBlocked(onSignal, task.surface, "kill_switch_active");
    return { ok: false, error: aiError("kill_switch_active", DEFAULT_AI_ERROR_COPY.kill_switch_active) };
  }

  // 2. Provider configured? A missing key degrades gracefully (no charge, calm copy).
  const cfg = getAiServerConfig();
  if (!cfg.isConfigured) {
    emitBlocked(onSignal, task.surface, "not_configured");
    return { ok: false, error: aiError("not_configured", DEFAULT_AI_ERROR_COPY.not_configured) };
  }

  // The gateway is a Result-returning contract — it must NEVER throw, because a throw would crash
  // the caller's server action and surface as a generic failure to the user. Any unexpected
  // exception below (adapter init, rate card, prompt build, orchestration) degrades to a typed
  // provider_error the surface maps to its graceful fallback. Defence in depth for every mount.
  try {
    const deps: AiTaskDeps = {
      adapter: createAnthropicAdapter({ apiKey: cfg.apiKey }),
      billing: opts.billing,
      rules: opts.rules ?? defaultAiUsageRules(),
      vatPolicy: TAX.vat satisfies VatRatePolicy,
      vatTreatment: opts.vatTreatment ?? "standard",
      killSwitchEnabled: true, // already checked above
      now: () => new Date(),
      promptBuilder: buildPrompt,
      validateOutput: (raw, t) => {
        if (t.surface.endsWith(".draft")) return validateDraftOutput(raw);
        if (t.surface.endsWith(".verify")) return parseVerdict(raw) != null;
        // The coach must return the {reply,ready} envelope — a malformed one triggers the
        // orchestrator's single automatic retry, so the conversation never silently degrades.
        // The reply is ALSO scanned for a provider/model self-disclosure (defence in depth for
        // opacity): a leak fails validation and the retry gives the model a chance to comply.
        if (t.surface === "studio.brief.coach") {
          const env = parseCoachEnvelope(raw);
          return env != null && !assistantReplyLeaksProvider(env.reply);
        }
        // Support assist returns the {reply,navigate,handoff} envelope — same guard, so a
        // person never sees raw JSON, and the same opacity leak-scan on the reply.
        if (t.surface === "support.message.assist") {
          const env = parseSupportAssistEnvelope(raw);
          return env != null && !assistantReplyLeaksProvider(env.reply);
        }
        // The Intelligence chat + the deep-work capabilities return free prose; scan directly
        // for an opacity leak (the person paid for these, so a leaked provider name is worse).
        if (t.surface === "intelligence.chat" || t.surface.startsWith("intelligence.deep."))
          return !assistantReplyLeaksProvider(raw);
        return true;
      },
      onSignal,
      newId: opts.newId ?? (() => crypto.randomUUID()),
      rateLimiter: opts.rateLimiter ?? defaultRateLimiter,
      defaultTimeoutMs: AI_GATEWAY_TIMEOUT_MS,
    };

    return await runAiTaskWith(deps, task);
  } catch (error) {
    // Name only — never the message (could echo provider/model text) — so it stays diagnosable
    // without leaking the provider/source.
    console.error("[ai-gateway] runAiTask threw — degrading to provider_error (contract: never throw)", {
      surface: task.surface,
      name: error instanceof Error ? error.name : "unknown",
    });
    emitBlocked(onSignal, task.surface, "provider_error");
    return { ok: false, error: aiError("provider_error", DEFAULT_AI_ERROR_COPY.provider_error) };
  }
}

/** A billing port for FREE surfaces (never invoked — the orchestrator skips billing when
 *  `!policy.billable`) and the fail-closed default for a METERED surface whose division wallet
 *  is not configured yet (reserve refuses ⇒ provider never called ⇒ caller falls back). */
export const noBillingPort: AiBillingPort = {
  async reserve() {
    return { ok: false, error: aiError("not_configured", DEFAULT_AI_ERROR_COPY.not_configured) };
  },
  async settle() {
    return { ok: false, error: aiError("not_configured", DEFAULT_AI_ERROR_COPY.not_configured) };
  },
  async release() {},
};

export { createPgBillingPort, type SqlExecutor } from "./billing";
export { parseDraftOutput } from "./prompts";
export { resolveModelForTier } from "./config";
export { createAiTelemetry, type AiTelemetryDeps } from "./telemetry";
// The company-wide mount helper — a division wires any surface in ~8 lines.
export { createAssistRunner, type AssistRunnerConfig, type AssistActor, type AssistResult } from "./assist-kit";
// Intelligence Live L4 — the price-before-run quote for a chargeable capability (server-only:
// the rate card never leaves the server; only the final kobo totals cross to the client).
export { quoteCapability, type CapabilityQuote } from "./quote";
