import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHubUrl } from "@henryco/config";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

function planCtaHref(planId: string) {
  if (planId === "partner") {
    return getHubUrl("/contact?reason=partnerships&plan=partner");
  }
  return `/account/seller-application/start?plan=${planId}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.sellPricing.metadata.title,
    description: copy.sellPricing.metadata.description,
  };
}

export default async function SellerPricingPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const sp = copy.sellPricing;

  return (
    <main className="mx-auto max-w-[1480px] space-y-16 px-4 py-12 sm:px-6 xl:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              {sp.hero.kicker}
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {sp.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {sp.hero.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/account/seller-application"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {sp.hero.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {sp.hero.secondaryCta}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: sp.hero.statsLabels.planTiers, value: String(sellerPlanRows.length) },
              { label: sp.hero.statsLabels.trustTiers, value: String(sellerTrustTierRules.length) },
              { label: sp.hero.statsLabels.featuredSlots, value: sp.hero.featuredSlotsValue },
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
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">{sp.plans.kicker}</p>
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
                  <dt>{sp.plans.feeLabel}</dt>
                  <dd className="text-right text-[var(--market-ink)]">{plan.marketplaceFeeLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>{sp.plans.payoutLabel}</dt>
                  <dd className="text-right text-[var(--market-ink)]">{plan.payoutFeeLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>{sp.plans.includedLabel}</dt>
                  <dd className="text-right text-[var(--market-ink)]">{plan.includedListings} {sp.plans.includedSuffix}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--market-line)] py-2">
                  <dt>{sp.plans.extraListingLabel}</dt>
                  <dd className="text-right text-[var(--market-ink)]">
                    {sp.plans.currencyPrefix} {plan.postingFee.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt>{sp.plans.featuredSlotLabel}</dt>
                  <dd className="text-right text-[var(--market-ink)]">
                    {sp.plans.currencyPrefix} {plan.featuredSlotFee.toLocaleString()}
                  </dd>
                </div>
              </dl>
              <Link
                href={planCtaHref(plan.id)}
                className="market-button-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                {plan.id === "partner"
                  ? sp.plans.ctaPartner
                  : sp.plans.ctaTemplate.replace("{plan}", plan.name)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-12 xl:grid-cols-[1.05fr,0.95fr] xl:divide-x xl:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {sp.economics.kicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            {sp.economics.title}
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-[var(--market-muted)]">
            {sp.economics.items.map((item, i) => (
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
            {sp.trustTiers.kicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            {sp.trustTiers.title}
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
              {sp.closing.kicker}
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              {sp.closing.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              {sp.closing.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/seller-application"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {sp.closing.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {sp.closing.secondaryCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
