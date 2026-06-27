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

export interface RunAiTaskOptions {
  /** The billing port — the app supplies `createPgBillingPort(sql)` over a service-role
   *  Postgres connection (the guarded RPCs are not PostgREST-reachable). */
  billing: AiBillingPort;
  /** The rate card. Defaults to the governed launch baseline. */
  rules?: AiUsageRuleSet;
  /** "standard" collects VAT (default); a non-standard treatment defers it. */
  vatTreatment?: VatTreatment;
  onSignal?: (signal: AiUsageSignal) => void;
  /** Id generator for the FREE-surface receipt; defaults to crypto.randomUUID. */
  newId?: () => string;
  /** Env source (defaults to process.env) — the kill switch + model routing read it. */
  env?: NodeJS.ProcessEnv;
}

function emitBlocked(opts: RunAiTaskOptions, surface: AiTask["surface"], code: AiGatewayError["code"]): void {
  opts.onSignal?.({ kind: "blocked", surface, tier: "standard", billable: true, code });
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

  // 1. System-wide kill switch — default OFF. Nothing else runs while paused.
  if (!isFlagEnabled(parseHenryFeatureFlags(env), "ai_gateway")) {
    emitBlocked(opts, task.surface, "kill_switch_active");
    return { ok: false, error: aiError("kill_switch_active", DEFAULT_AI_ERROR_COPY.kill_switch_active) };
  }

  // 2. Provider configured? A missing key degrades gracefully (no charge, calm copy).
  const cfg = getAiServerConfig();
  if (!cfg.isConfigured) {
    emitBlocked(opts, task.surface, "not_configured");
    return { ok: false, error: aiError("not_configured", DEFAULT_AI_ERROR_COPY.not_configured) };
  }

  const deps: AiTaskDeps = {
    adapter: createAnthropicAdapter({ apiKey: cfg.apiKey }),
    billing: opts.billing,
    rules: opts.rules ?? defaultAiUsageRules(),
    vatPolicy: TAX.vat satisfies VatRatePolicy,
    vatTreatment: opts.vatTreatment ?? "standard",
    killSwitchEnabled: true, // already checked above
    now: () => new Date(),
    promptBuilder: buildPrompt,
    validateOutput: (raw, t) => (t.surface === "marketplace.listing.draft" ? validateDraftOutput(raw) : true),
    onSignal: opts.onSignal,
    newId: opts.newId ?? (() => crypto.randomUUID()),
    defaultTimeoutMs: AI_GATEWAY_TIMEOUT_MS,
  };

  return runAiTaskWith(deps, task);
}

export { createPgBillingPort, type SqlExecutor } from "./billing";
export { parseDraftOutput } from "./prompts";
export { resolveModelForTier } from "./config";
