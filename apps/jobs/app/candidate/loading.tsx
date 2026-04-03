import { JobsWorkspaceLoading } from "@/components/loading-state";

export default function Loading() {
  return (
    <JobsWorkspaceLoading
      kicker="Preparing candidate module"
      title="Loading your role activity and profile strength."
      body="Bringing your applications, saved roles, alerts, files, and recruiter updates into one calm view."
    />
  );
}
