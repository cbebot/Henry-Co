import "server-only";

import {
  getCareBookingCatalog,
  getCarePricing,
  getCareSettings,
} from "@/lib/care-data";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Care public snapshot — small projection of capability evidence + paint
 * tokens used by the public surfaces (home + track + book hero).
 *
 * V3 Wave B1 mirror of getPublicLogisticsSnapshot. Never throws — every
 * supabase call is wrapped + returns sensible defaults so the Vercel
 * preview env contract (200, not 500) is honoured even when env is
 * absent.
 */
export type CarePublicSnapshot = {
  settings: Awaited<ReturnType<typeof getCareSettings>>;
  pricing: Awaited<ReturnType<typeof getCarePricing>>;
  catalog: Awaited<ReturnType<typeof getCareBookingCatalog>>;
  stats: {
    /** Active service lanes — captures real packages currently open. */
    activeLanes: number;
    /** Approved customer reviews (used as social-proof count). */
    approvedReviews: number;
    /** Total active garment pricing rows (transparency signal). */
    pricingRows: number;
    /** Active service zones (coverage signal). */
    zones: number;
  };
};

async function countActiveReviews() {
  try {
    const admin = createAdminSupabase();
    const { count } = await admin
      .from("care_reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", true);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getCarePublicSnapshot(): Promise<CarePublicSnapshot> {
  const [settings, pricing, catalog, reviewCount] = await Promise.all([
    getCareSettings(),
    getCarePricing(),
    getCareBookingCatalog(),
    countActiveReviews(),
  ]);

  const activePackages = catalog.packages.filter((pkg) => pkg.is_active);
  const activeZones = catalog.zones.filter((zone) => zone.is_active);

  return {
    settings,
    pricing,
    catalog,
    stats: {
      activeLanes: activePackages.length,
      approvedReviews: reviewCount,
      pricingRows: pricing.length,
      zones: activeZones.length,
    },
  };
}
