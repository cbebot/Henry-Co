import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudioCatalog, getStudioTeamBySlug } from "@/lib/studio/catalog";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [team, catalog] = await Promise.all([getStudioTeamBySlug(slug), getStudioCatalog()]);
  if (!team) notFound();

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="studio-kicker">{team.label}</div>
            <h1 className="studio-heading mt-4">{team.name}</h1>
          </div>
          <div className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
            {team.availability}
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--studio-ink-soft)]">{team.summary}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/request?team=${team.id}`} className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Select this team
          </Link>
          <Link href="/request" className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Ask for a recommendation
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {[
          { title: "Specialties", items: team.focus },
          { title: "Industries", items: team.industries },
          { title: "Technology", items: team.stack },
        ].map((section) => (
          <article key={section.title} className="studio-panel rounded-[1.75rem] p-6">
            <div className="studio-kicker">{section.title}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {section.items.map((item) => (
                <span key={item} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Strengths</div>
          <div className="mt-5 space-y-3">
            {team.highlights.map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Representative work</div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {catalog.caseStudies.slice(0, 3).map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-lg font-semibold text-[var(--studio-ink)]">{item.name}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.challenge}</p>
                <div className="mt-3 text-sm text-[var(--studio-signal)]">{item.impact}</div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
