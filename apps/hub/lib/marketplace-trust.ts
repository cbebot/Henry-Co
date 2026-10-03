import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-MKT-TRUST-01 — the owner's read model of the marketplace publish gate.
 *
 * Two lists, both read with the service-role client (the ledger tables are
 * default-deny for every request role):
 *   * the gate's recent decisions — what it published, held and refused;
 *   * the listings it has taken down that are waiting for a person.
 *
 * READ ONLY. A restore or an uphold goes through the existing audited product
 * review write (lib/product-review-write.ts), never through this module.
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner) — this module does not gate.
 */

export type GateDecisionRow = {
  id: string;
  subjectType: "listing" | "seller";
  slug: string;
  outcome: "publish" | "hold" | "reject";
  source: string;
  reasons: string[];
  createdAt: string;
};

export type OpenHideRow = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  store: string;
  kind: "policy" | "reports" | "risk";
  reasons: string[];
  createdAt: string;
};

export type MarketplaceTrustView = {
  /** False when the gate's tables are not on this database yet. */
  available: boolean;
  decisions: GateDecisionRow[];
  hides: OpenHideRow[];
};

export async function readMarketplaceTrust(): Promise<MarketplaceTrustView> {
  const empty: MarketplaceTrustView = { available: false, decisions: [], hides: [] };
  try {
    const admin = createAdminSupabase();
    const [decisionsRes, hidesRes] = await Promise.all([
      admin
        .from("marketplace_listing_gate_verdicts")
        .select("id, subject_type, slug, outcome, source, reasons, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      admin
        .from("marketplace_listing_enforcement")
        .select("id, product_id, vendor_id, kind, reasons, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (decisionsRes.error || hidesRes.error) return empty;

    type HideRecord = {
      id: string;
      product_id: string;
      vendor_id: string | null;
      kind: string;
      reasons: string[] | null;
      created_at: string;
    };
    const hideRows = (hidesRes.data ?? []) as HideRecord[];
    const productIds = Array.from(new Set(hideRows.map((row) => String(row.product_id))));
    const vendorIds = Array.from(new Set(hideRows.map((row) => row.vendor_id).filter((id): id is string => Boolean(id))));

    const [productsRes, vendorsRes] = await Promise.all([
      productIds.length > 0
        ? admin.from("marketplace_products").select("id, slug, title").in("id", productIds)
        : Promise.resolve({ data: [] as Array<{ id: string; slug: string | null; title: string | null }> }),
      vendorIds.length > 0
        ? admin.from("marketplace_vendors").select("id, name").in("id", vendorIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }> }),
    ]);
    const products = new Map(
      ((productsRes.data ?? []) as Array<{ id: string; slug: string | null; title: string | null }>).map((row) => [String(row.id), row]),
    );
    const vendors = new Map(
      ((vendorsRes.data ?? []) as Array<{ id: string; name: string | null }>).map((row) => [String(row.id), row]),
    );

    type DecisionRecord = {
      id: string;
      subject_type: string;
      slug: string;
      outcome: string;
      source: string;
      reasons: string[] | null;
      created_at: string;
    };

    return {
      available: true,
      decisions: ((decisionsRes.data ?? []) as DecisionRecord[])
        .filter((row) => row.outcome === "publish" || row.outcome === "hold" || row.outcome === "reject")
        .map((row) => ({
          id: String(row.id),
          subjectType: row.subject_type === "seller" ? "seller" : "listing",
          slug: String(row.slug ?? ""),
          outcome: row.outcome as GateDecisionRow["outcome"],
          source: String(row.source ?? ""),
          reasons: Array.isArray(row.reasons) ? row.reasons.map(String) : [],
          createdAt: String(row.created_at),
        })),
      hides: hideRows
        .filter((row) => row.kind === "policy" || row.kind === "reports" || row.kind === "risk")
        .map((row) => {
          const product = products.get(String(row.product_id));
          const vendor = row.vendor_id ? vendors.get(String(row.vendor_id)) : undefined;
          return {
            id: String(row.id),
            productId: String(row.product_id),
            slug: String(product?.slug ?? ""),
            title: String(product?.title ?? product?.slug ?? row.product_id),
            store: String(vendor?.name ?? ""),
            kind: row.kind as OpenHideRow["kind"],
            reasons: Array.isArray(row.reasons) ? row.reasons.map(String) : [],
            createdAt: String(row.created_at),
          };
        }),
    };
  } catch {
    return empty;
  }
}
