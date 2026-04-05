import Link from "next/link";
import { formatCurrency } from "@/lib/env";
import { StudioFormListbox } from "@/components/studio/studio-form-listbox";
import { setProposalStatusAction } from "@/lib/studio/actions";
import { STUDIO_PROPOSAL_STATUS_OPTIONS } from "@/lib/studio/form-options";
import { requireStudioRoles } from "@/lib/studio/auth";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { salesNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function SalesProposalsPage() {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/proposals");
  const [snapshot, catalog] = await Promise.all([
    getStudioSnapshot(),
    getStudioCatalog({ includeUnpublished: true }),
  ]);

  return (
    <StudioWorkspaceShell
      kicker="Proposal queue"
      title="Track sent, accepted, and expired scopes from one list."
      description="Sales can change proposal state, preserve the commercial trail, and move into project activation without leaving the Studio surface."
      nav={salesNav("/sales/proposals")}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {snapshot.proposals.map((proposal) => (
          <article key={proposal.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{proposal.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{proposal.summary}</p>
            <p className="mt-3 text-sm text-[var(--studio-ink-soft)]">
              {catalog.services.find((item) => item.id === proposal.serviceId)?.name || proposal.serviceId} · {catalog.teams.find((item) => item.id === proposal.teamId)?.name || "Team assigned in review"}
            </p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold text-[var(--studio-ink)]">{formatCurrency(proposal.investment, proposal.currency)}</div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                {proposal.status.replaceAll("_", " ")}
              </div>
            </div>
            <form action={setProposalStatusAction} className="mt-5 flex flex-wrap items-end gap-2">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="redirectPath" value="/sales/proposals" />
              <div className="min-w-[11.5rem] max-w-[16rem]">
                <StudioFormListbox
                  name="status"
                  label="Proposal status"
                  initialValue={proposal.status}
                  options={STUDIO_PROPOSAL_STATUS_OPTIONS}
                />
              </div>
              <button type="submit" className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]">
                Save
              </button>
            </form>
            <div className="mt-5">
              <Link href={`/proposals/${proposal.id}?access=${proposal.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                Open proposal
              </Link>
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
