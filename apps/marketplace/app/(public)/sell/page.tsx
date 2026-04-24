import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, Store, WalletCards } from "lucide-react";
import { PageIntro } from "@/components/marketplace/shell";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";

export const dynamic = "force-dynamic";

export default function SellPage() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Sell on HenryCo"
        title="Selective by design. Built for sellers who lead on trust."
        description="HenryCo Marketplace favours sellers who care about presentation, reliable fulfillment, and honest buyer protection. The bar is explicit on this page; the seller application continues inside your HenryCo account."
        actions={
          <>
            <Link
              href="/sell/pricing"
              className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
            >
              See seller pricing
            </Link>
            <Link
              href="/account/seller-application"
              className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open seller application
            </Link>
            <Link
              href={buildSharedAccountLoginUrl("/account/seller-application")}
              className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Sign in with HenryCo account
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.96fr,1.04fr]">
        <article className="market-panel rounded-[2.2rem] p-6 sm:p-8">
          <p className="market-kicker">Why stronger sellers win here</p>
          <div className="mt-5 space-y-4">
            {[
              {
                icon: BadgeCheck,
                title: "Trust-led positioning",
                body: "Your store gets a visible trust passport instead of being buried in low-quality marketplace clutter.",
              },
              {
                icon: Store,
                title: "Better storefront quality",
                body: "Editorial rails, calmer search, and cleaner product cards help quality stores convert faster.",
              },
              {
                icon: WalletCards,
                title: "Sharper operations",
                body: "Payouts, orders, support, moderation, and stock alerts stay visible in one cleaner workspace.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="market-paper rounded-[2.2rem] p-6 sm:p-8">
          <p className="market-kicker">How onboarding works</p>
          <div className="mt-5 space-y-4">
            {[
              "1. Start the seller application from your HenryCo account.",
              "2. Save your draft while you add your business details, store profile, and product focus.",
              "3. The HenryCo team reviews your documents, trust signals, and store readiness.",
              "4. Approved sellers continue into vendor onboarding where pricing, posting fees, payout windows, and policy rules stay visible before publishing opens.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-paper-white)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.7rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-1 h-5 w-5 text-[var(--market-brass)]" />
              <div>
                <p className="text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">
                  A cleaner seller application
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                  Seller registration stays inside your account so business details, review status, and approval updates remain private and easy to follow.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/seller-application"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Start application <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/vendor"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Visit vendor workspace
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <article className="market-paper rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Plan economics</p>
          <div className="mt-5 grid gap-4">
            {sellerPlanRows.map((plan) => (
              <div key={plan.id} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-[var(--market-paper-white)]">{plan.name}</h2>
                    <p className="mt-2 text-sm text-[var(--market-muted)]">{plan.summary}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--market-brass)]">{plan.monthlyLabel}</p>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[var(--market-paper-white)] sm:grid-cols-2">
                  <span>{plan.marketplaceFeeLabel}</span>
                  <span>{plan.payoutFeeLabel} payout fee</span>
                  <span>{plan.includedListings} listings before extra posting fees</span>
                  <span>Featured slot: NGN {plan.featuredSlotFee.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="market-panel rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Trust tiers change privileges</p>
          <div className="mt-5 space-y-4">
            {sellerTrustTierRules.map((tier) => (
              <div key={tier.tier} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">{tier.tier}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{tier.privileges}</p>
                <p className="mt-3 text-sm font-medium text-[var(--market-brass)]">{tier.payoutWindow}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
