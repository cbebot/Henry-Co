import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Preparing employer console"
      title="Loading company, roles, and applicant movement."
      body="Pulling live employer onboarding data, trust posture, published roles, and pipeline updates into place."
    />
  );
}
