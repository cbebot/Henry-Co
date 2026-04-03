import { requireLearnRoles } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { instructorNav } from "@/lib/learn/navigation";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function InstructorPage() {
  await requireLearnRoles(["academy_owner", "academy_admin", "instructor"], "/instructor");
  const snapshot = await getLearnSnapshot();

  return (
    <LearnWorkspaceShell
      kicker="Instructor"
      title="Monitor course quality, completions, and learner outcomes."
      description="Instructor views stay focused on teaching signals and learner outcomes so course quality remains easy to review."
      nav={instructorNav("/instructor")}
    >
      <div className="space-y-5">
        {snapshot.courses.map((course) => (
          <LearnPanel key={course.id} className="rounded-[2rem]">
            <div className="font-semibold text-[var(--learn-ink)]">{course.title}</div>
            <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">
              Enrollments: {snapshot.enrollments.filter((item) => item.courseId === course.id).length} • Certificates: {snapshot.certificates.filter((item) => item.courseId === course.id).length}
            </p>
          </LearnPanel>
        ))}
      </div>
    </LearnWorkspaceShell>
  );
}
