import {
  computeAiUsageBreakdown,
  type AiModelTier,
  type AiUsageRuleSet,
  type MeteredUsage,
  type PricingBreakdown,
  type VatRatePolicy,
  type VatTreatment,
} from "@henryco/pricing";

import type { Result } from "./result";
import { AI_SURFACES, type AiSurfaceKey, type AiSurfacePolicy } from "./surfaces";
import type { AiProviderAdapter, ProviderError, ProviderRequest, ProviderResult } from "./provider-types";
import type { AiBillingPort } from "./billing-port";
import type { AiRateLimitPort } from "./rate-limit";
import { DAY_MS } from "./rate-limit";
import type { AiTask, AiUsageReceipt } from "./contracts";
import { aiError, DEFAULT_AI_ERROR_COPY, type AiGatewayError, type AiGatewayErrorCode } from "./errors";
import { estimateInputTokens, estimateUsageUpperBound } from "./metering";
import { assertClientSafe, redactReceipt } from "./redaction";

/** The provider-request pieces a surface contributes (built server-side). */
export interface AiPromptParts {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** Optional image URLs for a multimodal surface (e.g. the trust review reads listing media). */
  images?: string[];
  responseSchema?: object;
  timeoutMs?: number;
}

/** Provider/model-free telemetry signal — safe to log/emit anywhere. */
export interface AiUsageSignal {
  kind: "estimated" | "metered" | "blocked" | "provider_failed";
  surface: AiSurfaceKey;
  tier: AiModelTier;
  billable: boolean;
  totalKobo?: number;
  vatKobo?: number;
  usageEventId?: string;
  code?: AiGatewayErrorCode;
  /** true when actuals exceeded the reservation and the charge was capped to the quote
   *  (an estimator-tuning signal; the user was protected). */
  cappedToReserve?: boolean;
}

export interface AiTaskDeps {
  adapter: AiProviderAdapter;
  billing: AiBillingPort;
  /** Optional anti-abuse velocity limiter. When present, a surface's `freeAllowancePerDay`
   *  (and any future per-actor cap) is enforced after the auth gate, before dispatch. */
  rateLimiter?: AiRateLimitPort;
  rules: AiUsageRuleSet;
  vatPolicy: VatRatePolicy;
  /** Defaults to "standard" (collect VAT). A non-standard treatment defers VAT. */
  vatTreatment?: VatTreatment;
  /** Defaults to the built-in AI_SURFACES registry. */
  surfaces?: Record<AiSurfaceKey, AiSurfacePolicy>;
  /** The system-wide kill switch — when false, no provider is dispatched. */
  killSwitchEnabled: boolean;
  now: () => Date;
  /** Surface-specific prompt construction (system prompt + topic guard live here). */
  promptBuilder: (task: AiTask, policy: AiSurfacePolicy) => AiPromptParts;
  /** Optional output validator — on false the call is retried once, then refused. */
  validateOutput?: (raw: string, task: AiTask) => boolean;
  /** Generates an id for the FREE-surface receipt (the metered path's id comes from settle). */
  newId?: () => string;
  onSignal?: (signal: AiUsageSignal) => void;
  /** Hold time-to-live (ms). Default 5 minutes. */
  holdTtlMs?: number;
  /** Default per-call provider timeout (ms). Default 12s. */
  defaultTimeoutMs?: number;
}

export interface AiTaskSuccess {
  output: string;
  receipt: AiUsageReceipt;
}

function lineAmount(breakdown: PricingBreakdown, code: string): number {
  return breakdown.lines.find((l) => l.code === code)?.amount.amount ?? 0;
}

/** V3-33: a call is allowed only for an authenticated actor — a non-empty user id the
 *  surface resolved from the session. A blank/missing id is anonymous and refused. */
function isAuthenticatedActor(actorId: unknown): boolean {
  return typeof actorId === "string" && actorId.trim().length > 0;
}

function mapProviderError(error: ProviderError): AiGatewayErrorCode {
  const code = (error.code || "").toLowerCase();
  if (code.includes("timeout")) return "provider_timeout";
  if (code.includes("refus")) return "provider_refusal";
  return "provider_error";
}

