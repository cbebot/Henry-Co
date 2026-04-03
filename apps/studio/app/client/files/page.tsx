import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { clientNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function ClientFilesPage() {
  const viewer = await requireStudioUser("/client/files");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);

  return (
    <StudioWorkspaceShell
      kicker="Client files"
      title="Reference uploads, payment proofs, and delivery assets in one place."
      description="The file layer gives clients a single view of everything sent into or out of the Studio workspace."
      nav={clientNav("/client/files")}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {clientData.files.map((file) => (
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
