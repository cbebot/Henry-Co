import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

/**
 * V3-05 — account Studio route fallback.
 *
 * AccountRouteLoading now renders a content-shaped StructuredSkeleton;
 * the previous theater props ("Loading Studio" + "Pulling the latest
 * project movement, payment state, and creative workspace context.")
 * were dropped from source.
 */
export default function StudioLoading() {
  return <AccountRouteLoading title="Studio" />;
}
