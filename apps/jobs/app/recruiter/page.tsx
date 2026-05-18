import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getRecruiterOverviewData } from "@/lib/jobs/data";
import { recruiterNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { EmptyState } from "@/components/feedback";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function RecruiterOverviewPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/recruiter");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const data = await getRecruiterOverviewData(locale);

  return (
    <WorkspaceShell
      area="recruiter"
      title={t("Recruiter Console")}
      subtitle={t("Manage the hiring pipeline, employers, moderation, and candidate queue.")}
      nav={recruiterNav}
      activeHref="/recruiter"
      accent="linear-gradient(135deg,#1d3f6f 0%,#3266b4 55%,#6db7ff 100%)"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label={t("Jobs")} value={data.jobs.length} detail={t("Published and pending jobs in the system.")} />
          <StatTile label={t("Employers")} value={data.employers.length} detail={t("Employer profiles under management.")} />
          <StatTile label={t("Candidates")} value={data.candidateProfiles.length} detail={t("Profiles with live jobs metadata.")} />
          <StatTile label={t("Applications")} value={data.applications.length} detail={t("Active pipeline rows.")} />
        </div>

        <SectionCard title={t("Priority queue")} actions={<Link href="/recruiter/pipeline" className="text-sm font-semibold text-[var(--jobs-accent)]">{t("Open pipeline")}</Link>}>
          {data.applications.length === 0 ? (
            <EmptyState
              kicker={t("No active queue")}
              title={t("The pipeline is quiet right now.")}
              body={t("New applications, moderation pressure, and hiring movement will appear here as soon as the live system receives them.")}
            />
          ) : (
            <div className="space-y-3">
              {data.applications.slice(0, 8).map((application) => (
                <Link key={application.applicationId} href={`/employer/applicants/${application.applicationId}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{application.candidateName}</div>
                      <div className="mt-1 text-sm text-[var(--jobs-muted)]">{application.jobTitle} · {application.employerName}</div>
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
