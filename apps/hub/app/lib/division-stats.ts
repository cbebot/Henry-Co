import { createClient } from "@supabase/supabase-js";
import { fetchNoStore } from "./no-store-fetch";

export type DivisionLiveStat = {
  /** Division key, normalized lower-case (e.g. "marketplace"). */
  key: string;
  /** Imperative CTA verb shown on the tile (e.g. "Browse listings"). */
  cta: string;
  /** Live data point shown next to the CTA (e.g. "4 curated"). */
  metric: string | null;
};

const FALLBACK_BY_KEY: Record<string, { cta: string; metric: string | null }> = {
  hub: { cta: "Open the directory", metric: null },
  care: { cta: "Book a service", metric: null },
  marketplace: { cta: "Shop the marketplace", metric: null },
  property: { cta: "Browse listings", metric: null },
  logistics: { cta: "Ship now", metric: null },
  jobs: { cta: "Find work", metric: null },
  learn: { cta: "Start a program", metric: null },
  studio: { cta: "Engage the studio", metric: null },
  building: { cta: "Talk to the team", metric: null },
  hotel: { cta: "Plan a stay", metric: null },
};

function shapeStat(key: string, metric: string | null): DivisionLiveStat {
  const base = FALLBACK_BY_KEY[key] ?? { cta: "Open division", metric: null };
  return { key, cta: base.cta, metric };
}

function safeCount(value: number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return null;
}

/**
 * Server-side fetch for the hub home divisions grid. Each query is best-effort:
 * if a table/RLS denies anon read, the helper returns `metric: null` and the UI
 * falls back to a designed phrase rather than a fake number.
 */
export async function getDivisionLiveStats(
  keys: string[]
): Promise<Record<string, DivisionLiveStat>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const out: Record<string, DivisionLiveStat> = {};
  for (const k of keys) out[k] = shapeStat(k, null);

  if (!url || !anon) return out;

  const supabase = createClient(url, anon, {
    global: { fetch: fetchNoStore },
    auth: { persistSession: false },
  });

  const wantsMarketplace = keys.includes("marketplace");
  const wantsProperty = keys.includes("property");
  const wantsLearn = keys.includes("learn");
  const wantsLogistics = keys.includes("logistics");
  const wantsStudio = keys.includes("studio");

  const [marketplaceRes, propertyRes, learnRes, logisticsRes, studioRes] =
    await Promise.all([
      wantsMarketplace
        ? supabase
            .from("marketplace_products")
            .select("id", { count: "exact", head: true })
            .eq("approval_status", "approved")
            .eq("status", "active")
        : Promise.resolve({ count: null, error: null }),
      wantsProperty
        ? supabase
            .from("property_listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved")
            .eq("visibility", "public")
        : Promise.resolve({ count: null, error: null }),
      wantsLearn
        ? supabase
            .from("learn_courses")
            .select("id", { count: "exact", head: true })
            .eq("status", "published")
            .eq("visibility", "public")
        : Promise.resolve({ count: null, error: null }),
      wantsLogistics
        ? supabase
            .from("logistics_zones")
            .select("region", { count: "exact" })
            .eq("is_active", true)
        : Promise.resolve({ count: null, data: null, error: null }),
      wantsStudio
        ? supabase
            .from("studio_services")
            .select("id", { count: "exact", head: true })
            .eq("is_published", true)
        : Promise.resolve({ count: null, error: null }),
    ]);

  if (wantsMarketplace) {
    const n = safeCount(marketplaceRes.count);
    if (n !== null) {
      out.marketplace = shapeStat(
        "marketplace",
        `${n} ${n === 1 ? "product" : "products"} live`
      );
    }
  }

  if (wantsProperty) {
    const n = safeCount(propertyRes.count);
    if (n !== null) {
      out.property = shapeStat(
        "property",
        `${n} curated ${n === 1 ? "listing" : "listings"}`
      );
    }
  }

  if (wantsLearn) {
    const n = safeCount(learnRes.count);
    if (n !== null) {
      out.learn = shapeStat(
        "learn",
        `${n} ${n === 1 ? "program" : "programs"} open`
      );
    }
  }

  if (wantsLogistics) {
    type ZoneRow = { region?: string | null };
    const zoneRows = (logisticsRes as { data?: ZoneRow[] | null }).data ?? [];
    const regions = new Set<string>();
    for (const row of zoneRows) {
      const region = String(row?.region ?? "").trim();
      if (region) regions.add(region);
    }
    const n = regions.size || safeCount(logisticsRes.count);
    if (n !== null && n > 0) {
      out.logistics = shapeStat(
        "logistics",
        `Serving ${n} ${n === 1 ? "region" : "regions"}`
      );
    }
  }

  if (wantsStudio) {
    const n = safeCount(studioRes.count);
    if (n !== null) {
      out.studio = shapeStat(
        "studio",
        `${n} ${n === 1 ? "capability" : "capabilities"} live`
      );
    }
  }

  return out;
}
