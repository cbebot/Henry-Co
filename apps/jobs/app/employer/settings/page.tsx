import { requireJobsRoles } from "@/lib/auth";
import { employerNav } from "@/lib/jobs/navigation";
import { SectionCard, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerSettingsPage() {
  await requireJobsRoles(["employer", "admin", "owner"], "/employer/settings");

  return (
    <WorkspaceShell
      area="employer"
      title="Employer Settings"
      subtitle="Settings stay server-side and preserve future unified account compatibility."
      nav={employerNav}
      activeHref="/employer/settings"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <SectionCard title="Settings note" body="The employer console already persists company state, jobs, applications, and notes in shared Supabase records.">
        <div className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm leading-7 text-[var(--jobs-muted)]">
          Additional billing and seat controls can layer on top of the current employer membership model without changing the canonical activity graph.
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
