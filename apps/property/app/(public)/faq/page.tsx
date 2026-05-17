import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getPropertyFaqCopy } from "@henryco/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPropertyPublicLocale();
  const copy = getPropertyFaqCopy(locale);
  return {
    title: copy.meta.title,
    description: copy.meta.description,
  };
}

export default async function PropertyFaqPage() {
  const [locale, snapshot] = await Promise.all([
    getPropertyPublicLocale(),
    getPropertySnapshot(),
  ]);
  const copy = getPropertyFaqCopy(locale);

  return (
    <main className="mx-auto max-w-[80rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={copy.page.kicker}
        title={copy.page.title}
        description={copy.page.description}
      />

      <section className="mt-10">
        {snapshot.faqs.length === 0 ? (
          <p className="border-l-2 border-[var(--property-accent-strong)]/55 pl-5 text-sm leading-7 text-[var(--property-ink-soft)]">
            {copy.empty.text}{" "}
            <Link
              href="/trust"
              className="font-semibold text-[var(--property-accent-strong)] underline-offset-4 hover:underline"
            >
              {copy.empty.trustLinkLabel}
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
            {snapshot.faqs.map((faq) => (
              <li key={faq.id}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 text-base font-semibold tracking-tight text-[var(--property-ink)]">
                    <span>{faq.question}</span>
                    <span
                      aria-hidden
                      className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)] transition group-open:text-[var(--property-accent-strong)]"
                    >
                      <span className="group-open:hidden">{copy.faqItem.openLabel}</span>
                      <span className="hidden group-open:inline">{copy.faqItem.closeLabel}</span>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--property-ink-soft)]">
                    {faq.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 border-t border-[var(--property-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
              {copy.contact.kicker}
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
              {copy.contact.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--property-ink-soft)]">
              {copy.contact.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/submit"
              className="property-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {copy.contact.submitListingCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--property-line)] px-6 py-3 text-sm font-semibold text-[var(--property-ink)] transition hover:border-[var(--property-accent-strong)]/50"
            >
              {copy.contact.trustStandardsCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
