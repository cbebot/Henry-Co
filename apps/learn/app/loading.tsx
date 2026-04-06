import {
  HenryCoPublicContentSkeleton,
  PublicRouteLoader,
} from "@henryco/ui/public-shell";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[92rem] px-5 py-16 sm:px-8 xl:px-10">
      <div className="learn-panel learn-mesh rounded-[2.8rem] p-6 sm:p-8">
        <PublicRouteLoader
          eyebrow="HenryCo Learn"
          title="Loading your learning experience."
          subtitle="Preparing courses, learning paths, and your progress."
          className="py-4"
        >
          <HenryCoPublicContentSkeleton cards={3} className="max-w-none px-0 pb-2" />
        </PublicRouteLoader>
      </div>
    </div>
  );
}
