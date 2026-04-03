import Link from "next/link";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterOverviewPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter");
  const data = await getRecruiterOverviewData();

  return (
    <WorkspaceShell
      area="recruiter"
      title="Recruiter Overview"
      subtitle="Pipeline triage, employers, moderation, and internal hiring queues in one operator-grade surface."
      nav={recruiterNav}
      activeHref="/recruiter"
      accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Jobs" value={data.jobs.length} detail="Published and pending jobs in the system." />
          <StatTile label="Employers" value={data.employers.length} detail="Employer profiles under management." />
          <StatTile label="Candidates" value={data.candidateProfiles.length} detail="Profiles with live jobs metadata." />
          <StatTile label="Applications" value={data.applications.length} detail="Active pipeline rows." />
        </div>

        <SectionCard title="Priority queue" actions={<Link href="/recruiter/pipeline" className="text-sm font-semibold text-[var(--jobs-accent)]">Open pipeline</Link>}>
          <div className="space-y-3">
            {data.applications.slice(0, 8).map((application) => (
              <Link key={application.applicationId} href={`/employer/applicants/${application.applicationId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{application.candidateName}</div>
                    <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.jobTitle} · {application.employerName}</div>
                  </div>
                  <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">{application.stage}</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
