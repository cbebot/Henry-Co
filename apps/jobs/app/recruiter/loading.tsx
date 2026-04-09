import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Recruiter console"
      title="Hiring queues and candidate pipeline."
      body="Employer verification, candidate movement, moderation status, and audit history."
    />
  );
}
