import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import type { UserAddressRecord } from "@henryco/address-selector";

/**
 * V2-CART-01 — Marketplace checkout reads the user's canonical address book
 * (V2-ADDR-01 public.user_addresses). Service-role read is fine here because
 * the viewer is already authenticated upstream and we filter by user_id.
 */
export async function getMarketplaceAddresses(
  userId: string
): Promise<UserAddressRecord[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("user_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as UserAddressRecord[];
}
