import Link from "next/link";
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
    <main className="mx-auto max-w-[72rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="max-w-3xl">
          <div className="studio-kicker">{caseStudy.type}</div>
          <h1 className="studio-heading mt-4 text-balance">{caseStudy.name}</h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">{caseStudy.challenge}</p>
        </div>
        <div className="mt-8 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">Impact</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">{caseStudy.impact}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {caseStudy.metrics.map((metric) => (
              <span key={metric} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                {metric}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <Link href="/request" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Build something at this level
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">The challenge</div>
          <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{caseStudy.challenge}</p>
        </article>
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">The result</div>
          <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{caseStudy.impact}</p>
        </article>
      </section>
    </main>
  );
}
