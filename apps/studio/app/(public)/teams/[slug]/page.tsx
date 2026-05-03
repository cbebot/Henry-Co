import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getStudioCatalog, getStudioTeamBySlug } from "@/lib/studio/catalog";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [team, catalog] = await Promise.all([
    getStudioTeamBySlug(slug),
    getStudioCatalog(),
  ]);
  if (!team) notFound();

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="studio-kicker">{team.label}</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
              {team.name}
            </h1>
          </div>
          <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            {team.availability}
          </span>
        </div>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          {team.summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/request?team=${team.id}`}
            className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            Select this team
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/request"
            className="studio-button-secondary inline-flex rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            Ask for a recommendation
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <ul className="grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[var(--studio-line)]">
          {[
            { title: "Specialties", items: team.focus },
            { title: "Industries", items: team.industries },
            { title: "Technology", items: team.stack },
          ].map((section, i) => (
            <li key={section.title} className={i > 0 ? "lg:pl-8" : ""}>
              <p className="studio-kicker">{section.title}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="studio-kicker">Strengths</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            What this team does best.
          </h2>
          <ul className="mt-7 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {team.highlights.map((item) => (
              <li
                key={item}
                className="py-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="studio-kicker">Representative work</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            Recent case studies in this lane.
          </h2>
          <ul className="mt-7 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {catalog.caseStudies.slice(0, 3).map((item) => (
              <li key={item.id} className="py-5">
                <h3 className="text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--studio-ink-soft)]">
                  {item.challenge}
                </p>
                <p className="mt-2 text-[12.5px] font-semibold text-[var(--studio-signal)]">
                  {item.impact}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
