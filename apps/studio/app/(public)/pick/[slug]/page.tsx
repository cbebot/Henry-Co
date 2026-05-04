import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import { formatCurrency } from "@/lib/env";
import {
  getStudioTemplateBySlug,
  studioTemplateCategories,
  studioTemplates,
} from "@/lib/studio/templates";

export async function generateStaticParams() {
  return studioTemplates.map((tpl) => ({ slug: tpl.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getStudioTemplateBySlug(slug);
  if (!template) {
    return {
      title: "Template not found | HenryCo Studio",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${template.name} | HenryCo Studio templates`,
    description: template.summary,
    alternates: { canonical: `/pick/${template.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: template.name,
      description: template.summary,
      type: "website",
      url: `/pick/${template.slug}`,
    },
  };
}

export default async function StudioTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getStudioTemplateBySlug(slug);
  if (!template) notFound();

  const category = studioTemplateCategories.find((c) => c.id === template.category);
  const related = studioTemplates
    .filter((tpl) => tpl.category === template.category && tpl.id !== template.id)
    .slice(0, 3);
  const depositAmount = Math.round(template.price * template.depositRate);
  const balanceAmount = template.price - depositAmount;

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[80rem] px-5 pb-24 pt-10 sm:px-8 lg:px-10">
      <Link
        href="/pick"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3 w-3" />
        All templates
      </Link>

      <section className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="studio-kicker">{category?.label || "Studio template"}</p>
          <h1 className="mt-4 max-w-3xl text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.6rem] md:text-[3rem]">
            {template.name}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
            {template.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-[1.7] text-[var(--studio-ink-soft)]">
            {template.summary}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/checkout/template/${template.slug}`}
              className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Pay {Math.round(template.depositRate * 100)}% deposit & start
              <ArrowRight className="h-4 w-4" />
            </Link>
            {template.demoUrl ? (
              <Link
                href={template.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-5 py-2.5 text-sm font-semibold text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/40"
              >
                View live demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            <Link
              href={`/request?template=${template.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
            >
              Customise the brief first
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--studio-line)] py-5 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Price
              </dt>
              <dd className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)]">
                {formatCurrency(template.price)}
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Ready in
              </dt>
              <dd className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)]">
                {template.readyInDays} days
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Build window
              </dt>
              <dd className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)]">
                {template.timelineWeeks} wks
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Deposit
              </dt>
              <dd className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)]">
                {Math.round(template.depositRate * 100)}%
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
            <span className="font-semibold text-[var(--studio-ink)]">Often for:</span>{" "}
            {template.audience}
          </p>
        </div>

        <aside>
          <div
            aria-hidden
            className="relative h-72 w-full overflow-hidden rounded-[1.6rem] sm:h-80"
            style={{
              background: `linear-gradient(135deg, ${template.preview.from} 0%, ${template.preview.to} 100%)`,
            }}
          >
            <div
              className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30 blur-3xl"
              style={{ background: template.preview.accent }}
            />
            <div className="absolute inset-x-6 bottom-6 space-y-2">
              <div
                className="h-1.5 w-32 rounded-full"
                style={{ background: template.preview.accent, opacity: 0.85 }}
              />
              <div
                className="h-1.5 w-48 rounded-full"
                style={{ background: template.preview.accent, opacity: 0.55 }}
              />
              <div
                className="h-1.5 w-24 rounded-full"
                style={{ background: template.preview.accent, opacity: 0.35 }}
              />
            </div>
            <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
              <Clock className="h-3 w-3" />
              {template.readyInDays} days
            </div>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Payment plan
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3 border-b border-[var(--studio-line)] pb-3">
                <dt className="text-[var(--studio-ink-soft)]">Deposit on accept</dt>
                <dd className="font-semibold text-[var(--studio-ink)]">
                  {formatCurrency(depositAmount)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-[var(--studio-line)] pb-3">
                <dt className="text-[var(--studio-ink-soft)]">Balance at launch</dt>
                <dd className="font-semibold text-[var(--studio-ink)]">
                  {formatCurrency(balanceAmount)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[var(--studio-ink-soft)]">Total</dt>
                <dd className="text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                  {formatCurrency(template.price)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]">
              Bank transfer or card via Paystack / Flutterwave. Branded receipt issued the
              moment finance confirms.
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-2">
        <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-6 sm:p-7">
          <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            <Layers3 className="h-3.5 w-3.5" />
            Pages included
          </p>
          <ul className="mt-5 space-y-2.5">
            {template.pages.map((page) => (
              <li
                key={page}
                className="flex gap-2.5 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
              >
                <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                <span>{page}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-6 sm:p-7">
          <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            <Sparkles className="h-3.5 w-3.5" />
            Features built in
          </p>
          <ul className="mt-5 space-y-2.5">
            {template.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-2.5 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
              >
                <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            <Target className="h-3.5 w-3.5" />
            Outcomes you can expect
          </p>
          <ul className="mt-5 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {template.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="py-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
              >
                {outcome}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            Tech stack
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {template.stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--studio-line)] bg-black/10 px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[var(--studio-ink-soft)]">
            You can pin a different stack on the brief — HenryCo will quote the delta if it
            changes the build effort, or honour your choice at no cost when it doesn&rsquo;t.
          </p>
        </div>
      </section>

      <section className="mt-14 rounded-[1.6rem] border border-[var(--studio-signal)]/40 bg-[rgba(11,42,52,0.55)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="studio-kicker">Move forward</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.65rem]">
              Customise this template and launch in {template.readyInDays} days.
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
              The brief takes about eight minutes. We confirm scope, send a milestone-priced
              proposal, and start work the moment your deposit clears.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/checkout/template/${template.slug}`}
              className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Pay deposit & start
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/request?template=${template.slug}`}
              className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Customise the brief first
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
            >
              Talk to a Studio lead
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--studio-line)] pb-5">
            <div>
              <p className="studio-kicker">Other {category?.label.toLowerCase()} templates</p>
              <h2 className="mt-3 text-[1.35rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.55rem]">
                Compare nearby ready-made paths.
              </h2>
            </div>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {related.map((tpl) => (
              <li key={tpl.id}>
                <Link
                  href={`/pick/${tpl.slug}`}
                  className="group flex h-full flex-col rounded-[1.6rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--studio-signal)]/40"
                >
                  <div
                    aria-hidden
                    className="h-20 w-full rounded-[1.1rem]"
                    style={{
                      background: `linear-gradient(135deg, ${tpl.preview.from} 0%, ${tpl.preview.to} 100%)`,
                    }}
                  />
                  <h3 className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)]">
                    {tpl.name}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]">
                    {tpl.tagline}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[12.5px]">
                    <span className="font-semibold text-[var(--studio-ink)]">
                      {formatCurrency(tpl.price)}
                    </span>
                    <span className="font-mono uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                      {tpl.readyInDays} days
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
