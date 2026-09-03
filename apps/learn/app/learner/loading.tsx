import { LearnWorkspaceLoading } from "@/components/learn/loading-state";

/**
 * V3-05 — Learn learner workspace route fallback.
 *
 * LearnWorkspaceLoading now renders content-shaped skeleton blocks;
 * the previous theater hero copy ("Loading your progress and enrolled
 * courses." + "Preparing your enrollments...") was dropped.
 */
export default function LearnerLoading() {
  return <LearnWorkspaceLoading />;
}
