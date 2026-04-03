import { createJobAlertAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateAlertsPage() {
  const viewer = await requireJobsUser("/candidate/alerts");
  const data = await getCandidateDashboardData(viewer.user!.id);

  return (
    <WorkspaceShell
      area="candidate"
      title="Job Alerts"
      subtitle="Create live alerts that can feed in-app, email, and scheduler-driven job updates."
      nav={candidateNav}
      activeHref="/candidate/alerts"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Create alert" body="Alerts are stored in the real jobs activity layer, not a local browser stub.">
        <form action={createJobAlertAction} className="grid gap-4 md:grid-cols-2">
          <input name="label" className="jobs-input" placeholder="Remote operations roles" />
          <input name="q" className="jobs-input" placeholder="Keyword" />
          <input name="category" className="jobs-input" placeholder="Category slug" />
          <input name="mode" className="jobs-input" placeholder="remote, hybrid, onsite" />
          <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold md:col-span-2">
            Save alert
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Active alerts">
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="font-semibold">{alert.label}</div>
              <div className="mt-1 text-sm text-[var(--jobs-muted)]">{JSON.stringify(alert.criteria)}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
