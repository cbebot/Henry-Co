import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Recruiter workspace"
      title="Loading the hiring pipeline."
      body="Preparing employer verification, candidates, and moderation queues."
    />
  );
}
