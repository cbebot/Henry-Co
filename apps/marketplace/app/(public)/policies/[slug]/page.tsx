import { notFound } from "next/navigation";
import { PageIntro } from "@/components/marketplace/shell";
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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker={policy.kicker}
        title={policy.title}
        description={policy.summary}
      />

      <section className="grid gap-5 md:grid-cols-2">
        {policy.bullets.map((bullet) => (
          <article key={bullet} className="market-paper rounded-[1.75rem] p-6">
            <p className="text-sm leading-8 text-[var(--market-ink)]">{bullet}</p>
          </article>
        ))}
      </section>

      <section className="market-panel rounded-[2rem] p-6 sm:p-8">
        <p className="market-kicker">Connected marketplace controls</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ecosystemOffers.slice(0, 3).map((offer) => (
            <a key={offer.title} href={offer.href} className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4">
              <h2 className="text-lg font-semibold text-[var(--market-paper-white)]">{offer.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{offer.body}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
