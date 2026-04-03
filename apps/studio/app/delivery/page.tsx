import Link from "next/link";
import { requireStudioRoles } from "@/lib/studio/auth";
import { deliveryNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function DeliveryDashboardPage() {
  await requireStudioRoles(["studio_owner", "developer_designer", "project_manager"], "/delivery");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Delivery vault"
      title="Manage shipped assets, delivery files, and final handoff confidence."
      description="Delivery holds the visible record of what has been shared, what is under review, and what still needs a clean handoff package."
      nav={deliveryNav("/delivery")}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StudioMetricCard label="Files" value={String(snapshot.files.filter((file) => file.kind === "deliverable").length)} hint="All delivery files already pushed into the Studio vault." />
        <StudioMetricCard label="Deliverables" value={String(snapshot.deliverables.length)} hint="Named delivery batches shared to clients." />
        <StudioMetricCard label="Approved" value={String(snapshot.deliverables.filter((item) => item.status === "approved").length)} hint="Deliverables fully signed off by the client." />
        <StudioMetricCard label="Reference assets" value={String(snapshot.files.filter((file) => file.kind === "reference").length)} hint="Reference files available to support production work." />
      </section>

      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Shared handoffs</div>
        <div className="mt-5 space-y-4">
          {snapshot.deliverables.map((deliverable) => (
            <article key={deliverable.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{deliverable.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{deliverable.summary}</p>
                </div>
                <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                  {deliverable.status}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {deliverable.fileIds.map((fileId) => (
                  <span key={fileId} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                    File {fileId.slice(0, 8)}
                  </span>
                ))}
              </div>
              <div className="mt-5">
                <Link href={`/project/${deliverable.projectId}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                  Open linked project
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </StudioWorkspaceShell>
  );
}
