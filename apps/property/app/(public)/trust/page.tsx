import type { Metadata } from "next";
import {
  Building2,
  CalendarRange,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  PropertyMetricGrid,
  PropertySectionIntro,
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { getPropertyTrustCopy } from "@henryco/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPropertyPublicLocale();
  const copy = getPropertyTrustCopy(locale);
  return {
    title: copy.meta.title,
    description: copy.meta.description,
  };
}

const TRUST_RAIL_ICONS = [ShieldCheck, FileCheck2, CalendarRange] as const;
const POLICY_CARD_ICONS = [Building2, ShieldCheck, CalendarRange] as const;

export default async function TrustPage() {
  const [locale, snapshot] = await Promise.all([
    getPropertyPublicLocale(),
    getPropertySnapshot(),
  ]);
  const copy = getPropertyTrustCopy(locale);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={copy.page.kicker}
        title={copy.page.title}
        description={copy.page.description}
      />

      <div className="mt-10">
        <PropertyMetricGrid items={snapshot.metrics} />
      </div>

      <section className="mt-14">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">{copy.trustRails.sectionKicker}</p>
        <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
          {copy.trustRails.items.map((item, i) => {
            const Icon = TRUST_RAIL_ICONS[i];
            return (
              <li
                key={item.title}
                className="grid gap-3 py-6 sm:grid-cols-[auto,1fr] sm:items-start sm:gap-6"
              >
                <Icon
                  className="h-5 w-5 text-[var(--property-accent-strong)]"
                  aria-hidden
                />
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--property-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--property-ink-soft)]">
                    {item.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14 grid gap-12 xl:grid-cols-[1.05fr_0.95fr] xl:divide-x xl:divide-[var(--property-line)]">
        <div>
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {copy.statusGuide.sectionKicker}
          </p>
          <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
            {copy.statusGuide.items.map((item) => (
              <li key={item.title} className="py-5">
                <h3 className="text-base font-semibold tracking-tight text-[var(--property-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:pl-12">
          <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
            {copy.expectations.sectionKicker}
          </p>
          <div className="mt-6 grid gap-10 md:grid-cols-2 md:divide-x md:divide-[var(--property-line)]">
            {copy.expectations.columns.map((column, i) => (
              <div key={column.heading} className={i > 0 ? "md:pl-8" : ""}>
                <h3 className="text-sm font-semibold tracking-tight text-[var(--property-ink)]">
                  {column.heading}
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {column.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-accent-strong)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.28em]">
          {copy.policy.sectionKicker}
        </p>
        <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-3 xl:divide-x xl:divide-[var(--property-line)]">
          {copy.policy.cards.map((card, i) => {
            const Icon = POLICY_CARD_ICONS[i];
            return (
              <li key={card.title} className={i > 0 && i < 3 ? "xl:pl-8" : ""}>
                <Icon
                  className="h-5 w-5 text-[var(--property-accent-strong)]"
                  aria-hidden
                />
                <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--property-ink)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {card.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14 border-l-2 border-[var(--property-accent-strong)]/55 pl-5">
        <p className="property-kicker text-[10.5px] uppercase tracking-[0.22em]">
          <Sparkles className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
          {copy.nextSteps.kicker}
        </p>
        <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          {copy.nextSteps.items.map((item, i) => (
            <li key={item} className="flex gap-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
