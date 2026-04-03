import { requireStudioRoles } from "@/lib/studio/auth";
import { deliveryNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function DeliveryAssetsPage() {
  await requireStudioRoles(["studio_owner", "developer_designer", "project_manager"], "/delivery/assets");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Asset vault"
      title="Every uploaded Studio file across the active delivery estate."
      description="Use this surface to inspect proofs, references, and deliverables without leaving the delivery lane."
      nav={deliveryNav("/delivery/assets")}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {snapshot.files.map((file) => (
          <article key={file.id} className="studio-panel rounded-[1.75rem] p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{file.kind}</div>
            <h3 className="mt-3 text-xl font-semibold text-[var(--studio-ink)]">{file.label}</h3>
            <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">{file.path}</p>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
