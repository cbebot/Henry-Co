import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

/**
 * V3-05 — account Wallet route fallback.
 *
 * AccountRouteLoading now renders a content-shaped StructuredSkeleton;
 * the previous theater props ("Loading wallet" + "Refreshing verified
 * balance, pending funding, and ledger history.") were dropped.
 */
export default function WalletLoading() {
  return <AccountRouteLoading title="Wallet" />;
}
