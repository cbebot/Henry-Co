import type { Metadata } from "next";
import { getJobsCopy } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getEmployerDashboardData } from "@/lib/jobs/data";
import { employerNav } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCopy(locale).employerAnalytics;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

export default async function EmployerAnalyticsPage() {
  const viewer = await requireJobsRoles(["employer", "admin", "owner"], "/employer/analytics");
  const locale = await getJobsPublicLocale();
  const data = await getEmployerDashboardData(viewer.user!.id, viewer.user!.email, locale);
  const copy = getJobsCopy(locale).employerAnalytics;

  const stageLabel = (stage: string): string => {
    switch (stage) {
      case "applied":
        return copy.stageApplied;
      case "reviewing":
        return copy.stageReviewing;
      case "shortlisted":
        return copy.stageShortlisted;
      case "interview":
        return copy.stageInterview;
      case "offer":
        return copy.stageOffer;
      case "hired":
        return copy.stageHired;
      case "rejected":
        return copy.stageRejected;
      default:
        return stage
          .split(/[_\s-]+/)
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(" ");
    }
  };

  return (
    <WorkspaceShell
      area="employer"
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
      nav={employerNav}
      activeHref="/employer/analytics"
      accent="linear-gradient(135deg,#7c5a28 0%,#b88a47 55%,#f1c88c 100%)"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label={copy.tileJobsLabel} value={data.jobs.length} detail={copy.tileJobsDetail} />
        <StatTile label={copy.tileApplicantsLabel} value={data.applications.length} detail={copy.tileApplicantsDetail} />
        <StatTile label={copy.tileInterviewingLabel} value={data.stageSummary.interview ?? 0} detail={copy.tileInterviewingDetail} />
        <StatTile label={copy.tileOffersLabel} value={data.stageSummary.offer ?? 0} detail={copy.tileOffersDetail} />
      </div>
      <SectionCard title={copy.stageSectionTitle}>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(data.stageSummary).map(([stage, count]) => (
            <div key={stage} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">{stageLabel(stage)}</div>
              <div className="mt-2 text-2xl font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
