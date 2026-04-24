import Link from "next/link";
import { PageIntro } from "@/components/marketplace/shell";
import { ecosystemOffers, policyPages, sellerTrustTierRules } from "@/lib/marketplace/policy";

export const dynamic = "force-dynamic";

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Trust &amp; Safety"
        title="Visible before checkout. Enforced after it."
        description="Trust governs what a seller can do, how money moves, and how moderation responds. Seller tiers, buyer risk, listing scoring, escrow holds, disputes, and payout release all leave a server-side paper trail."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Trust passports", "Every store and product surfaces verification level, SLA, dispute rate, payout readiness, and fulfillment posture."],
          ["Escrow control", "Buyer funds are held by HenryCo first, then move into releasable payout only after delivery and trust checks clear."],
          ["Anti-fraud review", "Off-platform payment steering, duplicate media, listing velocity spikes, and risky payout patterns route into queue visibility."],
          ["Audit trails", "Approvals, rejections, payout actions, dispute decisions, and automation sweeps are logged server-side."],
        ].map(([title, body]) => (
          <article key={title} className="market-paper rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{body}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <article className="market-paper rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Seller trust ladder</p>
          <div className="mt-5 space-y-4">
            {sellerTrustTierRules.map((tier) => (
              <div key={tier.tier} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] p-4">
                <h2 className="text-lg font-semibold text-[var(--market-ink)]">{tier.tier}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{tier.privileges}</p>
                <p className="mt-3 text-sm font-medium text-[var(--market-brass)]">{tier.payoutWindow}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="market-panel rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Policy surfaces</p>
          <div className="mt-5 grid gap-4">
            {policyPages.map((policy) => (
              <Link key={policy.slug} href={`/policies/${policy.slug}`} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 transition hover:border-[var(--market-brass)]">
                <h2 className="text-lg font-semibold text-[var(--market-paper-white)]">{policy.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{policy.summary}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="market-paper rounded-[2rem] p-6 sm:p-8">
        <p className="market-kicker">Ecosystem trust reinforcement</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ecosystemOffers.map((item) => (
            <a key={item.title} href={item.href} className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] p-4">
              <h2 className="text-lg font-semibold text-[var(--market-ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
