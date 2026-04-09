import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Employer console"
      title="Company overview, roles, and applicant activity."
      body="Onboarding status, published roles, and pipeline updates."
    />
  );
}
