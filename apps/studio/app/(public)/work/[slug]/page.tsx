import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createDivisionMetadata, toSeoDescription } from "@henryco/config";
import { getStudioCaseStudyBySlug } from "@/lib/studio/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getStudioCaseStudyBySlug(slug);

  if (!caseStudy) {
    return createDivisionMetadata("studio", {
      title: "Case study not found | HenryCo Studio",
      description: "The requested studio case study could not be found.",
      path: `/work/${slug}`,
      noIndex: true,
    });
  }

  return createDivisionMetadata("studio", {
    title: `${caseStudy.name} | HenryCo Studio`,
    description: toSeoDescription(caseStudy.challenge, caseStudy.impact),
    path: `/work/${slug}`,
  });
}

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
        <div className="studio-kicker">{caseStudy.type}</div>
        <h1 className="studio-heading mt-4">{caseStudy.name}</h1>
        <p className="mt-5 text-lg leading-8 text-[var(--studio-ink-soft)]">{caseStudy.challenge}</p>
        <div className="mt-8 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Impact</div>
          <div className="mt-3 text-2xl font-semibold text-[var(--studio-ink)]">{caseStudy.impact}</div>
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
