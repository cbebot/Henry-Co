import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { CourseCard, LearnEmptyState, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerSavedPage() {
  const viewer = await requireLearnUser("/learner/saved");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="Saved Courses"
      title="Keep a cleaner shortlist of programs worth returning to."
      description="Saved courses stay separate from active enrollments so the academy never feels cluttered."
      nav={learnerNav("/learner/saved")}
    >
      {workspace.savedCourses.length === 0 ? (
        <LearnEmptyState title="Nothing saved yet" body="Bookmark courses from the public catalog and they will appear here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {workspace.savedCourses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} saved />
          ))}
        </div>
      )}
    </LearnWorkspaceShell>
  );
}
