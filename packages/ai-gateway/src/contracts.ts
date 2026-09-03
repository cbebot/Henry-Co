import type { AiModelTier } from "@henryco/pricing";
import type { AiSurfaceKey } from "./surfaces";

/**
 * The ONLY shape a client surface is allowed to see after a call. It names neither the
 * provider/source nor the real model — `tier` is a capability label ("fast"/"standard"/
 * "deep") that explains WHY a heavier question cost more, never a model id. No cost, no
 * margin (revealing margin invites disintermediation and exposes the provider's price).
 */
export interface AiUsageReceipt {
  /** What was debited from the wallet for this question (kobo). */
  totalKobo: number;
  /** The VAT portion of the total, shown for transparency (kobo). */
  vatKobo: number;
  surface: AiSurfaceKey;
  /** Capability label only — NEVER a model name or provider/source. */
  tier: AiModelTier;
  /** → ai_usage_events (support/audit reference). */
  usageEventId: string;
  /** false for FREE surfaces. */
  billed: boolean;
}

/** What a surface hands the gateway. The gateway resolves the policy/tier, prices,
 *  reserves, dispatches, meters, settles, and returns `{ output, receipt }`. */
export interface AiTask {
  surface: AiSurfaceKey;
  /** The billed actor (e.g. the vendor's user_id). */
  actorId: string;
  /** Surface-specific input (e.g. the listing seed). Redacted before any log line. */
  input: Record<string, unknown>;
  /** Canonical idempotency key → the reservation + (derived) usage-event id. */
  idempotencyKey: string;
  /** Optional server-side escalation to a heavier tier ("higher model, higher bill"). */
  tierOverride?: AiModelTier;
}
