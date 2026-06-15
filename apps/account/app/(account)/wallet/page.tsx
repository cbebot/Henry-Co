import Link from "next/link";

import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";

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
import { convertWalletDisplay } from "@/lib/wallet-currency";
import { reconcileWalletTopupsForUser } from "@/lib/wallet-topup-port";
import { getVerificationState } from "@/lib/verification";
import {
  isPendingWithdrawalStatus,
  LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE,
} from "@/lib/wallet-storage";

import "@/components/wallet/styles.css";
import { WalletVault } from "@/components/wallet/WalletVault";
import { BalanceTrend } from "@/components/wallet/BalanceTrend";
import { CashflowPanel } from "@/components/wallet/CashflowPanel";
import { FrozenBanner } from "@/components/wallet/FrozenBanner";
import { StatementLedger } from "@/components/wallet/StatementLedger";
import { TrustLadder } from "@/components/wallet/TrustLadder";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";
import WalletCreditedToast from "@/components/wallet/WalletCreditedToast";
import {
  cashflowWindow,
  runningBalanceSeries,
  type WalletTransaction,
} from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

/**
 * Wallet — "Onyx Ledger" (V3-WALLET rebuild).
 *
 * A private-bank money console, not a grid of dashboard cards:
 *   1. FrozenBanner   — honest hold state (only when frozen).
 *   2. WalletVault    — engraved-onyx statement header; the available balance in
 *                       NGN (settlement truth) + an approximate line in the
 *                       user's currency when a live rate exists.
 *   3. Attention      — the single highest-friction next move (proof / identity).
 *   4. Insight band   — running-balance trend (balance_after_kobo) + cashflow
 *                       (money IN and OUT) + withdrawal readiness.
 *   5. Funding lane   — recent funding requests in review (when present).
 *   6. Statement      — date-grouped, filterable ledger (All / In / Out).
 *
 * MONEY INVARIANT: read-only over money. Every figure is rendered from
 * server-confirmed kobo; nothing is computed or credited here. The reconciler
 * (idempotent, self-healing) is the only money write, and it runs once per load.
 */
