"use server";

/**
 * V3-42 — the server action behind the recommendation rail.
 *
 * This is the entire write surface of the pass. It records a human decision and
 * audits it; it applies nothing. The actor is re-derived here rather than taken
 * from the client, because a direct POST never passes the page's role gate.
 */

import { revalidatePath } from "next/cache";
import type { LensKey } from "@henryco/dashboard-modules-staff";
import { requireIntelligenceActor } from "@/lib/intelligence/actor";
import {
  RecommendationNotLiveError,
  recordRecommendationAction,
  type RecommendationAction,
} from "@/lib/intelligence/recommendation-write";

export async function handleRecommendationAction(
  recommendationKey: string,
  lens: LensKey,
  action: RecommendationAction,
): Promise<"saved" | "stale"> {
  // Re-derive the caller AND check they may act on this lens. A support
  // operator POSTing against a `trust` card is refused here.
  const actor = await requireIntelligenceActor();
  try {
    await recordRecommendationAction({ actor, recommendationKey, lens, action });
  } catch (error) {
    // The card changed under the operator. Nothing was written; re-render the
    // page so the rail shows what the engine shows NOW (round 3).
    if (error instanceof RecommendationNotLiveError) {
      revalidatePath("/modules/staff-intelligence");
      return "stale";
    }
    throw error;
  }
  revalidatePath("/modules/staff-intelligence");
  return "saved";
}
