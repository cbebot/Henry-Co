import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

/**
 * V3-05 — account Jobs route fallback.
 *
 * AccountRouteLoading now renders a content-shaped StructuredSkeleton;
 * the previous theater props ("Loading Jobs" + "Refreshing recruiter
 * movement...") were dropped from source.
 */
export default function JobsLoading() {
  return <AccountRouteLoading title="Jobs" />;
}
