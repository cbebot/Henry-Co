import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

/**
 * V3-05 — account Learn route fallback.
 *
 * AccountRouteLoading now renders a content-shaped StructuredSkeleton;
 * the previous theater props ("Loading Learn" + "Loading your courses,
 * progress signals, and certificates.") were dropped from source.
 */
export default function LearnLoading() {
  return <AccountRouteLoading title="Learn" />;
}
