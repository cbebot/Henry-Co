import Link from "next/link";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerJobsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/jobs");
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email);

  return (
    <WorkspaceShell
      area="employer"
      title="Employer Jobs"
      subtitle="Role visibility, moderation state, and application counts stay attached to each posting."
      nav={employerNav}
      activeHref="/employer/jobs"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title="Posted roles" actions={<Link href="/employer/jobs/new" className="jobs-button-primary rounded-full px-4 py-2.5 text-sm font-semibold">Post role</Link>}>
        <div className="space-y-3">
          {data.jobs.map((job) => (
            <Link key={job.slug} href={`/employer/jobs/${job.slug}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{job.title}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{job.location} · {job.applicationCount} applicants</div>
                </div>
                <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{job.moderationStatus}</span>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
