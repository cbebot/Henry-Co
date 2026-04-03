import { LearnWorkspaceLoading } from "@/components/learn/loading-state";

export default function OwnerLoading() {
  return (
    <LearnWorkspaceLoading
      kicker="Preparing academy operations"
      title="Loading courses, learners, assignments, and communications."
      body="Bringing live academy records into one polished operations view so decisions stay grounded in the current state."
    />
  );
}
