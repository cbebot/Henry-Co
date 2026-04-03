import Link from "next/link";
import { setLeadStatusAction } from "@/lib/studio/actions";
import { requireStudioRoles } from "@/lib/studio/auth";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { salesNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function SalesLeadsPage() {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/leads");
  const [snapshot, catalog] = await Promise.all([
    getStudioSnapshot(),
    getStudioCatalog({ includeUnpublished: true }),
  ]);

  return (
    <StudioWorkspaceShell
      kicker="Lead queue"
      title="Lead-by-lead qualification with readiness and team matching context."
      description="Every lead record keeps enough structure to let sales move from inquiry to proposal without restarting discovery."
      nav={salesNav("/sales/leads")}
    >
      <section className="space-y-4">
        {snapshot.leads.map((lead) => {
          const proposal = snapshot.proposals.find((item) => item.leadId === lead.id) ?? null;
          const matchedTeam = catalog.teams.find((item) => item.id === lead.matchedTeamId) ?? null;
          const service = catalog.services.find((item) => item.kind === lead.serviceKind) ?? null;

          return (
            <article key={lead.id} className="studio-panel rounded-[1.75rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--studio-ink)]">{lead.customerName}</h3>
                  <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                    {service?.name || lead.serviceKind.replaceAll("_", " ")} · {lead.businessType} · {lead.budgetBand}
                  </p>
                </div>
                <form action={setLeadStatusAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="redirectPath" value="/sales/leads" />
                  <select name="status" defaultValue={lead.status} className="studio-select rounded-full px-4 py-2 text-sm">
                    {["new", "qualified", "proposal_ready", "proposal_sent", "won", "lost"].map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]">
                    Save
                  </button>
                </form>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                Matched team: {matchedTeam?.name || "Pending"} · Contact: {lead.normalizedEmail || "No email"}
                {lead.phone ? ` · ${lead.phone}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                  Readiness {lead.readinessScore}
                </span>
                <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                  {lead.status.replaceAll("_", " ")}
                </span>
              </div>
              {proposal ? (
                <div className="mt-5">
                  <Link href={`/proposals/${proposal.id}?access=${proposal.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                    Open proposal
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </StudioWorkspaceShell>
  );
}
