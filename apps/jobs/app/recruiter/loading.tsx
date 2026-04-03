import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Preparing recruiter console"
      title="Loading the live hiring queues."
      body="Bringing employer verification, candidate movement, moderation pressure, and account-linked audit history into view."
    />
  );
}
