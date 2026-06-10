import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import MarketplaceHelpCentre from "@/components/marketplace/help-centre";
import { MARKETPLACE_FAQS } from "@/lib/marketplace/help-faqs";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

type HelpSearchParams = {
  vendor?: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.help.metadata.title,
    description: copy.help.metadata.description,
  };
}

export default async function HelpPage({
  searchParams,
}: {
  searchParams?: Promise<HelpSearchParams>;
}) {
  // Vendor query param is preserved for the support thread CTA so a
  // visitor coming from a vendor page lands on the right thread context.
  const [locale, params] = await Promise.all([
    getMarketplacePublicLocale(),
    Promise.resolve(searchParams).then((p) => p ?? {}),
  ]);
  const copy = getMarketplacePublicCopy(locale);
  const vendorSlug = typeof params.vendor === "string" ? params.vendor.trim() : "";
  const supportHref = vendorSlug
    ? `/account/support?vendor=${encodeURIComponent(vendorSlug)}`
    : "/account/support";

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
          {copy.help.hero.kicker}
        </p>
        <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--market-ink)] sm:text-[2.4rem] md:text-[2.8rem]">
          {copy.help.hero.title}
        </h1>
        {/* READING-02: hero body in the editorial serif reading face. */}
        <p className="hc-font-reading mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
          {copy.help.hero.body}
        </p>
      </section>

      <MarketplaceHelpCentre categories={MARKETPLACE_FAQS} />

      <section className="rounded-[1.8rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
              {copy.help.stillNeedHelp.kicker}
            </p>
            <h2 className="mt-3 text-balance text-[1.4rem] font-semibold leading-[1.18] tracking-[-0.012em] text-[var(--market-ink)] sm:text-[1.7rem]">
              {copy.help.stillNeedHelp.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              {copy.help.stillNeedHelp.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href={supportHref}
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-canvas)] active:translate-y-[0.5px]"
            >
              <MessageSquare className="h-4 w-4" />
              {copy.help.stillNeedHelp.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
