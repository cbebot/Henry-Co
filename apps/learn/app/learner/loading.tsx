import { LearnWorkspaceLoading } from "@/components/learn/loading-state";

export default function LearnerLoading() {
  return (
    <LearnWorkspaceLoading
      kicker="Preparing your academy"
      title="Loading progress, saved courses, and certificate history."
      body="Pulling together your live enrollments, reminders, and the next learning steps worth taking."
    />
  );
}
