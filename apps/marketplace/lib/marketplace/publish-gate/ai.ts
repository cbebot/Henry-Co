import "server-only";

// V3-MKT-TRUST-01 — the OPTIONAL listing screen. Flag-dark.
//
// A second read of a listing through the governed gateway, consulted by the gate
// ONLY after the deterministic rules have said "publish". It can do one thing:
// ask for a person to look. The fold that applies it (applyAiSignal in ./policy)
// leaves every non-publish verdict untouched, so nothing here can turn a
// deterministic refusal into a publish.
//
// PLATFORM-INVOKED AND NON-BILLABLE. The seller did not ask for this and is never
// charged for it: the surface is registered non-billable and runs through the
// no-billing port, so no wallet is opened. The spend is company cost, RESERVED
// BEFORE the call on the unified internal daily ledger. If that ledger is not
// there (its migration may not be applied yet), the reservation fails and the
// call simply does not happen — the deterministic floor still decides.
//
// EVERY failure is "no signal": flag off, gateway dark, provider not configured,
// budget spent, ledger absent, provider error, unparseable reply. The provider
// and the model never leave the server: this module returns a closed vocabulary
// and nothing else — not the reply text, not the receipt.

import { getAiProviderConfig } from "@henryco/config";
import {
  LISTING_SCREEN_BUDGET_KEY,
  LISTING_SCREEN_MAX_IMAGES,
  LISTING_SCREEN_SURFACE,
  isAiGatewayLive,
  listingScreenEstimateText,
  parseListingScreen,
  resolveListingScreenBudgetKobo,
  type ListingScreenLabel,
} from "@henryco/ai-gateway";
import { estimateFreeTurnCostKobo, noBillingPort, runAiTask } from "@henryco/ai-gateway/server";
import { reservePlatformAiSpend } from "@henryco/intelligence";
import type { AiScanResult, ModerationReason } from "@henryco/moderation";
import { createAdminSupabase } from "@/lib/supabase";
import { isInstantPublishAiEnabled } from "./flag";
import type { ListingAiScan } from "./server";

const LABEL_TO_REASON: Record<ListingScreenLabel, ModerationReason> = {
  scam: "ai_flagged_scam",
  nsfw: "ai_flagged_nsfw",
  abuse: "ai_flagged_abuse",
  other: "ai_flagged_other",
};

/** Both switches: this surface's own flag (which itself requires instant publish) AND the gateway's master switch. */
export function listingScreenEnabled(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return isInstantPublishAiEnabled(env) && isAiGatewayLive(env);
}

/** Only pictures served from this deployment's own storage are sent: the seller cannot make the provider fetch an arbitrary URL. */
function firstPartyImageUrls(urls: ReadonlyArray<string>, publicBaseUrl: string | null | undefined): string[] {
  let host: string | null = null;
  try {
    host = publicBaseUrl ? new URL(publicBaseUrl).host.toLowerCase() : null;
  } catch {
    host = null;
  }
  if (!host) return [];
  const kept: string[] = [];
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && parsed.host.toLowerCase() === host) kept.push(parsed.toString());
    } catch {
      // not a URL
    }
    if (kept.length >= LISTING_SCREEN_MAX_IMAGES) break;
  }
  return kept;
}

/**
 * The screen the gate may call, or null when it is switched off — in which case
 * the gate never calls anything.
 */
export function createListingAiScan(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): ListingAiScan | null {
  if (!listingScreenEnabled(env)) return null;

  return async (input): Promise<AiScanResult | null> => {
    try {
      // Checked before any budget is reserved: an unconfigured provider would
      // otherwise spend the day's reservation on refusals.
      if (!getAiProviderConfig().isConfigured) return null;

      const text = String(input.text ?? "").trim();
      if (!text) return null;
      const images = firstPartyImageUrls(input.imageUrls, env.NEXT_PUBLIC_SUPABASE_URL);

      const estimateKobo = estimateFreeTurnCostKobo({
        surface: LISTING_SCREEN_SURFACE,
        inputText: listingScreenEstimateText(text, images.length),
      });

      const reservation = await reservePlatformAiSpend({
        ledger: {
          async add(kobo: number): Promise<number> {
            const admin = createAdminSupabase();
            const { data, error } = await admin.rpc("internal_ai_spend_add", {
              p_budget_key: LISTING_SCREEN_BUDGET_KEY,
              p_add_kobo: kobo,
            });
            // An absent ledger (its migration not applied) lands here: closed.
            if (error) throw new Error("ledger_error");
            const total = Number(data);
            if (data == null || !Number.isFinite(total) || total < kobo) throw new Error("ledger_bad_total");
            return total;
          },
        },
        estimateKobo,
        ceilingKobo: resolveListingScreenBudgetKobo(env),
      });
      if (!reservation.allowed) return null;

      const result = await runAiTask(
        {
          surface: LISTING_SCREEN_SURFACE,
          actorId: input.actorId,
          input: { text, images, locale: input.locale },
          idempotencyKey: `listing-screen:${input.slug}:${Date.now()}`,
        },
        { billing: noBillingPort },
      );
      if (!result.ok) return null;

      const screen = parseListingScreen(result.value.output);
      if (!screen) return null;
      return {
        recommendation: screen.flagged ? "hold" : "approve",
        reasons: screen.flagged ? screen.labels.map((label) => LABEL_TO_REASON[label]) : [],
        confidence: screen.confidence,
      };
    } catch {
      return null;
    }
  };
}
