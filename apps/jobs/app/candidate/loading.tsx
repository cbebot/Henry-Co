import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Candidate hub"
      title="Loading your profile and applications."
      body="Your applications, saved roles, alerts, and documents are being loaded."
    />
  );
}
