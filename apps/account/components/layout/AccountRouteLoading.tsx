import AccountRouteLoader from "./AccountRouteLoader";

/**
 * AccountRouteLoading — back-compat shim.
 *
 * Previously rendered a generic four-card `StructuredSkeleton` on every
 * account route (the grey-placeholder "warmup" the owner flagged as weak).
 * It now delegates to the dedicated, branded `AccountRouteLoader` — one
 * honest Henry Onyx loading moment (calm gold rail → breathing H·Onyx
 * mark, no timer, no fake progress, no copy). Kept as a shim so the
 * ~dozen existing `<AccountRouteLoading title=… />` call sites (section
 * `loading.tsx` files + the layout Suspense fallback) upgrade in one move;
 * the `title`/`description` props are accepted and ignored at the visible
 * layer.
 */
export default function AccountRouteLoading(props: {
  title?: string;
  description?: string;
}) {
  return <AccountRouteLoader {...props} />;
}
