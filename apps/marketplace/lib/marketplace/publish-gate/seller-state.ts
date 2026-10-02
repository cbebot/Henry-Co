// V3-MKT-TRUST-01 — the store facts the gate decides on. PURE.
//
// These come from ONE source: the SQL function marketplace_gate_seller_state().
// The probation caps in particular are never hardcoded in TypeScript — the
// database both reports them here and enforces them in the guard, so the number a
// seller is told and the number they are held to cannot drift apart.

export interface ProbationCaps {
  maxLiveListings: number;
  maxNewListingsPerDay: number;
  maxPrice: number;
  graduationMinDeliveredOrders: number;
  graduationMinDays: number;
}

export interface SellerGateState {
  vendor: {
    id: string;
    status: string;
    ownerUserId: string | null;
    ownerType: string;
    sellerTier: string;
  };
  identityVerified: boolean;
  plan: { listingCap: number; listingRows: number };
  probation: {
    /** The store was opened by instant onboarding. */
    tracked: boolean;
    /** Caps apply right now (tracked and not yet graduated). */
    active: boolean;
    startedAt: string | null;
    ageDays: number;
    caps: ProbationCaps;
    liveListings: number;
    newListings24h: number;
    deliveredOrders: number;
  };
  /** The listing being written, when it already exists. */
  product: { id: string; vendorId: string | null; approvalStatus: string } | null;
  /** An open hide on that listing. */
  activeHide: { id: string; kind: "policy" | "reports" | "risk"; reasons: string[] } | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Parse the RPC payload. Returns null when anything the gate depends on is
 * missing or malformed — the caller treats null as "gate unavailable" and holds,
 * so a schema surprise can never be read as "no caps apply".
 */
export function parseSellerGateState(payload: unknown): SellerGateState | null {
  const root = asRecord(payload);
  const vendor = asRecord(root?.vendor);
  const plan = asRecord(root?.plan);
  const probation = asRecord(root?.probation);
  const caps = asRecord(probation?.caps);
  if (!root || !vendor || !plan || !probation || !caps) return null;

  const vendorId = asString(vendor.id);
  const status = asString(vendor.status);
  const listingCap = asNumber(plan.listing_cap);
  const listingRows = asNumber(plan.listing_rows);
  const maxLiveListings = asNumber(caps.max_live_listings);
  const maxNewListingsPerDay = asNumber(caps.max_new_listings_per_day);
  const maxPrice = asNumber(caps.max_price);
  const minDelivered = asNumber(caps.graduation_min_delivered_orders);
  const minDays = asNumber(caps.graduation_min_days);
  const liveListings = asNumber(probation.live_listings);
  const newListings24h = asNumber(probation.new_listings_24h);
  const deliveredOrders = asNumber(probation.delivered_orders);

  if (
    vendorId === null ||
    status === null ||
    listingCap === null ||
    listingRows === null ||
    maxLiveListings === null ||
    maxNewListingsPerDay === null ||
    maxPrice === null ||
    minDelivered === null ||
    minDays === null ||
    liveListings === null ||
    newListings24h === null ||
    deliveredOrders === null ||
    typeof probation.tracked !== "boolean" ||
    typeof probation.active !== "boolean" ||
    typeof root.identity_verified !== "boolean"
  ) {
    return null;
  }

  const product = asRecord(root.product);
  const hide = asRecord(root.active_hide);
  const hideKind = asString(hide?.kind);

  return {
    vendor: {
      id: vendorId,
      status,
      ownerUserId: asString(vendor.owner_user_id),
      ownerType: asString(vendor.owner_type) ?? "vendor",
      sellerTier: asString(vendor.seller_tier) ?? "launch",
    },
    identityVerified: root.identity_verified,
    plan: { listingCap, listingRows },
    probation: {
      tracked: probation.tracked,
      active: probation.active,
      startedAt: asString(probation.started_at),
      ageDays: asNumber(probation.age_days) ?? 0,
      caps: {
        maxLiveListings,
        maxNewListingsPerDay,
        maxPrice,
        graduationMinDeliveredOrders: minDelivered,
        graduationMinDays: minDays,
      },
      liveListings,
      newListings24h,
      deliveredOrders,
    },
    product:
      product && asString(product.id)
        ? {
            id: asString(product.id) as string,
            vendorId: asString(product.vendor_id),
            approvalStatus: asString(product.approval_status) ?? "draft",
          }
        : null,
    activeHide:
      hide && asString(hide.id) && (hideKind === "policy" || hideKind === "reports" || hideKind === "risk")
        ? {
            id: asString(hide.id) as string,
            kind: hideKind,
            reasons: Array.isArray(hide.reasons) ? hide.reasons.filter((r): r is string => typeof r === "string") : [],
          }
        : null,
  };
}

/** What a store still has to do to leave probation. For the seller's dashboard. */
export interface ProbationProgress {
  identityVerified: boolean;
  deliveredOrders: number;
  deliveredOrdersNeeded: number;
  ageDays: number;
  ageDaysNeeded: number;
  liveListings: number;
  liveListingsCap: number;
}

export function probationProgress(state: SellerGateState): ProbationProgress | null {
  if (!state.probation.active) return null;
  return {
    identityVerified: state.identityVerified,
    deliveredOrders: state.probation.deliveredOrders,
    deliveredOrdersNeeded: state.probation.caps.graduationMinDeliveredOrders,
    ageDays: state.probation.ageDays,
    ageDaysNeeded: state.probation.caps.graduationMinDays,
    liveListings: state.probation.liveListings,
    liveListingsCap: state.probation.caps.maxLiveListings,
  };
}
