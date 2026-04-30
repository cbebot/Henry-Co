import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { ecosystemOffers, policyPages } from "@/lib/marketplace/policy";

export const dynamic = "force-dynamic";

export default async function MarketplacePolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policyPages.find((item) => item.slug === slug);
  if (!policy) notFound();

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              {policy.kicker}
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {policy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {policy.summary}
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <Link
                href="/trust"
                className="font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
              >
                Back to trust standards
              </Link>
              <span className="text-[var(--market-line)]">·</span>
              <Link
                href="/help"
                className="font-semibold text-[var(--market-ink)] underline-offset-4 hover:underline"
              >
                Open support thread
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Coverage
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                Buyers + sellers
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Enforcement
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                Server-logged trail
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Updated
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                On policy revisions
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">Policy provisions</p>
        <ol className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
          {policy.bullets.map((bullet, i) => (
            <li
              key={bullet}
              className="grid gap-3 py-5 sm:grid-cols-[auto,1fr] sm:gap-6"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="max-w-3xl text-sm leading-8 text-[var(--market-ink)]">{bullet}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[var(--market-line)] pt-10">
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
          Connected marketplace controls
        </p>
        <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-3 xl:divide-x xl:divide-[var(--market-line)]">
          {ecosystemOffers.slice(0, 3).map((offer, i) => (
            <li key={offer.title} className={i > 0 && i < 3 ? "xl:pl-8" : ""}>
              <a href={offer.href} className="group block transition hover:opacity-95">
                <Sparkles className="h-4 w-4 text-[var(--market-brass)]" aria-hidden />
                <h3 className="mt-3 text-base font-semibold tracking-tight text-[var(--market-ink)] group-hover:text-[var(--market-brass)]">
                  {offer.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{offer.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)] underline-offset-4 group-hover:underline">
                  Open
                  <ArrowRight className="h-3 w-3" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