/**
 * Run one AI task end to end: resolve policy → (billable) estimate + cap + reserve →
 * dispatch → meter actuals → price → settle (atomic, idempotent) → redacted receipt.
 *
 * Pure orchestration with INJECTED ports (`adapter`, `billing`, clock, telemetry) so the
 * money flow is fully unit-testable; the server wrapper wires the real Anthropic adapter
 * and the guarded `payments_private` RPCs. Money invariants enforced here:
 *  - wallet-zero ⇒ provider is NEVER called (reserve fails before dispatch);
 *  - the charge is HARD-CAPPED at the reservation (the quoted price) — the customer is
 *    never billed above the quote and the wallet can never go negative, regardless of
 *    estimator accuracy; any over-run is absorbed as company margin, not passed on;
 *  - a provider failure/refusal releases the hold and charges nothing;
 *  - the returned receipt names no provider/source and no real model (redaction +
 *    a defence-in-depth leak scan).
 */
export async function runAiTaskWith(
  deps: AiTaskDeps,
  task: AiTask,
): Promise<Result<AiTaskSuccess, AiGatewayError>> {
  const surfaces = deps.surfaces ?? AI_SURFACES;
  const treatment: VatTreatment = deps.vatTreatment ?? "standard";

  const policy = surfaces[task.surface];
  if (!policy) {
    return fail(deps, "blocked", task.surface, "fast", false, aiError("surface_unknown", DEFAULT_AI_ERROR_COPY.surface_unknown));
  }

  // Kill switch — evaluated BEFORE any wallet or provider work.
  if (!deps.killSwitchEnabled) {
    return fail(deps, "blocked", policy.surface, policy.modelTier, policy.billable, aiError("kill_switch_active", DEFAULT_AI_ERROR_COPY.kill_switch_active));
  }

  // V3-33 personal-task gating — no anonymous AI. Every call requires an authenticated
  // actor; an unauth/blank actor is refused AT THE ROUTER, before any wallet or provider
  // work, and the refusal is signalled (audited). The surface is the auth trust boundary
  // (it resolves the authenticated user and passes their id); this is the router backstop.
  if (!isAuthenticatedActor(task.actorId)) {
    return fail(deps, "blocked", policy.surface, policy.modelTier, policy.billable, aiError("auth_required", DEFAULT_AI_ERROR_COPY.auth_required));
  }

  // Anti-abuse velocity cap — enforced AFTER auth, BEFORE any wallet or provider work. FREE
  // surfaces are gated by `freeAllowancePerDay` (the wallet gates metered ones); a hit returns
  // a typed rate_limited error and the provider is never called. consume-on-attempt (the
  // studio precedent) so retry-hammering can't bypass the cap.
  if (deps.rateLimiter && policy.freeAllowancePerDay != null) {
    const rl = await deps.rateLimiter.consume({
      actorId: task.actorId,
      surface: policy.surface,
      maxPerWindow: policy.freeAllowancePerDay,
      windowMs: DAY_MS,
    });
    if (!rl.allowed) {
      return fail(deps, "blocked", policy.surface, policy.modelTier, policy.billable, aiError("rate_limited", DEFAULT_AI_ERROR_COPY.rate_limited));
    }
  }

  const tier: AiModelTier = task.tierOverride ?? policy.modelTier;
  const rate = deps.rules.tiers[tier];
  if (!rate) {
    return fail(deps, "blocked", policy.surface, tier, policy.billable, aiError("rate_card_missing", DEFAULT_AI_ERROR_COPY.rate_card_missing));
  }

  const prompt = deps.promptBuilder(task, policy);
  const promptText = `${prompt.system}\n${prompt.messages.map((m) => m.content).join("\n")}`;
  const promptTokens = estimateInputTokens(promptText);

  let holdId: string | null = null;
  // Held from pre-flight to settle: the estimate is the quoted price AND the hard ceiling
  // on the final charge — the user is never billed above what was reserved.
  let reservedBreakdown: PricingBreakdown | null = null;
  let reservedTotalKobo = 0;

  // ---- Billable pre-flight: estimate (upper bound) → cap → reserve. -------------
  if (policy.billable) {
    const estimateUsage = estimateUsageUpperBound({ promptTokens, policy });
    const estimateBreakdown = computeAiUsageBreakdown({ rules: deps.rules, tier, usage: estimateUsage, vat: { policy: deps.vatPolicy, treatment } });
    const estimateCostKobo = lineAmount(estimateBreakdown, "ai_compute");
    if (estimateCostKobo > rate.maxCostKoboPerCall) {
      return fail(deps, "blocked", policy.surface, tier, true, aiError("cap_exceeded", DEFAULT_AI_ERROR_COPY.cap_exceeded));
    }
    const estimateTotalKobo = estimateBreakdown.totals.customerTotal.amount;
    reservedBreakdown = estimateBreakdown;
    reservedTotalKobo = estimateTotalKobo;
    deps.onSignal?.({ kind: "estimated", surface: policy.surface, tier, billable: true, totalKobo: estimateTotalKobo, vatKobo: lineAmount(estimateBreakdown, "tax") });

    const expiresAt = new Date(deps.now().getTime() + (deps.holdTtlMs ?? 5 * 60 * 1000)).toISOString();
    const reserved = await deps.billing.reserve({
      userId: task.actorId,
      estimateKobo: estimateTotalKobo,
      idempotencyKey: task.idempotencyKey,
      surface: policy.surface,
      tier,
      expiresAt,
    });
    if (!reserved.ok) {
      // insufficient_funds / config error — the PROVIDER IS NEVER CALLED.
      return fail(deps, "blocked", policy.surface, tier, true, reserved.error);
    }
    holdId = reserved.value.holdId;
  }

  // ---- Dispatch to the provider. -----------------------------------------------
  const request = {
    modelTier: tier,
    system: prompt.system,
    messages: prompt.messages,
    maxOutputTokens: policy.maxOutputTokens,
    images: prompt.images,
    responseSchema: prompt.responseSchema,
    timeoutMs: prompt.timeoutMs ?? deps.defaultTimeoutMs ?? 12_000,
  };

  let result = await safeGenerate(deps.adapter, request);

  if (!result.ok) {
    await releaseHold(deps, holdId);
    const code = mapProviderError(result.error);
    return fail(deps, "provider_failed", policy.surface, tier, policy.billable, aiError(code, DEFAULT_AI_ERROR_COPY[code]));
  }
  if (result.value.finishReason === "refusal") {
    await releaseHold(deps, holdId);
    return fail(deps, "provider_failed", policy.surface, tier, policy.billable, aiError("provider_refusal", DEFAULT_AI_ERROR_COPY.provider_refusal));
  }

  // ---- Optional output validation (retry once). --------------------------------
  if (deps.validateOutput && !deps.validateOutput(result.value.output, task)) {
    const retry = await safeGenerate(deps.adapter, request);
    if (retry.ok && retry.value.finishReason !== "refusal" && deps.validateOutput(retry.value.output, task)) {
      result = retry;
    } else {
      await releaseHold(deps, holdId);
      return fail(deps, "provider_failed", policy.surface, tier, policy.billable, aiError("schema_validation_failed", DEFAULT_AI_ERROR_COPY.schema_validation_failed));
    }
  }

  const output = result.value.output;

  // ---- FREE surface: no wallet phase. ------------------------------------------
  if (!policy.billable) {
    const usageEventId = deps.newId?.() ?? task.idempotencyKey;
    const receipt = redactReceipt({ surface: policy.surface, tier, totalKobo: 0, vatKobo: 0, usageEventId, billed: false });
    assertClientSafe(receipt);
    deps.onSignal?.({ kind: "metered", surface: policy.surface, tier, billable: false, totalKobo: 0, vatKobo: 0, usageEventId });
    return { ok: true, value: { output, receipt } };
  }

  // ---- Meter actuals → price → settle (atomic + idempotent). -------------------
  const actualUsage: MeteredUsage = {
    inputTokens: result.value.usage.inputTokens,
    outputTokens: result.value.usage.outputTokens,
    cacheReadTokens: result.value.usage.cacheReadTokens,
    cacheWriteTokens: result.value.usage.cacheWriteTokens,
    calls: 1,
  };
  const actualBreakdown = computeAiUsageBreakdown({ rules: deps.rules, tier, usage: actualUsage, vat: { policy: deps.vatPolicy, treatment } });

  // STRUCTURAL prepaid guarantee: the charge can never exceed the reserved (quoted)
  // amount. If actuals somehow exceed the reservation (an estimator miss), bill the
  // reserved breakdown instead — the user pays no more than quoted and the wallet can
  // never be driven negative; the company absorbs the small provider-cost overage and
  // the divergence is surfaced for estimator tuning.
  const actualTotal = actualBreakdown.totals.customerTotal.amount;
  const cappedToReserve = reservedBreakdown != null && actualTotal > reservedTotalKobo;
  const chargeBreakdown = cappedToReserve ? (reservedBreakdown as PricingBreakdown) : actualBreakdown;
  const costKobo = lineAmount(chargeBreakdown, "ai_compute");
  const marginKobo = lineAmount(chargeBreakdown, "ai_margin");
  const vatKobo = lineAmount(chargeBreakdown, "tax");

  const settled = await deps.billing.settle({
    holdId: holdId as string,
    userId: task.actorId,
    surface: policy.surface,
    tier,
    costKobo,
    marginKobo,
    vatKobo,
    usage: actualUsage,
    ruleBookKey: deps.rules.key,
    ruleVersion: deps.rules.version,
    // Server-side metadata ONLY (RLS-protected). No provider/model/prompt/output.
    breakdownMeta: {
      surface: policy.surface,
      tier,
      ruleBookKey: deps.rules.key,
      ruleVersion: deps.rules.version,
      inputTokens: actualUsage.inputTokens,
      outputTokens: actualUsage.outputTokens,
      cacheReadTokens: actualUsage.cacheReadTokens,
      cacheWriteTokens: actualUsage.cacheWriteTokens,
      calls: actualUsage.calls,
      costKobo,
      marginKobo,
      vatKobo,
    },
  });

  if (!settled.ok) {
    // The settle transaction rolled back (no debit, no post). Do NOT hand back free
    // output — release the hold and surface the error; a retry re-prices and settles once.
    await releaseHold(deps, holdId);
    return fail(deps, "provider_failed", policy.surface, tier, true, settled.error);
  }

  const receipt = redactReceipt({
    surface: policy.surface,
    tier,
    totalKobo: settled.value.totalKobo,
    vatKobo,
    usageEventId: settled.value.usageEventId,
    billed: true,
  });
  assertClientSafe(receipt);
  deps.onSignal?.({ kind: "metered", surface: policy.surface, tier, billable: true, totalKobo: settled.value.totalKobo, vatKobo, usageEventId: settled.value.usageEventId, cappedToReserve });
  return { ok: true, value: { output, receipt } };
}

async function safeGenerate(
  adapter: AiProviderAdapter,
  request: ProviderRequest,
): Promise<Result<ProviderResult, ProviderError>> {
  try {
    return await adapter.generate(request);
  } catch (e) {
    return {
      ok: false,
      error: { code: "provider_exception", message: e instanceof Error ? e.message : "provider threw", retryable: true, providerKey: adapter.key },
    };
  }
}

async function releaseHold(deps: AiTaskDeps, holdId: string | null): Promise<void> {
  if (!holdId) return;
  try {
    await deps.billing.release({ holdId });
  } catch {
    // best-effort — the hold's expiry frees `available` regardless of an explicit release.
  }
}

function fail(
  deps: AiTaskDeps,
  kind: "blocked" | "provider_failed",
  surface: AiSurfaceKey,
  tier: AiModelTier,
  billable: boolean,
  error: AiGatewayError,
): Result<never, AiGatewayError> {
  deps.onSignal?.({ kind, surface, tier, billable, code: error.code });
  return { ok: false, error };
}
