import { JobsWorkspaceLoading } from "@/components/loading-state";
import { getJobsCandidateSurfaceCopy } from "@henryco/i18n";
import { getJobsPublicLocale } from "@/lib/locale-server";

export default async function Loading() {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCandidateSurfaceCopy(locale).candidateLoading;

  return (
    <JobsWorkspaceLoading
      kicker={copy.kicker}
      title={copy.title}
      body={copy.body}
    />
  );
}
