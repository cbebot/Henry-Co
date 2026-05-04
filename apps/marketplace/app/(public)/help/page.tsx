import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import MarketplaceHelpCentre from "@/components/marketplace/help-centre";
import { MARKETPLACE_FAQS } from "@/lib/marketplace/help-faqs";

export const dynamic = "force-dynamic";

type HelpSearchParams = {
  vendor?: string;
};

export default async function HelpPage({
  searchParams,
}: {
  searchParams?: Promise<HelpSearchParams>;
}) {
  // Vendor query param is preserved for the support thread CTA so a
  // visitor coming from a vendor page lands on the right thread context.
  const params = (await searchParams) ?? {};
  const vendorSlug = typeof params.vendor === "string" ? params.vendor.trim() : "";
  const supportHref = vendorSlug
    ? `/account/support?vendor=${encodeURIComponent(vendorSlug)}`
    : "/account/support";

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
          Help centre
        </p>
        <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--market-ink)] sm:text-[2.4rem] md:text-[2.8rem]">
          Find an answer in seconds &mdash; or talk to a person.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
          Search the topics most buyers and sellers ask about. If you do not
          find what you need, open a support ticket from the bottom of this
          page and a person on the team will read it.
        </p>
      </section>

      <MarketplaceHelpCentre categories={MARKETPLACE_FAQS} />

      <section className="rounded-[1.8rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.28em]">
              Still need help
            </p>
            <h2 className="mt-3 text-balance text-[1.4rem] font-semibold leading-[1.18] tracking-[-0.012em] text-[var(--market-ink)] sm:text-[1.7rem]">
              Open a support ticket and a person will read it.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              Tickets keep the full context attached &mdash; the order, the
              vendor, the dispute history &mdash; so the team works through
              the issue without you re-typing it on every reply.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href={supportHref}
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] active:translate-y-[0.5px]"
            >
              <MessageSquare className="h-4 w-4" />
              Open a support ticket
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
