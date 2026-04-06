import { HenryCoPublicContentSkeleton } from "@henryco/ui";
import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function Loading() {
  return (
    <div className="jobs-page">
      <PublicRouteLoader
        eyebrow="HenryCo Jobs"
        title="Gathering this page for you"
        subtitle="We are loading the latest jobs and updates. You can keep this tab open — nothing is wrong on your side."
        className="mx-auto max-w-7xl"
      >
        <HenryCoPublicContentSkeleton cards={3} className="pt-2" />
      </PublicRouteLoader>
    </div>
  );
}
