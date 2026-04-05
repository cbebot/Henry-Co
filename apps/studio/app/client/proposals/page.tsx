import Link from "next/link";
import { formatCurrency } from "@/lib/env";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { clientNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { friendlyProposalStatus } from "@/lib/studio/project-workspace-copy";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function ClientProposalsPage() {
  const viewer = await requireStudioUser("/client/proposals");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);

  return (
    <StudioWorkspaceShell
      kicker="Client proposals"
      title="Review every Studio proposal tied to your account."
      description="Proposal history stays available here so scope, pricing, and milestone logic are always easy to revisit."
      nav={clientNav("/client/proposals")}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {clientData.proposals.map((proposal) => (
          <article key={proposal.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-2xl font-semibold text-[var(--studio-ink)]">{proposal.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{proposal.summary}</p>
            <div className="mt-4 text-2xl font-semibold text-[var(--studio-ink)]">
              {formatCurrency(proposal.investment, proposal.currency)}
            </div>
            <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">{friendlyProposalStatus(proposal.status)}</div>
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
