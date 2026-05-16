import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ClipboardList,
  Receipt,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import { getLogisticsBusinessCopy } from "@henryco/i18n/server";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsBusinessCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function BusinessPage() {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsBusinessCopy(locale);

  const standards = [
    {
      icon: Repeat2,
      title: copy.standards.repeatLanesTitle,
      body: copy.standards.repeatLanesBody,
    },
    {
      icon: Workflow,
      title: copy.standards.escalationsTitle,
      body: copy.standards.escalationsBody,
    },
    {
      icon: ShieldCheck,
      title: copy.standards.premiumTitle,
      body: copy.standards.premiumBody,
    },
  ] as const;

  const path = [
    {
      step: "01",
      title: copy.path.step01Title,
      body: copy.path.step01Body,
    },
    {
      step: "02",
      title: copy.path.step02Title,
      body: copy.path.step02Body,
    },
    {
      step: "03",
      title: copy.path.step03Title,
      body: copy.path.step03Body,
    },
    {
      step: "04",
      title: copy.path.step04Title,
      body: copy.path.step04Body,
    },
  ] as const;

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                {copy.hero.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
                >
                  {copy.hero.quoteCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={getAccountUrl("/logistics")}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
                >
                  {copy.hero.accountCta}
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  {copy.hero.compareCta}
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: Receipt,
                  label: copy.credibility.pricingLabel,
                  value: copy.credibility.pricingValue,
                },
                {
                  icon: ClipboardList,
                  label: copy.credibility.visibilityLabel,
                  value: copy.credibility.visibilityValue,
                },
                {
                  icon: Sparkles,
                  label: copy.credibility.continuityLabel,
                  value: copy.credibility.continuityValue,
                },
              ].map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-3 border-b border-[var(--logistics-line)] py-3 last:border-b-0"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--logistics-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            {copy.standards.eyebrow}
          </p>
          <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--logistics-line)]">
            {standards.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[var(--logistics-accent)]" aria-hidden />
                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            {copy.path.eyebrow}
          </p>
          <ol className="mt-6 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
            {path.map((item) => (
              <li
                key={item.step}
                className="grid gap-3 py-5 sm:grid-cols-[auto,1fr] sm:gap-6"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  {copy.path.stepLabel} {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--logistics-muted)]">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-[var(--logistics-line)]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              {copy.fit.bestForEyebrow}
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--logistics-muted)]">
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>{copy.fit.bestForRetail}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>{copy.fit.bestForServices}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>{copy.fit.bestForDivisions}</span>
              </li>
            </ul>
          </div>
          <div className="lg:pl-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              {copy.fit.notYetEyebrow}
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--logistics-muted)]">
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>{copy.fit.notYetColdChain}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>{copy.fit.notYetCrossBorder}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>{copy.fit.notYetHazmat}</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--logistics-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {copy.closing.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
                {copy.closing.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                {copy.closing.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
              >
                {copy.closing.quoteCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
              >
                {copy.closing.dispatchCta}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
