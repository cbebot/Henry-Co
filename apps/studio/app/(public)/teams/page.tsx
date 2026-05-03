import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioTeamSlug } from "@/lib/studio/content";
import { studioLeadership } from "@/lib/studio/templates";

export default async function TeamsPage() {
  const catalog = await getStudioCatalog();

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Teams</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          The people accountable for your build.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          HenryCo Studio runs four delivery pods — each tuned to a kind of work — backed by a named
          leadership group that owns scope, quality, and the launch date.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Studio leadership</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Every project has a named lead from this group. You&rsquo;ll know who signs off on scope,
          who answers when something slips, and who is on the hook for launch.
        </p>
        <ol className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {studioLeadership.map((leader) => (
            <li key={leader.id}>
              <article className="flex h-full flex-col rounded-[1.4rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-5">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-[var(--studio-signal)]/40 bg-[rgba(11,42,52,0.5)] text-[var(--studio-signal)]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)]">
                      {leader.name}
                    </h3>
                    <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                      {leader.role}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-[var(--studio-ink-soft)]">
                  {leader.bio}
                </p>
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
                  {leader.focus.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Delivery pods</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Pick the pod that fits your project, or send the brief and let Studio route you
          to the right match.
        </p>
      </section>

      <ol className="mt-7 grid gap-5 lg:grid-cols-2">
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
