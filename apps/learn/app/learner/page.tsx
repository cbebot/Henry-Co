import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { CourseCard, LearnMetricCard, LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerOverviewPage() {
  const viewer = await requireLearnUser("/learner");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="Learner Workspace"
      title="Track progress, certificates, assignments, and your next best course."
      description="HenryCo Learn keeps the learner view calm and progress-centered while preserving the real operational details behind payments, reminders, certificates, and internal assignments."
      nav={learnerNav("/learner")}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <LearnMetricCard label="Active courses" value={String(workspace.totals.activeCourses)} hint="Programs that are currently open and in progress." />
        <LearnMetricCard label="Completed courses" value={String(workspace.totals.completedCourses)} hint="Courses that reached HenryCo Learn completion rules." />
        <LearnMetricCard label="Certificates" value={String(workspace.totals.certificates)} hint="Issued certificates linked into your academy history." />
        <LearnMetricCard label="Pending assignments" value={String(workspace.totals.pendingAssignments)} hint="Internal or sponsored training still awaiting completion." />
      </div>

      <LearnPanel className="rounded-[2rem]">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">In progress</h3>
        <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {workspace.courses.slice(0, 3).map(({ course }) =>
            course ? <CourseCard key={course.id} course={course} href={`/learner/courses/${course.id}`} /> : null
          )}
        </div>
      </LearnPanel>

      <LearnPanel className="rounded-[2rem]">
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Recommended next</h3>
        <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {workspace.recommended.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
          ))}
        </div>
      </LearnPanel>
    </LearnWorkspaceShell>
  );
}
