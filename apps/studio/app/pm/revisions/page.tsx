import { requireStudioRoles } from "@/lib/studio/auth";
import { pmNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function PmRevisionsPage() {
  await requireStudioRoles(["studio_owner", "project_manager"], "/pm/revisions");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Revision queue"
      title="Track every open and completed revision."
      description="Revision governance protects the Studio team from untracked scope drift."
      nav={pmNav("/pm/revisions")}
    >
      <section className="space-y-4">
        {snapshot.revisions.map((revision) => (
          <article key={revision.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{revision.summary}</h3>
            <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              Requested by {revision.requestedBy} · {revision.status}
            </p>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
