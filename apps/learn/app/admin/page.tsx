import { requireLearnRoles } from "@/lib/learn/auth";
import { getOwnerAnalytics } from "@/lib/learn/data";
import { adminNav } from "@/lib/learn/navigation";
import { LearnMetricCard, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function AdminPage() {
  await requireLearnRoles(["academy_owner", "academy_admin"], "/admin");
  const analytics = await getOwnerAnalytics();

  return (
    <LearnWorkspaceShell
      kicker="Admin"
      title="Support the academy across courses, learners, assignments, and reporting."
      description="Admin operators can move between the core academy surfaces without needing the full owner view."
      nav={adminNav("/admin")}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label="Courses" value={String(analytics.metrics.totalCourses)} hint="Courses currently represented in the academy data layer." />
        <LearnMetricCard label="Learners" value={String(analytics.metrics.activeLearners)} hint="Distinct learner identities with live academy activity." />
        <LearnMetricCard label="Certificates" value={String(analytics.metrics.certificatesIssued)} hint="Issued credential volume." />
        <LearnMetricCard label="Assignments" value={String(analytics.snapshot.assignments.length)} hint="Tracked internal assignment records." />
      </div>
    </LearnWorkspaceShell>
  );
}
