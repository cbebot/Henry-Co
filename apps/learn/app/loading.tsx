import {
  HenryCoPublicContentSkeleton,
  PublicRouteLoader,
} from "@henryco/ui/public-shell";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";

export default async function Loading() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="mx-auto max-w-[92rem] px-5 py-16 sm:px-8 xl:px-10">
      <div className="learn-panel learn-mesh rounded-[2.8rem] p-6 sm:p-8">
        <PublicRouteLoader
          eyebrow="HenryCo Learn"
          title={t("Loading your learning experience.")}
          subtitle={t("Preparing courses, learning paths, and your progress.")}
          className="py-4"
        >
          <HenryCoPublicContentSkeleton cards={3} className="max-w-none px-0 pb-2" />
        </PublicRouteLoader>
      </div>
    </div>
  );
}
