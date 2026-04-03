import { requireJobsRoles } from "@/lib/auth";
import { getModerationQueue } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterVerificationPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/verification");
  const queue = await getModerationQueue();

  return (
    <WorkspaceShell area="recruiter" title="Verification" subtitle="Employer and job trust states that still need attention." nav={recruiterNav} activeHref="/recruiter/verification" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title="Pending employers">
        <div className="space-y-3">
          {queue.pendingEmployers.map((employer) => (
            <div key={employer.slug} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="font-semibold">{employer.name}</div>
              <div className="mt-1 text-sm text-[var(--jobs-muted)]">{employer.verificationStatus}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
