/**
 * V2-ADDR-01 — Shared address types.
 *
 * The canonical row shape mirrors public.user_addresses (see
 * apps/hub/supabase/migrations/20260502160000_user_addresses_canonical.sql).
 * Keep these in sync with the SQL — when the schema changes, change here too.
 */

export const USER_ADDRESS_LABELS = [
  "home",
  "office",
  "shop",
  "warehouse",
  "alternative_1",
  "alternative_2",
] as const;

export const USER_ADDRESS_LEGACY_LABELS = [
  "legacy_imported_1",
  "legacy_imported_2",
  "legacy_imported_3",
  "legacy_imported_4",
] as const;

export type UserAddressLabel = (typeof USER_ADDRESS_LABELS)[number];
export type UserAddressLegacyLabel = (typeof USER_ADDRESS_LEGACY_LABELS)[number];
export type UserAddressAnyLabel = UserAddressLabel | UserAddressLegacyLabel;

export const USER_ADDRESS_LABEL_DISPLAY: Record<UserAddressAnyLabel, string> = {
  home: "Home",
  office: "Office",
  shop: "Shop",
  warehouse: "Warehouse",
  alternative_1: "Alternative 1",
  alternative_2: "Alternative 2",
  legacy_imported_1: "Legacy 1",
  legacy_imported_2: "Legacy 2",
  legacy_imported_3: "Legacy 3",
  legacy_imported_4: "Legacy 4",
};

/**
 * Audience hints — passed to <AddressSelector audience="..."> so the selector
 * can default to the most appropriate label, sort order, and validation rules.
 *
 * These do NOT change which addresses the user sees (always: their full book).
 * They just help the selector make smart defaults.
 */
export type AddressAudience =
  | "marketplace_checkout"
  | "marketplace_account"
  | "care_pickup"
  | "care_return"
  | "logistics_pickup"
  | "logistics_dropoff"
  | "jobs_employer_office"
  | "generic";

/**
 * Wire shape — what the API and DB return.
 * Maps to public.user_address_summary (read) and public.user_addresses (write).
 */
export interface UserAddressRecord {
  id: string;
  user_id: string;
  label: UserAddressAnyLabel;
  full_name: string | null;
  phone: string | null;
  country: string;
  state: string | null;
  city: string;
  street: string;
  postal_code: string | null;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  google_place_id: string | null;
  formatted_address: string | null;
  kyc_verified: boolean;
  kyc_verified_at: string | null;
  kyc_match_score: number | null;
  kyc_match_method: "exact" | "fuzzy" | "manual" | "auto" | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Input shape — what the form submits.
 * Coordinates + place_id are populated by Places Autocomplete pick.
 * If place_id is null on submit, the address is unverified and rejected by
 * the API (we require an autocomplete pick).
 */
export interface UserAddressInput {
  label: UserAddressAnyLabel;
  full_name?: string | null;
  phone?: string | null;
  country: string;
  state?: string | null;
  city: string;
  street: string;
  postal_code?: string | null;
  coordinates_lat: number;
  coordinates_lng: number;
  google_place_id: string;
  formatted_address: string;
  is_default?: boolean;
}

/**
 * One-shot variant — used for "use a different address this time" at checkout.
 * Same shape as UserAddressInput but never persisted to user_addresses.
 * The consumer (checkout, care booking, etc.) snapshots it into its own table
 * (orders.shipping_address_jsonb, care_bookings.pickup_address_snapshot_jsonb).
 */
export interface OneShotAddress extends Omit<UserAddressInput, "label" | "is_default"> {
  is_one_shot: true;
}

/**
 * Discriminated union — the AddressSelector emits one of these on pick.
 */
export type AddressPick =
  | { kind: "saved"; addressId: string; address: UserAddressRecord }
  | { kind: "one_shot"; address: OneShotAddress };
