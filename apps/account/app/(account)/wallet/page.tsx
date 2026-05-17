import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy } from "@henryco/i18n/server";

import { getAccountAppLocale } from "@/lib/locale-server";
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

function format(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export default async function WalletPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.wallet;
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

  const verificationLabel =
    verification.status === "verified"
      ? copy.trust.verificationLabels.verified
      : verification.status === "pending"
        ? copy.trust.verificationLabels.pending
        : verification.status === "rejected"
          ? copy.trust.verificationLabels.rejected
          : copy.trust.verificationLabels.notSubmitted;

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <HeroBalance
        balanceKobo={balanceKobo}
        pendingFundingKobo={pending_kobo}
        pendingWithdrawalKobo={pendingWithdrawalKobo}
        availableKobo={availableBalanceKobo}
        currency={wallet.currency || "NGN"}
        settlementNote={region.settlementNote || copy.hero.settlementFallback}
        copy={copy.hero}
      />
      <section className="acct-wal__section" aria-labelledby="acct-wal-actions-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-actions-head" className="acct-wal__section-title hc-h3 acct-display">
            {copy.sections.actionsTitle}
          </h2>
          <span className="acct-wal__section-meta">{copy.sections.actionsMeta}</span>
        </div>
        <QuickActions copy={copy.quickActions} />
      </section>
      <section className="acct-wal__section" aria-labelledby="acct-wal-pending-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-pending-head" className="acct-wal__section-title hc-h3 acct-display">
            {copy.sections.pendingTitle}
          </h2>
          <span className="acct-wal__section-meta">{copy.sections.pendingMeta}</span>
        </div>
        <PendingOpsTiles
          pendingFundingKobo={pending_kobo}
          pendingFundingCount={pendingFundingCount}
          pendingWithdrawalKobo={pendingWithdrawalKobo}
          pendingWithdrawalCount={pendingWithdrawalCount}
          copy={copy.pendingOps}
        />
      </section>
      <section className="acct-wal__section" aria-labelledby="acct-wal-flow-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-flow-head" className="acct-wal__section-title hc-h3 acct-display">
            {copy.sections.flowTitle}
          </h2>
          <span className="acct-wal__section-meta">{copy.sections.flowMeta}</span>
        </div>
        <div className="acct-wal__columns">
          <SpendStrip transactions={transactions} copy={copy.spend} />
          <TrustLadder
            verificationLabel={verificationLabel}
            verificationDone={verification.status === "verified"}
            payoutMethodCount={(payoutMethods as Array<unknown>).length}
            withdrawalPinConfigured={pinConfigured}
            copy={copy.trust}
          />
        </div>
      </section>
      {(requests as Array<unknown>).length > 0 ? (
        <section className="acct-wal__section" aria-labelledby="acct-wal-funding-head">
          <div className="acct-wal__section-head">
            <h2 id="acct-wal-funding-head" className="acct-wal__section-title hc-h3 acct-display">
              {copy.sections.fundingTitle}
            </h2>
            <span className="acct-wal__section-meta">
              {format(copy.sections.fundingMetaTemplate, { count: pendingFundingCount })}
            </span>
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
                <FundingRequestRow
                  key={request.id}
                  request={request}
                  copy={copy.funding}
                  statusLabels={copy.statusLabels}
                />
              ))}
          </div>
        </section>
      ) : null}
      <section className="acct-wal__section" aria-labelledby="acct-wal-activity-head">
        <div className="acct-wal__section-head">
          <h2 id="acct-wal-activity-head" className="acct-wal__section-title hc-h3 acct-display">
            {copy.sections.activityTitle}
          </h2>
          <span className="acct-wal__section-meta">
            {format(copy.sections.activityMetaTemplate, { count: Math.min(transactions.length, 50) })}
          </span>
        </div>
        <ActivityFeed transactions={transactions} copy={copy.activity} />
      </section>
    </div>
  );
}
