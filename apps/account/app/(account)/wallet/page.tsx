import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import {
  HeroCard,
  NextStepRow,
  MetricStrip,
  EmptyStateCard,
  DivisionLanding,
  type HeroCardTile,
  type MetricStripCell,
} from "@henryco/dashboard-shell/surfaces";

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
import { reconcileWalletTopupsForUser } from "@/lib/wallet-topup-port";
import { getVerificationState } from "@/lib/verification";
import {
  isPendingWithdrawalStatus,
  LEGACY_WITHDRAWAL_REQUEST_REFERENCE_TYPE,
} from "@/lib/wallet-storage";

import "@/components/wallet/styles.css";
import { ActivityFeed } from "@/components/wallet/ActivityFeed";
import WalletCreditedToast from "@/components/wallet/WalletCreditedToast";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";
import { QuickActions } from "@/components/wallet/QuickActions";
import { SpendStrip } from "@/components/wallet/SpendStrip";
import { TrustLadder } from "@/components/wallet/TrustLadder";
import { formatKoboMajor, type WalletTransaction } from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

/**
 * Wallet landing — the premium-feel anchor for the customer dashboard.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2A).
 *
 * Composition (top → bottom):
 *   1. <HeroCard variant="paired" tone={state}> — available balance is the
 *      headline value; 3 tiles for verified/pending-funding/pending-withdrawal;
 *      side panel summarises the trust-ladder readiness.
 *   2. <NextStepRow> — when pending funding without proof OR identity blocks
 *      withdrawal, the highest-impact next move surfaces here.
 *   3. <MetricStrip> — quick glance over pending operations + available cell
 *      (preserves PendingOpsTiles intent in a primitive shape).
 *   4. Sections — Actions, Flow (spend strip + trust ladder), Funding
 *      requests (conditional), Activity.
 *
 * State picker (page-local):
 *   - empty:     wallet has zero history and nothing pending.
 *   - attention: pending funding without proof OR identity-blocked withdrawal.
 *   - active:    pending funding or withdrawal in flight.
 *   - calm:      verified balance with no pending operations.
 */
