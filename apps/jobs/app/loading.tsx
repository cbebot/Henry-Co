import { HenryCoPublicContentSkeleton } from "@henryco/ui";
import { PublicRouteLoader } from "@henryco/ui/public-shell";
import { getJobsCandidateSurfaceCopy } from "@henryco/i18n";
import { getJobsPublicLocale } from "@/lib/locale-server";

export default async function Loading() {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCandidateSurfaceCopy(locale).pageLoading;

  return (
    <div className="jobs-page">
      <PublicRouteLoader
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        className="mx-auto max-w-7xl"
      >
        <HenryCoPublicContentSkeleton cards={3} className="pt-2" />
      </PublicRouteLoader>
    </div>
  );
}
