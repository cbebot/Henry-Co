import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getOptionalEnv } from "@/lib/env";
import type { PropertyListing } from "@/lib/property/types";
import { rowToListing, type PropertyListingRow } from "@/lib/property/listing-mapping";

/**
 * Stage 1 of the property Storage-JSON → Postgres listings migration
 * (docs/v3/property/PROPERTY-STORAGE-TO-DB-MIGRATION.md).
 *
 * DB-backed read path for property listings. The full PropertyListing lives in
 * `property_listings.data` (jsonb); the durable "Henry Onyx Verified" badge is overlaid from the
 * relational `henry_onyx_verified` column (the only column the service_role-only SECURITY DEFINER
 * writer can set). The pure `rowToListing` mapping is unit-tested in `listing-mapping.test.ts`.
 *
 * Non-breaking: gated by PROPERTY_DB_LISTINGS, and `listListingsFromDb` returns [] when the table
 * is empty so the snapshot builder falls back to the Storage catalog (identical to today).
 */
export function isPropertyDbListingsEnabled(): boolean {
  return getOptionalEnv("PROPERTY_DB_LISTINGS") === "true";
}

/** Load DB-backed listings. Returns [] on error or when the table is empty (⇒ Storage fallback). */
export async function listListingsFromDb(): Promise<PropertyListing[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("property_listings")
    .select("data, henry_onyx_verified")
    .not("data", "is", null);
  if (error || !data) return [];
  return (data as PropertyListingRow[])
    .map((row) => rowToListing(row))
    .filter((listing): listing is PropertyListing => listing != null);
}
