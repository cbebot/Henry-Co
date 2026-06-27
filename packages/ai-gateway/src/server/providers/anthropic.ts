import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { Result } from "../../result";
import type { AiProviderAdapter, ProviderError, ProviderRequest, ProviderResult } from "../../provider-types";
import { AI_PROVIDER_TIMEOUT_MS, resolveModelForTier } from "../config";

const PROVIDER_KEY = "anthropic";
const MODEL_DISABLED_BACKOFF_MS = 15 * 60 * 1000;

// Module-level billing-backoff state (the studio precedent). On a billing/auth/quota
// error we temporarily disable dispatch rather than hammering the provider — degrade
// gracefully, never charge, never 500 the host surface.
let modelDisabledUntil = 0;

/** Matches the studio copilot's `shouldTemporarilyDisableModel` substrings. */
function isBillingClassError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("credit balance") ||
    m.includes("billing") ||
    m.includes("authentication") ||
    m.includes("invalid x-api-key") ||
    m.includes("permission")
  );
}

/** Promise.race timeout wrapper (the studio precedent). Rejects `model_timeout:<ms>`. */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`model_timeout:${timeoutMs}`)), timeoutMs);
  });
  // Swallow the loser's unhandled rejection.
  void promise.catch(() => undefined);
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function mapStopReason(stop: string | null | undefined): ProviderResult["finishReason"] {
  if (stop === "refusal") return "refusal";
  if (stop === "max_tokens") return "length";
  return "stop";
}

/**
 * The Anthropic adapter — the only place a model SDK, the API key, or a concrete model
 * name lives. Implements the gateway's provider seam (mirrors a payment-router adapter):
 * returns a `Result`, never throws for expected failures, and carries the model id only
 * in `modelUsedInternal` (redacted before anything returns to a surface). Harvests the
 * studio integration's proven hardening: a tight outer timeout race, billing-error
 * backoff, and the exact `usage` field mapping (input/output/cache_read/cache_creation).
 */
export function createAnthropicAdapter(opts: { apiKey: string; timeoutMs?: number }): AiProviderAdapter {
  const client = new Anthropic({ apiKey: opts.apiKey, timeout: opts.timeoutMs ?? AI_PROVIDER_TIMEOUT_MS, maxRetries: 0 });

  return {
    key: PROVIDER_KEY,
    async generate(req: ProviderRequest): Promise<Result<ProviderResult, ProviderError>> {
      if (Date.now() < modelDisabledUntil) {
        return { ok: false, error: { code: "provider_disabled", message: "temporarily disabled (billing backoff)", retryable: false, providerKey: PROVIDER_KEY } };
      }

      const model = resolveModelForTier(req.modelTier);
      try {
        const response = await withTimeout(
          client.messages.create({
            model,
            max_tokens: req.maxOutputTokens,
            system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
            messages: req.messages.map((m) => ({ role: m.role, content: [{ type: "text" as const, text: m.content }] })),
          }),
          req.timeoutMs,
        );

        const usage = response.usage as
          | { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }
          | undefined;

        const output = response.content
          .filter((block): block is Extract<(typeof response.content)[number], { type: "text" }> => block.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();

        return {
          ok: true,
          value: {
            output,
            usage: {
              inputTokens: Number(usage?.input_tokens ?? 0),
              outputTokens: Number(usage?.output_tokens ?? 0),
              cacheReadTokens: Number(usage?.cache_read_input_tokens ?? 0),
              cacheWriteTokens: Number(usage?.cache_creation_input_tokens ?? 0),
            },
            // Internal only — the orchestrator's redaction drops this before the client.
            modelUsedInternal: response.model || model,
            finishReason: mapStopReason(response.stop_reason),
          },
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : "provider error";
        const billingClass = isBillingClassError(message);
        if (billingClass) modelDisabledUntil = Date.now() + MODEL_DISABLED_BACKOFF_MS;
        const isTimeout = message.startsWith("model_timeout");
        return {
          ok: false,
          error: {
            code: isTimeout ? "model_timeout" : billingClass ? "provider_billing" : "provider_error",
            message, // server-only; the orchestrator maps to safe copy and never returns this to a client
            retryable: !billingClass && !isTimeout ? true : isTimeout,
            providerKey: PROVIDER_KEY,
          },
        };
      }
    },
  };
}

/** Test/ops hook — reset the module-level backoff (e.g. between test cases). */
export function _resetAnthropicBackoff(): void {
  modelDisabledUntil = 0;
}
