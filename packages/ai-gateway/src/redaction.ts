import type { AiModelTier } from "@henryco/pricing";
import type { AiUsageReceipt } from "./contracts";
import type { AiSurfaceKey } from "./surfaces";

/**
 * Keys that must NEVER appear in a client payload or a raw log line for the AI engine.
 * `@henryco/observability`'s default redactor scrubs PII by key but knows nothing about
 * LLM/provider fields — pass these as `createRedactor({ extra: [...AI_LOG_REDACT_KEYS] })`.
 */
export const AI_LOG_REDACT_KEYS = [
  "provider",
  "providerKey",
  "model",
  "modelUsedInternal",
  "apiKey",
  "anthropicApiKey",
  "system",
  "systemPrompt",
  "prompt",
  "completion",
  "messages",
  "rawInput",
  "costKobo",
  "marginKobo",
  "cost",
  "margin",
] as const;

const FORBIDDEN_RECEIPT_KEYS = new Set<string>([
  "provider",
  "providerKey",
  "source",
  "model",
  "modelUsedInternal",
  "modelUsed",
  "apiKey",
  "system",
  "systemPrompt",
  "prompt",
  "completion",
  "messages",
  "cost",
  "costKobo",
  "margin",
  "marginKobo",
]);

/**
 * Build the client-facing {@link AiUsageReceipt} from internal data by WHITELIST — only
 * the six safe fields are copied, so provider/model/cost/margin can never leak through
 * this path even if the caller hands in extra fields.
 */
export function redactReceipt(input: {
  surface: AiSurfaceKey;
  tier: AiModelTier;
  totalKobo: number;
  vatKobo: number;
  usageEventId: string;
  billed: boolean;
}): AiUsageReceipt {
  return {
    totalKobo: input.totalKobo,
    vatKobo: input.vatKobo,
    surface: input.surface,
    tier: input.tier,
    usageEventId: input.usageEventId,
    billed: input.billed,
  };
}

/**
 * Defence-in-depth: throw if any forbidden provider/model/cost/margin key appears
 * anywhere in a value about to cross to a client. The whitelist builder above already
 * prevents leaks; this catches a future regression where a surface returns a richer
 * object. Walks plain objects/arrays; ignores cycles.
 */
export function assertClientSafe(value: unknown, path = "$"): void {
  const seen = new WeakSet<object>();
  const walk = (node: unknown, where: string): void => {
    if (node === null || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${where}[${i}]`));
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_RECEIPT_KEYS.has(key)) {
        throw new Error(`[ai-gateway] provider/model/cost leak: forbidden key "${key}" at ${where}`);
      }
      walk(child, `${where}.${key}`);
    }
  };
  walk(value, path);
}
