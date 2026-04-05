import { LearnWorkspaceLoading } from "@/components/learn/loading-state";

export default function LearnerLoading() {
  return (
    <LearnWorkspaceLoading
      kicker="Your courses"
      title="Loading your progress and enrolled courses."
      body="Preparing your enrollments, lessons, and certificates."
    />
  );
}
