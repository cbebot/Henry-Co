import Link from "next/link";
import { requireStudioRoles } from "@/lib/studio/auth";
import { pmNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function PmProjectsPage() {
  await requireStudioRoles(["studio_owner", "project_manager"], "/pm/projects");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Project list"
      title="Project-by-project operational control."
      description="Use this list to jump directly into the workspace that needs milestone or revision attention."
      nav={pmNav("/pm/projects")}
    >
      <section className="space-y-4">
        {snapshot.projects.map((project) => (
          <article key={project.id} className="studio-panel rounded-[1.75rem] p-6">
            <h3 className="text-2xl font-semibold text-[var(--studio-ink)]">{project.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{project.nextAction}</p>
            <div className="mt-5">
              <Link href={`/project/${project.id}?access=${project.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                Open workspace
              </Link>
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
