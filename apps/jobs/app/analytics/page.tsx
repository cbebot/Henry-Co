import { BriefcaseBusiness, ChartColumnBig } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { requireJobsRoles } from "@/lib/auth";
import { getAnalyticsSnapshot } from "@/lib/jobs/data";
import type { WorkspaceNavItem } from "@/lib/jobs/navigation";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SectionCard, StatTile, WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireJobsRoles(["recruiter", "admin", "owner", "moderator"], "/analytics");
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const snapshot = await getAnalyticsSnapshot();
  const analyticsNav: WorkspaceNavItem[] = [
    { href: "/analytics", label: t("Overview"), icon: ChartColumnBig },
    { href: "/recruiter", label: t("Recruiter"), icon: BriefcaseBusiness },
  ];

  return (
    <WorkspaceShell area="analytics" title={t("Platform Analytics")} subtitle={t("High-level jobs platform telemetry for operators and leadership.")} nav={analyticsNav} activeHref="/analytics" accent="linear-gradient(135deg,#123b33 0%,#1f7a59 55%,#8ee0bf 100%)">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("Jobs")} value={snapshot.totalJobs} detail={t("Published and draft jobs.")} />
        <StatTile label={t("Employers")} value={snapshot.employers} detail={t("Employer profiles in the system.")} />
        <StatTile label={t("Applications")} value={snapshot.applications} detail={t("Total applications.")} />
        <StatTile label={t("Verified employers")} value={snapshot.verifiedEmployers} detail={t("Employer pages with verified state.")} />
      </div>
      <SectionCard title={t("Stage counts")}>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(snapshot.stageCounts).map(([stage, count]) => (
            <div key={stage} className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4">
              <div className="jobs-kicker">{stage}</div>
              <div className="mt-2 text-2xl font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </WorkspaceShell>
  );
}
