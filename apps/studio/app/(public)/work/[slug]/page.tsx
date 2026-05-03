import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getStudioCaseStudyBySlug } from "@/lib/studio/catalog";

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = await getStudioCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[72rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">{caseStudy.type}</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          {caseStudy.name}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          {caseStudy.challenge}
        </p>

        <div className="mt-10 border-l-2 border-[var(--studio-signal)]/55 pl-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-signal)]">
            Impact
          </p>
          <p className="mt-3 max-w-2xl text-[1.45rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.7rem]">
            {caseStudy.impact}
          </p>
          {caseStudy.metrics.length ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {caseStudy.metrics.map((metric) => (
                <li
                  key={metric}
                  className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                >
                  {metric}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Link
          href="/request"
          className="studio-button-primary mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          Build something at this level
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mt-16 grid gap-12 md:grid-cols-2">
        <div>
          <p className="studio-kicker">The challenge</p>
          <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
            {caseStudy.challenge}
          </p>
        </div>
        <div>
          <p className="studio-kicker">The result</p>
          <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{caseStudy.impact}</p>
        </div>
      </section>
    </main>
  );
}
