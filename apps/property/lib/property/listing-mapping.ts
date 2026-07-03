import type { PropertyListing } from "@/lib/property/types";

/** A property_listings row's fields the DB read path needs: the full listing object (`data`
 *  jsonb) + the durable badge (relational column). Pure — no server imports — so it is unit-testable. */
export interface PropertyListingRow {
  data: unknown;
  henry_onyx_verified: boolean | null;
}

/**
 * Reconstruct a PropertyListing from a DB row: the full object from `data`, with the durable
 * "Henry Onyx Verified" badge overlaid from the relational `henry_onyx_verified` column. The
 * relational column ALWAYS wins — a `data`-embedded flag can never forge the badge (only the
 * service_role-only SECURITY DEFINER writer sets the column). Returns null for a row without a
 * usable `data` object.
 */
export function rowToListing(row: PropertyListingRow): PropertyListing | null {
  if (!row || !row.data || typeof row.data !== "object" || Array.isArray(row.data)) return null;
  return {
    ...(row.data as PropertyListing),
    henryOnyxVerified: row.henry_onyx_verified === true,
  };
}
