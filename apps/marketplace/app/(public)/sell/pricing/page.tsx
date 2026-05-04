import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHubUrl } from "@henryco/config";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";

export const dynamic = "force-dynamic";

function planCtaHref(planId: string) {
  if (planId === "partner") {
    return getHubUrl("/contact?reason=partnerships&plan=partner");
  }
  return `/account/seller-application/start?plan=${planId}`;
}

function planCtaLabel(planId: string, planName: string) {
  if (planId === "partner") return "Contact for partner terms";
  return `Start with ${planName}`;
}

const economics = [
  "Transaction commissions are deducted from each vendor order-group settlement before payout release.",
  "Posting fees apply after the included listing allowance is exhausted for the seller's active plan.",
  "Featured placement is a separate paid request and stays subject to quality and trust review.",
  "Payout processing fees are deducted inside the seller settlement snapshot, not later by surprise.",
  "Studio, Learn, and Logistics value-added services create additional seller revenue lanes.",
  "Operator-controlled campaigns and sponsored slots remain auditable and not self-serve chaos.",
];

export default function SellerPricingPage() {
  return (
    <main className="mx-auto max-w-[1480px] space-y-16 px-4 py-12 sm:px-6 xl:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              Seller pricing
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Clear economics. No hidden fees.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              Plan fees, listing fees, featured-slot fees, transaction commission, and payout
              processing are all stated up front &mdash; before you publish inventory, not after.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/account/seller-application"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Apply as seller
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Back to seller overview
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "Plan tiers", value: String(sellerPlanRows.length) },
              { label: "Trust tiers", value: String(sellerTrustTierRules.length) },
              { label: "Featured slots", value: "Reviewed individually" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {item.label}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Plans at a glance</p>
        <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-[var(--market-line)]">
          {sellerPlanRows.map((plan, i) => (
            <li key={plan.id} className={i > 0 && i < 4 ? "xl:pl-8" : ""}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                {plan.name}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--market-ink)] sm:text-[1.7rem]">
                {plan.monthlyLabel}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-7 text-[var(--market-muted)]">
                {plan.summary}
              </p>
              <dl className="mt-4 space-y-2 text-sm leading-7 text-[var(--market-muted)]">
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>Fee</dt>
                  <dd className="text-right text-[var(--market-ink)]">{plan.marketplaceFeeLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>Payout</dt>
                  <dd className="text-right text-[var(--market-ink)]">{plan.payoutFeeLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>Included</dt>
                  <dd className="text-right text-[var(--market-ink)]">{plan.includedListings} listings</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>Extra listing</dt>
                  <dd className="text-right text-[var(--market-ink)]">
                    NGN {plan.postingFee.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt>Featured slot</dt>
                  <dd className="text-right text-[var(--market-ink)]">
                    NGN {plan.featuredSlotFee.toLocaleString()}
                  </dd>
                </div>
              </dl>
              <Link
                href={planCtaHref(plan.id)}
                className="market-button-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                {planCtaLabel(plan.id, plan.name)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-12 xl:grid-cols-[1.05fr,0.95fr] xl:divide-x xl:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            How HenryCo makes money
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Stated up front, deducted in the open.
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-[var(--market-muted)]">
            {economics.map((item, i) => (
              <li key={item} className="flex gap-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:pl-12">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Trust-tier payout timing
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Better behaviour earns shorter holds.
          </h2>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {sellerTrustTierRules.map((tier) => (
              <li
                key={tier.tier}
                className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-start sm:gap-8"
              >
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--market-ink)]">
                    {tier.tier}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
                    {tier.privileges}
                  </p>
                </div>
                <span className="text-sm font-semibold tracking-tight text-[var(--market-brass)]">
                  {tier.payoutWindow}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[var(--market-line)] pt-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
              Ready to apply?
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              Application opens in your HenryCo account.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              You can save the draft and return — pricing visible here applies once vendor
              onboarding completes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/seller-application"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Apply as seller
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Trust standards
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
