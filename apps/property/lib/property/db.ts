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

/**
 * Stage 2 dual-write: upsert the listing's relational row + full `data` jsonb alongside the
 * Storage write. Flag-gated (inert until PROPERTY_DB_LISTINGS is on) and best-effort — a DB
 * hiccup must never fail the Storage write (the primary during transition).
 *
 * CRITICAL: never writes `henry_onyx_verified` — the badge is the service_role-only SECURITY
 * DEFINER writer's exclusive column, so an owner edit can never reset a granted badge.
 */
export async function writeListingToDb(listing: PropertyListing): Promise<void> {
  if (!isPropertyDbListingsEnabled()) return;
  try {
    const admin = createAdminSupabase();
    await admin.from("property_listings").upsert(
      {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        summary: listing.summary,
        description: listing.description,
        kind: listing.kind,
        status: listing.status,
        visibility: listing.visibility,
        location_slug: listing.locationSlug,
        location_label: listing.locationLabel,
        district: listing.district,
        address_line: listing.addressLine,
        price: listing.price,
        currency: listing.currency,
        managed_by_henryco: listing.managedByHenryCo,
        owner_user_id: listing.ownerUserId,
        agent_id: listing.agentId,
        data: listing,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    );
  } catch {
    /* best-effort; the Storage write is the primary during transition */
  }
}
