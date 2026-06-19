import "server-only";

import { moderate } from "@henryco/moderation/server";
import type { ModerationOutcome } from "@henryco/moderation";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * V3-25 publish-gate seam for marketplace listings.
 *
 * DORMANT by default: gated by MODERATION_ENFORCED. When the flag is off,
 * moderateListing() returns null and the upsert path behaves exactly as before
 * (zero behavioural change, the migration can stay committed-NOT-applied).
 *
 * Activation prerequisites (owner-gated): apply 20260616120000_v3_25_moderation.sql
 * to prod, then set MODERATION_ENFORCED=true. Deterministic-only is the always-
 * safe floor; AI scanning lights up when a ModerationAiRouter is injected (V3-26).
 */
export function moderationEnforced(): boolean {
  return process.env.MODERATION_ENFORCED === "true";
}

export async function moderateListing(
  admin: SupabaseClient,
  args: { slug: string; title: string; summary: string; description: string; actorId: string; locale?: string },
): Promise<ModerationOutcome | null> {
  if (!moderationEnforced()) return null;
  const text = [args.title, args.summary, args.description].filter(Boolean).join("\n");
  if (!text.trim()) return null;
  return moderate(
    {
      contentType: "marketplace_listing",
      contentId: args.slug,
      text,
      locale: args.locale ?? "en",
      actorId: args.actorId,
    },
    { supabase: admin },
  );
}
