import { requireJobsRoles } from "@/lib/auth";
import { getModerationQueue } from "@/lib/jobs/data";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/moderation");
  const queue = await getModerationQueue();

  return (
    <WorkspaceShell area="moderation" title="Moderation" subtitle="Jobs and employer records that still carry review pressure." nav={[{ href: "/moderation", label: "Queue" }, { href: "/recruiter", label: "Recruiter" }]} activeHref="/moderation" accent="linear-gradient(135deg,#5e2020 0%,#9f3f3f 55%,#e38e8e 100%)">
      <SectionCard title="Pending jobs">
        <div className="space-y-3">
          {queue.pendingJobs.map((job) => (
            <div key={job.slug} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="font-semibold">{job.title}</div>
              <div className="mt-1 text-sm text-[var(--jobs-muted)]">{job.moderationStatus}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
