import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Employer workspace"
      title="Loading your company data and applicants."
      body="Your job postings, applicants, and company profile are being loaded."
    />
  );
}
