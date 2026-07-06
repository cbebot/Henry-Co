import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ScrollText } from "lucide-react";
import {
  getStudioPolicyBySlug,
  studioPolicyIndex,
  type PolicyClause,
} from "@/lib/studio/policies";

export async function generateStaticParams() {
  return studioPolicyIndex.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getStudioPolicyBySlug(slug);
  if (!policy) {
    return {
      title: "Policy not found | Henry Onyx Studio",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${policy.title} | Henry Onyx Studio`,
    description: policy.description,
    alternates: { canonical: `/policies/${policy.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function StudioPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getStudioPolicyBySlug(slug);
  if (!policy) notFound();

  const others = studioPolicyIndex.filter((item) => item.slug !== policy.slug);

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[68rem] px-5 pb-24 pt-10 sm:px-8 lg:px-10"
    >
      <Link
        href="/policies"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3 w-3" />
        All policies
      </Link>

      <article className="mt-6">
        <header className="border-b border-[var(--studio-line)] pb-8">
          <p className="flex items-center gap-2 studio-kicker">
            <ScrollText className="h-3.5 w-3.5" />
            {policy.shortTitle}
          </p>
          {/* Owner direction (spec §7.5): the editorial page title reads in the SERIF,
              not a flat sans scaled up. .hc-font-reading gives the clean editorial serif
              (optical-sizing:auto opens its display contrast at this size) and becomes the
              bespoke serif at reveal. The neat serif body below is kept as the reference. */}
          <h1 className="hc-font-reading mt-4 text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.4rem] md:text-[2.8rem]">
            {policy.title}
          </h1>
          {/* READING-02: hero intent reads in the editorial serif face
              (size/leading stay tuned for the hero; --studio-ink-soft already
              maps to the ink-70 equivalent on the public theme). */}
          <p className="hc-font-reading mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)]">
            {policy.intent}
          </p>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
            <DefinitionItem label="Effective from" value={policy.effectiveFrom} />
            <DefinitionItem label="Last reviewed" value={policy.lastUpdated} />
            <DefinitionItem label="Governing law" value={policy.governingLaw} />
          </dl>
        </header>

        <ol className="mt-10 space-y-10">
          {policy.clauses.map((clause) => (
            <Clause key={clause.heading} clause={clause} />
          ))}
        </ol>
      </article>

      <section className="mt-16 rounded-[1.5rem] border border-[var(--studio-signal)]/35 bg-[rgba(11,42,52,0.45)] p-6 sm:p-8">
        <p className="studio-kicker">Continue reading</p>
        <h2 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.5rem]">
          The other agreements that govern Henry Onyx Studio engagements.
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/policies/${item.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] px-4 py-3 transition hover:border-[color:var(--home-accent)]"
              >
                <span>
                  <span className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                    {item.shortTitle}
                  </span>
                  <span className="mt-1 block text-[14px] font-semibold text-[var(--studio-ink)]">
                    {item.title}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--studio-ink-soft)] transition group-hover:translate-x-0.5 group-hover:text-[var(--studio-ink)]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function DefinitionItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-[var(--studio-ink)]">{value}</dd>
    </div>
  );
}

function Clause({ clause }: { clause: PolicyClause }) {
  return (
    <li>
      <h2 className="text-[1.05rem] font-semibold tracking-[-0.005em] text-[var(--studio-ink)] sm:text-[1.15rem]">
        {clause.heading}
      </h2>
      {/* READING-02: legal clause bodies = long-form reading → .hc-prose
          (serif 18px / 1.6 / 66ch measure + paragraph/list rhythm — the hub
          SectionBlock precedent). Ink stays host-owned. */}
      <div className="hc-prose mt-3 text-[var(--studio-ink-soft)]">
        {clause.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {clause.bullets && clause.bullets.length > 0 ? (
          // READING-02: keep list-disc (preflight strips markers); indent +
          // li rhythm come from .hc-prose.
          <ul className="list-disc">
            {clause.bullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
