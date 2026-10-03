import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileSearch, Lock, ShieldCheck } from "lucide-react";
import { policyPages } from "@/lib/marketplace/policy";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

const GUARDRAIL_ICONS = [ShieldCheck, Lock, FileSearch, ClipboardCheck] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return {
    title: copy.trust.metadata.title,
    description: copy.trust.metadata.description,
  };
}

export default async function TrustPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);

  const guardrails = copy.trust.guardrails.items.map((item, index) => ({
    ...item,
    icon: GUARDRAIL_ICONS[index] ?? GUARDRAIL_ICONS[GUARDRAIL_ICONS.length - 1],
  }));

  return (
    <main className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
          {copy.trust.hero.kicker}
        </p>
        <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
          {copy.trust.hero.title}
        </h1>
      </section>

      <section>
        <ul className="grid gap-10 md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-[var(--market-line)]">
          {guardrails.map((item, i) => {
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

      <section>
        <h2 className="text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
          {copy.trust.policySurfaces.title}
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
                </div>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--market-brass)]"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
