import Link from "next/link";
import { ArrowRight, Building2, Wallet } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getWalletFundingContext } from "@/lib/account-data";
import {
  formatPricingAmount,
  formatSettlementAmount,
  resolveAccountCurrencyTruth,
} from "@/lib/currency-truth";
import PageHeader from "@/components/layout/PageHeader";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
import FundingRequestForm from "@/components/wallet/FundingRequestForm";
import CopyValueButton from "@/components/ui/CopyValueButton";

export const dynamic = "force-dynamic";

export default async function WalletFundingPage() {
  const user = await requireAccountUser();
  const [data, profile] = await Promise.all([
    getWalletFundingContext(user.id),
    getProfile(user.id),
  ]);
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });
  const walletTruth = resolveAccountCurrencyTruth(region, {
    pricingCurrency: String(data.wallet.currency || "NGN"),
    settlementCurrency: String(data.wallet.settlement_currency || data.wallet.currency || "NGN"),
    baseCurrency: String(data.wallet.base_currency || "NGN"),
    exchangeRateSource:
      typeof data.wallet.exchange_rate_source === "string"
        ? data.wallet.exchange_rate_source
        : null,
    exchangeRateTimestamp:
      typeof data.wallet.exchange_rate_timestamp === "string"
        ? data.wallet.exchange_rate_timestamp
        : null,
  });
  const fundingTruth = resolveAccountCurrencyTruth(region, {
    pricingCurrency: String(data.rail.currency || data.wallet.currency || "NGN"),
    settlementCurrency: String(data.rail.currency || data.wallet.currency || "NGN"),
  });

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <PageHeader
        title="Wallet Funding"
        description="Move funds into your HenryCo wallet through a verification-safe bank transfer flow."
        icon={Wallet}
        actions={
          <Link href="/wallet" className="acct-button-secondary rounded-2xl">
            Back to wallet
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
        <div className="acct-card overflow-hidden">
          <div className="bg-[linear-gradient(140deg,#0F172A_0%,#21435B_58%,#C9A227_100%)] px-6 py-7 text-white">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/70">
              Wallet balance
            </p>
            <p className="mt-3 text-4xl font-semibold">
              {formatSettlementAmount(Number(data.wallet.balance_kobo || 0), walletTruth)}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/72">
              Verified balance is ready to spend. Pending funding sits separately until finance clears the transfer in {fundingTruth.settlementCurrency}.
            </p>
            {!walletTruth.displayMatchesPricing ? (
              <p className="mt-2 max-w-xl text-xs leading-6 text-white/70">
                Display preference remains {walletTruth.displayCurrency}, but no converted wallet amount is shown on this page.
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 border-t border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 sm:grid-cols-2">
            <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
              <p className="acct-kicker">Verified</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                {formatSettlementAmount(Number(data.wallet.balance_kobo || 0), walletTruth)}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
              <p className="acct-kicker">Pending verification</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                {formatSettlementAmount(Number(data.pending_kobo || 0), fundingTruth)}
              </p>
            </div>
          </div>
        </div>

        <div className="acct-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
              <Building2 size={18} />
            </div>
            <div>
              <p className="acct-kicker">Transfer details</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">HenryCo finance account</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Bank</p>
                {data.rail.bankName ? <CopyValueButton value={data.rail.bankName} /> : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{data.rail.bankName || "Pending"}</p>
            </div>
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Account name</p>
                {data.rail.accountName ? <CopyValueButton value={data.rail.accountName} /> : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{data.rail.accountName || "Pending"}</p>
            </div>
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Settlement currency</p>
                <span className="acct-chip acct-chip-blue text-[0.6rem]">{fundingTruth.settlementCurrency}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
                Funding requests settle in {fundingTruth.settlementCurrency}. Display preference {fundingTruth.displayCurrency} does not change the transfer rail.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Account number</p>
                {data.rail.accountNumber ? <CopyValueButton value={data.rail.accountNumber} /> : null}
              </div>
              <p className="mt-2 text-sm font-semibold tracking-[0.12em] text-[var(--acct-ink)]">
                {data.rail.accountNumber || "Pending"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <FundingRequestForm />

      <section className="acct-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="acct-kicker">Recent funding requests</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">Recent requests</h2>
          </div>
        </div>

        {data.requests.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">No funding requests yet</p>
            <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
              The requests you create here will show proof status, reference, and finance verification state.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.requests.map((request) => (
              <Link
                key={request.id}
                href={`/wallet/funding/${request.id}`}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-5 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="acct-chip acct-chip-blue text-[0.6rem]">
                      {request.status.replaceAll("_", " ")}
                    </span>
                    {request.proof_url ? (
                      <span className="acct-chip acct-chip-green text-[0.6rem]">Proof uploaded</span>
                    ) : (
                      <span className="acct-chip acct-chip-orange text-[0.6rem]">Awaiting proof</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">
                    {formatPricingAmount(
                      request.amount_kobo,
                      resolveAccountCurrencyTruth(region, {
                        pricingCurrency: request.pricing_currency,
                        settlementCurrency: request.settlement_currency,
                        baseCurrency: request.base_currency,
                        exchangeRateSource: request.exchange_rate_source,
                        exchangeRateTimestamp: request.exchange_rate_timestamp,
                      })
                    )} · {request.reference || request.id}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
                    Created {new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(request.created_at))}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-gold)]">
                  Open request <ArrowRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
