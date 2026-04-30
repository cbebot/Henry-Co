import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, Store, WalletCards } from "lucide-react";
import { sellerPlanRows, sellerTrustTierRules } from "@/lib/marketplace/policy";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";

export const dynamic = "force-dynamic";

export default function SellPage() {
  const advantages = [
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
  ] as const;

  const onboardingSteps = [
    {
      step: "01",
      title: "Start the seller application",
      body: "Open the application from inside your HenryCo account — drafts save automatically while you assemble details.",
    },
    {
      step: "02",
      title: "Add business details",
      body: "Business name, store profile, product focus, and any verification documents that explain how you fulfil orders.",
    },
    {
      step: "03",
      title: "Application review",
      body: "The HenryCo team reviews documents, trust signals, and store readiness — not just a paid badge.",
    },
    {
      step: "04",
      title: "Vendor onboarding",
      body: "Approved sellers continue into vendor onboarding where pricing, posting fees, payout windows, and policy rules stay visible before publishing opens.",
    },
  ] as const;

  return (
    <main className="mx-auto max-w-[1480px] space-y-16 px-4 py-12 sm:px-6 xl:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              Sell on HenryCo
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Selective by design. Built for sellers who lead on trust.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              HenryCo Marketplace favours sellers who care about presentation, reliable
              fulfillment, and honest buyer protection. The bar is explicit on this page; the
              seller application continues inside your HenryCo account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/account/seller-application"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Open seller application
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell/pricing"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                See seller pricing
              </Link>
              <Link
                href={buildSharedAccountLoginUrl("/account/seller-application")}
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
              >
                Sign in with HenryCo account
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "Selection", value: "Manual review, not pay-to-list" },
              { label: "Storefront", value: "Trust passport visible to buyers" },
              { label: "Workspace", value: "Orders, payouts, support unified" },
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
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
          Why stronger sellers win here
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
          How onboarding works
        </p>
        <ol className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
          {onboardingSteps.map((item) => (
            <li
              key={item.step}
              className="grid gap-3 py-5 sm:grid-cols-[auto,1fr] sm:gap-6"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                Step {item.step}
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
            A cleaner seller application
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
            Seller registration stays inside your account so business details, review status, and
            approval updates remain private and easy to follow.
          </p>
        </div>
      </section>

      <section className="grid gap-12 xl:grid-cols-[1fr,1fr] xl:divide-x xl:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Plan economics</p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Tiers stated up front, not after publishing.
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
                      Fee
                    </dt>
                    <dd className="mt-0.5">{plan.marketplaceFeeLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      Payout
                    </dt>
                    <dd className="mt-0.5">{plan.payoutFeeLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      Included
                    </dt>
                    <dd className="mt-0.5">{plan.includedListings} listings</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.18em] text-[var(--market-ink)]/60">
                      Featured
                    </dt>
                    <dd className="mt-0.5">NGN {plan.featuredSlotFee.toLocaleString()}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:pl-12">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Trust tiers change privileges
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Earn faster payouts, larger storefronts, and policy advantages.
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
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Move forward</p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              Apply, then watch the application status from your account.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              Approval unlocks vendor onboarding. Pricing, posting fees, and payout windows are
              visible before you publish — no contract surprises later.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/account/seller-application"
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Start application
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/vendor"
              className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Visit vendor workspace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
