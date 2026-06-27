import type { AiModelTier } from "@henryco/pricing";
import type { Result } from "./result";

/** Opaque internal discriminant for a provider adapter, e.g. "anthropic". NEVER
 *  returned to a client (cf. payment-router PaymentProviderAdapter.key). */
export type AiProviderKey = string;

/** What the gateway hands an adapter. `modelTier` (a capability) is resolved to a
 *  concrete Claude model INSIDE the adapter via company-governed, server-only config —
 *  the model id is never set or seen by the caller. */
export interface ProviderRequest {
  modelTier: AiModelTier;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** Hard cap on output tokens — a runaway-cost guardrail. */
  maxOutputTokens: number;
  /** Optional image URLs to attach to the (first user) message — for multimodal surfaces
   *  like the Henry Onyx Verified trust review, which reads the listing's media. The adapter
   *  sends them as image content blocks; the provider/model stay server-only. */
  images?: string[];
  /** Optional JSON-schema description used to constrain/parse the output. */
  responseSchema?: object;
  timeoutMs: number;
}

/** Raw token counts FROM the provider — the metering truth. Field names mirror the
 *  Anthropic SDK usage object (input_tokens / output_tokens / cache_read_input_tokens /
 *  cache_creation_input_tokens) normalised to the gateway's MeteredUsage shape. */
export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface ProviderResult {
  output: string;
  usage: ProviderUsage;
  /** Concrete model id — INTERNAL ONLY; redacted before anything returns to a surface. */
  modelUsedInternal: string;
  finishReason: "stop" | "length" | "refusal" | "error";
}

export interface ProviderError {
  code: string;
  message: string;
  /** Drives failover (mirrors payment-router). */
  retryable: boolean;
  /** Server-only audit; NEVER reaches the client. */
  providerKey: AiProviderKey;
}

/**
 * The adapter seam — one stable interface, N provider implementations, selected at
 * runtime (mirrors `PaymentProviderAdapter`). `generate` returns a `Result` and does
 * NOT throw for expected failures. Provider identity and the real model name terminate
 * here and never cross back to a surface.
 */
export interface AiProviderAdapter {
  readonly key: AiProviderKey;
  generate(req: ProviderRequest): Promise<Result<ProviderResult, ProviderError>>;
}
