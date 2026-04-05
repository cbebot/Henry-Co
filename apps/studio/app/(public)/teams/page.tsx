import Link from "next/link";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioTeamSlug } from "@/lib/studio/content";

export default async function TeamsPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="max-w-4xl">
          <div className="studio-kicker">Teams</div>
          <h1 className="studio-heading mt-4">
            Work with a specialist team matched to your project.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--studio-ink-soft)]">
            Each team brings deep experience in specific industries and project types. Choose the
            team that fits your needs, or let us recommend the best match based on your brief.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {catalog.teams.map((team) => (
          <article key={team.id} className="studio-panel rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="studio-kicker">{team.label}</div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                  {team.name}
                </h2>
              </div>
              <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                {team.availability}
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{team.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {team.focus.map((focus) => (
                <span key={focus} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                  {focus}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {team.highlights.map((highlight) => (
                <span key={highlight} className="rounded-full bg-[rgba(73,192,197,0.12)] px-3 py-1 text-xs text-[var(--studio-signal)]">
                  {highlight}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/request?team=${team.id}`} className="studio-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                Select this team
              </Link>
              <Link href={`/teams/${studioTeamSlug(team)}`} className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                View team detail
              </Link>
              <Link href="/request" className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                Request a match instead
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
