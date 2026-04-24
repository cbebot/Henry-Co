import Link from "next/link";
import { PageIntro } from "@/components/marketplace/shell";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";

export const dynamic = "force-dynamic";

export default function SellerPricingPage() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Seller pricing"
        title="Clear economics. No hidden fees."
        description="Plan fees, listing fees, featured-slot fees, transaction commission, and payout processing are all stated up front &mdash; before you publish inventory, not after."
        actions={
          <Link href="/account/seller-application" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Apply as seller
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-4">
        {sellerPlanRows.map((plan) => (
          <article key={plan.id} className="market-paper rounded-[1.9rem] p-6">
            <p className="market-kicker">{plan.name}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">{plan.monthlyLabel}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{plan.summary}</p>
            <div className="mt-5 space-y-2 text-sm text-[var(--market-ink)]">
              <p>{plan.marketplaceFeeLabel}</p>
              <p>{plan.payoutFeeLabel} payout fee</p>
              <p>{plan.includedListings} included listings</p>
              <p>Extra listing fee: NGN {plan.postingFee.toLocaleString()}</p>
              <p>Featured slot fee: NGN {plan.featuredSlotFee.toLocaleString()}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <article className="market-panel rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">How HenryCo makes money</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "Transaction commissions are deducted from each vendor order-group settlement before payout release.",
              "Posting fees apply after included listing allowance is exhausted for the seller's active plan.",
              "Featured placement is a separate paid request and stays subject to quality and trust review.",
              "Payout processing fees are deducted inside the seller settlement snapshot, not later by surprise.",
              "Studio, Learn, and Logistics value-added services create additional seller revenue lanes.",
              "Operator-controlled campaigns and sponsored slots remain auditable and not self-serve chaos.",
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-paper-white)]">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="market-paper rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Trust-tier payout timing</p>
          <div className="mt-5 space-y-4">
            {sellerTrustTierRules.map((tier) => (
              <div key={tier.tier} className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4">
                <h2 className="text-lg font-semibold text-[var(--market-paper-white)]">{tier.tier}</h2>
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
