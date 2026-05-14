import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import {
  getPayoutMethods,
  getPendingWithdrawalHoldKobo,
  getProfile,
  getWalletFundingContext,
  getWalletTransactions,
  getWithdrawalPinConfigured,
  getWithdrawalRequests,
} from "@/lib/account-data";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import { getVerificationState } from "@/lib/verification";
import {
  isPendingWithdrawalStatus,
  LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE,
} from "@/lib/wallet-storage";

import "@/components/wallet/styles.css";
import { ActivityFeed } from "@/components/wallet/ActivityFeed";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";
import { HeroBalance } from "@/components/wallet/HeroBalance";
import { PendingOpsTiles } from "@/components/wallet/PendingOpsTile";
import { QuickActions } from "@/components/wallet/QuickActions";
import { SpendStrip } from "@/components/wallet/SpendStrip";
import { TrustLadder } from "@/components/wallet/TrustLadder";
import type { WalletTransaction } from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await requireAccountUser();
  const [
    { wallet, pending_kobo, requests },
    withdrawalRequests,
    profile,
    rawTransactions,
    payoutMethods,
    pinConfigured,
    verification,
  ] = await Promise.all([
    getWalletFundingContext(user.id),
    getWithdrawalRequests(user.id),
    getProfile(user.id),
    getWalletTransactions(user.id, 50),
    getPayoutMethods(user.id),
    getWithdrawalPinConfigured(user.id),
    getVerificationState(user.id),
  ]);

  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  const balanceKobo = Number(wallet.balance_kobo) || 0;
  const pendingWithdrawalKobo = getPendingWithdrawalHoldKobo(withdrawalRequests as never);
  const availableBalanceKobo = Math.max(0, balanceKobo - pendingWithdrawalKobo);
  const pendingWithdrawalCount = (
    withdrawalRequests as Array<Record<string, unknown>>
  ).filter((r) => isPendingWithdrawalStatus(String(r.status || ""))).length;
  const pendingFundingCount = (requests as Array<Record<string, unknown>>).filter(
    (r) => {
      const s = String(r.status || "");
      return s !== "completed" && s !== "verified";
    },
  ).length;

  const transactions: WalletTransaction[] = (rawTransactions as Array<Record<string, unknown>>)
    .filter((t) => {
      const refType = String(t.reference_type || "");
      const status = String(t.status || "");
      // Hide noisy pending funding-request entries until they settle.
      if (
        refType === "wallet_funding_request" &&
        status !== "completed" &&
        status !== "verified"
      ) {
        return false;
      }
      if (
        refType === LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE &&
        isPendingWithdrawalStatus(status)
      ) {
        return false;
      }
      return true;
    })
    .map((t) => ({
      id: String(t.id ?? ""),
      type: String(t.type ?? ""),
      description: String(t.description ?? ""),
      amount_kobo: Number(t.amount_kobo) || 0,
      division: (t.division as string | null) ?? null,
      created_at: String(t.created_at ?? ""),
      status: String(t.status ?? ""),
      reference_type: (t.reference_type as string | null) ?? null,
    }));

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <HeroBalance
        balanceKobo={balanceKobo}
        pendingFundingKobo={pending_kobo}
        pendingWithdrawalKobo={pendingWithdrawalKobo}
        availableKobo={availableBalanceKobo}
        currency={wallet.currency || "NGN"}
        settlementNote={region.settlementNote}
      />
      <section className="acct-wal__section" aria-labelledby="acct-wal-actions-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-actions-head" className="acct-wal__section-title hc-h3 acct-display">
            Wallet actions
          </h2>
          <span className="acct-wal__section-meta">Add, withdraw, pay, reconcile</span>
        </div>
        <QuickActions />
      </section>
      <section className="acct-wal__section" aria-labelledby="acct-wal-pending-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-pending-head" className="acct-wal__section-title hc-h3 acct-display">
            Pending operations
          </h2>
          <span className="acct-wal__section-meta">Kept separate from your available balance</span>
        </div>
        <PendingOpsTiles
          pendingFundingKobo={pending_kobo}
          pendingFundingCount={pendingFundingCount}
          pendingWithdrawalKobo={pendingWithdrawalKobo}
          pendingWithdrawalCount={pendingWithdrawalCount}
        />
      </section>
      <section className="acct-wal__section" aria-labelledby="acct-wal-flow-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-flow-head" className="acct-wal__section-title hc-h3 acct-display">
            How your money flows
          </h2>
          <span className="acct-wal__section-meta">Last 30 days · last 6 months · by division</span>
        </div>
        <div className="acct-wal__columns">
          <SpendStrip transactions={transactions} />
          <TrustLadder
            verificationLabel={
              verification.status === "verified"
                ? "Identity verified"
                : verification.status === "pending"
                  ? "Verification in review"
                  : verification.status === "rejected"
                    ? "Verification needs another submission"
                    : "Identity not yet submitted"
            }
            verificationDone={verification.status === "verified"}
            payoutMethodCount={(payoutMethods as Array<unknown>).length}
            withdrawalPinConfigured={pinConfigured}
          />
        </div>
      </section>
      {(requests as Array<unknown>).length > 0 ? (
        <section className="acct-wal__section" aria-labelledby="acct-wal-funding-head">
          <div className="acct-wal__section-head">
            <h2 id="acct-wal-funding-head" className="acct-wal__section-title hc-h3 acct-display">
              Recent funding requests
            </h2>
            <span className="acct-wal__section-meta">{pendingFundingCount} in review</span>
          </div>
          <div className="acct-wal__funding-list">
            {(requests as Array<{
              id: string;
              amount_kobo: number;
              status: string;
              reference: string | null;
              proof_url?: string | null;
              created_at: string;
            }>)
              .slice(0, 4)
              .map((request) => (
                <FundingRequestRow key={request.id} request={request} />
              ))}
          </div>
        </section>
      ) : null}
      <section className="acct-wal__section" aria-labelledby="acct-wal-activity-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-activity-head" className="acct-wal__section-title hc-h3 acct-display">
            Activity
          </h2>
          <span className="acct-wal__section-meta">Latest {Math.min(transactions.length, 50)}</span>
        </div>
        <ActivityFeed transactions={transactions} />
      </section>
    </div>
  );
}
