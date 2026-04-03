import Link from "next/link";
import { requireStudioRoles } from "@/lib/studio/auth";
import { pmNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function ProjectManagerPage() {
  await requireStudioRoles(["studio_owner", "project_manager"], "/pm");
  const snapshot = await getStudioSnapshot();

  return (
    <StudioWorkspaceShell
      kicker="Project management"
      title="Advance milestones, resolve revisions, and keep every project accountable."
      description="This surface exists to keep scope, timing, review states, and next actions explicit across the Studio pipeline."
      nav={pmNav("/pm")}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StudioMetricCard label="Active" value={String(snapshot.projects.filter((project) => project.status === "active").length)} hint="Projects currently moving through the core delivery lane." />
        <StudioMetricCard label="Review" value={String(snapshot.projects.filter((project) => project.status === "in_review").length)} hint="Projects waiting on client feedback or approval." />
        <StudioMetricCard label="Open revisions" value={String(snapshot.revisions.filter((revision) => revision.status !== "completed").length)} hint="Tracked revision items requiring PM attention." />
        <StudioMetricCard label="Milestones ready" value={String(snapshot.projects.flatMap((project) => project.milestones).filter((milestone) => milestone.status === "ready_for_review").length)} hint="Delivery checkpoints already prepared for client review." />
      </section>

      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Project board</div>
        <div className="mt-5 space-y-4">
          {snapshot.projects.map((project) => (
            <article key={project.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--studio-ink)]">{project.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{project.nextAction}</p>
                </div>
                <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
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
                <Link href={`/project/${project.id}?access=${project.accessKey}`} className="studio-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                  Open project workspace
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </StudioWorkspaceShell>
  );
}
