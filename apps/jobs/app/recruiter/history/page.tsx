import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterHistoryPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter/history");
  const data = await getRecruiterOverviewData();

  return (
    <WorkspaceShell area="recruiter" title="History" subtitle="Audit trail for jobs, verification, and application movement." nav={recruiterNav} activeHref="/recruiter/history" accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)">
      <SectionCard title="Recent history">
        <div className="space-y-3">
          {data.history.slice(0, 40).map((event) => (
            <div key={event.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="font-semibold">{event.action}</div>
              <div className="mt-1 text-sm text-[var(--jobs-muted)]">{event.reason || JSON.stringify(event.newValues)}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
