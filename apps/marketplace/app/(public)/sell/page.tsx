import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, Store, WalletCards } from "lucide-react";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

const ADVANTAGE_ICONS = [BadgeCheck, Store, WalletCards] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.sell.metadata.title,
    description: copy.sell.metadata.description,
  };
}

export default async function SellPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const sell = copy.sell;

  const advantages = sell.advantages.items.map((item, index) => ({
    ...item,
    icon: ADVANTAGE_ICONS[index] ?? BadgeCheck,
  }));

  return (
    <main className="mx-auto max-w-[1480px] space-y-16 px-4 py-12 sm:px-6 xl:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              {sell.hero.kicker}
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {sell.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {sell.hero.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/account/seller-application"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {sell.hero.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell/pricing"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {sell.hero.secondaryCta}
              </Link>
              <Link
                href={buildSharedAccountLoginUrl("/account/seller-application")}
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
              >
                {sell.hero.signInCta}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {sell.hero.highlights.map((item) => (
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
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
          {sell.advantages.kicker}
        </p>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--market-line)]">
          {advantages.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[var(--market-brass)]" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--market-ink)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
          {sell.onboarding.kicker}
        </p>
        <ol className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
          {sell.onboarding.steps.map((item) => (
            <li
              key={item.step}
              className="grid gap-3 py-5 sm:grid-cols-[auto,1fr] sm:gap-6"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                {sell.onboarding.stepLabel} {item.step}
              </span>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                  {item.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--market-muted)]">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 border-l-2 border-[var(--market-brass)]/55 pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
            <FileCheck2 className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
            {sell.onboarding.callout.eyebrow}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
            {sell.onboarding.callout.body}
          </p>
        </div>
      </section>

      <section className="grid gap-12 xl:grid-cols-[1fr,1fr] xl:divide-x xl:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {sell.plans.kicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            {sell.plans.title}
          </h2>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {sellerPlanRows.map((plan) => (
              <li key={plan.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold tracking-tight text-[var(--market-ink)]">
                    {plan.name}
                  </h3>
                  <span className="text-sm font-semibold tracking-tight text-[var(--market-brass)]">
                    {plan.monthlyLabel}
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
                  {plan.summary}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-[var(--market-muted)] sm:grid-cols-4">
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      {sell.plans.feeLabel}
                    </dt>
                    <dd className="mt-0.5">{plan.marketplaceFeeLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      {sell.plans.payoutLabel}
                    </dt>
                    <dd className="mt-0.5">{plan.payoutFeeLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      {sell.plans.includedLabel}
                    </dt>
                    <dd className="mt-0.5">
                      {plan.includedListings} {sell.plans.includedSuffix}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      {sell.plans.featuredLabel}
                    </dt>
                    <dd className="mt-0.5">
                      {sell.plans.featuredCurrencyPrefix} {plan.featuredSlotFee.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:pl-12">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {sell.trustTiers.kicker}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            {sell.trustTiers.title}
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
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
              {sell.closing.kicker}
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              {sell.closing.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              {sell.closing.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/account/seller-application"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {sell.closing.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/vendor"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {sell.closing.secondaryCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
