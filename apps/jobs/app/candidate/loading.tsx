import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Candidate workspace"
      title="Your roles, applications, and profile."
      body="Applications, saved roles, alerts, files, and recruiter updates in one view."
    />
  );
}
