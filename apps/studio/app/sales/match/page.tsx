import { getStudioCatalog } from "@/lib/studio/catalog";
import { requireStudioRoles } from "@/lib/studio/auth";
import { salesNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function SalesMatchPage() {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/match");
  const [snapshot, catalog] = await Promise.all([
    getStudioSnapshot(),
    getStudioCatalog({ includeUnpublished: true }),
  ]);

  return (
    <StudioWorkspaceShell
      kicker="Matching board"
      title="See how demand clusters around the current Studio teams."
      description="This gives sales a fast view into which team is best positioned for the next proposal lane."
      nav={salesNav("/sales/match")}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {catalog.teams.map((team) => (
          <article key={team.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-2xl font-semibold text-[var(--studio-ink)]">{team.name}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{team.summary}</p>
            <div className="mt-4 text-sm text-[var(--studio-signal)]">
              Matched leads: {snapshot.leads.filter((lead) => lead.matchedTeamId === team.id).length}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {team.focus.map((focus) => (
                <span key={focus} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                  {focus}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
