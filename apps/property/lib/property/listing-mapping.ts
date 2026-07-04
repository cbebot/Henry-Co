import { createHash } from "node:crypto";
import type { PropertyListing } from "@/lib/property/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fixed namespace for deriving row uuids from legacy string listing ids. NEVER change it —
 *  determinism across every writer (app dual-write, backfill, verify action) is the invariant
 *  that makes re-runs converge on one row instead of duplicating. */
const LISTING_ID_NAMESPACE = "henryco.property.listing.v1:";

export function isUuid(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * The uuid actually stored in `property_listings.id`. Real uuids pass through; the legacy
 * Storage-era string ids ("listing-ikoyi-apartment") map to a stable SHA-1-derived uuid
 * (v5-style: version and variant bits set). The ORIGINAL id keeps living inside `data`, and
 * `rowToListing` reads the object back from `data` — so the app-visible id never changes.
 */
export function stableListingRowId(id: string): string {
  if (isUuid(id)) return id;
  const digest = createHash("sha1").update(LISTING_ID_NAMESPACE + id).digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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
