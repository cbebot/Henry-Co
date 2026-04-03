import { updateEmployerVerificationAction } from "@/app/actions";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterEmployersPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/employers");
  const data = await getRecruiterOverviewData();

  return (
    <WorkspaceShell area="recruiter" title="Employers" subtitle="Review employer trust posture and verification state." nav={recruiterNav} activeHref="/recruiter/employers" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title="Employer verification">
        <div className="space-y-3">
          {data.employers.map((employer) => (
            <div key={employer.slug} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{employer.name}</div>
                  <div className="mt-1 text-sm text-[var(--jobs-muted)]">{employer.industry} · trust {employer.trustScore}</div>
                </div>
                <form action={updateEmployerVerificationAction} className="flex gap-2">
                  <input type="hidden" name="employerSlug" value={employer.slug} />
                  <select name="status" defaultValue={employer.verificationStatus} className="jobs-select max-w-[150px]">
                    {["pending", "verified", "watch", "rejected"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button className="jobs-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold">Save</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