export default async function WalletPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.wallet;

  // V3-15-JOB-B: project any confirmed card/bank/USSD top-up onto the wallet
  // before reading balance — idempotent, so a buyer returning from hosted
  // checkout sees their credit immediately (and it never double-credits).
  // V3-FEEDBACK-01: when THIS load credited (provider-confirmed, idempotent —
  // a replay reports zero), acknowledge it through the unified toast + chime.
  let creditedKobo = 0;
  try {
    const credited = await reconcileWalletTopupsForUser(user.id);
    creditedKobo = credited.creditedCount > 0 ? credited.creditedKobo : 0;
  } catch {
    /* self-healing: a transient failure retries on the next wallet load */
  }

  // DASH-RESILIENCE: barrier each wallet read independently. A single rejected
  // Supabase read (e.g. a connection drop under load) must degrade that one
  // section, never collapse the whole page into the V3-10 "Reference: …" error
  // boundary. getVerificationState is reject-safe at source; the rest are
  // barriered here with safe fallbacks. Mirrors the shell layout's allSettled.
  const [verification, settled] = await Promise.all([
    getVerificationState(user.id),
    Promise.allSettled([
      getWalletFundingContext(user.id),
      getWithdrawalRequests(user.id),
      getProfile(user.id),
      getWalletTransactions(user.id, 50),
      getPayoutMethods(user.id),
      getWithdrawalPinConfigured(user.id),
    ]),
  ]);
  const [fundingR, withdrawalR, profileR, transactionsR, payoutR, pinR] = settled;

  const funding = fundingR.status === "fulfilled" ? fundingR.value : null;
  const wallet =
    funding?.wallet ?? { id: null, balance_kobo: 0, currency: "NGN", is_active: true };
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

  const balanceKobo = Number(wallet.balance_kobo) || 0;
  const pendingWithdrawalKobo = getPendingWithdrawalHoldKobo(withdrawalRequests as never);
  const availableBalanceKobo = Math.max(0, balanceKobo - pendingWithdrawalKobo);
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
  // Funding requests awaiting proof — the highest-friction status.
  const fundingAwaitingProof = fundingRequests.find((r) => {
    const status = String(r.status || "");
    return !r.proof_url && status !== "completed" && status !== "verified";
  }) ?? null;

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
    }));

  const verificationLabel =
    verification.status === "verified"
      ? copy.trust.verificationLabels.verified
      : verification.status === "pending"
        ? copy.trust.verificationLabels.pending
        : verification.status === "rejected"
          ? copy.trust.verificationLabels.rejected
          : copy.trust.verificationLabels.notSubmitted;

  // ── State picker ─────────────────────────────────────────────────
  // attention beats active: a pending funding without proof OR an identity
  // block on withdrawal is the worst friction we want to surface.
  const verificationBlocksWithdrawal = verification.status !== "verified";
  const heroState: "empty" | "calm" | "active" | "attention" =
    balanceKobo === 0 &&
    pending_kobo === 0 &&
    pendingWithdrawalKobo === 0 &&
    transactions.length === 0
      ? "empty"
      : fundingAwaitingProof !== null ||
          (verificationBlocksWithdrawal && pendingWithdrawalCount > 0)
        ? "attention"
        : pendingFundingCount > 0 || pendingWithdrawalCount > 0
          ? "active"
          : "calm";

  const currency = wallet.currency || "NGN";

  // ── HeroCard composition ─────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.hero.tiles.verifiedLabel,
      value: `₦${formatKoboMajor(balanceKobo)}`,
      foot: copy.hero.tiles.verifiedFoot,
    },
    {
      label: copy.hero.tiles.pendingFundingLabel,
      value: `₦${formatKoboMajor(pending_kobo)}`,
      foot: copy.hero.tiles.pendingFundingFoot,
      tone: pending_kobo > 0 ? "warning" : "default",
    },
    {
      label: copy.hero.tiles.pendingWithdrawalLabel,
      value: pendingWithdrawalKobo > 0 ? `₦${formatKoboMajor(pendingWithdrawalKobo)}` : "—",
      foot: copy.hero.tiles.pendingWithdrawalFoot,
      tone: pendingWithdrawalKobo > 0 ? "active" : "default",
    },
  ];

  // ── NextStep picker ──────────────────────────────────────────────
  // Highest-priority: upload proof for an awaiting-proof funding request.
  // Otherwise: verify identity to unlock withdrawals.
  let nextStep: React.ReactNode = null;
  if (fundingAwaitingProof) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.pendingOps.fundingKicker}
        title={
          fundingAwaitingProof.reference
            ? `${copy.funding.awaitingProof} · ${fundingAwaitingProof.reference}`
            : copy.funding.awaitingProof
        }
        detail={copy.pendingOps.fundingDescSingular.replaceAll("{count}", "1")}
        cta={{
          label: copy.pendingOps.fundingCta,
          href: `/wallet/funding/${fundingAwaitingProof.id}`,
        }}
      />
    );
  } else if (verificationBlocksWithdrawal && pendingWithdrawalCount > 0) {
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.trust.heading}
        title={copy.trust.identityTitle}
        detail={verificationLabel}
        cta={{ label: copy.trust.identityCta, href: "/verification" }}
      />
    );
  }

  // ── MetricStrip: compact pending-ops glance ──────────────────────
  const metricCells: ReadonlyArray<MetricStripCell> = [
    {
      label: copy.pendingOps.fundingKicker,
      value: `₦${formatKoboMajor(pending_kobo)}`,
      tone: pending_kobo > 0 ? "warning" : "default",
      href: "/wallet/funding",
    },
    {
      label: copy.pendingOps.withdrawalKicker,
      value:
        pendingWithdrawalKobo > 0 ? `₦${formatKoboMajor(pendingWithdrawalKobo)}` : "—",
      tone: pendingWithdrawalKobo > 0 ? "default" : "default",
      href: "/wallet/withdrawals",
    },
    {
      label: copy.hero.availableLabel,
      value: `₦${formatKoboMajor(availableBalanceKobo)}`,
      tone: availableBalanceKobo > 0 ? "success" : "default",
    },
  ];

  const heroBlurb =
    region.settlementNote || copy.hero.settlementFallback;

  // ── Sections ─────────────────────────────────────────────────────
  const sections = [
    {
      id: "wal-actions",
      title: copy.sections.actionsTitle,
      meta: copy.sections.actionsMeta,
      content: <QuickActions copy={copy.quickActions} />,
    },
    {
      id: "wal-flow",
      title: copy.sections.flowTitle,
      meta: copy.sections.flowMeta,
      content: (
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
      ),
    },
    ...(fundingRequests.length > 0
      ? [
          {
            id: "wal-funding",
            title: copy.sections.fundingTitle,
            meta: formatAccountTemplate(copy.sections.fundingMetaTemplate, {
              count: pendingFundingCount,
            }),
            content: (
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
            ),
          },
        ]
      : []),
    {
      id: "wal-activity",
      title: copy.sections.activityTitle,
      meta:
        transactions.length === 0
          ? copy.activity.emptyTitle
          : formatAccountTemplate(copy.sections.activityMetaTemplate, {
              count: Math.min(transactions.length, 50),
            }),
      content:
        transactions.length === 0 ? (
          <EmptyStateCard
            kicker={copy.hero.eyebrow}
            title={copy.activity.emptyTitle}
            body={copy.activity.emptyBody}
          />
        ) : (
          <ActivityFeed transactions={transactions} copy={copy.activity} />
        ),
    },
  ];

  return (
    <DivisionLanding
      className="acct-wal acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroState}
          eyebrow={copy.hero.eyebrow}
          headline={`₦${formatKoboMajor(availableBalanceKobo)}`}
          blurb={heroBlurb}
          ariaLabel={copy.hero.ariaLabel}
          ctaPrimary={{ label: copy.hero.ctas.fund, href: "/wallet/funding" }}
          ctaSecondary={{ label: copy.hero.ctas.withdraw, href: "/wallet/withdrawals" }}
          tiles={tiles}
          side={{
            kicker: copy.hero.availableLabel,
            title: `${copy.hero.availableLabel} · ${currency}`,
            body: copy.hero.tiles.verifiedFoot,
          }}
        />
      }
      nextStep={nextStep}
      metrics={
        <MetricStrip cells={metricCells} ariaLabel={copy.sections.pendingTitle} />
      }
      sections={sections}
      footer={
        <>
          <RouteLiveRefresh />
          {creditedKobo > 0 ? (
            <WalletCreditedToast creditedKobo={creditedKobo} nonce={crypto.randomUUID()} />
          ) : null}
        </>
      }
    />
  );
}
