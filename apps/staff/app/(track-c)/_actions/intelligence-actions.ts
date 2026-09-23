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
  recordRecommendationAction,
  type RecommendationAction,
} from "@/lib/intelligence/recommendation-write";

export async function handleRecommendationAction(
  recommendationKey: string,
  lens: LensKey,
  action: RecommendationAction,
): Promise<void> {
  // Re-derive the caller AND check they may act on this lens. A support
  // operator POSTing against a `trust` card is refused here.
  const actor = await requireIntelligenceActor();
  await recordRecommendationAction({ actor, recommendationKey, lens, action });
  revalidatePath("/modules/staff-intelligence");
}
