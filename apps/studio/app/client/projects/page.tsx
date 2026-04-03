import Link from "next/link";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { clientNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function ClientProjectsPage() {
  const viewer = await requireStudioUser("/client/projects");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);

  return (
    <StudioWorkspaceShell
      kicker="Client projects"
      title="See every active and delivered Studio engagement."
      description="Projects remain visible here with direct links into milestone status, files, revisions, and message history."
      nav={clientNav("/client/projects")}
    >
      <section className="space-y-4">
        {clientData.projects.map((project) => (
          <article key={project.id} className="studio-panel rounded-[1.75rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-[var(--studio-ink)]">{project.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{project.summary}</p>
              </div>
              <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                {project.status.replaceAll("_", " ")}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.milestones.map((milestone) => (
                <span key={milestone.id} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                  {milestone.name} · {milestone.status.replaceAll("_", " ")}
                </span>
              ))}
            </div>
            <div className="mt-5">
              <Link href={`/project/${project.id}?access=${project.accessKey}`} className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Open project
              </Link>
            </div>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
