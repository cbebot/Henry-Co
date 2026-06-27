import "server-only";

import { runAiTask, type RunAiTaskOptions } from "./index";
import type { AiBillingPort } from "../billing-port";
import type { AiSurfaceKey } from "../surfaces";
import type { AiUsageReceipt } from "../contracts";
import type { AiTelemetryDeps } from "./telemetry";

/** The authenticated actor a division resolves from its own session, or null when anonymous.
 *  `supabase` is the user-scoped client used for the V3-33 audit (so `auth.uid()` resolves
 *  to the actor). */
export interface AssistActor {
  userId: string;
  supabase: AiTelemetryDeps["supabase"];
}

export type AssistResult =
  | { ok: true; output: string; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

export interface AssistRunnerConfig {
  surface: AiSurfaceKey;
  /** The division's own auth: resolve the authenticated actor, or null if not signed in. */
  resolveActor: () => Promise<AssistActor | null>;
  /** The division's metered-billing port (its PAYMENTS_DATABASE_URL pool). Only needed for
   *  METERED surfaces; a FREE surface never touches it, so it may be omitted. */
  billing?: AiBillingPort;
  /** Optional overrides forwarded to runAiTask (rate card, VAT treatment, env). */
  options?: Pick<RunAiTaskOptions, "rules" | "vatTreatment" | "env" | "onSignal">;
}

/**
 * The company-wide mount helper. A division wires ANY gateway surface by giving the kit
 * three already-standard things — who is authenticated (`resolveActor`), the metered-billing
 * port (`billing`), and (via the actor's supabase client) the audit path — and gets back a
 * runner it calls from a thin `"use server"` action. Auth-gating, the prepaid reservation,
 * metering, the price cap, the balanced ledger post, the redacted receipt, the audit row,
 * and provider/model opacity are written ONCE here and reused by every division verbatim.
 *
 * This is the leverage that makes "Henry Onyx Intelligence everywhere" tractable without
 * per-app money code: a new surface is a registry entry + a prompt builder + ~8 lines.
 */
export function createAssistRunner(config: AssistRunnerConfig) {
  return async function run(args: { input: Record<string, unknown>; idempotencyKey: string }): Promise<AssistResult> {
    const actor = await config.resolveActor();
    if (!actor || !actor.userId) {
      // V3-33: no anonymous AI. Refuse before any wallet/provider work.
      return { ok: false, code: "auth_required", message: "Sign in to use Henry Onyx Intelligence." };
    }

    // A METERED surface needs a billing port; a missing one is a configuration error, not a
    // charge — fail closed (never silently free a metered call).
    const billing = config.billing ?? NO_BILLING;

    const result = await runAiTask(
      {
        surface: config.surface,
        actorId: actor.userId,
        input: args.input,
        idempotencyKey: args.idempotencyKey,
      },
      {
        billing,
        audit: { supabase: actor.supabase },
        ...config.options,
      },
    );

    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    return { ok: true, output: result.value.output, receipt: result.value.receipt };
  };
}

/** A billing port that refuses every reservation — used when a METERED surface is mounted
 *  without a real port, so the call fails closed (a misconfiguration never bills nothing). */
const NO_BILLING: AiBillingPort = {
  async reserve() {
    return { ok: false, error: { code: "not_configured", message: "Henry Onyx Intelligence is unavailable right now." } };
  },
  async settle() {
    return { ok: false, error: { code: "not_configured", message: "Henry Onyx Intelligence is unavailable right now." } };
  },
  async release() {
    /* nothing reserved */
  },
};
