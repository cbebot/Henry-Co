import { requireJobsUser } from "@/lib/auth";
import { candidateNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function CandidateSettingsPage() {
  await requireJobsUser("/candidate/settings");

  return (
    <WorkspaceShell
      area="candidate"
      title="Settings"
      subtitle="Notification routing and account defaults stay aligned with the future shared HenryCo account."
      nav={candidateNav}
      activeHref="/candidate/settings"
      accent="linear-gradient(135deg,#0d5e66 0%,#0e7c86 55%,#7fd0d4 100%)"
    >
      <SectionCard title="Notification defaults" body="Transactional email is enabled for live application movement. WhatsApp depends on provider eligibility.">
        <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm leading-7 text-[var(--jobs-muted)]">
          Candidate settings are kept server-side through the shared customer preferences record. Jobs-specific alerts live in the jobs activity layer.
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
