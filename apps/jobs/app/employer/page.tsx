import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { EmptyState } from "@/components/feedback";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function EmployerOverviewPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale);

  return (
    <WorkspaceShell
      area="employer"
      title={t("Employer workspace")}
      subtitle={t("Manage your company profile, job postings, and applicants in one place.")}
      nav={employerNav}
      activeHref="/employer"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label={t("Companies")} value={data.memberships.length} detail={t("Employer profiles linked to your account.")} />
          <StatTile label={t("Live jobs")} value={data.jobs.length} detail={t("Roles published or under review.")} />
          <StatTile label={t("Applicants")} value={data.applications.length} detail={t("Candidates across your roles.")} />
          <StatTile label={t("Shortlisted")} value={data.stageSummary.shortlisted ?? 0} detail={t("Applications already past early review.")} />
        </div>

        <SectionCard title={t("Recent applicants")} body={t("The latest candidates across your open roles.")} actions={<Link href="/employer/applicants" className="text-sm font-semibold text-[var(--jobs-accent)]">{t("View all")}</Link>}>
          {data.applications.length === 0 ? (
            <EmptyState
              kicker={t("No applicants yet")}
              title={t("Candidate movement will appear here.")}
              body={t("As soon as roles start receiving applications, this feed will show the newest candidates entering your hiring pipeline.")}
            />
          ) : (
            <div className="space-y-3">
              {data.applications.slice(0, 6).map((application) => (
                <Link key={application.applicationId} href={`/employer/applicants/${application.applicationId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4 hover:bg-[var(--jobs-accent-soft)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{application.candidateName}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.jobTitle}</div>
                    </div>
                    <span className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold capitalize">{application.stage.replace(/[_-]+/g, " ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
