/** Session intent after shared-account login (same origin return). TTL prevents stale replays. */

const STORAGE_KEY = "henryco:mp:postAuth";
const DEFAULT_TTL_MS = 15 * 60 * 1000;

export type MarketplacePostAuthIntentV1 =
  | { v: 1; action: "wishlist"; productSlug: string; exp: number }
  | { v: 1; action: "follow"; vendorSlug: string; exp: number }
  | { v: 1; action: "save_for_later"; cartItemId: string; exp: number };

export type MarketplacePostAuthStashInput =
  | { action: "wishlist"; productSlug: string }
  | { action: "follow"; vendorSlug: string }
  | { action: "save_for_later"; cartItemId: string };

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function stashMarketplacePostAuthIntent(intent: MarketplacePostAuthStashInput, ttlMs = DEFAULT_TTL_MS) {
  if (!isBrowser()) return;
  const exp = Date.now() + ttlMs;
  const payload: MarketplacePostAuthIntentV1 =
    intent.action === "wishlist"
      ? { v: 1, action: "wishlist", productSlug: intent.productSlug, exp }
      : intent.action === "follow"
      ? { v: 1, action: "follow", vendorSlug: intent.vendorSlug, exp }
      : { v: 1, action: "save_for_later", cartItemId: intent.cartItemId, exp };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function takeMarketplacePostAuthIntent(): MarketplacePostAuthIntentV1 | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as MarketplacePostAuthIntentV1;
    if (!parsed || parsed.v !== 1 || typeof parsed.exp !== "number") return null;
    if (Date.now() > parsed.exp) return null;
    if (parsed.action === "wishlist" && typeof parsed.productSlug === "string") return parsed;
    if (parsed.action === "follow" && typeof parsed.vendorSlug === "string") return parsed;
    if (parsed.action === "save_for_later" && typeof parsed.cartItemId === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
