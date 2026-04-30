import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileSearch,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ecosystemOffers, policyPages, sellerTrustTierRules } from "@/lib/marketplace/policy";

export const dynamic = "force-dynamic";

export default function TrustPage() {
  const passports = [
    {
      icon: ShieldCheck,
      title: "Trust passports",
      body: "Every store and product surfaces verification level, SLA, dispute rate, payout readiness, and fulfillment posture.",
    },
    {
      icon: Lock,
      title: "Escrow control",
      body: "Buyer funds are held by HenryCo first, then move into releasable payout only after delivery and trust checks clear.",
    },
    {
      icon: FileSearch,
      title: "Anti-fraud review",
      body: "Off-platform payment steering, duplicate media, listing velocity spikes, and risky payout patterns route into queue visibility.",
    },
    {
      icon: ClipboardCheck,
      title: "Audit trails",
      body: "Approvals, rejections, payout actions, dispute decisions, and automation sweeps are logged server-side.",
    },
  ] as const;

  return (
    <main className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              Trust &amp; safety
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Visible before checkout. Enforced after it.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              Trust governs what a seller can do, how money moves, and how moderation responds.
              Seller tiers, buyer risk, listing scoring, escrow holds, disputes, and payout release
              all leave a server-side paper trail.
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "Money movement", value: "Escrowed, released after checks" },
              { label: "Reviews", value: "Server-logged, dispute-traceable" },
              { label: "Tiers", value: "Earned, revocable" },
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
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Four guardrails</p>
        <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-[var(--market-line)]">
          {passports.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 && i < 4 ? "xl:pl-8" : ""}>
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

      <section className="grid gap-12 xl:grid-cols-[1fr,1fr] xl:divide-x xl:divide-[var(--market-line)]">
        <div>
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Seller trust ladder
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            Tiers earned through behaviour, not paid for.
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

        <div className="xl:pl-12">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Policy surfaces</p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
            The standards we hold ourselves to.
          </h2>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {policyPages.map((policy) => (
              <li key={policy.slug}>
                <Link
                  href={`/policies/${policy.slug}`}
                  className="group flex items-start gap-4 py-5 transition hover:bg-[var(--market-bg-soft)]/40"
                >
                  <div className="flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--market-ink)]">
                      {policy.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                      {policy.summary}
                    </p>
                  </div>
                  <ArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--market-brass)]"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[var(--market-line)] pt-10">
        <div className="flex items-baseline gap-4">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
            Ecosystem trust reinforcement
          </p>
          <span className="h-px flex-1 bg-[var(--market-line)]" />
        </div>
        <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-3 xl:divide-x xl:divide-[var(--market-line)]">
          {ecosystemOffers.map((item, i) => (
            <li key={item.title} className={i > 0 && i < 3 ? "xl:pl-8" : ""}>
              <a
                href={item.href}
                className="group block transition hover:opacity-95"
              >
                <Sparkles className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
                <h3 className="mt-3 text-base font-semibold tracking-tight text-[var(--market-ink)] group-hover:text-[var(--market-brass)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
