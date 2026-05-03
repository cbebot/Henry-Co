import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock, Compass, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/env";
import {
  studioTemplateCategories,
  studioTemplates,
} from "@/lib/studio/templates";

export const metadata: Metadata = {
  title: "Ready-made websites and apps | HenryCo Studio",
  description:
    "Pick a HenryCo Studio template — real prices, real timelines, real scope. Each template launches in days, not months, and customises around your brand.",
  alternates: { canonical: "/pick" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "HenryCo Studio templates — real prices, ready to launch",
    description:
      "Browse ready-made websites, commerce sites, portals, and apps. Real prices, real timelines, no fake screenshots.",
    type: "website",
    url: "/pick",
  },
};

function TemplateGradient({
  from,
  to,
  accent,
}: {
  from: string;
  to: string;
  accent: string;
}) {
  return (
    <div
      aria-hidden
      className="relative h-32 w-full overflow-hidden rounded-[1.4rem]"
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: accent }}
      />
      <div
        className="absolute bottom-3 left-4 h-1 w-12 rounded-full"
        style={{ background: accent, opacity: 0.7 }}
      />
      <div
        className="absolute bottom-7 left-4 h-1 w-20 rounded-full"
        style={{ background: accent, opacity: 0.45 }}
      />
      <div
        className="absolute bottom-11 left-4 h-1 w-8 rounded-full"
        style={{ background: accent, opacity: 0.3 }}
      />
    </div>
  );
}

export default function StudioPickPage() {
  const totalTemplates = studioTemplates.length;
  const minPrice = studioTemplates.reduce(
    (min, tpl) => Math.min(min, tpl.price),
    Number.POSITIVE_INFINITY,
  );
  const fastestDays = studioTemplates.reduce(
    (min, tpl) => Math.min(min, tpl.readyInDays),
    Number.POSITIVE_INFINITY,
  );

  return (
    <main className="mx-auto max-w-[92rem] px-5 pb-24 pt-10 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Ready-made by HenryCo Studio</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Pick a site. We launch a customised version in days.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Every template is a real, production-ready HenryCo Studio site. Real prices.
          Real timelines. Real scope. We tailor it to your brand and content, then ship.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/40 hover:bg-[rgba(0,0,0,0.04)]"
          >
            <Compass className="h-3.5 w-3.5" />
            Need something custom? Open a free-form brief
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
          >
            Compare package bands
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--studio-line)] py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
          <div className="flex flex-col gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Templates
            </dt>
            <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
              {totalTemplates}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Starts from
            </dt>
            <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
              {formatCurrency(minPrice)}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Fastest launch
            </dt>
            <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
              {fastestDays} days
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Categories
            </dt>
            <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
              {studioTemplateCategories.length}
            </dd>
          </div>
        </dl>
      </section>

      {studioTemplateCategories.map((category) => {
        const items = studioTemplates.filter((tpl) => tpl.category === category.id);
        if (items.length === 0) return null;
        return (
          <section key={category.id} id={`cat-${category.id}`} className="mt-16 scroll-mt-32">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--studio-line)] pb-5">
              <div>
                <p className="studio-kicker">{category.label}</p>
                <h2 className="mt-3 text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
                  {category.blurb}
                </h2>
              </div>
              <p className="hidden text-sm leading-7 text-[var(--studio-ink-soft)] sm:block">
                {items.length} template{items.length === 1 ? "" : "s"}
              </p>
            </div>

            <ol className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((tpl) => (
                <li key={tpl.id}>
                  <Link
                    href={`/pick/${tpl.slug}`}
                    className="studio-card-tactile group flex h-full flex-col rounded-[1.8rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--studio-signal)]/40"
                  >
                    <TemplateGradient
                      from={tpl.preview.from}
                      to={tpl.preview.to}
                      accent={tpl.preview.accent}
                    />
                    <div className="mt-5 flex items-start justify-between gap-3">
                      <h3 className="text-[1.15rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)] sm:text-[1.25rem]">
                        {tpl.name}
                      </h3>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--studio-signal)]" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--studio-ink-soft)]">
                      {tpl.tagline}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 border-y border-[var(--studio-line)] py-3">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                          Price
                        </dt>
                        <dd className="mt-1 text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                          {formatCurrency(tpl.price)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                          Ready in
                        </dt>
                        <dd className="mt-1 inline-flex items-center gap-1 text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                          <Clock className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
                          {tpl.readyInDays} days
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                      Often for
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]">
                      {tpl.audience}
                    </p>

                    <ul className="mt-4 space-y-1.5 border-t border-[var(--studio-line)] pt-4">
                      {tpl.pages.slice(0, 4).map((page) => (
                        <li
                          key={page}
                          className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]"
                        >
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--studio-signal)]" />
                          <span>{page}</span>
                        </li>
                      ))}
                      {tpl.pages.length > 4 ? (
                        <li className="text-[11.5px] italic leading-relaxed text-[var(--studio-ink-soft)]">
                          + {tpl.pages.length - 4} more
                        </li>
                      ) : null}
                    </ul>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[12.5px]">
                      <span className="font-semibold text-[var(--studio-ink)]">
                        View template
                      </span>
                      <span className="font-mono uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                        {tpl.timelineWeeks} wk launch
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <section className="mt-16 border-l-2 border-[var(--studio-signal)]/55 pl-5 sm:pl-6">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-signal)]">
          <Sparkles className="h-3.5 w-3.5" />
          None of these fit? Describe what you actually need.
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.7rem]">
          Custom builds use the same milestone discipline — and skip the template entirely.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Multi-role portals, bespoke software, deep integrations: we scope against your
          requirements, not a template you have to fit into. Brief takes about eight minutes
          and returns indicative pricing.
        </p>
        <Link
          href="/request"
          className="studio-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          Describe a fully custom build
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
