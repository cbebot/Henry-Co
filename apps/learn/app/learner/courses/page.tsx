import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { CourseCard, LearnEmptyState, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerCoursesPage() {
  const viewer = await requireLearnUser("/learner/courses");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="My Courses"
      title="Every enrollment, in one cleaner academy view."
      description="Track which courses are active, awaiting payment confirmation, or already completed without losing the path back into the learning experience."
      nav={learnerNav("/learner/courses")}
    >
      {workspace.courses.length === 0 ? (
        <LearnEmptyState title="No enrollments yet" body="Browse the academy catalog and enroll in a course to start building your HenryCo Learn history." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {workspace.courses.map(({ course }) =>
            course ? <CourseCard key={course.id} course={course} href={`/learner/courses/${course.id}`} /> : null
          )}
        </div>
      )}
    </LearnWorkspaceShell>
  );
}
