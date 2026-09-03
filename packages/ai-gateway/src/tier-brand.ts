// The customer-facing brand names for the Henry Onyx Intelligence tiers. Pure + client-safe.
//
// The machine labels (fast/standard/deep) stay internal policy keys; every surface that shows a
// tier to a person renders THESE names instead — one brand voice everywhere, and never a hint of
// the provider or the concrete model behind a tier ("higher model, higher bill" stays a Henry
// Onyx product truth, not a vendor detail).
import type { AiModelTier } from "@henryco/pricing";

export const AI_TIER_BRAND_NAMES: Record<AiModelTier, string> = {
  fast: "Onyx Swift",
  standard: "Onyx Core",
  deep: "Onyx Prime",
};

/** The display name for a tier — the ONLY way a tier should be shown to a person. */
export function aiTierBrandName(tier: AiModelTier): string {
  return AI_TIER_BRAND_NAMES[tier] ?? "Henry Onyx Intelligence";
}
