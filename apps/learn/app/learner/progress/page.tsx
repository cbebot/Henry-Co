import { requireLearnUser } from "@/lib/learn/auth";
import { getLearnerWorkspace } from "@/lib/learn/data";
import { learnerNav } from "@/lib/learn/navigation";
import { syncViewerIdentity } from "@/lib/learn/workflows";
import { LearnPanel, LearnWorkspaceShell } from "@/components/learn/ui";

export default async function LearnerProgressPage() {
  const viewer = await requireLearnUser("/learner/progress");
  await syncViewerIdentity(viewer);
  const workspace = await getLearnerWorkspace(viewer);

  return (
    <LearnWorkspaceShell
      kicker="Progress"
      title="See exactly where momentum is building or stalling."
      description="Progress combines lesson completion and assessment state so learners can see real completion logic instead of vague progress bars."
      nav={learnerNav("/learner/progress")}
    >
      <div className="space-y-5">
        {workspace.courses.map(({ course, enrollment }) =>
          course ? (
            <LearnPanel key={course.id} className="rounded-[2rem]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{course.title}</h3>
                  <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{enrollment.percentComplete}% complete</p>
                </div>
                <div className="w-full max-w-sm rounded-full bg-white/10 p-1">
                  <div className="h-3 rounded-full bg-[linear-gradient(135deg,#d8f4eb,#5fc5ab)]" style={{ width: `${Math.max(6, enrollment.percentComplete)}%` }} />
                </div>
              </div>
            </LearnPanel>
          ) : null
        )}
      </div>
    </LearnWorkspaceShell>
  );
}
