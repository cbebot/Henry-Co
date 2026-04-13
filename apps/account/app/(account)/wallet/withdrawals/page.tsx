import Link from "next/link";
import { ArrowLeft, Banknote } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import {
  getProfile,
  getPendingWithdrawalHoldKobo,
  getPayoutMethods,
  getWithdrawalPinConfigured,
  getWithdrawalRequests,
  getWalletSummary,
} from "@/lib/account-data";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import PageHeader from "@/components/layout/PageHeader";
import WalletWithdrawalsClient from "@/components/wallet/WalletWithdrawalsClient";

export const dynamic = "force-dynamic";

export default async function WalletWithdrawalsPage() {
  const user = await requireAccountUser();
  const [wallet, methods, requests, pinConfigured, profile] = await Promise.all([
    getWalletSummary(user.id),
    getPayoutMethods(user.id),
    getWithdrawalRequests(user.id),
    getWithdrawalPinConfigured(user.id),
    getProfile(user.id),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  const balanceKobo = Number((wallet as { balance_kobo?: number }).balance_kobo ?? 0);
  const pendingHoldKobo = getPendingWithdrawalHoldKobo(requests as never);
  const availableBalanceKobo = Math.max(0, balanceKobo - pendingHoldKobo);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <PageHeader
        title="Withdrawals"
        description="Request a bank transfer from your available balance. Finance reviews every withdrawal before payout."
        icon={Banknote}
        actions={
          <Link href="/wallet" className="acct-button-secondary inline-flex items-center gap-2 rounded-xl">
            <ArrowLeft size={16} /> Back to wallet
          </Link>
        }
      />

      <WalletWithdrawalsClient
        initialMethods={methods as never}
        initialRequests={requests as never}
        pinConfigured={pinConfigured}
        availableBalanceKobo={availableBalanceKobo}
        pendingHoldKobo={pendingHoldKobo}
        settlementCurrency={wallet.currency || region.settlementCurrency}
        displayCurrency={region.displayCurrency}
        locale={region.locale}
      />
    </div>
  );
}
