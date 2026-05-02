import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioTeamSlug } from "@/lib/studio/content";

export default async function TeamsPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Teams</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Specialist teams, matched to the work.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Pick the team that fits your project, or send the brief and let Studio route you to the
          right match.
        </p>
      </section>

      <ol className="mt-14 grid gap-5 lg:grid-cols-2">
        {catalog.teams.map((team) => (
          <li key={team.id} id={team.id} className="scroll-mt-32">
            <article className="studio-card-tactile flex h-full flex-col rounded-[1.8rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                    {team.label}
                  </p>
                  <h2 className="mt-3 text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.55rem]">
                    {team.name}
                  </h2>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                  {team.availability}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--studio-ink-soft)]">
                {team.summary}
              </p>
              {team.focus.length ? (
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {team.focus.map((focus) => (
                    <li
                      key={focus}
                      className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                    >
                      {focus}
                    </li>
                  ))}
                </ul>
              ) : null}
              {team.highlights.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {team.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="rounded-full border border-[var(--studio-signal)]/30 bg-[rgba(73,192,197,0.08)] px-2.5 py-1 text-[10.5px] font-semibold tracking-tight text-[var(--studio-signal)]"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                <Link
                  href={`/request?team=${team.id}`}
                  className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  Select this team
                </Link>
                <Link
                  href={`/teams/${studioTeamSlug(team)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
                >
                  Team detail
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </main>
  );
}
