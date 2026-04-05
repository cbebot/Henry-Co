import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

export default function WalletLoading() {
  return (
    <AccountRouteLoading
      title="Loading wallet"
      description="Refreshing verified balance, pending funding, and ledger history."
    />
  );
}
