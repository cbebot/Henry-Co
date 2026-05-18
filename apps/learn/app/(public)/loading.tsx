import { PublicPageSkeleton, PublicRouteLoader } from "@henryco/ui/public-shell";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";

export default async function PublicLoading() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[92rem] items-center px-5 py-16 sm:px-8 xl:px-10">
      <div className="learn-panel learn-mesh w-full rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <PublicRouteLoader
          eyebrow="HenryCo Learn"
          title={t("Loading courses, certifications, and learning paths.")}
          subtitle={t("Curating the latest HenryCo Learn programs so every page opens with live content and a calm reading experience.")}
          className="px-0 py-0"
        >
          <PublicPageSkeleton cards={3} className="max-w-none px-0 pb-0" />
        </PublicRouteLoader>
      </div>
    </div>
  );
}
