// V3-FIRE-MARKETPLACE-FIX — service_role multiplexer authorization predicates.
//
// Every marketplace write flows through the single `service_role` route handler
// (`app/api/marketplace/route.ts`) and the force-dynamic public order surfaces
// (`/track`, `/pay`). `service_role` bypasses RLS, so the database is NOT a
// backstop for these paths — ownership/authorization MUST be proven here in
// TypeScript. Concentrating the logic in pure, unit-tested predicates stops the
// per-`case` drift that let `dispute_create` ship without the ownership check
// its sibling `order_confirm_completion` already carried (finding F-02).
//
// Pure module: imports only `normalizeEmail` (the canonical, isomorphic helper)
// and no `server-only` surface, so it runs under `tsx --test`.
import { normalizeEmail } from "@henryco/config";

export type OrderOwnershipRow =
  | {
      user_id?: string | null;
      normalized_email?: string | null;
    }
  | null
  | undefined;

export type OwnershipViewer =
  | {
      user: { id: string; email: string | null } | null;
    }
  | null
  | undefined;

/**
 * True only when `viewer` is the authenticated owner of `order`.
 *
 * A bound `user_id` match, or — ONLY for orders without a bound user — a
 * normalized-email match. An unauthenticated viewer or a missing order is never
 * an owner. Empty emails on both sides must never be treated as equal (that
 * would grant every order with no email to every user with no email).
 *
 * The email branch is gated on `!order.user_id`: if an order is bound to a
 * specific user, ownership is decided SOLELY by that id — we never fall through
 * to an email match, so a future code path that set `normalized_email` from
 * buyer-supplied input could not be turned into a takeover.
 */
export function isMarketplaceOrderOwner(order: OrderOwnershipRow, viewer: OwnershipViewer): boolean {
  if (!order || !viewer?.user) return false;
  if (order.user_id) {
    return Boolean(viewer.user.id) && order.user_id === viewer.user.id;
  }
  const orderEmail = normalizeEmail(order.normalized_email);
  const viewerEmail = normalizeEmail(viewer.user.email);
  return Boolean(orderEmail && viewerEmail && orderEmail === viewerEmail);
}

export type ProductSlugRow =
  | {
      id?: string | null;
      vendor_id?: string | null;
    }
  | null
  | undefined;

export type VendorProductUpsertDecision =
  | { ok: true }
  | { ok: false; code: "missing-vendor-scope" | "listing-conflict" };

/**
 * Guards the `onConflict:"slug"` upsert in `vendor_product_upsert` (finding
 * F-04). `marketplace_products.slug` is GLOBALLY unique, so an upsert keyed on a
 * slug that already belongs to a different vendor would overwrite that row and
 * reassign its `vendor_id` to the caller — a cross-vendor product takeover.
 *
 * Allow the upsert only when (a) a concrete vendor scope resolved for the caller
 * (never a silent fallback to some other vendor) and (b) the slug is either
 * unused or already owned by that same vendor. A slug owned by a different
 * vendor — or by the company (`vendor_id` null) — is rejected outright.
 */
export function resolveVendorProductUpsert(input: {
  vendorScopeId: string | null | undefined;
  existing: ProductSlugRow;
}): VendorProductUpsertDecision {
  const { vendorScopeId, existing } = input;
  if (!vendorScopeId) return { ok: false, code: "missing-vendor-scope" };
  if (existing?.id && existing.vendor_id !== vendorScopeId) {
    return { ok: false, code: "listing-conflict" };
  }
  return { ok: true };
}

export type CartOwnershipRow =
  | {
      user_id?: string | null;
      session_token?: string | null;
    }
  | null
  | undefined;

/**
 * True when the caller owns `cart` — by authenticated `user_id` or by the guest
 * `session_token` cookie. Mirrors `/api/cart`'s `verifyCartItemOwnership` so the
 * `cart_update` multiplexer case can no longer mutate arbitrary cart items by id
 * (finding F-05).
 */
export function cartItemOwnerMatches(
  cart: CartOwnershipRow,
  viewer: OwnershipViewer,
  sessionToken: string | null | undefined,
): boolean {
  if (!cart) return false;
  if (viewer?.user && cart.user_id && String(cart.user_id) === viewer.user.id) return true;
  if (sessionToken && cart.session_token && String(cart.session_token) === sessionToken) return true;
  return false;
}
