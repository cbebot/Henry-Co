import Link from "next/link";
import { PageIntro } from "@/components/marketplace/shell";

export const dynamic = "force-dynamic";

export default function SellPage() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Sell on HenryCo"
        title="A marketplace for premium sellers who want more trust, better operations, and less clutter."
        description="HenryCo Marketplace is selective by design. Public `/sell` explains the value proposition and standards, while the real seller application now lives inside protected account flows where drafts, verification, moderation notes, and approval status stay structured."
        actions={
          <>
            <Link
              href="/account/seller-application"
              className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Start seller application
            </Link>
            <Link
              href="/login?next=/account/seller-application"
              className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Sign in first
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <article className="rounded-[2.2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_24px_70px_rgba(28,24,18,0.06)] sm:p-8">
          <p className="market-kicker">Why stronger sellers convert here</p>
          <div className="mt-5 space-y-4">
            {[
              "Your store gets a public trust passport instead of being buried in low-quality marketplace noise.",
              "Low-stock, payout, and approval pressure are surfaced as coaching actions instead of silent losses.",
              "Support, moderation, finance, and operations work from cleaner internal queues, so seller issues do not vanish into chaos.",
              "Editorial merchandising and premium search help quality stores win more quickly.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2.2rem] border border-[var(--market-line-strong)] bg-[var(--market-noir)] p-6 text-[var(--market-paper-white)] shadow-[0_32px_90px_rgba(17,13,9,0.3)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--market-brass)]">
            How onboarding works
          </p>
          <div className="mt-6 space-y-4">
            {[
              "1. Start the protected application from your HenryCo account.",
              "2. Drafts autosave while you fill store identity, verification context, and standards.",
              "3. Submission routes into the moderation and owner alert workflow.",
              "4. Approved sellers move into vendor onboarding and product submission.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[color:rgba(255,255,255,0.72)]"
              >
                {item}
              </div>
            ))}
          </div>
          <Link
            href="/account/seller-application"
            className="mt-6 inline-flex rounded-full bg-[var(--market-paper-white)] px-5 py-3 text-sm font-semibold text-[var(--market-noir)]"
          >
            Open protected seller flow
          </Link>
        </article>
      </section>
    </div>
  );
}
