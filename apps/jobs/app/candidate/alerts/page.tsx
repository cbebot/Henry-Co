import Link from "next/link";
import { createJobAlertAction } from "@/app/actions";
import { requireJobsUser } from "@/lib/auth";
import { getCandidateDashboardData } from "@/lib/jobs/data";
import { candidateNav } from "@/lib/jobs/navigation";
import { EmptyState, InlineNotice } from "@/components/feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

function describeAlertCriteria(criteria: Record<string, unknown>) {
  const segments = [
    typeof criteria.q === "string" && criteria.q ? `Keyword: ${criteria.q}` : null,
    typeof criteria.category === "string" && criteria.category ? `Category: ${criteria.category}` : null,
    typeof criteria.mode === "string" && criteria.mode ? `Mode: ${criteria.mode}` : null,
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(" | ") : "Any matching HenryCo Jobs role.";
}

export default async function CandidateAlertsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireJobsUser("/candidate/alerts");
  const [data, params] = await Promise.all([
    getCandidateDashboardData(viewer.user!.id),
    searchParams ?? Promise.resolve({}),
  ]);
  const saved = params.saved === "1";

  return (
    <WorkspaceShell
      area="candidate"
      title="Job Alerts"
      subtitle="Create live alerts that can feed in-app, email, and scheduler-driven job updates."
      nav={candidateNav}
      activeHref="/candidate/alerts"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <div className="space-y-4">
        {saved ? (
          <InlineNotice
            tone="success"
            title="Alert saved"
            body="This alert is now stored in the live Jobs activity layer and can feed in-app and email job updates."
          />
        ) : null}

        <SectionCard title="Create alert" body="Alerts are stored in the real jobs activity layer, not a local browser stub.">
          <form action={createJobAlertAction} className="grid gap-4 md:grid-cols-2">
            <input name="label" className="jobs-input" placeholder="Remote operations roles" />
            <input name="q" className="jobs-input" placeholder="Keyword" />
            <input name="category" className="jobs-input" placeholder="Category slug" />
            <input name="mode" className="jobs-input" placeholder="remote, hybrid, onsite" />
            <PendingSubmitButton pendingLabel="Saving alert..." className="md:col-span-2">
              Save alert
            </PendingSubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Active alerts" body="Each alert stays attached to your shared HenryCo account graph.">
          {data.alerts.length === 0 ? (
            <EmptyState
              kicker="No alerts yet"
              title="Create your first live role alert."
              body="Use alerts to quietly watch the categories, keywords, and work modes that matter to you."
              action={
                <Link href="/jobs" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                  Explore roles first
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{alert.label}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{describeAlertCriteria(alert.criteria)}</div>
                    </div>
                    <div className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                      {alert.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