export default async function WalletPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale).wallet;

  // Project any confirmed card/bank/USSD top-up onto the wallet before reading
  // balance — idempotent, so a returning buyer sees their credit and it never
  // double-credits. A replay reports zero (→ no toast).
  let creditedKobo = 0;
  try {
    const credited = await reconcileWalletTopupsForUser(user.id);
    creditedKobo = credited.creditedCount > 0 ? credited.creditedKobo : 0;
  } catch {
    /* self-healing: a transient failure retries on the next wallet load */
  }

  // DASH-RESILIENCE: barrier each read independently so one Supabase drop
  // degrades a section, never the whole page.
  const [verification, settled] = await Promise.all([
    getVerificationState(user.id),
    Promise.allSettled([
      getWalletFundingContext(user.id),
      getWithdrawalRequests(user.id),
      getProfile(user.id),
      getWalletTransactions(user.id, 60),
      getPayoutMethods(user.id),
      getWithdrawalPinConfigured(user.id),
    ]),
  ]);
  const [fundingR, withdrawalR, profileR, transactionsR, payoutR, pinR] = settled;

  const funding = fundingR.status === "fulfilled" ? fundingR.value : null;
  const walletRow = (funding?.wallet ?? {
    id: null,
    balance_kobo: 0,
    currency: "NGN",
    is_active: true,
  }) as {
    id: string | null;
    balance_kobo: number;
    currency: string;
    is_active?: boolean;
    frozen_at?: string | null;
    frozen_reason?: string | null;
  };
  const pending_kobo = funding?.pending_kobo ?? 0;
  const requests = funding?.requests ?? [];
  const withdrawalRequests = withdrawalR.status === "fulfilled" ? withdrawalR.value : [];
  const profile = profileR.status === "fulfilled" ? profileR.value : null;
  const rawTransactions = transactionsR.status === "fulfilled" ? transactionsR.value : [];
  const payoutMethods = payoutR.status === "fulfilled" ? payoutR.value : [];
  const pinConfigured = pinR.status === "fulfilled" ? pinR.value : false;

  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  const balanceKobo = Number(walletRow.balance_kobo) || 0;
  const heldKobo = getPendingWithdrawalHoldKobo(withdrawalRequests as never);
  const availableBalanceKobo = Math.max(0, balanceKobo - heldKobo);
  const currencyTruth = walletRow.currency || "NGN";
  const frozen = walletRow.is_active === false || Boolean(walletRow.frozen_at);

  const pendingWithdrawalCount = (
    withdrawalRequests as Array<Record<string, unknown>>
  ).filter((r) => isPendingWithdrawalStatus(String(r.status || ""))).length;

  const fundingRequests = requests as Array<{
    id: string;
    amount_kobo: number;
    status: string;
    reference: string | null;
    proof_url?: string | null;
    created_at: string;
  }>;
  const pendingFundingCount = fundingRequests.filter((r) => {
    const s = String(r.status || "");
    return s !== "completed" && s !== "verified";
  }).length;
  const fundingAwaitingProof =
    fundingRequests.find((r) => {
      const status = String(r.status || "");
      return !r.proof_url && status !== "completed" && status !== "verified";
    }) ?? null;

  // Completed/visible transactions for the trend, cashflow and statement.
  const transactions: WalletTransaction[] = (rawTransactions as Array<Record<string, unknown>>)
    .filter((t) => {
      const refType = String(t.reference_type || "");
      const status = String(t.status || "");
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
      balance_after_kobo:
        t.balance_after_kobo == null ? null : Number(t.balance_after_kobo),
    }));

  // Display-currency overlay (approximate; NGN stays the settlement truth).
  // Resolves to null — NGN only — when the target is NGN or no live rate exists.
  const approxAvailable = await convertWalletDisplay(availableBalanceKobo, region.currencyCode);

  const series = runningBalanceSeries(transactions);
  const cashflow = cashflowWindow(transactions, 30);

  const verificationDone = verification.status === "verified";
  const verificationLabel = verificationDone
    ? copy.trust.verificationLabels.verified
    : verification.status === "pending"
      ? copy.trust.verificationLabels.pending
      : verification.status === "rejected"
        ? copy.trust.verificationLabels.rejected
        : copy.trust.verificationLabels.notSubmitted;

  // The single highest-friction next move.
  const attention = fundingAwaitingProof
    ? {
        title: copy.alert.proofTitle,
        desc: formatAccountTemplate(copy.alert.proofDescTemplate, {
          reference: fundingAwaitingProof.reference ?? "",
        }),
        cta: copy.alert.proofCta,
        href: `/wallet/funding/${fundingAwaitingProof.id}`,
      }
    : !verificationDone && pendingWithdrawalCount > 0
      ? {
          title: copy.alert.identityTitle,
          desc: formatAccountTemplate(copy.alert.identityDescTemplate, {
            label: verificationLabel,
          }),
          cta: copy.alert.identityCta,
          href: "/verification",
        }
      : null;

  return (
    <div className="acct-wal acct-fade-in">
      {frozen ? (
        <FrozenBanner reason={walletRow.frozen_reason} copy={copy.frozen} />
      ) : null}

      <WalletVault
        availableKobo={availableBalanceKobo}
        balanceKobo={balanceKobo}
        heldKobo={heldKobo}
        arrivingKobo={pending_kobo}
        currencyTruth={currencyTruth}
        approxAvailable={approxAvailable}
        frozen={frozen}
        copy={copy.vault}
      />

      <nav className="acct-wal__quicklinks" aria-label={copy.quickActions.ariaLabel}>
        <Link className="acct-wal__quicklink" href="/payments">
          {copy.quickActions.paymentsLabel}
        </Link>
        <Link className="acct-wal__quicklink" href="/invoices">
          {copy.quickActions.receiptsLabel}
        </Link>
      </nav>

      {attention ? (
        <div className="acct-wal__alert">
          <span className="acct-wal__alert-dot" aria-hidden="true" />
          <div className="acct-wal__alert-meta">
            <span className="acct-wal__alert-title">{attention.title}</span>
            <span className="acct-wal__alert-desc">{attention.desc}</span>
          </div>
          <Link className="acct-wal__alert-cta" href={attention.href}>
            {attention.cta}
          </Link>
        </div>
      ) : null}

      <div className="acct-wal__insight">
        <BalanceTrend series={series} copy={copy.trend} />
        <div className="acct-wal__insight-stack">
          <CashflowPanel cashflow={cashflow} copy={copy.cashflow} />
          <TrustLadder
            verificationLabel={verificationLabel}
            verificationDone={verificationDone}
            payoutMethodCount={(payoutMethods as Array<unknown>).length}
            withdrawalPinConfigured={pinConfigured}
            copy={copy.trust}
          />
        </div>
      </div>

      {fundingRequests.length > 0 ? (
        <section className="acct-wal__section">
          <div className="acct-wal__section-head">
            <h2 className="acct-wal__section-title acct-display">{copy.sections.fundingTitle}</h2>
            <span className="acct-wal__section-meta">
              {formatAccountTemplate(copy.sections.fundingMetaTemplate, {
                count: pendingFundingCount,
              })}
            </span>
          </div>
          <div className="acct-wal__funding-list">
            {fundingRequests.slice(0, 4).map((request) => (
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

      {transactions.length === 0 ? (
        <div className="acct-wal__empty">
          <span className="acct-wal__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18M7 15h4" />
            </svg>
          </span>
          <h2 className="acct-wal__empty-title acct-display">{copy.activity.emptyTitle}</h2>
          <p className="acct-wal__empty-body">{copy.activity.emptyBody}</p>
        </div>
      ) : (
        <StatementLedger
          transactions={transactions}
          copy={{
            title: copy.statement.title,
            metaTemplate: copy.statement.metaTemplate,
            filterAll: copy.statement.filterAll,
            filterIn: copy.statement.filterIn,
            filterOut: copy.statement.filterOut,
            today: copy.statement.today,
            yesterday: copy.statement.yesterday,
            runningLabel: copy.statement.runningLabel,
            emptyFiltered: copy.statement.emptyFiltered,
            ariaLabel: copy.statement.ariaLabel,
            statusLabels: copy.statusLabels,
          }}
        />
      )}

      <RouteLiveRefresh />
      {creditedKobo > 0 ? (
        <WalletCreditedToast creditedKobo={creditedKobo} nonce={crypto.randomUUID()} />
      ) : null}
    </div>
  );
}
